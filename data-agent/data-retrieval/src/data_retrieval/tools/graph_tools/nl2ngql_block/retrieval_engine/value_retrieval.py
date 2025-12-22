import copy, yaml, os
from pprint import pprint
import asyncio
from .config import MethodConfig
import json, aiohttp
from data_retrieval.tools.graph_tools.common.stand_log import StandLogger
from data_retrieval.tools.graph_tools.common.config import Config
from data_retrieval.tools.graph_tools.utils.opensearch import OpenSearchConnector



class VectorRetrieval:
    def __init__(self, params):
        # 初始化向量检索算法，例如LSH
        self.score = params["score"]
        self.select_num = params["select_num"]
        self.label_name = params.get("label_name", "*")
        self.embedding_url = Config.EMB_URL
        self.opensearch_engine = OpenSearchConnector(ips=Config.OPENSEARCH_HOST.split(','),
                                                     ports=Config.OPENSEARCH_PORT.split(','),
                                                     user=Config.OPENSEARCH_USER,
                                                     password=Config.OPENSEARCH_PASS)

    # 第一种
    async def retrieval(self, intermediate_result, keywords):

        # 使用 asyncio.gather 并发执行 embedding_search
        results = await asyncio.gather(
            *[self.embedding_search(keyword, nebula_params=intermediate_result.nebula_params,
                                    label_name=self.label_name) for
              keyword in
              keywords])
        # *[self.embedding_search(keyword_info, space_name=DefaultConfig.space_name) for keyword_info in keywords])
        # 过滤掉空结果
        results = [result for result in results if result]
        StandLogger.info("关键词检索结果:{}".format(results))
        return results

    async def embedding_search(self, keyword, label_name="*", nebula_params=None):
        text = keyword
        space_name = nebula_params["dbname"]
        quantized_flag = nebula_params["quantized_flag"]
        # text, node_prop = keyword_info
        # node_prop_s = node_prop.split(".")
        # if len(node_prop_s) != 2: return
        # rel_label_name, rel_prop_name = node_prop_s[0], node_prop_s[1]
        StandLogger.info("embedding_url:{}".format(self.embedding_url))
        StandLogger.info("关键词检索text:{}".format(text))
        pyload = {
                "model": "embedding",
                "input": [text.strip()]
            }
        retrieval_values = {}
        # 问题编码
        # 问题编码
        try:
            # assert 1 == 2
            async with aiohttp.ClientSession() as session:
                async with session.post(self.embedding_url, json=pyload, verify_ssl=False) as resp:
                    res = await resp.text()
            res = json.loads(res)
            if "data" not in res:
                StandLogger.error("embedding接口返回格式错误:{}".format(res))
            query_embedding = res["data"][0]["embedding"]
            if quantized_flag:
                query_embedding = await self.opensearch_engine.scalar_quantizer(query_embedding)
            requests_body = {
                "_source": {"excludes": [
                    "_vector768"
                ]},
                "query": {
                    "nested": {
                        "path": "_vector768",
                        "query": {
                            "knn": {
                                "_vector768.vec": {
                                    "vector": query_embedding,
                                    "k": 5000
                                }
                            }
                        },
                        "inner_hits": {
                            "_source": {
                                "excludes": [
                                    "_vector768.vec"
                                ]
                            }
                        }
                    }
                },
                "from": 0,
                "size": 1000
            }

            url = "{}_{}/_search".format(space_name, label_name)  # 图数据库的url
            # print(url)
            search_url = self.opensearch_engine.pre_url + url

            # float_results = await os_engine.execute(url=url,
            #                                         body=requests_body)
            auth = aiohttp.BasicAuth(login=Config.OPENSEARCH_USER, password=Config.OPENSEARCH_PASS)
            async with aiohttp.ClientSession(auth=auth) as session:
                response = await session.post(url=search_url, json=requests_body, ssl=False)
                results = await response.json()

            
            same_value = False
            if results and results.get("hits"):
                max_score = results["hits"]["max_score"]
                for hit in results["hits"]["hits"]:
                    source = hit["_source"]
                    score = hit["_score"]
                    if score < self.score:
                        continue
                    # label_name = "".join(hit["_index"].split("_")[1:])
                    space_name = hit["_index"].split("_")[0]
                    label_name = hit["_index"].replace(space_name + "_", "")
                    # if label_name != rel_label_name and score < 0.95: continue # 如果有很相似的，就不用限制
                    retrieval_values.setdefault(label_name, {})
                    inner_hits = hit["inner_hits"]["_vector768"]["hits"]["hits"]
                    for hits in inner_hits:
                        if score == hits["_score"]:
                            prop_name = hits["_source"]["field"]
                            prop_value = source[prop_name]
                            # if score == 1.0:
                            #     retrieval_values[label_name].setdefault(prop_name, []).append(prop_value)
                            #     same_value = True
                            #     break
                            #
                            # if prop_name in ["parent"]: continue # AS 圖譜專用
                            # if prop_name != rel_prop_name and score < 0.95: continue
                            retrieval_values[label_name].setdefault(prop_name, {})
                            if not retrieval_values[label_name][prop_name] or len(
                                    retrieval_values[label_name][prop_name]) < self.select_num:
                                if prop_value not in retrieval_values[label_name][prop_name]:
                                    if prop_value.lower() == text.lower():
                                        score = 1
                                    retrieval_values[label_name][prop_name][prop_value] = score
        except Exception as e:
            StandLogger.error("embedding检索失败:{}".format(e))
            raise "embedding检索失败:{}".format(e)
        return {text: retrieval_values}

        # print(float_results)

class BaseValueRetrieval:
    """
    只做关键词检索
    """
    def __init__(self, params):
        self.vector_retrieval = VectorRetrieval(params)


    async def retrieval(self, intermediate_result, keywords):
        self.schema = intermediate_result.schema
        values = await self.retrieve_values(intermediate_result, keywords)
        # value_retrievals = {"value_retrieval": values}
        return values

    async def retrieve_values(self, intermediate_result, keywords):
        # 向量检索和重排序
        retrieve_results = []
        if keywords.get("涉及实体"):
            keywords = [key for key, value in keywords.get("涉及实体", {}).items()]
        else:
            keywords = [intermediate_result.query]
        retrieve_results = await self.vector_retrieval.retrieval(intermediate_result, keywords)
        return retrieve_results
    
class ValueRetrieval:
    def __init__(self, params):
        self.vector_retrieval = VectorRetrieval(params)
        if MethodConfig.enable_kg_node_retrieval:
            params = MethodConfig.kg_node_retrieval.get("params")
            self.kg_node_retrieval = KGNestedNodeRetrieval(params)
        # if hasattr(MethodConfig, 'vector_retrieval'):
        #     params = MethodConfig.vector_retrieval.get("params")
        #     self.vector_retrieval = MODELS.build(dict(type=MethodConfig.vector_retrieval['name'], params=params))
        # if hasattr(MethodConfig, 'reranking'):
        #     self.reranking = MODELS.build(dict(type=MethodConfig.reranking['name']))

    async def retrieval(self, intermediate_result, keywords):
        self.schema = intermediate_result.schema
        values = await self.retrieve_values(intermediate_result, keywords)
        value_retrievals = {"value_retrieval": values}

        # 通过关键词抽取的结果，来缩小嵌套节点的检索范围
        if MethodConfig.enable_kg_node_retrieval:
            value_retrievals['kg_node_retrieval'] = await self.kg_node_retrieval.retrieval(intermediate_result,
                                                                                           keywords, values)
        return value_retrievals

    async def retrieve_values(self, intermediate_result, keywords):
        # 向量检索和重排序
        retrieve_results = []
        if keywords.get("涉及实体"):
            keywords = [key for key, value in keywords.get("涉及实体", {}).items()]
        else:
            keywords = []
        retrieve_results = await self.vector_retrieval.retrieval(intermediate_result, keywords)
        filtered_results = self.filter_node_prop(retrieve_results)
        # StandLogger.info(filtered_results)
        return filtered_results

    def filter_node_prop(self, results):
        exist_node = self.entity_2props(self.schema)
        """ 根据定义的schema字段，过滤"""
        filter_results = copy.deepcopy(results)
        for index, result in enumerate(results):
            for keyword, res in result.items():
                for node_name, node_info in res.items():
                    if node_name not in exist_node:  # 过滤实体
                        filter_results[index][keyword].pop(node_name)
                        continue
                    for prop_name, prop_value in node_info.items():
                        if prop_name not in exist_node[node_name]:  # 过滤属性
                            filter_results[index][keyword][node_name].pop(prop_name)
                        else:
                            filter_results[index][keyword][node_name][prop_name] = []
                            for value, score in prop_value.items():
                                # if value not in filter_results[index][keyword][node_name][prop_name]:
                                if score == 1:
                                    filter_results[index][keyword][node_name][prop_name] = [value]
                                    break
                                filter_results[index][keyword][node_name][prop_name].append(value)

        return filter_results

    def entity_2props(self, schema):
        exist_node = {}
        for entity in schema["entity"]:
            exist_node.setdefault(entity["name"], set())
            for prop in entity["props"]:
                exist_node.setdefault(entity["name"], set()).add(prop["name"])
        return exist_node


class KGNestedNodeRetrieval:
    def __init__(self, params):
        self.use_node_names = set()

    def init_nested_node(self, intermediate_result):
        self.center_node = intermediate_result.inner_kg.get("output_fields", [])
        node_dic = {}
        if self.center_node:  # TODO 后面做成通用的，对任何schema中的嵌套节点都可以抽取
            center_node = self.center_node[0]  # 目前先只处理一个节点
            self.neighbor_entitys = {}
            for edge in self.schema.get("edge", []):
                if edge["object"] == center_node and edge["subject"] != center_node:
                    self.neighbor_entitys.setdefault(edge["subject"], edge["name"])
            redis_params = intermediate_result.redis_params
            nebula_params = intermediate_result.nebula_params
            cache_cover = intermediate_result.cache_cover
            redis_engine = redis_params["redis_engine"]
            db_name = redis_params["dbname"]
            redis_conn_write = redis_engine.connect_redis(db_name, 'write')
            redis_conn_read = redis_engine.connect_redis(db_name, 'read')
            node_dic = {}
            # 要检查的key
            # TODO 线上还是v2了，做实验v3
            name = "graph_nested_node_" + str(
                nebula_params["dbname"])  # 尝试和graphrag一样，召回组织的邻居信息， 比如人物，再通过关键词判断，是否需要拿到人物的其他信息。
            if redis_conn_read.exists(name) != 0 and not cache_cover:  # cache_cover 图谱刷新，重新生成
                node_dic_json = redis_conn_read.get(name)
                node_dic = json.loads(node_dic_json)
            else:
                node_dic = {}
                neighbor_entity_dic = {}
                # # 获取嵌套节点的邻居信息，假设嵌套节点是A，只获取指向A的邻居节点（*->A）。从A指出的暂不考虑
                for neighbor_entity, _ in self.neighbor_entitys.items():
                    query = """
                    match (v1:{neighbor_entity})-[e1]->(v2:{center_node}) return distinct v1, v2.{center_node}.name""".format(
                        neighbor_entity=neighbor_entity, center_node=center_node)
                    executed_res1, error_info = self.nebula_engine.execute_any_ngql(self.space_name, query)

                    values = list(executed_res1.values())
                    for neighbor_entity_info, organization_name in zip(values[0], values[1]):
                        neighbor_entity_dic.setdefault(organization_name, {})
                        neighbor_entity_dic[organization_name].setdefault(neighbor_entity, []).append(
                            neighbor_entity_info)

                # print(neighbor_entity_dic["数据智能产品BG"])
                # 获取嵌套节点的关系
                # 再通过关系获取子组织
                # 先获取
                query = """
                match (v1:{center_node})-[e1]->(v2:{center_node}) return distinct v1.{center_node}.name, v2.{center_node}.name""".format(
                    center_node=center_node)
                executed_res3, error_info = self.nebula_engine.execute_any_ngql(self.space_name, query)
                if isinstance(executed_res3, dict):
                    values = list(executed_res3.values())
                    for parent_node, current_node in zip(values[0], values[1]):
                        # if parent_node == "数据智能产品BG" or current_node == "数据智能产品BG":
                        #     print()
                        node_dic.setdefault(parent_node, {})
                        node_dic[parent_node].setdefault("child", []).append(current_node)
                        neighbor_entity_info = node_dic[parent_node].setdefault("neighbor_entity", {})
                        if not neighbor_entity_info:
                            node_dic[parent_node]["neighbor_entity"] = neighbor_entity_dic.get(parent_node, {})

                        node_dic.setdefault(current_node, {})
                        node_dic[current_node].setdefault("parent", []).append(parent_node)
                        neighbor_entity_info = node_dic[current_node].setdefault("neighbor_entity", {})
                        if not neighbor_entity_info:
                            node_dic[current_node]["neighbor_entity"] = neighbor_entity_dic.get(current_node, {})

                node_dic_json = json.dumps(node_dic, ensure_ascii=False)
                redis_conn_write.set(name, node_dic_json)
        return node_dic

    async def retrieval(self, intermediate_result, keywords, values):
        question = intermediate_result.query
        self.schema = intermediate_result.schema
        self.space_name = intermediate_result.nebula_params["dbname"]
        self.nebula_engine = intermediate_result.nebula_params["nebula_engine"]

        # 提前拿到所有嵌套节点的信息，并缓存到redis中，下次直接读取
        self.cache_nested_nodes = self.init_nested_node(intermediate_result)
        values = await self.retrieve_values(intermediate_result, keywords, values)
        return values

    async def retrieve_values(self, intermediate_result, keywords, values):

        question = intermediate_result.query
        merge_nodes = {}
        if self.center_node:  # TODO 后面做成通用的，对任何schema中的嵌套节点都可以抽取
            center_node = self.center_node[0]  # 目前先只处理一个节点
            # 举例：获取嵌套组织的上下层组织实体信息，包括组织名称和组织的职位信息。

            nested_entity = []  # 关键词
            nested_keywords = []  # 召回的所有词

            # 收集涉及的邻居节点及相关属性
            self.related_neighbor_entity = {}
            self.key_value_pairs_sample = 0
            # 按照关键词抽取来限制中间节点的范围
            for value_ in values:
                for key, value in value_.items():
                    if center_node in value and value[center_node].get("name") and center_node in keywords.get(
                            "涉及实体", {}).get(key):
                        nested_entity.extend(value[center_node].get("name"))
                        nested_keywords.append(key)

            # 收集邻居节点信息
            related_entities = []
            for key, value in keywords.get("涉及实体", {}).items():
                related_entities.append(value)
            related_entities.extend(keywords.get("查询实体", []))

            for node_prop in related_entities:
                node_prop_split = node_prop.split(".")
                if len(node_prop_split) == 2:
                    node_name = node_prop_split[0]
                    # node_prop_name = node_prop_split[1]
                    if node_name in self.neighbor_entitys:
                        if "name" in node_prop:
                            self.related_neighbor_entity.setdefault(node_name, []).insert(0, node_prop)
                        else:
                            self.related_neighbor_entity.setdefault(node_name, []).append(node_prop)

            # 这里获取下级节点，通过子串匹配的方式，如anydata研发线有哪些测试，通过测试两个字，判断anydata研发线下面的模型工厂测试组也是重要的节点。
            temp_question = question
            for nested_keyword in nested_keywords:
                temp_question = temp_question.replace(nested_keyword, "")

            self.nested_entity = nested_entity
            #         # 需要结合组织描述召回，进行筛选。初步方案：问题和组织名和组织描述，看有没有相同字段。
            for limit in [10, 5, 2, 1]:
                self.limit = limit
                nested_nodes = []
                for entity_name in nested_entity:
                    if entity_name not in self.cache_nested_nodes:
                        StandLogger.error("该实体没有相邻节点：{}".format(entity_name))
                        continue
                    nested_node, current_node = self.search_up_nested_node(center_node, entity_name)
                    self.search_down_nested_node(temp_question, center_node, entity_name, current_node)
                    if nested_node:
                        nested_nodes.append(nested_node)
                self.use_node_names = set()
                merge_nodes = self.merge_dicts(nested_nodes)
                self.key_value_pairs_sample = self.count_key_value_pairs(merge_nodes)
                print("键值对的数量：{}:{}".format(self.limit, self.key_value_pairs_sample))
                if self.key_value_pairs_sample < 200:  # 直接限制数量剪枝
                    break

            merge_nodes = yaml.dump(merge_nodes, sort_keys=False, allow_unicode=True)

            # return merge_nodes
        return merge_nodes

    def search_up_nested_node(self, node_name, entity_name):
        # 如果当前实体已经在 use_node_names 中，直接返回空字典
        # if entity_name in self.use_node_names and (entity_name not in self.nested_entity):
        #     return {}, {}
        # self.use_node_names.add(entity_name)
        # 初始化嵌套字典
        entity_info = self.search_properties(entity_name)
        # 获取当前实体的父级实体
        res = self.cache_nested_nodes[entity_name].get("parent", [])
        if res and res[0]:  # 只处理当前节点只有一个父级节点的情况
            parent_entity_name = res[0]
            if parent_entity_name == entity_name:  # bug，子类和父类名字一样，就会死循环
                StandLogger.error(
                    "图谱schema错误，子类和父类名称一样，子类：{}，父类{}".format(entity_name, parent_entity_name))
                return entity_info, entity_info

            if parent_entity_name in self.cache_nested_nodes:
                # 递归查找父级实体的嵌套结构
                parent_nested_node, nearest_parent_node = self.search_up_nested_node(node_name, parent_entity_name)
                # 将当前实体添加到父级实体的 child 中
                # parent_nested_node.setdefault(parent_entity_name, {}).setdefault("child", {}).update(parent_entity_info)
                # nearest_parent_node[parent_entity_name]["child"].update(entity_info) # update是地址复制，不是引用
                nearest_parent_node[parent_entity_name]["child"] = entity_info  # update是地址复制，不是引用

                # 返回构建好的嵌套字典
                return parent_nested_node, entity_info

        # 如果没有父级实体，返回当前实体的嵌套字典
        return entity_info, entity_info

    def search_properties(self, entity_name):
        # 获取当前实体的邻居实体信息
        neighbor_entity_info = self.cache_nested_nodes[entity_name].get("neighbor_entity", {})

        # 返回当前实体的信息
        return {entity_name: {
            # "neighbor_entity": neighbor_entity_info, # 父节点就不召回过多信息
            "child": {},
        }}

    def has_overlapping_substring(self, s1, s2, min_length=2):
        for i in range(len(s1) - min_length + 1):
            substring = s1[i:i + min_length]
            if substring in s2:
                return True
        return False

    def count_key_value_pairs(self, d):
        count = 0

        if isinstance(d, dict):
            for key, value in d.items():
                count += 1  # 统计当前字典的键值对
                if isinstance(value, (dict, list, tuple, set)):
                    count += self.count_key_value_pairs(value)
        elif isinstance(d, (list, tuple, set)):
            for item in d:
                count += self.count_key_value_pairs(item)

        return count

    def search_down_nested_node(self, question, node_name, entity_name, current_node):
        if entity_name in self.use_node_names and (entity_name not in self.nested_entity): return
        # if entity_name
        self.use_node_names.add(entity_name)
        # if not self.has_overlapping_substring(question, entity_name, min_length=2): return

        # 获取邻居节点信息
        neighbor_entity_res = self.cache_nested_nodes[entity_name].get("neighbor_entity", {})

        # 根据关键词的范围，筛选邻居节点
        filter_entity_res = {}
        for neighbor_entity, neighbor_entity_info in neighbor_entity_res.items():
            if neighbor_entity in self.related_neighbor_entity:
                filter_prop = []
                for prop_info in neighbor_entity_info:
                    tmp_dic = {}
                    for related_neighbor in self.related_neighbor_entity[neighbor_entity]:
                        if related_neighbor in prop_info:
                            entity_prop_name = related_neighbor.split(".")[1]
                            tmp_dic[entity_prop_name] = prop_info[related_neighbor]
                    filter_prop.append(tmp_dic)
                # # TODO 限制子图的大小，怎么剪枝 先简单粗暴，限制数量
                filter_prop = filter_prop[:self.limit]

                filter_entity_res.setdefault(neighbor_entity, []).append(filter_prop)
        if filter_entity_res:
            tmp_current_node = {
                entity_name: {
                    "neighbor_entity": filter_entity_res,
                    "child": {}
                }}
        else:
            tmp_current_node = {
                entity_name: {
                    "child": {}
                }}
        # 获取子组织
        res = self.cache_nested_nodes[entity_name].get("child", [])
        child_has_overlap = False
        if res:
            child_entity_names = list(res)
            for e_name in child_entity_names:
                if e_name == entity_name:  # bug，子类和父类名字一样，就会死循环
                    StandLogger.error(
                        "图谱schema错误，子类和父类名称一样，子类：{}，父类{}".format(entity_name, entity_name))
                    continue
                has_overlap = self.search_down_nested_node(question, node_name, e_name,
                                                           tmp_current_node[entity_name]["child"])
                child_has_overlap = child_has_overlap or has_overlap
        current_has_overlap = self.has_overlapping_substring(question, entity_name, min_length=2)
        if child_has_overlap or current_has_overlap or (entity_name in self.nested_entity):
            current_node.update(tmp_current_node)
        return child_has_overlap or current_has_overlap

    def merge_dicts(self, dicts):
        def _merge(dict1, dict2):
            for key, value in dict2.items():
                if key in dict1 and isinstance(dict1[key], dict) and isinstance(value, dict):
                    dict1[key] = _merge(dict1[key], value)
                else:
                    dict1[key] = value
            return dict1

        result = {}
        for d in dicts:
            result = _merge(result, d)
        return result
