import random, copy, json, os
import regex as re
import uuid
import asyncio
import aiohttp
from af_agent.tools.graph_tools.common.stand_log import StandLogger
from .config import MethodConfig
from .utils import letterCombinations, uniqueletterCombinations, string_to_unique_id
from .ngql_template import generic_template_strict
from .find_path import find_simple_edges, find_converging_paths, find_two_hop_paths, find_three_hop_paths, \
    find_unique_nodes, find_diverging_paths, search_path_func, search_path_template
from .utils import find_keys_with_multiple_values, permutations
# 设置随机数生成器的种子
random.seed(10)

class nGQLTemplateSynthetic:
    def __init__(self):
        self.operator_dic = {
            "string": {
                # "elements": ["==", "CONTAINS", "!=", "STARTS WITH", "ENDS WITH"],
                "elements": ["=="],
                "weights": [4]
            },
            "boolean": {
                # "elements": ["==", "CONTAINS", "!=", "STARTS WITH", "ENDS WITH"],
                "elements": ["=="],
                "weights": [4]
            },
            "integer": {
                # "elements": ["==", ">", "<", "!=", ],
                "elements": ["==", ">", "<"],
                "weights": [4, 2, 2]
            },
            "double": {
                "elements": ["==", ">", "<", ],
                "weights": [1, 1, 1]
            },
            "float": {
                "elements": ["==", ">", "<", ],
                "weights": [1, 1, 1]
            },
            "datetime": {
                "elements": ["==", ">", "<"],
                "weights": [2, 2, 2]
            },
            "date": {
                "elements": ["==", ">", "<"],
                "weights": [2, 2, 2]
            },

        }
        self.sample_size = 1

    # def seeded_choice(self, sequence):
    #     random.seed(10)
    #     return random.choice(sequence)
    #
    # def seeded_sample(self, population, k):
    #     random.seed(10)
    #     return random.sample(population, k)

    def synthetic_by_schema(self, schema):
        # 设置随机数生成器的种子
        random.seed(10)
        if not schema: return {}
        nGQL_template = {}

        count_freq = {}
        extracted_dict = self.generate_template()
        # 准备边和实体的映射
        edge_name2props, entity_name2props = self.entity_edge_2props(schema)
        for index, ngql_templates in enumerate(extracted_dict):

            # StandLogger.debug("index: {}".format(index))
            # if index > 10: continue
            # if index == 1000: break
            rel_path = ngql_templates["path1"]
            nGQL, category = ngql_templates["nggl_template"], ngql_templates
            # if nGQL.count("match") > 1:
            #     continue
            # StandLogger.debug("rel_path:", rel_path)
            if rel_path not in search_path_func:
                StandLogger.debug(rel_path)
                raise "search_path模板需要更新"
            # if rel_path != "v1->v2":
            #     continue
            search_path_res = eval(search_path_func[rel_path])(schema.get("edge", []))
            # print(search_path_res)
            # StandLogger.debug(search_path_res)
            # break

            for edge_entity_group in search_path_res:
                edge_with_entity_name = []
                edge_name = []
                for edge_entity_name, edge_entity_value in edge_entity_group.items():
                    if edge_entity_name.startswith("e"):
                        edge_name.append(edge_entity_value)
                    elif edge_entity_name.startswith("v"):
                        if edge_entity_value not in entity_name2props:
                            break
                        edge_with_entity_name.append(edge_entity_value)
                    else:
                        raise ""
                else:
                    # 获取所有标签
                    all_params = {}
                    for rel_i, rel_name in enumerate(edge_name, 1):
                        all_params.update({"rel_{}".format(rel_i): rel_name})
                    # for nGQL, category in ngql_templates.items():
                    nGQL = re.sub(r'\s+', ' ', nGQL).strip()

                    # id 一般是return之后
                    v_index = re.findall(r"(?<=(?:RETURN|return).*)v(\d+)\.", nGQL)
                    if v_index:
                        v_index = [int(i) for i in v_index]
                    else:
                        v_index = None
                    # # 聚合后面不要id
                    # agg_index = re.findall(r"(?:sum|min|max|avg|SUM|MIN|MAX|AVG)\(v(\d+)\.", nGQL)
                    all_candidate_combination = {}
                    for entity_i, entity_name in enumerate(edge_with_entity_name, 1):
                        if not entity_name2props[entity_name]: break  # 如果某个节点没有值，就跳过
                        # 抽取label实体在nGQL的属性类型要求有哪些，比如有的需要int或datetime类型。
                        all_params.update({"label_{}".format(entity_i): entity_name})
                        special_idx = None

                        # 获取属性的最大编号
                        require_prop_idx = re.findall(f"prop_{entity_i}" + "_(\d)", nGQL)
                        if require_prop_idx:
                            require_prop_num = max([int(i) for i in require_prop_idx])
                        else:
                            require_prop_num = 0

                        pairs = re.findall(f"prop_{entity_i}" + "_(\d)_([^}]+)", nGQL)
                        if pairs:
                            if find_keys_with_multiple_values(pairs):
                                # StandLogger.debug()
                                raise "模板写的不合理，同一属性有多个类型"
                            special_idx = dict(pairs)
                        # TODO 写个判断，如果是数值类型，就只采样数值属性，如果没有，就break

                        candidate_combination = self.sample_all_entity_label_prop_value(entity_name2props, entity_name,
                                                                                        edge_with_entity_name, special_idx,
                                                                                        entity_i, v_index, require_prop_num)
                        if not candidate_combination:
                            break
                        all_candidate_combination[entity_i] = candidate_combination
                    else:
                        if not all_candidate_combination:
                            continue
                        entity_i_list = list(all_candidate_combination.keys())
                        combination_idx = {key: list(range(len(value))) for key, value in all_candidate_combination.items()}
                        all_candidate_combination_idx = letterCombinations(combination_idx)
                        count_freq.setdefault(len(all_candidate_combination_idx), 0)
                        count_freq[len(all_candidate_combination_idx)] += 1
                        if len(all_candidate_combination_idx) > self.sample_size:
                            all_candidate_combination_idx = random.sample(all_candidate_combination_idx, self.sample_size)
                        sample_index = 0
                        for comb_index, candidate_combination in enumerate(all_candidate_combination_idx):
                            # 每次换模板需要初始化
                            all_params.update({"connector": random.choice(["AND"])})
                            # all_params.update({"connector": random.choice(["AND", "OR"])})
                            all_params.update({"limit": random.choice([1])})
                            all_params.update({"skip": random.choice([0])})
                            all_params.update({"desc_asc": random.choice(["DESC", "ASC"])})
                            all_params.update({"aggregate": random.choice(["avg", "sum", "max", "min"])})
                            all_params.update({"operator": random.choice(["==", "<", ">"])})
                            all_params.update({"aggregate_min_max": random.choice(["max", "min"])})
                            # all_params.update({"connector": random.choice(["AND"])})
                            # all_params.update({"limit": random.choice([1])})
                            # all_params.update({"skip": random.choice([0])})
                            # all_params.update({"desc_asc": random.choice(["DESC"])})
                            entity_params = {}
                            self.get_entity_params(entity_params, candidate_combination, all_candidate_combination,
                                                   entity_i_list)
                            nGQL_new = re.sub(f"(prop_(\d)" + "_(\d))_[^}]+", r"\1", nGQL)
                            nGQL_new = re.sub(r'\s+', ' ', nGQL_new).strip()
                            example = nGQL_new.format(**all_params, **entity_params)
                            # print(example)
                            nGQL_template.setdefault(nGQL, []).append(example)
        return nGQL_template





    def generate_template(self):
        check = set()
        template_combination = []
        template_count = {}
        for template_k, template in copy.deepcopy(generic_template_strict).items():

            # continue
            # if template_k not in [
            #     # "match return",
            #     "match where with return",
            #                       ]: continue
            for ngql_template, template_params in template.items():

                # if ngql_template != "match {path1} where {node1}.pov {{connector}} {node2}.pov return count(distinct {node3})":
                #     continue
                # StandLogger.debug("ngql_template:", ngql_template)
                template_count.setdefault(ngql_template, 0)
                try:
                    path1 = template_params.pop("path1")
                    path2 = template_params.pop("path2") if "path2" in template_params else []  # TODO 可能有path2的场景
                except:
                    raise
                letter_combination = uniqueletterCombinations(template_params)
                # StandLogger.debug(letter_combination)

                for params_value in letter_combination:
                    assert len(params_value) == len(template_params)
                    last_value = -1
                    for value, node_tag in zip(params_value, template_params.keys()):
                        # where v1 and v2 和where v2 and v1 是一样的，需要去重。
                        if re.search("node(\d)\+", node_tag):
                            value = int(re.findall("v(\d)", value)[0])
                            if value < last_value:
                                # StandLogger.debug("--------------------------------")
                                # StandLogger.debug(ngql_template)
                                # StandLogger.debug(params_value)
                                break
                        elif re.search("node(\d)", node_tag):
                            value = int(re.findall("v(\d)", value)[0])
                        last_value = value
                    else:
                        """
                        宽松版，对应book等数据集。
                         if "v4" in params_value:  # TODO 如果有多个match，多个path，按 match拆分，然后分别判断path1和path2
                            path1 = ["v1->v2->v3->v4"]
                        elif "v3" in params_value:
                            path1 = ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1<-v2->v3"]
                            # path1 = ["v1->v2->v3", "v1->v2<-v3"]
                        elif "v2" in params_value:
                            # path1 = ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2"]
                            path1 = ["v1->v2->v3", "v1->v2<-v3", "v1<-v2->v3", "v1->v2"]  # 不超过两跳
                            # path1 = ["v1->v2"]
                        elif "v1" in params_value:
                            # path1 = ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"]
                            path1 = ["v1->v2", "v1"]
                        else:
                            continue
                        """
                        if "v4" in params_value:  # TODO 如果有多个match，多个path，按 match拆分，然后分别判断path1和path2
                            path1 = ["v1->v2->v3->v4"]
                        elif "v3" in params_value:
                            path1 = ["v1->v2->v3", "v1->v2<-v3", "v1<-v2->v3"]
                        elif "v2" in params_value:
                            path1 = ["v1->v2"]  # 不超过两跳
                        elif "v1" in params_value:
                            path1 = ["v1"]
                        else:
                            continue
                        for path in path1:

                            params = dict(zip([key.rstrip("+") for key, _ in template_params.items()], params_value))
                            ngql_template_dic = {
                                "first_class": template_k,
                                "second_class": ngql_template,
                                "path1": path,
                                "params": params
                            }
                            params.update({"path1": search_path_template[path]})
                            nggl_raw = ngql_template.format(**params)
                            # StandLogger.debug(nggl_raw)
                            if nggl_raw in check:
                                raise "有重复样本"
                            check.add(nggl_raw)
                            v_template = []

                            nggl_raw = self.completion_prop_value(nggl_raw)
                            # StandLogger.debug(nggl_raw)
                            # StandLogger.debug()
                            ngql_template_dic.update({"nggl_template": nggl_raw})
                            template_combination.append(ngql_template_dic)
                            template_count[ngql_template] += 1
        # StandLogger.info("总的模板数量：{}".format(len(template_combination)))
        # StandLogger.info("模板信息：{}".format(template_count))
        return template_combination

    def entity_edge_2props(self, schema):
        edge_name2props = {}
        for edge in schema.get("edge", []):
            edge_name2props.setdefault(edge["name"], edge)
        entity_name2props = {}
        for entity in schema.get("entity", []):
            entity_name2props.setdefault(entity["name"], entity["props"])
        return edge_name2props, entity_name2props

    def completion_prop_value(self, nggl_raw):
        v_template = []
        for n in [1, 2, 3, 4]: v_template.append(
            ["v{n}.{{label_{n}}}.{{prop_{n}_{m}date_type}} {{operator_{n}_{m}_1}} {{val_{n}_{m}_1}}".format(n=n,
                                                                                                            m=m) for
             m
             in [1, 2, 3, 4]])
        povc_enum = {}
        povc_enum.update(
            {"v{}.POV_int".format(n): {"index": n, "date_type": "int", "prefix": "POV", "postfix": "_int"} for n in
             [1, 2, 3, 4]})
        povc_enum.update(
            {"v{}.POV_date".format(n): {"index": n, "date_type": "date", "prefix": "POV", "postfix": "_date"} for n
             in [1, 2, 3, 4]})
        povc_enum.update(
            {"v{}.P_int".format(n): {"index": n, "date_type": "int", "prefix": "P", "postfix": "_int"} for n in
             [1, 2, 3, 4]})
        povc_enum.update(
            {"v{}.P_date".format(n): {"index": n, "date_type": "date", "prefix": "P", "postfix": "_date"} for n in
             [1, 2, 3, 4]})
        povc_enum.update(
            {"v{}.POV".format(n): {"index": n, "date_type": "", "prefix": "POV", "postfix": ""} for n in
             [1, 2, 3, 4]})
        povc_enum.update(
            {"v{}.pov_int".format(n): {"index": n, "date_type": "int", "prefix": "pov", "postfix": "_int"} for n in
             [1, 2, 3, 4]})
        povc_enum.update(
            {"v{}.pov_date".format(n): {"index": n, "date_type": "date", "prefix": "pov", "postfix": "_date"} for n
             in [1, 2, 3, 4]})
        povc_enum.update(
            {"v{}.p_int".format(n): {"index": n, "date_type": "int", "prefix": "p", "postfix": "_int"} for n in
             [1, 2, 3, 4]})
        povc_enum.update(
            {"v{}.p_date".format(n): {"index": n, "date_type": "date", "prefix": "p", "postfix": "_date"} for n in
             [1, 2, 3, 4]})
        povc_enum.update(
            {"v{}.pov".format(n): {"index": n, "date_type": "", "prefix": "pov", "postfix": ""} for n in
             [1, 2, 3, 4]})
        povc_enum.update(
            {"v{}.p".format(n): {"index": n, "date_type": "", "prefix": "p", "postfix": ""} for n in [1, 2, 3, 4]})

        for povc_variable, povc_info in povc_enum.items():
            if povc_variable in nggl_raw:
                index = povc_info["index"]
                prefix = povc_info["prefix"]
                postfix = povc_info["postfix"]
                i = 0
                while i < len(v_template[index - 1]):
                    povc_template = v_template[index - 1][i]
                    if povc_variable in nggl_raw:
                        if prefix == "p":
                            i += 1
                            povc_template_part = povc_template.split(" ")
                            value = povc_template_part[0]
                            value = value.replace("date_type", postfix)
                        elif prefix == "P":
                            povc_template_part = povc_template.split(" ")
                            value = povc_template_part[0]
                            value = value.replace("date_type", postfix)
                        elif prefix == "pov":
                            i += 1
                            value = povc_template
                            value = value.replace("date_type", postfix)
                        elif prefix == "POV":
                            value = povc_template
                            value = value.replace("date_type", postfix)
                        else:
                            raise ""
                        nggl_raw = nggl_raw.replace(povc_variable, value, 1)
                    else:
                        break
                if prefix in ["P", "POV"]:  # 循环里没有累加，循环外，需要累加
                    i += 1
                v_template[index - 1] = v_template[index - 1][i:]
        for ele in [".POV_int", ".POV_date", ".P_int", ".P_date", ".POV", ".pov_int", ".pov_date", ".p_int",
                    ".p_date", ".pov"]:
            if ele in nggl_raw:
                StandLogger.debug(v_template)
                raise "没有替换干净"
        return nggl_raw

    def sample_all_entity_label_prop_value(self, entity_name2props, entity_name, edge_with_entity_name, special_idx,
                                           entity_i,
                                           v_index, require_prop_num):
        idx2date_type = {i: None for i in range(require_prop_num)}
        if special_idx:
            idx2date_type = {i: special_idx.get(str(i + 1), None) for i in range(require_prop_num)}

        entity_props = entity_name2props[entity_name]

        entity_dt2props = []
        for entity_prop in entity_props:
            data_type = entity_prop["data_type"].lower()  # 注意，这里的类型一定是小写的，不然后面if无法判断
            prop_name = entity_prop["name"]
            if (not v_index or entity_i not in v_index) and "id" in prop_name:
                continue
            entity_sample_dic = {
                "prop": prop_name,
                "data_type": data_type,
                "operator": self.operator_dic[data_type],
                "val": entity_prop["partial_values"]}
            entity_dt2props.append(entity_sample_dic)
        if len(entity_dt2props) < require_prop_num:
            return
        if require_prop_num == 0:  # 对于模板没有属性值的情况，就默认一个
            props_index_combination = [[0]]
        else:
            props_index_combination = permutations(list(range(len(entity_dt2props))), require_prop_num)
        random.shuffle(props_index_combination)
        candidate_combination = []

        for prop_index_combination in props_index_combination:
            for idx, date_type in idx2date_type.items():
                if not date_type:
                    continue
                # 检查索引是否在有效范围内
                if idx >= len(prop_index_combination) or prop_index_combination[idx] >= len(entity_dt2props):
                    break
                entity_sample = entity_dt2props[prop_index_combination[idx]]
                prop_name = entity_dt2props[prop_index_combination[idx]]["prop"]
                prop_data_type = entity_sample["data_type"]
                if date_type == "date":
                    if prop_data_type not in ["date", "datetime"]:
                        break
                elif date_type == "int":
                    if prop_data_type not in ["integer", "double", "float"] or "id" in prop_name:
                        break
                else:
                    raise "未知数据类型"
            else:
                prop_combination = []
                for prop_index in prop_index_combination:
                    # 检查索引是否在有效范围内
                    if prop_index >= len(entity_dt2props):
                        break
                    prop_combination.append(entity_dt2props[prop_index])
                else:
                    # 只有在所有索引都有效时才添加到候选组合中
                    candidate_combination.append(prop_combination)
        # if len(edge_with_entity_name) >= 4:
        #     if len(candidate_combination) > 2: # 这个参数控制生成的数量，如果不限制，会生成上百万条数据
        #         candidate_combination = random.sample(candidate_combination, 2)
        # else:
        #     if len(candidate_combination) > 4: # 这个参数控制生成的数量，如果不限制，会生成上百万条数据
        #         candidate_combination = random.sample(candidate_combination, 4)
        return candidate_combination

        # return idx2props

    def get_entity_params(self, entity_params, candidate_combination, all_candidate_combination, entity_i_list):
        for comb_i, combination in enumerate(candidate_combination):
            entity_i = entity_i_list[comb_i]
            idx2props = all_candidate_combination[entity_i][combination]
            for prop_i, entity_prop_value_dic in enumerate(copy.deepcopy(idx2props), 1):
                prop_value_params = {}
                if not entity_prop_value_dic:
                    continue
                prop_value_params["prop_{}_{}".format(entity_i, prop_i)] = entity_prop_value_dic.get("prop")
                # operator_values = random.sample(entity_prop_value_dic.get("operator"), 4)
                elements = entity_prop_value_dic.get("operator")["elements"]
                weights = entity_prop_value_dic.get("operator")["weights"]
                operator_values = random.choices(elements, weights=weights, k=4)
                for operator_i, operator_value in enumerate(operator_values, 1):
                    prop_value_params["operator_{}_{}_{}".format(entity_i, prop_i, operator_i)] = operator_value
                data_type = entity_prop_value_dic.get("data_type")
                if len(entity_prop_value_dic.get("val")) >= 4:
                    prop_values = random.sample(entity_prop_value_dic.get("val"), 4)
                else:
                    prop_values = entity_prop_value_dic.get("val")
                for value_i, prop_value in enumerate(prop_values, 1):
                    if data_type == "datetime" or data_type == "date":
                        prop_value = "{}('".format(data_type) + prop_value.replace("Z", "") + "')"
                    if data_type == "string":
                        prop_value = "\"" + prop_value + "\""
                    prop_value_params["val_{}_{}_{}".format(entity_i, prop_i, value_i)] = prop_value
                entity_params.update(prop_value_params)




# generate_example()
if __name__ == "__main__":
    # 指定要保存的文件名
    # start_time = time.time()
    # generate_template()
    # filename = 'batch_nGQL_superhero_example.jsonl'
    # filename = 'batch_nGQL_financial_example.jsonl'
    # filename = 'batch_nGQL_car_example.jsonl'
    # generate_ngql(filename='batch_nGQL_financial_example.jsonl',
    #               space_name="ue0501b38b1f111ef9b76fa7a3cad21e8-2", #financial
    #               graph_id=14,
    #               sample_size=20
    #               )
    # generate_ngql(filename='batch_nGQL_AS_example.jsonl',
    #               space_name="uc692f7dc929911ef821966f202b6c1cd-2",  # as默认图谱
    #               graph_id=3,
    #               sample_size=2000
    #               )
    # generate_ngql(filename='batch_nGQL_car_example.jsonl',
    #               space_name="uad6ce80eb1f111efbf92fa7a3cad21e8", #car
    #               graph_id=13,
    #               sample_size=1
    #               )

    # StandLogger.debug("spend_time:", time.time()-start_time)
    # for i in range(2):
    params = MethodConfig.template_base["params"]
    nGQLTemplateSynthetic(params).synthetic()
    # asyncio.run(nGQLQuestionSynthetic(params).synthetic())
