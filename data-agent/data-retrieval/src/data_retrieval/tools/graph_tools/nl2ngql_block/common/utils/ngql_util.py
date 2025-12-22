import regex as re
import os, json, copy
import hashlib
from data_retrieval.tools.graph_tools.common.stand_log import StandLogger
from data_retrieval.errors import NGQLSchemaError


class SchemaParser(object):
    def _calculate_schema_hash(self, schema_res):
        """
        计算 schema 结构哈希值，用于判断 schema 是否变化
        
        Args:
            schema_res: 原始 schema 数据
            
        Returns:
            str: schema 结构的 MD5 哈希值
        """
        # 提取关键结构信息（实体名、属性名、边名等）
        signature_data = {
            "entities": [
                {
                    "name": entity["name"],
                    "properties": [prop["name"] for prop in entity.get("properties", [])]
                }
                for entity in schema_res.get("entity", [])
            ],
            "edges": [
                {
                    "name": edge["name"],
                    "relations": edge.get("relations", [])
                }
                for edge in schema_res.get("edge", [])
            ]
        }
        # 计算哈希值
        signature_str = json.dumps(signature_data, sort_keys=True, ensure_ascii=False)
        return hashlib.md5(signature_str.encode('utf-8')).hexdigest()
    
    def reformat_schema(self, intermediate_result, schema_res):
        # schema_res = intermediate_result.schema
        # example: ["field1", "field2"]
        search_schema = intermediate_result.inner_kg.get('fields', [])
        # example: {"field1": ["property1", "property2"], "field2": ["property3"]}
        field_properties = intermediate_result.inner_kg.get('field_properties', {})
        redis_params = intermediate_result.redis_params
        nebula_params = intermediate_result.nebula_params
        cache_cover = intermediate_result.cache_cover
        redis_engine = redis_params["redis_engine"]
        db_name = redis_params["dbname"]
        redis_conn_write = redis_engine.connect_redis(db_name, 'write')
        redis_conn_read = redis_engine.connect_redis(db_name, 'read')
        
        # 计算当前 schema 的哈希值
        current_schema_hash = self._calculate_schema_hash(schema_res)
        
        # Redis key
        schema_cache_key = "graph_schema_" + str(nebula_params["dbname"])
        schema_hash_key = "graph_schema_hash_" + str(nebula_params["dbname"])
        
        # 从 Redis 读取之前保存的哈希值
        cached_schema_hash = None
        if redis_conn_read.exists(schema_hash_key) != 0:
            cached_schema_hash = redis_conn_read.get(schema_hash_key).decode('utf-8')
        
        # 判断 schema 是否变化
        schema_changed = (cached_schema_hash is None) or (cached_schema_hash != current_schema_hash)
        
        filter_schema_res = {}
        need_update_cache = False
        need_query_samples = False
        
        # 决定是否需要更新缓存和查询样例数据
        if cache_cover:
            # cache_cover=True: 强制更新，包括样例数据
            need_update_cache = True
            need_query_samples = True
        elif schema_changed:
            # schema 变化了，需要更新缓存和样例数据
            need_update_cache = True
            need_query_samples = True
        else:
            # schema 未变化，检查缓存是否存在
            if redis_conn_read.exists(schema_cache_key) != 0:
                # 缓存存在，直接使用缓存（不查询样例数据）
                filter_schema_res_json = redis_conn_read.get(schema_cache_key)
                filter_schema_res = json.loads(filter_schema_res_json)
            else:
                # 缓存为空，需要更新缓存和样例数据
                need_update_cache = True
                need_query_samples = True
        
        # 如果需要更新缓存
        if need_update_cache:
            if need_query_samples:
                # 查询样例数据
                filter_schema_res = self._convert_schema_with_samples(intermediate_result, schema_res)
            else:
                # 不查询样例数据
                filter_schema_res = self._convert_schema_without_samples(schema_res)
            
            # 保存到缓存
            filter_schema_res_json = json.dumps(filter_schema_res, ensure_ascii=False)
            redis_conn_write.set(schema_cache_key, filter_schema_res_json)
            # 更新哈希值
            redis_conn_write.set(schema_hash_key, current_schema_hash)
        
        # 应用过滤条件
        filter_schema_res = self.filter_schema(filter_schema_res, search_schema, field_properties)
        return filter_schema_res
    
    def _convert_schema_without_samples(self, schema_res):
        """
        转换schema但不查询样例数据（partial_values为空）
        
        Args:
            schema_res: 原始schema数据
            
        Returns:
            filter_schema_res: 转换后的schema（不包含样例数据）
        """
        filter_entity = []
        filter_edge = []
        filter_schema_res = {
            "entity": filter_entity,
            "edge": filter_edge,
        }
        # 准备边和实体的映射
        entity_name2props = {}
        
        # 处理实体
        for entity in schema_res.get("entity", []):
            entity_dic = {
                "name": entity["name"],
                "alias": entity["alias"],
                "props": []
            }
            for properties in entity.get("properties", []):
                properties_dic = {
                    "name": properties["name"],
                    "alias": properties["alias"],
                    "data_type": properties.get("data_type") or properties.get("type"),
                    "partial_values": [],  # 不查询样例数据，设为空列表
                }
                if properties.get("description"):
                    properties_dic.update({"description": properties["description"]})
                
                entity_dic["props"].append(properties_dic)
            
            filter_entity.append(entity_dic)
            entity_name2props.setdefault(entity["name"], entity)
        
        # 处理边
        for edge in schema_res.get("edge", []):
            subject = edge["relations"][0]
            object_ = edge["relations"][2]
            # 确保subject和object都在entity_name2props中
            if subject not in entity_name2props or object_ not in entity_name2props:
                continue
            edge_dic = {
                "name": edge["name"],
                "alias": edge["alias"],
                "subject": subject,
                "object": object_,
                "description": entity_name2props[subject]["alias"] + "-" + edge["alias"] + "->" +
                               entity_name2props[object_]["alias"],
            }
            filter_edge.append(edge_dic)
        
        return filter_schema_res
    
    def _convert_schema_with_samples(self, intermediate_result, schema_res):
        """
        转换schema并查询样例数据
        
        Args:
            intermediate_result: 包含nebula引擎等配置
            schema_res: 原始schema数据
            
        Returns:
            filter_schema_res: 转换后的schema（包含样例数据）
        """
        self.space_name = intermediate_result.nebula_params["dbname"]
        self.nebula_engine = intermediate_result.nebula_params["nebula_engine"]
        sql_template = """MATCH (v1:{label}) WITH v1.{label}.{prop} AS m1,  count(v1.{label}.{prop}) as count_{prop} order by count_{prop} DESC LIMIT 5 RETURN m1, count_{prop}"""
        filter_entity = []
        filter_edge = []
        filter_schema_res = {
            "entity": filter_entity,
            "edge": filter_edge,
        }
        # 准备边和实体的映射
        entity_name2props = {}
        
        # 处理实体
        for entity in schema_res.get("entity", []):
            entity_dic = {
                "name": entity["name"],
                "alias": entity["alias"],
                "props": []
            }
            for properties in entity.get("properties", []):
                sql_str = sql_template.format(label=entity["name"], prop=properties["name"])
                
                # 查询样例数据
                records, error_info = self.nebula_engine.execute_any_ngql(self.space_name, sql_str)
                if error_info:
                    StandLogger.warning(f"查询样例数据失败: {error_info}, SQL: {sql_str}")
                    partial_values = []
                else:
                    try:
                        partial_values = records.get("m1", [])
                    except Exception as e:
                        StandLogger.warning(f"解析样例数据失败: {str(e)}, SQL: {sql_str}")
                        partial_values = []
                
                filter_values = self.filter_values(partial_values)
                if not filter_values:  # TODO 这样判断远远不够，比如[""], ["-"]
                    print("没有查询到数据，请补充", entity["name"], properties)
                    continue
                if filter_values == [""]:
                    print("没有查询到数据，请补充", entity["name"], properties)
                    continue
                print("{}.{}:{}".format(entity["name"], properties["name"], filter_values))
                
                properties_dic = {
                    "name": properties["name"],
                    "alias": properties["alias"],
                    "data_type": properties.get("data_type") or properties.get("type"),
                    "partial_values": filter_values if filter_values else [],
                }
                if properties.get("description"):
                    properties_dic.update({"description": properties["description"]})
                
                entity_dic["props"].append(properties_dic)
            
            filter_entity.append(entity_dic)
            entity_name2props.setdefault(entity["name"], entity)
        
        # 处理边
        for edge in schema_res.get("edge", []):
            subject = edge["relations"][0]
            object_ = edge["relations"][2]
            # 确保subject和object都在entity_name2props中
            if subject not in entity_name2props or object_ not in entity_name2props:
                continue
            edge_dic = {
                "name": edge["name"],
                "alias": edge["alias"],
                "subject": subject,
                "object": object_,
                "description": entity_name2props[subject]["alias"] + "-" + edge["alias"] + "->" +
                               entity_name2props[object_]["alias"],
            }
            filter_edge.append(edge_dic)
        
        return filter_schema_res

    def filter_schema(self, schema, schema_search_scope, field_properties=None):
        """
        根据 schema_search_scope 和 field_properties 过滤 schema
        
        Args:
            schema: 原始 schema 数据
            schema_search_scope: 实体名称列表，用于过滤实体和边
            field_properties: 字典，键为实体名，值为属性名列表，用于过滤实体的属性
            
        Returns:
            filter_schema: 过滤后的 schema
        """
        filter_schema = {"entity": [], "edge": []}
        
        # 如果提供了 field_properties，则构建一个便于查找的结构
        entity_property_filter = {}
        if field_properties:
            entity_property_filter = field_properties
            
        for entity in schema.get("entity", []):
            # 首先根据 schema_search_scope 过滤实体
            if schema_search_scope and entity["name"] not in schema_search_scope: 
                continue
                
            # 复制实体结构
            filtered_entity = {
                "name": entity["name"],
                "alias": entity["alias"],
                "props": []
            }
            
            # 如果提供了 field_properties，则根据它过滤属性
            if entity_property_filter and entity["name"] in entity_property_filter:
                # 只保留指定的属性
                property_names = entity_property_filter[entity["name"]]
                for prop in entity["props"]:
                    if prop["name"] in property_names:
                        filtered_entity["props"].append(prop)
            else:
                # 没有提供 field_properties 或者该实体不在过滤条件中，保留所有属性
                filtered_entity["props"] = entity["props"]
                
            filter_schema["entity"].append(filtered_entity)
            
        for edge in schema.get("edge", []):
            subject = edge["subject"]
            object_ = edge["object"]
            # 根据 schema_search_scope 过滤边
            if schema_search_scope and (
                    subject not in schema_search_scope or object_ not in schema_search_scope): 
                continue

            filter_schema["edge"].append(edge)
        # from pprint import pprint
        # pprint(filter_schema)
        return filter_schema

    def filter_values(self, values):
        filter_values = []
        total_word = 0
        for value in values:
            if total_word > 50: continue
            if isinstance(value, str):
                if len(value) > 10:
                    value = value[:10] + "..."
                    total_word += 10
            if not value: continue
            if isinstance(value, str):
                if not value.strip():
                    continue
                # if value in ['N/A', '-']:
                if value in ['N/A', '-']:
                    continue
                total_word += len(value)
            filter_values.append(value)
        return filter_values
