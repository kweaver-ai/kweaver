# -*- coding: utf-8 -*-
"""
关键词召回模块
实现基于关键词的细粒度上下文召回
"""

import httpx
import json
from typing import List, Dict, Any, Optional, Set
from data_retrieval.logs.logger import logger
from .config import config

# 知识网络查询API基础URL（从配置文件读取）
KNOWLEDGE_NETWORK_QUERY_API_BASE = config.KNOWLEDGE_NETWORK_QUERY_API_BASE


class KeywordRetrieval:
    """关键词召回类"""
    
    @classmethod
    async def _call_object_retrieval_api(
        cls,
        kn_id: str,
        object_type_id: str,
        condition: Dict[str, Any],
        headers: Optional[Dict[str, str]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        调用接口1：对象检索API
        
        Args:
            kn_id: 知识网络ID
            object_type_id: 对象类型ID
            condition: 查询条件
            headers: HTTP请求头
            
        Returns:
            API返回结果，如果失败返回None
        """
        try:
            url = f"{KNOWLEDGE_NETWORK_QUERY_API_BASE}/knowledge-networks/{kn_id}/object-types/{object_type_id}"
            
            request_headers = {
                "X-HTTP-Method-Override": "GET",
                "Content-Type": "application/json"
            }
            if headers:
                request_headers.update(headers)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    headers=request_headers,
                    json=condition,
                    timeout=5.0
                )
                response.raise_for_status()
                return response.json()
                
        except httpx.HTTPStatusError as e:
            # HTTP错误，尝试读取响应体中的错误信息
            error_detail = ""
            try:
                if e.response is not None:
                    response_text = e.response.text
                    error_detail = f"\n响应状态码: {e.response.status_code}\n响应Body: {response_text}"
            except Exception:
                pass
            
            logger.error(
                f"调用对象检索API失败 (kn_id={kn_id}, object_type_id={object_type_id}): {str(e)}{error_detail}",
                exc_info=True
            )
            return None
        except Exception as e:
            logger.error(f"调用对象检索API失败 (kn_id={kn_id}, object_type_id={object_type_id}): {str(e)}", exc_info=True)
            return None
    
    @classmethod
    async def _call_relation_path_api(
        cls,
        kn_id: str,
        relation_type_paths: List[Dict[str, Any]],
        headers: Optional[Dict[str, str]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        调用接口2：关系路径检索API
        
        Args:
            kn_id: 知识网络ID
            relation_type_paths: 关系路径查询条件列表
            headers: HTTP请求头
            
        Returns:
            API返回结果，如果失败返回None
        """
        try:
            url = f"{KNOWLEDGE_NETWORK_QUERY_API_BASE}/knowledge-networks/{kn_id}/subgraph"
            params = {"query_type": "relation_path"}
            
            request_headers = {
                "X-HTTP-Method-Override": "GET",
                "Content-Type": "application/json"
            }
            if headers:
                request_headers.update(headers)
            
            request_body = {
                "relation_type_paths": relation_type_paths
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    headers=request_headers,
                    params=params,
                    json=request_body,
                    timeout=5.0
                )
                response.raise_for_status()
                return response.json()
                
        except httpx.HTTPStatusError as e:
            # HTTP错误，尝试读取响应体中的错误信息
            error_detail = ""
            try:
                if e.response is not None:
                    response_text = e.response.text
                    error_detail = f"\n响应状态码: {e.response.status_code}\n响应Body: {response_text}"
            except Exception:
                pass
            
            # 打印请求body和响应错误信息以便调试
            try:
                request_body_str = json.dumps(request_body, ensure_ascii=False, indent=2)
                logger.error(
                    f"调用关系路径检索API失败 (kn_id={kn_id}): {str(e)}{error_detail}\n"
                    f"请求URL: {url}\n"
                    f"请求参数: {params}\n"
                    f"请求Body:\n{request_body_str}",
                    exc_info=True
                )
            except Exception as log_error:
                logger.error(
                    f"调用关系路径检索API失败 (kn_id={kn_id}): {str(e)}{error_detail}\n"
                    f"打印请求Body时出错: {str(log_error)}",
                    exc_info=True
                )
            return None
        except Exception as e:
            # 打印请求body以便调试
            try:
                request_body_str = json.dumps(request_body, ensure_ascii=False, indent=2)
                logger.error(
                    f"调用关系路径检索API失败 (kn_id={kn_id}): {str(e)}\n"
                    f"请求URL: {url}\n"
                    f"请求参数: {params}\n"
                    f"请求Body:\n{request_body_str}",
                    exc_info=True
                )
            except Exception as log_error:
                logger.error(
                    f"调用关系路径检索API失败 (kn_id={kn_id}): {str(e)}\n"
                    f"打印请求Body时出错: {str(log_error)}",
                    exc_info=True
                )
            return None
    
    @classmethod
    def _build_or_condition(cls, keyword: str, properties: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        构建OR查询条件，遍历所有属性字段
        
        Args:
            keyword: 关键词
            properties: 属性列表
            
        Returns:
            查询条件字典
        """
        sub_conditions = []
        
        for prop in properties:
            if not isinstance(prop, dict):
                continue
            
            field_name = prop.get("name") or prop.get("id")
            if not field_name:
                continue
            
            # 构建精确匹配条件
            sub_conditions.append({
                "field": field_name,
                "operation": "==",
                "value": keyword,
                "value_from": "const"
            })
        
        if not sub_conditions:
            # 如果没有属性，返回空条件
            return {
                "condition": {
                    "operation": "and",
                    "sub_conditions": []
                },
                "need_total": True,
                "limit": 10
            }
        
        return {
            "condition": {
                "operation": "or",
                "sub_conditions": sub_conditions
            },
            "need_total": True,
            "limit": 10
        }
    
    @classmethod
    def _extract_instance_info(cls, datas: List[Dict[str, Any]], object_type_id: str, primary_key_field: str) -> List[Dict[str, Any]]:
        """
        从接口1返回结果中提取实例信息
        
        Args:
            datas: 接口1返回的datas数组
            object_type_id: 对象类型ID
            primary_key_field: 主键字段名（必须提供，不能为None）
            
        Returns:
            实例信息列表
            
        Raises:
            ValueError: 如果主键字段不存在或主键值为空
        """
        if not primary_key_field:
            raise ValueError(f"对象类型 {object_type_id} 的主键字段名不能为空，必须从schema中获取primary_key_field")
        
        instances = []
        
        for data in datas:
            if not isinstance(data, dict):
                continue
            
            # 提取实例ID（必须从主键字段获取）
            if primary_key_field not in data:
                raise ValueError(f"对象类型 {object_type_id} 的返回数据中缺少主键字段 {primary_key_field}，数据: {data}")
            
            instance_id = data.get(primary_key_field)
            if not instance_id:
                raise ValueError(f"对象类型 {object_type_id} 的主键字段 {primary_key_field} 值为空，数据: {data}")
            
            # 提取实例名称（查找*_name字段）
            instance_name = None
            for key, value in data.items():
                if key.endswith("_name") and value:
                    instance_name = value
                    break
            
            instances.append({
                "instance_id": instance_id,
                "instance_name": instance_name or instance_id,
                "object_type_id": object_type_id,
                "properties": data  # 完整的属性字典
            })
        
        return instances
    
    @classmethod
    def _extract_neighbors_from_relation_path(
        cls,
        entries: List[Dict[str, Any]],
        source_instance_ids: Set[str]
    ) -> List[Dict[str, Any]]:
        """
        从接口2返回结果中提取一度邻居信息
        
        Args:
            entries: 接口2返回的entries数组
            source_instance_ids: 源实例ID集合（用于确定关系方向）
            
        Returns:
            邻居信息列表
        """
        neighbors = []
        
        if not entries:
            return neighbors
        
        entry = entries[0]  # 通常只有一个entry
        objects = entry.get("objects", {})
        relation_paths = entry.get("relation_paths", [])
        
        # 遍历关系路径
        for path in relation_paths:
            relations = path.get("relations", [])
            if not relations:
                continue
            
            for relation in relations:
                source_object_id = relation.get("source_object_id", "")
                target_object_id = relation.get("target_object_id", "")
                relation_type_id = relation.get("relation_type_id", "")
                relation_type_name = relation.get("relation_type_name", "")
                
                # 确定哪个是源实例，哪个是目标实例（邻居）
                neighbor_object_id = None
                relation_direction = None
                
                # 提取源实例ID（格式：object_type_id-instance_id）
                source_instance_id = None
                if source_object_id and "-" in source_object_id:
                    source_instance_id = source_object_id.split("-", 1)[1]
                
                # 提取目标实例ID
                target_instance_id = None
                if target_object_id and "-" in target_object_id:
                    target_instance_id = target_object_id.split("-", 1)[1]
                
                # 判断关系方向
                if source_instance_id in source_instance_ids:
                    # 源实例是关键词匹配的实例，目标实例是邻居
                    neighbor_object_id = target_object_id
                    relation_direction = "outgoing"
                elif target_instance_id in source_instance_ids:
                    # 目标实例是关键词匹配的实例，源实例是邻居
                    neighbor_object_id = source_object_id
                    relation_direction = "incoming"
                else:
                    continue
                
                # 从objects字典中提取邻居信息
                neighbor_obj = objects.get(neighbor_object_id)
                if not neighbor_obj:
                    continue
                
                # 提取邻居实例信息
                unique_identities = neighbor_obj.get("unique_identities", {})
                instance_id = None
                for key, value in unique_identities.items():
                    if value:
                        instance_id = value
                        break
                
                if not instance_id:
                    continue
                
                instance_name = neighbor_obj.get("display", "")
                neighbor_object_type_id = neighbor_obj.get("object_type_id", "")
                properties = neighbor_obj.get("properties", {})
                
                neighbors.append({
                    "instance_id": instance_id,
                    "instance_name": instance_name or instance_id,
                    "object_type_id": neighbor_object_type_id,
                    "relation_type_id": relation_type_id,
                    "relation_type_name": relation_type_name,
                    "relation_direction": relation_direction,
                    "properties": properties
                })
        
        return neighbors
    
    @classmethod
    async def retrieve_keyword_context(
        cls,
        keyword: str,
        object_type_id: str,
        kn_id: str,
        schema_info: Dict[str, Any],
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        召回关键词上下文
        
        Args:
            keyword: 关键词
            object_type_id: 对象类型ID
            kn_id: 知识网络ID
            schema_info: schema信息（包含object_types和relation_types）
            headers: HTTP请求头
            
        Returns:
            关键词上下文信息
        """
        # 1. 从schema中获取对象类型的属性列表和主键字段名
        object_type_info = None
        for obj_type in schema_info.get("object_types", []):
            if obj_type.get("concept_id") == object_type_id:
                object_type_info = obj_type
                break
        
        if not object_type_info:
            logger.warning(f"未找到对象类型 {object_type_id} 的schema信息，请确认是否调用enable_keyword_context=False召回schema")
            return {
                "keyword": keyword,
                "object_type_id": object_type_id,
                "instances": [],
                "statistics": {
                    "total_instances": 0,
                    "total_neighbors": 0,
                    "matched_fields": []
                }
            }
        
        # 获取属性列表
        properties = object_type_info.get("properties", [])
        if not isinstance(properties, list):
            properties = []
        
        # 获取主键字段名（必须存在）
        primary_key_field = object_type_info.get("primary_key_field")
        if not primary_key_field:
            raise ValueError(f"对象类型 {object_type_id} 的schema信息中未找到主键字段primary_key_field，无法提取实例ID")
        
        # 2. 构建OR查询条件
        condition = cls._build_or_condition(keyword, properties)
        
        # 3. 调用接口1获取对象实例
        api_result = await cls._call_object_retrieval_api(
            kn_id=kn_id,
            object_type_id=object_type_id,
            condition=condition,
            headers=headers
        )
        
        if not api_result:
            logger.warning(f"调用对象检索API失败，关键词: {keyword}, object_type_id: {object_type_id}")
            return {
                "keyword": keyword,
                "object_type_id": object_type_id,
                "instances": [],
                "statistics": {
                    "total_instances": 0,
                    "total_neighbors": 0,
                    "matched_fields": []
                }
            }
        
        # 4. 提取实例信息（使用主键字段名）
        datas = api_result.get("datas", [])
        instances = cls._extract_instance_info(datas, object_type_id, primary_key_field)
        total_count = api_result.get("total_count", 0)
        
        # 5. 识别匹配的字段
        matched_fields = []
        if instances:
            # 从第一个实例的属性中找出匹配的字段
            first_instance_props = instances[0].get("properties", {})
            for prop_name, prop_value in first_instance_props.items():
                if prop_value == keyword:
                    matched_fields.append(prop_name)
        
        # 6. 获取一度邻居信息
        relation_types = schema_info.get("relation_types", [])
        all_neighbors = []
        source_instance_ids = {inst["instance_id"] for inst in instances}
        
        # 限制实例数量，避免查询过多
        instances_to_query = instances[:10]  # 最多查询10个实例
        
        # 使用主键字段名（primary_key_field必须存在，已在前面验证）
        id_field_name = primary_key_field
        
        for instance in instances_to_query:
            instance_neighbors = []
            
            # 为每个关系类型构建查询
            for rel_type in relation_types:
                source_obj_type_id = rel_type.get("source_object_type_id")
                target_obj_type_id = rel_type.get("target_object_type_id")
                relation_type_id = rel_type.get("concept_id")
                
                if not all([source_obj_type_id, target_obj_type_id, relation_type_id]):
                    continue
                
                # 构建关系路径查询（方向不限定，需要构建双向查询）
                relation_type_paths = []
                
                # 作为源对象的查询
                if source_obj_type_id == object_type_id:
                    relation_type_paths.append({
                        "object_types": [
                            {
                                "id": source_obj_type_id,
                                "condition": {
                                    "operation": "==",
                                    "field": id_field_name,
                                    "value": instance["instance_id"],
                                    "value_from": "const"
                                },
                                "limit": 1
                            },
                            {
                                "id": target_obj_type_id,
                                "limit": 10
                            }
                        ],
                        "relation_types": [
                            {
                                "relation_type_id": relation_type_id,
                                "source_object_type_id": source_obj_type_id,
                                "target_object_type_id": target_obj_type_id
                            }
                        ],
                        "limit": 10
                    })
                
                # 作为目标对象的查询
                if target_obj_type_id == object_type_id:
                    relation_type_paths.append({
                        "object_types": [
                            {
                                "id": source_obj_type_id,
                                "limit": 10
                            },
                            {
                                "id": target_obj_type_id,
                                "condition": {
                                    "operation": "==",
                                    "field": id_field_name,
                                    "value": instance["instance_id"],
                                    "value_from": "const"
                                },
                                "limit": 1
                            }
                        ],
                        "relation_types": [
                            {
                                "relation_type_id": relation_type_id,
                                "source_object_type_id": source_obj_type_id,
                                "target_object_type_id": target_obj_type_id
                            }
                        ],
                        "limit": 10
                    })
                
                if relation_type_paths:
                    # 调用接口2
                    neighbor_result = await cls._call_relation_path_api(
                        kn_id=kn_id,
                        relation_type_paths=relation_type_paths,
                        headers=headers
                    )
                    
                    if neighbor_result:
                        entries = neighbor_result.get("entries", [])
                        neighbors = cls._extract_neighbors_from_relation_path(
                            entries, 
                            {instance["instance_id"]}
                        )
                        instance_neighbors.extend(neighbors)
            
            # 去重邻居（基于instance_id）
            seen_neighbor_ids = set()
            unique_neighbors = []
            for neighbor in instance_neighbors:
                neighbor_id = neighbor.get("instance_id")
                if neighbor_id and neighbor_id not in seen_neighbor_ids:
                    seen_neighbor_ids.add(neighbor_id)
                    unique_neighbors.append(neighbor)
            
            # 限制每个实例的邻居数量
            instance["neighbors"] = unique_neighbors[:50]  # 最多50个邻居
            all_neighbors.extend(unique_neighbors[:50])
        
        # 7. 构建最终结果
        result = {
            "keyword": keyword,
            "object_type_id": object_type_id,
            "matched_field": matched_fields[0] if matched_fields else None,
            "instances": instances[:10],  # 最多返回10个实例
            "statistics": {
                "total_instances": total_count,
                "total_neighbors": len(set(n.get("instance_id") for n in all_neighbors if n.get("instance_id"))),
                "matched_fields": matched_fields
            }
        }
        
        return result

