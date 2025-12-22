import regex as re

from .config import MethodConfig
from data_retrieval.tools.graph_tools.common.stand_log import StandLogger


class RuleFixer:
    def __init__(self):
        self.queries_fix = []
        self.execute_res = []

    def fix(self, query, intermediate_result):
        self.schema = intermediate_result.schema
        self.space_name = intermediate_result.nebula_params["dbname"]
        self.nebula_engine = intermediate_result.nebula_params["nebula_engine"]
        self.entity_edge_2props()
        """
        TODO 粗暴的把v3相关的去掉。
        step 1：把多余的node去掉
        step2：矫正路径
        step3：添加嵌套
        match (v1:business)<-[e1:person_2_business_belong_to]-(v2:person)-[e2:person_2_custom_subject_releated_manual]->(v3:custom_subject)
        where v1.business.name == "互联网领域" return v2.person.name
        """
        # self.check_nested_node()
        # Implement query fixing logic here

        # for raw_query in queries:
        self.queries_fix = []
        self.execute_res = []
        fix_query = self.fix_format(query)
        # step1：矫正路径，主要是箭头方向
        fix_query, res = self.fix_edge_path(fix_query)
        if not self.queries_fix:
        # step3：添加嵌套关系child*0..
            fix_query, res = self.add_nested_node(fix_query)
        if not self.queries_fix:
            self.queries_fix.append({"executed_res": res, "ngql": query})

        # query_fix_response = QueriesFixResponse(queries=self.queries_fix)
        # StandLogger.info("RuleFix: {}".format(self.queries_fix))
        return self.queries_fix, query

    def entity_edge_2props(self):
        self.nested_edges = []
        self.nested_nodes = []
        self.edge_name2props = {}
        for edge in self.schema.get("edge", []):
            self.edge_name2props.setdefault(edge["name"], edge)
            if edge["subject"] == edge["object"]:
                self.nested_edges.append(edge["name"])
                self.nested_nodes.append(edge["subject"])
        self.entity_name2props = {}
        for entity in self.schema.get("entity", []):
            self.entity_name2props.setdefault(entity["name"], entity["props"])
        return



    def cypher_case_insensitive_query(self, query):
        # 使用正则表达式匹配属性值并进行忽略大小写处理
        pattern = r'([a-zA-Z]\d\.\w+\.\w+)\s*(?:=|==|contains)\s*[\'\"](.*?)[\'\"]'
        modified_query = re.sub(pattern, lambda m: f'toLower({m.group(1)}) contains toLower(\'{m.group(2)}\')', query)
        return modified_query

    def fix_format(self, query):
        query = query.split("nGQL:")[-1].strip()
        query = query.replace("nGQL: ", "").replace("nGQL", "").replace("```", "").replace("：", "")
        query = re.sub(r'([a-zA-Z]\d{0,1})\.[^ \.\)]{2,}\)', r'\1)', query)  # v1.xxx 变成v1
        query = re.sub(r'\s+', ' ', query).strip()
        # query = self.cypher_case_insensitive_query(query)
        # query = re.sub("(\.[^. ]+\.[^. ]+ ?)(?:==|=~)( ?['\"][^'\"]+['\"])", r"\1 contains \2", query)
        return query

    def fix_edge_path(self, query):
        """
        match (v_district:district)-[e_district:district_2_district_child*0..11]->(v1:district),
        (v1:district)-[e1:person_2_district_work_at]->(v2:person) where v_district.district.name =~ "福建.*" return v2.person.name
        """
        edge_names = self.nested_edges
        for edge in self.edge_name2props:
            if edge in query and edge not in edge_names:
                node1 = self.edge_name2props[edge]["subject"]
                node2 = self.edge_name2props[edge]["object"]
                query = re.sub(f"(\([a-zA-Z]\d:{node1}\))-.?(\[e?\d?:{edge}\])-.?(\([a-zA-Z]\d:{node2}\))", r"\1-\2->\3", query)
                query = re.sub(f"(\([a-zA-Z]\d:{node2}\))-.?(\[e?\d?:{edge}\])-.?(\([a-zA-Z]\d:{node1}\))", r"\1<-\2-\3", query)

        res, error_info = self.nebula_engine.execute_any_ngql(self.space_name, query + " limit 20")
        # res = nebula_connector.execute_query(query, limit=20)
        # if res != 'none' and self.has_value(res):
        if res != 'none' and not self.check_null_values(res):
            if res not in self.execute_res:
                self.queries_fix.append({"executed_res": res, "ngql": query})
                self.execute_res.append(res)
        return query, res

    def remove_nouse_node(self, query, res):
        """
        match (v1:business)<-[e1:person_2_business_belong_to]-(v2:person)-[e2:person_2_custom_subject_releated_manual]->(v3:custom_subject)
        where v1.business.name == "互联网领域" return v2.person.name
        """
        if not self.has_value(res):
            min_node_index, max_node_index = 0, 0
            use_min_node_index, use_max_node_index = 0, 0
            node_index = re.findall(r"v(\d+):", query)
            if node_index:
                min_node_index, max_node_index = min([int(i) for i in node_index]), max([int(i) for i in node_index])
            use_node_index = re.findall(r"v(\d+)(?:\.|\))", query)
            if use_node_index:
                use_min_node_index, use_max_node_index = min([int(i) for i in use_node_index]), max(
                    [int(i) for i in use_node_index])

            if use_min_node_index - min_node_index >= 1 or max_node_index - use_max_node_index >= 1:
                if use_min_node_index - min_node_index >= 1:
                    query = re.sub(f"\(v{min_node_index}:[^\)]*\)(?:(?!match).)*(\(v{use_min_node_index}:[^\)]*\))",
                                   r"\1",
                                   query)
                # print(query)
                if max_node_index - use_max_node_index >= 1:
                    # print(max_node_index, use_max_node_index)
                    query = re.sub(f"(\(v{use_max_node_index}:[^\)]*\))(?:(?!match).)*\(v{max_node_index}:[^\)]*\)",
                                   r"\1",
                                   query)

                res, error_info = self.nebula_engine.execute_any_ngql(self.space_name, query + " limit 20")
                if res != 'none' and self.has_value(res):
                    if res not in self.execute_res:
                        self.queries_fix.append({"executed_res": res, "ngql": query})
                        self.execute_res.append(res)
        return query, res

    def add_nested_node(self, query):
        """
        match
        (v3:orgnization)-[e2:orgnization_2_orgnization_child*0..11]->(v1:orgnization),
        (v1:orgnization)<-[e1:person_2_orgnization_belong_to]-(v2:person)
        where v3.orgnization.name == "AnyFabric设计与文档部"
        return v2.person.name

        """
        # TODO 有些生成的nGQL不是v1 v2的形式
        node_names = self.nested_nodes
        edge_names = self.nested_edges
        for node_name, edge_name in zip(node_names, edge_names):
            # if edge_name in query:
            #     nested_query = query.replace(edge_name, edge_name + "*0..")
            #     continue
            # 获取orgnization和district的编号
            node_index = re.findall(r"v(\d+):{}".format(node_name), query)
            if not node_index: continue

            # 先替换
            node_index = node_index[0]
            # nested_query = re.sub(r'v{}\.{}'.format(node_index, node_name), r'v_{}.{}'.format(node_name, node_name),
            #                       query)
            # print(node_index)
            # print(re.search(f'->\(v{node_index}:{node_name}\)'.format(node_name=node_name, edge_name=edge_name, node_index=node_index), query))
            # 再新增路径
            """
            (v2:orgnization)<-[e2:orgnization_2_orgnization_child*0..]-(v3:orgnization)
            (v2:orgnization)-[e2:orgnization_2_orgnization_child*0..]->(v3:orgnization)
            """
            if edge_name in query:
                pattern = f'(\(v\d:{node_name}\)<-\[e\d*:{edge_name}[^\]]+\]-\(v\d+:{node_name}\))'
                # 两个orgnization的add
                res = re.findall(pattern, query)
                if res:
                    query = re.sub(pattern, f"(v_{node_name}:{node_name})<-[e_{node_name}:{edge_name}*0..11]-" + r"\1",
                                   query)

                pattern = f'(\(v\d:{node_name}\)-\[e\d*:{edge_name}[^\]]+\]->\(v\d+:{node_name}\))'
                # 两个orgnization的add
                res = re.findall(pattern, query)
                if res:
                    query = re.sub(pattern, r"\1" + f"-[e_{node_name}:{edge_name}*0..11]->(v_{node_name}:{node_name})",
                                   query)

            elif re.findall(f"v\d?\.{node_name}\.", query):
                # 单个orgnization的add。
                # 如果where 条件不涉及组织，就不加嵌套，如张小宇的组还有谁：match (v1:person)-[e1:person_2_orgnization_belong_to]->(v2:orgnization)<-[e2:person_2_orgnization_belong_to]-(v3:person) where v1.person.name  contains  '张小宇' return distinct v3.person.name
                if f'->(v{node_index}:{node_name})'.format(node_name=node_name, node_index=node_index) in query:
                    query = re.sub(f'->\(v{node_index}:{node_name}\)'.format(
                        node_name=node_name, node_index=node_index),
                        f'->(v_{node_name}:{node_name})<-[e_{node_name}:{edge_name}*0..11]-(v{node_index}:{node_name})'.format(
                            node_name=node_name, edge_name=edge_name, node_index=node_index),
                        query)
                elif f'(v{node_index}:{node_name})<-'.format(node_name=node_name, node_index=node_index) in query:
                    query = re.sub(f'\(v{node_index}:{node_name}\)<-'.format(
                        node_name=node_name, node_index=node_index),
                        f'(v{node_index}:{node_name})-[e_{node_name}:{edge_name}*0..11]->(v_{node_name}:{node_name})<-'.format(
                            node_name=node_name, edge_name=edge_name, node_index=node_index),
                        query)

            # print("修改后的nested nGQL:\n ", query)

        res, error_info = self.nebula_engine.execute_any_ngql(self.space_name, query + " limit 20")
        # if res != 'none' and self.has_value(res) :
        if res != 'none' and res not in self.execute_res and not self.check_null_values(res):
            self.queries_fix.append({"executed_res": res, "ngql": query})
            self.execute_res.append(res)
        return query, res
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
        return False
    def replace_contains(self, query, res):
        if not self.has_value(res):
            query = re.sub("(\.[^. ]+\.[^. ]+ ?)(?:==|=~)( ?['\"][^'\"]+['\"])",
                           r"\1 contains \2", query)
            res, error_info = self.nebula_engine.execute_any_ngql(self.space_name, query + " limit 20")
            if res == "none":
                res = {}
                # StandLogger.warning(query)
        return query, res
    def has_value(self, res):
        res_value = [v for key, value in res.items() for v in value]
        if not res_value or (len(res_value) == 1 and (res_value[0] == 0 or res_value[0] == "0")):
            return False
        return True