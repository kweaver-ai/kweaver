import regex as re
from .rule_fixer import RuleFixer
from ..common.structs import QueriesFixResponse
from .cot_fixer import CoTFixer
from data_retrieval.tools.graph_tools.common.stand_log import StandLogger


class QueryFixer:
    def __init__(self):
        self.rule_fixer = RuleFixer()
        self.cot_fix_generator = CoTFixer()
        self.retry = 0

    # async def fix(self, intermediate_result):
    #     """
    #     TODO 粗暴的把v3相关的去掉。
    #     step 1：把多余的node去掉
    #     step2：矫正路径
    #     step3：添加嵌套
    #     match (v1:business)<-[e1:person_2_business_belong_to]-(v2:person)-[e2:person_2_custom_subject_releated_manual]->(v3:custom_subject)
    #     where v1.business.name == "互联网领域" return v2.person.name
    #     """
    #     queries = intermediate_result.candidate_queries
    #     queries_fix = []
    #     queries_fix, query = self.rule_fixer.fix(queries["response"], intermediate_result)
    #     executed_res = queries_fix[-1]["executed_res"]
    #     if self.rule_fixer.check_null_values(executed_res):
    #         response = await self.cot_generator.generate(intermediate_result, queries["messages"], queries_fix)
    #         if response:
    #             queries_fix, query = self.rule_fixer.fix(response, intermediate_result)
    #     query_fix_response = QueriesFixResponse(queries=queries_fix)   # TODO 考虑查询结果过多的问题
    #     intermediate_result.fixed_queries = query_fix_response
    #     return query_fix_response.queries
    

    
    async def fix(self, intermediate_result):
        """

        """
        queries = intermediate_result.candidate_queries
        self.schema = intermediate_result.schema
        
        self.space_name = intermediate_result.nebula_params["dbname"]
        self.nebula_engine = intermediate_result.nebula_params["nebula_engine"]
        query = queries["response"]
        messages = queries["messages"]
        queries_fix = []
        res, query = await self.execute(query)
        queries_fix.append({"executed_res": res, "ngql": query})
        retry = 1
        # is_null = self.rule_fixer.check_null_values(res)
        # while is_null:
        #     query = await self.cot_fix_generator.generate(intermediate_result, messages, queries_fix[-1])
        #     res, query = await self.execute(query)
        #     queries_fix.append({"executed_res": res, "ngql": query})
        #     is_null = self.rule_fixer.check_null_values(res)
        #     retry += 1
        #     if retry > 1:
        #         break
        # if is_null:
        #     queries_fix  = queries_fix[:1]
        query_fix_response = QueriesFixResponse(queries=queries_fix)   # TODO 考虑查询结果过多的问题
        intermediate_result.fixed_queries = query_fix_response
        return query_fix_response.queries

    async def execute(self, query):
        cpyher_query = self.fix_format(query)
        query = self.cypher_to_nGQL(cpyher_query)
        res, error_info = self.nebula_engine.execute_any_ngql(self.space_name, query + " limit 20") 
        return res, cpyher_query 

    def fix_format(self, query):
        query = query.split("cypher:")[-1].strip()
        query = query.replace("cypher", "").replace("```", "").replace("：", "")
        query = re.sub(r'\s+', ' ', query).strip()
        return query
    
    # def fix_format(self, query):
    #     # 使用正则匹配 ```cypher 或 ```cypher 包裹的语句
    #     pattern = re.compile(r'```(?:cypher|cypher)\s*([\s\S]+?)\s*```')
    #     match = pattern.search(query)
    #     if match:
    #         print("已匹配到....")
    #         query = match.group(1).strip()
    #     else:
    #         # 如果没有匹配到，则保留原有逻辑
    #         query = query.split("cypher:")[-1].strip()
    #         query = query.replace("cypher:", "").replace("cypher:", "").replace("cypher", "").replace("cypher", "").replace("```", "")
    #     query = re.sub(r'\s+', ' ', query).strip()
    #     return query
    
    def cypher_to_nGQL(self, cypher_query):
        """Convert cypher query to nGQL format"""
        # 添加输入日志
        StandLogger.debug(f"cypher_to_nGQL input: {cypher_query}")
        
        # Replace = with ==
        query = cypher_query.replace("=", "==")
        
        # 提取所有变量及其类型 (v1:person) -> {'v1': 'person'}
        import re
        var_type_pattern = re.compile(r'\((\w+):([^)\s]+)')
        var_types = dict(var_type_pattern.findall(cypher_query))
        
        # 匹配属性引用模式 (v1.name)
        prop_pattern = re.compile(r'(\w+)\.(\w+)')
        
        def replace_property(match):
            var_name, prop_name = match.groups()
            
            # 如果知道变量的类型
            if var_name in var_types and self.schema and "entity" in self.schema:
                var_type = var_types[var_name]
                # 查找该类型实体是否有这个属性
                for entity in self.schema.get("entity", []):
                    if entity["name"] == var_type and "props" in entity:
                        for prop in entity.get("props", []):
                            if prop["name"] == prop_name:
                                return f"{var_name}.{entity['name']}.{prop_name}"
            
            # 如果不知道变量类型或找不到匹配属性，保持原样
            return match.group(0)
            
        query = prop_pattern.sub(replace_property, query)
        
        # 添加输出日志
        StandLogger.debug(f"cypher_to_nGQL output: {query}")
        return query
    
    def check_null_values(self, executed_res):
        if not executed_res or not isinstance(executed_res, dict):
            return True
        for res_name, res_value in executed_res.items():
            if isinstance(res_value, list):
                try:
                    # 尝试转换为集合去重
                    unique_values = list(set(res_value))
                except TypeError:
                    continue
                # 检查是否为空或仅包含0/1
                if not unique_values or (len(unique_values) == 1 and unique_values[0] in ["0", "1", 0, 1]):
                    return True
            else:
                return True
        return