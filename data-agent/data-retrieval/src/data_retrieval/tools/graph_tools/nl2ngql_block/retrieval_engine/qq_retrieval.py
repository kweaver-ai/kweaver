import asyncio, aiohttp
from ..synthetic_data.template_synthetic import nGQLTemplateSynthetic
import copy

from itertools import zip_longest


class QuestionRuleRetrieval:
    def __init__(self, params):
        self.template_synthetic = nGQLTemplateSynthetic()
        self.size = params["size"]
        



    async def retrieval(self, intermediate_result, keywords):
        query = intermediate_result.query
        self.schema = intermediate_result.schema  # 保存schema信息
        filter_schema = self.get_schema(keywords)
        # filter
        nGQL_template = self.template_synthetic.synthetic_by_schema(filter_schema)
        results = await self.rule_search(query, nGQL_template, size=self.size)
        # 转换成cypher
        if isinstance(results, str):
            results = self.nGQL_to_cypher(results)
        elif isinstance(results, list):
            results = [self.nGQL_to_cypher(r) for r in results]
        return results

    def nGQL_to_cypher(self, nGQL_query):
        """Convert nGQL query to cypher format"""
        # Replace == with =
        query = nGQL_query.replace("==", "=")
        
        # Remove tag names from property references (v1.person.name -> v1.name)
        import re
        query = re.sub(r'(\w+)\.\w+\.(\w+)', r'\1.\2', query)
        
        return query

    def get_schema(self, keywords):
        linked_keywords = keywords.get("涉及实体", {})
        relation_keywords = keywords.get("涉及关系", [])
        query_keywords = keywords.get("查询实体", [])
        filter_schema = {}
        if linked_keywords or query_keywords:
            entity_prop = {}
            for _, value in linked_keywords.items():
                value = value.split(".")
                if len(value) >= 2:
                    entity_prop.setdefault(value[0], set()).add(value[1])
                else:
                    entity_prop.setdefault(value[0], set())
            for value in query_keywords:
                value = value.split(".")
                if len(value) >= 2:
                    entity_prop.setdefault(value[0], set()).add(value[1])
                else:
                    entity_prop.setdefault(value[0], set())
            for value in relation_keywords:
                value = value.split("_")
                if len(value) > 2:
                    entity_prop.setdefault(value[0], set()).add("name")
                    entity_prop.setdefault(value[2], set()).add("name")

            # print()
            filter_schema["edge"] = self.schema.get("edge", [])
            filter_schema["entity"] = []
            for entity in self.schema.get("entity", []):
                filter_entity = copy.deepcopy(entity)
                if entity["name"] in entity_prop:
                    props_list = filter_entity.pop("props")
                    filter_entity["props"] = []
                    filter_schema["entity"].append(filter_entity)
                    for props in props_list:
                        if props["name"] in entity_prop[entity["name"]]:
                            filter_entity["props"].append(props)
        return filter_schema

    async def rule_search(self, question, nGQL_template, size=20):
        """
        TODO 一个template会有多个真实样例，分组返回会好点。
        """

        count = 0
        context = ""

        if not nGQL_template:
            return context
        # 假设这是你的多个列表的列表
        lists = [
            value for key, value in nGQL_template.items()
        ]

        # 使用zip_longest来处理所有列表，fillvalue可以根据需要设置，这里设置为None
        # result = [element for sublist in zip_longest(*lists, fillvalue=None) for element in sublist if element is not None]
        if len(lists) > self.size:
            # 计算公差
            total_numbers = len(lists)
            # 公差
            step = (total_numbers - 1) / (self.size - 1)
            # 生成等差数列的索引
            indices = [int(i * step) for i in range(self.size)]
            lists = [lists[i] for i in indices]
        # 确定最长的列表长度
        max_length = max(len(lst) for lst in lists)

        # 取出每个位置的元素
        lists = [element for i in range(max_length) for lst in lists if i < len(lst) for element in [lst[i]]]
        for i, res in enumerate(lists):
            if i > self.size: break
            context += "{}.".format(i) + res + "\n"

        # result = sorted(result, key=lambda x: len(x), reverse=True)
        # for i, res in enumerate(result):
        #     if i > self.size: break
        #     context += "{}.".format(i) + res + "\n"
        # context += "query: " + hit['_source']['question'] + "\n"
        # context += "nGQL: " + hit['_source']['example'] + "\n"

        return context
