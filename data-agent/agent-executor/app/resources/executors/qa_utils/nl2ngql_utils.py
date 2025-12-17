# -*- coding: utf-8 -*-
# @Time   : 2024/6/15 11:23
# @Author : weiwang
import re
import ast


class LF2nGQL:
    """
    将LLM生成的logic form转换成nGQL语句
    """

    def multi_level_ent_ngql_proc_lf(self, ngql, belong_reason_rules):
        """加多级实体"""
        v_alias = re.findall(r"v(\d+)", ngql)
        max_v = 0
        if v_alias:
            max_v = max([int(x) for x in v_alias])
        e_alias = re.findall(r"e(\d+)", ngql)
        max_e = 0
        if e_alias:
            max_e = max([int(x) for x in e_alias])
        v_a = "v" + str(max_v + 1)
        e_a = "e" + str(max_e + 1)
        for reason_rule in belong_reason_rules:
            max_hops = reason_rule["max_hops"]  # 最大跳数
            reason_edge = reason_rule[
                "reason_edge"
            ]  # 边中实体存在自指向包含关系的表示(为减少错误,用户必须正向写出边的关系)
            entity_name = reason_rule["entity_name"]  # 自己指向自己的实体名称
            contained_by_edge = reason_rule["contained_by"]  # 自指向自己边的表示
            contained_by_re_pos = (
                r"\((\w+)\)-\[(\w+)\]->\((\w+)\)"  # 清洗自指向边正向写法的正则
            )
            contained_by_re_neg = (
                r"\((\w+)\)<-\[(\w+)\]-\((\w+)\)"  # 清洗自指向边反向写法的正则
            )
            entity_name_re_rule = r"\((\w+)\)"  # 清洗自指向实体的名称正则
            edge_re_rule = r"\((\w+)\)-\[(\w+)\]->\((\w+)\)"  # 清洗边中实体存在自指向包含关系的正则(为减少错误,用户必须正向写出边的关系)
            # 判断用户输入自己指向自己边的正反写关系
            if "->" in contained_by_edge:
                contained_by_edge_res = re.findall(
                    contained_by_re_pos, contained_by_edge
                )
            elif "<-" in contained_by_edge:
                contained_by_edge_res = re.findall(
                    contained_by_re_neg, contained_by_edge
                )
            else:
                raise Exception("belong_reason_rules contained_by 配置错误!")
            self_loop_relation_name = contained_by_edge_res[0][1]
            self_loop_entity_name = re.findall(entity_name_re_rule, entity_name)[
                0
            ]  # 一层
            reason_edge_cleared_list = re.findall(edge_re_rule, reason_edge)
            reason_edge_out_ent = reason_edge_cleared_list[0][0]
            reason_edge_relation = reason_edge_cleared_list[0][1]
            reason_edge_in_ent = reason_edge_cleared_list[0][2]
            # 判断自指向实体在llm预测结果中是出边节点还是入边节点
            if self_loop_entity_name == reason_edge_in_ent:  # 入边节点
                pat1 = r"(\(v\d*:?{}\)-\[e\d*:?{}\]->)(\(v\d*:?{}\))".format(
                    reason_edge_out_ent, reason_edge_relation, reason_edge_in_ent
                )
                pat2 = r"(\(v\d*:?{}\))(<-\[e\d*:?{}\]-\(v\d*:?{}\))".format(
                    reason_edge_in_ent, reason_edge_relation, reason_edge_out_ent
                )
                # r'(\(v\d*: ?person\)-\[e\d*: ?person_2_district_work_at\]->) (\(v\d*: ?district\))'
                # pat2 = r'(?<!)(\(v\d*: ?district\))(<-\[e\d*: ?person_2_district_work_at\]-\(v\d*: ?person\))'
                match_results = re.findall(pat1, ngql)
                for substrt in reversed(match_results):
                    beg = ngql.index(substrt[0] + substrt[1])
                    end = beg + len(substrt[0])
                    if "<-[" in contained_by_edge:
                        ngql = (
                            ngql[:end]
                            + "("
                            + v_a
                            + ":{})".format(self_loop_entity_name)
                            + "<-["
                            + e_a
                            + ":{}*0..{}]-".format(self_loop_relation_name, max_hops)
                            + ngql[end:]
                        )
                    else:
                        ngql = (
                            ngql[:end]
                            + "("
                            + v_a
                            + ":{})".format(self_loop_entity_name)
                            + "-["
                            + e_a
                            + ":{}*0..{}]->".format(self_loop_relation_name, max_hops)
                            + ngql[end:]
                        )
                    max_e += 1
                    max_v += 1
                    v_a = "v" + str(max_v + 1)
                    e_a = "e" + str(max_e + 1)

                match_results2 = re.findall(pat2, ngql)
                # 注意 pat2中的方向与定义
                for substrt in reversed(match_results2):
                    beg = ngql.index(substrt[0] + substrt[1])
                    end = beg + len(substrt[0])
                    # 注意这里方向应该与contained_by_edge相反
                    if "<-[" in contained_by_edge:
                        ngql = (
                            ngql[:end]
                            + "-["
                            + e_a
                            + ":{}*0..{}]->".format(self_loop_relation_name, max_hops)
                            + "("
                            + v_a
                            + ":{})".format(self_loop_entity_name)
                            + ngql[end:]
                        )
                    else:
                        ngql = (
                            ngql[:end]
                            + "<-["
                            + e_a
                            + ":{}*0..{}]-".format(self_loop_relation_name, max_hops)
                            + "("
                            + v_a
                            + ":{})".format(self_loop_entity_name)
                            + ngql[end:]
                        )
                    max_e += 1
                    max_v += 1
                    v_a = "v" + str(max_v + 1)
                    e_a = "e" + str(max_e + 1)
            elif self_loop_entity_name == reason_edge_out_ent:  # 出边节点
                pat1 = r"(\(v\d*:?{}\))(-\[e\d*:?{}\]->\(v\d*:?{}\))".format(
                    self_loop_entity_name, reason_edge_relation, reason_edge_in_ent
                )
                pat2 = r"(\(v\d*:?{}\)<-\[e\d*:?{}\]-)(\(v\d*:?{}\))".format(
                    reason_edge_in_ent, reason_edge_relation, self_loop_entity_name
                )
                # r'(\(v\d*: ?person\)-\[e\d*: ?person_2_district_work_at\]->) (\(v\d*: ?district\))'
                # pat2 = r'(?<!)(\(v\d*: ?district\))(<-\[e\d*: ?person_2_district_work_at\]-\(v\d*: ?person\))'
                match_results = re.findall(pat1, ngql)
                for substrt in reversed(match_results):
                    beg = ngql.index(substrt[0] + substrt[1])
                    end = beg + len(substrt[0])
                    if "<-[" in contained_by_edge:
                        ngql = (
                            ngql[:end]
                            + "<-["
                            + e_a
                            + ":{}*0..{}]-".format(self_loop_relation_name, max_hops)
                            + "("
                            + v_a
                            + ":{})".format(self_loop_entity_name)
                            + ngql[end:]
                        )
                    else:
                        ngql = (
                            ngql[:end]
                            + "-["
                            + e_a
                            + ":{}*0..{}]->".format(self_loop_relation_name, max_hops)
                            + "("
                            + v_a
                            + ":{})".format(self_loop_entity_name)
                            + ngql[end:]
                        )
                    max_e += 1
                    max_v += 1
                    v_a = "v" + str(max_v + 1)
                    e_a = "e" + str(max_e + 1)

                match_results2 = re.findall(pat2, ngql)
                # 注意 pat2中的方向与丁一
                for substrt in reversed(match_results2):
                    beg = ngql.index(substrt[0] + substrt[1])
                    end = beg + len(substrt[0])
                    if "<-[" in contained_by_edge:
                        ngql = (
                            ngql[:end]
                            + "("
                            + v_a
                            + ":{})".format(self_loop_entity_name)
                            + "-["
                            + e_a
                            + ":{}*0..{}]->".format(self_loop_relation_name, max_hops)
                            + ngql[end:]
                        )
                    else:
                        ngql = (
                            ngql[:end]
                            + "("
                            + v_a
                            + ":{})".format(self_loop_entity_name)
                            + "<-["
                            + e_a
                            + ":{}*0..{}]-".format(self_loop_relation_name, max_hops)
                            + ngql[end:]
                        )
                    max_e += 1
                    max_v += 1
                    v_a = "v" + str(max_v + 1)
                    e_a = "e" + str(max_e + 1)
        return ngql

    def chore_proc_lf(self, predict_return_target_with_space, v2et):
        # 把LF中的v.prop改为v.entity_type.prop
        ret_res = list(
            re.finditer(
                r"(v.{0,2})[.]([`a-zA-Z0-9_]+|[*])[.]?([`a-zA-Z0-9_]+|[*])?",
                predict_return_target_with_space,
            )
        )
        if ret_res:
            for ret_group in reversed(ret_res):
                text = ret_group.group()
                span = ret_group.span()
                v_elems = text.split(".")
                new_text = ""
                if v_elems[0] in v2et.keys():
                    v_type = v2et[v_elems[0]]
                    ve2, ve3 = "", ""
                    if len(v_elems) > 1:
                        ve2 = v_elems[1].strip("`")
                    if len(v_elems) > 2:
                        ve3 = v_elems[2].strip("`")
                    if len(v_elems) == 2 and v_type != ve2:
                        if ve2 not in list(v2et.values()) and ve2 != "*":
                            new_text = v_elems[0] + ".`" + v_type + "`.`" + ve2 + "`"
                            new_text = v_elems[0] + "." + v_type + "." + ve2 + ""

                        else:
                            new_text = v_elems[0]
                    elif len(v_elems) == 2 and v_type == ve2:
                        new_text = v_elems[0]
                    elif len(v_elems) == 3 and v_type != ve2 and ve3 != "*":
                        new_text = v_elems[0] + ".`" + v_type + "`.`" + ve3 + "`"
                        new_text = v_elems[0] + "." + v_type + "." + ve3 + ""
                    elif len(v_elems) == 3 and ve3 == "*":
                        new_text = v_elems[0]

                if new_text:
                    print("修正：{} => {}".format(text, new_text))
                    predict_return_target_with_space = (
                        predict_return_target_with_space[: span[0]]
                        + new_text
                        + predict_return_target_with_space[span[1] :]
                    )

        return predict_return_target_with_space

    def keyword_proc(self, predicted_ngql):
        # Nebula3的关键词需要加上``
        keywords = [
            "ACROSS",
            "ADD",
            "ALTER",
            "AND",
            "AS",
            "ASC",
            "ASCENDING",
            "BALANCE",
            "BOOL",
            "BY",
            "CASE",
            "CHANGE",
            "COMPACT",
            "CREATE",
            "DATE",
            "DATETIME",
            "DELETE",
            "DESC",
            "DESCENDING",
            "DESCRIBE",
            "DISTINCT",
            "DOUBLE",
            "DOWNLOAD",
            "DROP",
            "DURATION",
            "EDGE",
            "EDGES",
            "EXISTS",
            "EXPLAIN",
            "FALSE",
            "FETCH",
            "FIND",
            "FIXED_STRING",
            "FLOAT",
            "FLUSH",
            "FROM",
            "GEOGRAPHY",
            "GET",
            "GO",
            "GRANT",
            "IF",
            "IGNORE_EXISTED_INDEX",
            "IN",
            "INDEX",
            "INDEXES",
            "INGEST",
            "INSERT",
            "INT",
            "INT16",
            "INT32",
            "INT64",
            "INT8",
            "INTERSECT",
            "IS",
            "JOIN",
            "LEFT",
            "LIST",
            "LOOKUP",
            "MAP",
            "MATCH",
            "MINUS",
            "NO",
            "NOT",
            "NULL",
            "OF",
            "ON",
            "OR",
            "ORDER",
            "OVER",
            "OVERWRITE",
            "PATH",
            "PROP",
            "REBUILD",
            "RECOVER",
            "REMOVE",
            "RESTART",
            "RETURN",
            "REVERSELY",
            "REVOKE",
            "SET",
            "SHOW",
            "STEP",
            "STEPS",
            "STOP",
            "STRING",
            "SUBMIT",
            "TAG",
            "TAGS",
            "TIME",
            "TIMESTAMP",
            "TO",
            "TRUE",
            "UNION",
            "UNWIND",
            "UPDATE",
            "UPSERT",
            "UPTO",
            "USE",
            "VERTEX",
            "VERTICES",
            "WHEN",
            "WHERE",
            "WITH",
            "XOR",
            "YIELD",
        ]
        keywords_pattern = "|".join(keywords + [x.lower() for x in keywords])
        match_groups = list(
            re.finditer(
                "(?<=[.:])(" + keywords_pattern + ")(?![a-zA-Z0-9_])", predicted_ngql
            )
        )
        for match_group in reversed(match_groups):
            beg = match_group.span()[0]
            end = match_group.span()[1]
            predicted_ngql = (
                predicted_ngql[:beg]
                + "`"
                + match_group.group()
                + "`"
                + predicted_ngql[end:]
            )
        return predicted_ngql

    def lf2ngql(self, llm_predicted_res, belong_reason_rules):
        predict_related_subgraph = ""
        predict_other_limits = ""
        predicted_nebula = ""

        v2et = {}
        try:
            match_res = re.findall(
                r'[{][ \n]*?[\'"]related_subgraph["\']:.+?,[ \n]*?[\'"]filtered_condition[\'"]:.+?,[ \n]*?[\'"]return_target[\'"]:.+?,[ \n]*?[\'"]other_limits[\'"]:.+?[ \n]*?[}]',
                llm_predicted_res,
            )
            if match_res:
                llm_predicted_res = match_res[-1]
        except Exception as e1:
            print("LLM返回结果抽取失败,因为{}".format(e1))
            return "none"
        # 计算logicform预测准确度
        try:
            predict_json_form_res = ast.literal_eval(llm_predicted_res)
            try:
                predict_related_subgraph_with_space = predict_json_form_res[
                    "related_subgraph"
                ]
                if isinstance(predict_related_subgraph_with_space, list):
                    predict_related_subgraph_with_space = ",".join(
                        predict_related_subgraph_with_space
                    )
                predict_related_subgraph = predict_related_subgraph_with_space.replace(
                    " ", ""
                )
            except Exception:
                print("related_subgraph识别失败")
                return "none"
            finally:
                # 识别v的entity type
                v_tuples = re.findall(
                    r"[(](v[0-9]{0,2})[:]([`a-zA-Z0-9_]+?)[)]", predict_related_subgraph
                )
                if v_tuples:
                    v2et = {x[0]: x[1].strip("`") for x in v_tuples}
                # 解码logic_form2nebula
                predicted_nebula = (
                    predicted_nebula + "match " + predict_related_subgraph_with_space
                )
            try:
                predict_filtered_condition_with_space = predict_json_form_res[
                    "filtered_condition"
                ]
                predict_filtered_condition = predict_json_form_res[
                    "filtered_condition"
                ].replace(" ", "")
            except Exception:
                print("filtered_condition识别失败")
                return "none"
            finally:
                # 把v.prop改为v.entity_type.prop
                predict_filtered_condition_with_space = self.chore_proc_lf(
                    predict_filtered_condition_with_space, v2et
                )
                # = 改 ==
                if (
                    "=" in predict_filtered_condition_with_space
                    and "==" not in predict_filtered_condition_with_space
                    and ">=" not in predict_filtered_condition_with_space
                    and "<=" not in predict_filtered_condition_with_space
                    and "!=" not in predict_filtered_condition_with_space
                ):
                    predict_filtered_condition_with_space = (
                        predict_filtered_condition_with_space.replace("=", "==")
                    )

                # 处理属性值中有单引号,属性值也用单引号括着的情况 v.chemical.name == '1-3'甲基乙烷'
                dyh_res = list(
                    re.finditer(
                        r"[, \[][\'].+?[\']([, \])]|\Z|and|or|AND|OR)",
                        predict_filtered_condition_with_space,
                    )
                )
                for dyh in reversed(dyh_res):
                    dyh_group = dyh.group()
                    print(dyh_group)
                    left = dyh.span()[0]
                    right = dyh.span()[1]
                    prefix = predict_filtered_condition_with_space[: left + 2]
                    if predict_filtered_condition_with_space[right - 1] == "'":
                        postfix = predict_filtered_condition_with_space[right - 1 :]
                        val = dyh_group[2:-1][:]
                    elif (
                        right - 4 > left + 1
                        and predict_filtered_condition_with_space[right - 4] == "'"
                    ):
                        postfix = predict_filtered_condition_with_space[right - 4 :]
                        val = dyh_group[2:-4][:]
                    elif (
                        right - 3 > left + 1
                        and predict_filtered_condition_with_space[right - 3] == "'"
                    ):
                        postfix = predict_filtered_condition_with_space[right - 3 :]
                        val = dyh_group[2:-3][:]
                    else:
                        postfix = predict_filtered_condition_with_space[right - 2 :]
                        val = dyh_group[2:-2][:]
                    if "'" in val:
                        print(val)
                        val = val.replace("'", "\\'")
                        predict_filtered_condition_with_space = prefix + val + postfix
                        print("修正:{}".format(val))

                predict_filtered_condition = (
                    predict_filtered_condition_with_space.replace(" ", "")
                )
                # 解码logic_form2nebula
                if predict_filtered_condition != "None":
                    # 定义获取最外层MAX()的函数
                    def extract_between_parentheses(s):
                        left_index = -1
                        right_index = -1

                        # 从左向右找到第一个 '('
                        for i in range(len(s)):
                            if s[i] == "(":
                                left_index = i
                                break

                        # 从右向左找到最后一个 ')'
                        for i in range(len(s) - 1, -1, -1):
                            if s[i] == ")":
                                right_index = i
                                break

                        # 提取并返回中间的字符串
                        if (
                            left_index != -1
                            and right_index != -1
                            and left_index < right_index
                        ):
                            return s[left_index + 1 : right_index]
                        else:
                            return None  # 如果没有找到，返回 None

                    # 识别到最大最小值筛选条件,需要额外的格式转换,因为nebula不直接支持MIN MAX聚合函数
                    if (
                        "MAX" in predict_filtered_condition
                        or "MIN" in predict_filtered_condition
                    ):
                        # MAX MIN和其他筛选条件一起
                        simple_filter_ls = []
                        if (
                            "and" in predict_filtered_condition
                            or "AND" in predict_filtered_condition
                        ):
                            # 通过 and分割字符串 去除头尾空格就够了 没必要替换掉value中的所有空格
                            filter_split_ls = [
                                _.strip()
                                for _ in re.split(
                                    r" and ",
                                    predict_filtered_condition_with_space,
                                    flags=re.IGNORECASE,
                                )
                            ]
                            # filter_split_ls = [_ for _ in re.split(r' and ', predict_filtered_condition_with_space, flags=re.IGNORECASE)]
                            min_max_filter_ls = []

                            for filter_split_single in filter_split_ls:
                                if (
                                    "MAX" in filter_split_single
                                    or "MIN" in filter_split_single
                                ):
                                    if (
                                        "count" not in filter_split_single
                                        and "COUNT" not in filter_split_single
                                    ):
                                        _item = extract_between_parentheses(
                                            filter_split_single
                                        )
                                        simple_filter_ls.append(
                                            "{} is not null".format(_item)
                                        )
                                    min_max_filter_ls.append(filter_split_single)
                                else:
                                    simple_filter_ls.append(filter_split_single)

                            # 处理普通条件筛选
                            if simple_filter_ls:
                                predicted_nebula = (
                                    predicted_nebula
                                    + " where "
                                    + str(" AND ".join(simple_filter_ls))
                                )
                            # 处理聚合操作
                            if len(min_max_filter_ls) > 1:
                                raise "暂时没有处理多聚合操作的能力"
                            else:
                                filter_split_single = min_max_filter_ls[0]
                                _item = extract_between_parentheses(filter_split_single)
                                if "MAX" in filter_split_single:
                                    predicted_nebula = (
                                        predicted_nebula
                                        + " with {} as m1 ORDER BY m1 DESC LIMIT 1".format(
                                            _item
                                        )
                                    )
                                elif "MIN" in filter_split_single:
                                    predicted_nebula = (
                                        predicted_nebula
                                        + " with {} as m1 ORDER BY m1 ASC LIMIT 1".format(
                                            _item
                                        )
                                    )
                        # 只有一个MAX MIN筛选条件
                        else:
                            # 读取聚合函数操作对象
                            if "MAX" in predict_filtered_condition:
                                max_object = re.findall(
                                    r"MAX\((.*?)\)", predict_filtered_condition
                                )
                                if len(max_object) > 1:
                                    raise "暂时没有处理多聚合操作的能力"
                                # 获取最外层括号内的条件
                                max_object = extract_between_parentheses(
                                    predict_filtered_condition
                                )
                                if "count" in max_object or "COUNT" in max_object:
                                    predicted_nebula = (
                                        predicted_nebula
                                        + " with {} as m1 ORDER BY m1 DESC LIMIT 1".format(
                                            max_object
                                        )
                                    )
                                else:
                                    predicted_nebula = (
                                        predicted_nebula
                                        + " where {} is not null".format(max_object)
                                    )
                                    predicted_nebula = (
                                        predicted_nebula
                                        + " with {} as m1 ORDER BY m1 DESC LIMIT 1".format(
                                            max_object
                                        )
                                    )
                            elif "MIN" in predict_filtered_condition:
                                min_object = re.findall(
                                    r"MIN\((.*?)\)", predict_filtered_condition
                                )
                                if len(min_object) > 1:
                                    raise "暂时没有处理多聚合操作的能力"
                                min_object = extract_between_parentheses(
                                    predict_filtered_condition
                                )
                                if "count" in min_object or "COUNT" in min_object:
                                    predicted_nebula = (
                                        predicted_nebula
                                        + " with {} as m1 ORDER BY m1 ASC LIMIT 1".format(
                                            min_object
                                        )
                                    )
                                else:
                                    predicted_nebula = (
                                        predicted_nebula
                                        + " where {} is not null".format(min_object)
                                    )
                                    predicted_nebula = (
                                        predicted_nebula
                                        + " with {} as m1 ORDER BY m1 ASC LIMIT 1".format(
                                            min_object
                                        )
                                    )

                    # 没有最大最小聚合筛选则直接使用where函数进行查询
                    else:
                        predicted_nebula = (
                            predicted_nebula
                            + " where "
                            + predict_filtered_condition_with_space
                        )
            try:
                predict_return_target_with_space = predict_json_form_res[
                    "return_target"
                ]

                if isinstance(predict_return_target_with_space, list):
                    predict_return_target_with_space = ",".join(
                        predict_return_target_with_space
                    )
                predict_return_target = predict_return_target_with_space.replace(
                    " ", ""
                )
            except Exception:
                print("return_target识别失败")
                return "none"
            finally:
                # v.entity_type 改为 v，v.property 改为 v.entity_type.property
                predict_return_target_with_space = self.chore_proc_lf(
                    predict_return_target_with_space, v2et
                )
                distinct_match = list(
                    re.finditer(
                        r"(DISTINCT|distinct) (count|COUNT)[(](DISTINCT|distinct)? ?(v.{0,2})[.]?([`a-zA-Z0-9_]+?)",
                        predict_return_target_with_space,
                    )
                )
                if distinct_match:
                    left = distinct_match[0].span()[0]
                    print(
                        "return target 修正：{} => {}".format(
                            predict_return_target_with_space,
                            predict_return_target_with_space[:left]
                            + predict_return_target_with_space[left + 8 :],
                        )
                    )
                    predict_return_target_with_space = (
                        predict_return_target_with_space[:left]
                        + predict_return_target_with_space[left + 8 :]
                    )

                predict_return_target = predict_return_target_with_space.replace(
                    " ", ""
                )

                if not predict_return_target_with_space:
                    predict_return_target_with_space = ",".join(list(v2et.keys()))
                    print(
                        "return target 修正：空返回 => {}".format(
                            predict_return_target_with_space
                        )
                    )
                    predict_return_target = predict_return_target_with_space.replace(
                        " ", ""
                    )

                # 解码logic_form2nebula
                # 这里的返回值要与MAX MIN聚合操作中的nebula语句with做联动
                if "with" in predicted_nebula:
                    # 首先判断COUNT是否在return结果中
                    if (
                        "count" in predict_return_target_with_space
                        or "COUNT" in predict_return_target_with_space
                    ):
                        count_object_ls = re.findall(
                            r"(count|COUNT)\((.*?)\)", predict_return_target_with_space
                        )
                        if len(count_object_ls) != 1:
                            raise "识别count宾语失败,目前只支持返回一个结果"
                        elif len(count_object_ls) == 1:
                            count_object = count_object_ls[0][1]
                            # 首先截取返回实体的编码vx
                            vx = re.findall(r"(v[0-9]{0,2})", count_object)[0]
                            # 在with语句中添加要返回的实体的vx
                            predicted_nebula = predicted_nebula.replace(
                                "with ", "with {},".format(vx)
                            )
                            # 最后添加return语句
                            if "distinct" in count_object or "DISTINCT" in count_object:
                                predicted_nebula = (
                                    predicted_nebula
                                    + " RETURN COUNT({})".format(count_object)
                                )
                            else:
                                predicted_nebula = (
                                    predicted_nebula
                                    + " RETURN COUNT(DISTINCT {})".format(count_object)
                                )
                    # COUNT不在返回结果中
                    else:
                        # 首先截取返回实体的编码vx
                        vx = re.findall(r"(v[0-9]{0,2})", predict_return_target)[0]
                        # 在with语句中添加要返回的实体的vx
                        predicted_nebula = predicted_nebula.replace(
                            "with ", "with {},".format(vx)
                        )
                        # 最后添加return语句
                        if re.findall(
                            r"(count|COUNT)[(](DISTINCT|distinct)? ?(v.{0,2})[.]?([`a-zA-Z0-9_]+?)",
                            predict_return_target_with_space,
                        ):
                            predicted_nebula = (
                                predicted_nebula
                                + " RETURN "
                                + predict_return_target_with_space
                            )
                        else:
                            predicted_nebula = (
                                predicted_nebula
                                + " RETURN DISTINCT "
                                + predict_return_target_with_space
                            )
                else:
                    if re.findall(
                        r"(count|COUNT)[(](DISTINCT|distinct)? ?(v.{0,2})[.]?([`a-zA-Z0-9_]+?)",
                        predict_return_target_with_space,
                    ):
                        predicted_nebula = (
                            predicted_nebula
                            + " RETURN "
                            + predict_return_target_with_space
                        )
                    else:
                        predicted_nebula = (
                            predicted_nebula
                            + " RETURN DISTINCT "
                            + predict_return_target_with_space
                        )
            try:
                predict_other_limits_with_space = predict_json_form_res["other_limits"]
                predict_other_limits = predict_json_form_res["other_limits"].replace(
                    " ", ""
                )
            except Exception:
                print("other_limits识别失败")
                return "none"
            finally:
                if predict_other_limits != "None":
                    predicted_nebula = (
                        predicted_nebula + " " + predict_other_limits_with_space
                    )
        except Exception as e2:
            print("Logic form格式抽取失败,因为{}".format(e2))
            return "none"
        return self.multi_level_ent_ngql_proc_lf(predicted_nebula, belong_reason_rules)


lf2ngql_connector = LF2nGQL()
if __name__ == "__main__":
    gql = (
        "match (v1:person)-[e1:person_2_district_work_at]->(v2:district),(v3:district)<-[e2:person_2_district_work_at]-(v4:person),"
        "(v5:district)-[e3:district_2_scenery]->(v6:scenery),(v7:scenery)<-[e4:district_2_scenery]-(v8:district) where v1.person.name=='孟洋' RETURN DISTINCT v1.person.name,v2"
    )
    reason_rules = [
        {
            "reason_edge": "(person)-[person_2_district_work_at]->(district)",
            "entity_name": "(district)",
            "contained_by": "(district)<-[district_2_district_child]-(district)",
            "max_hops": "3",
        },
        {
            "reason_edge": "(district)-[district_2_scenery]->(scenery)",
            "entity_name": "(district)",
            "contained_by": "(district)<-[test_edge]-(district)",
            "max_hops": "3",
        },
    ]
    testlf = LF2nGQL()
    predicted_gql = testlf.multi_level_ent_ngql_proc_lf(gql, reason_rules)
    finall_ngql = testlf.keyword_proc(predicted_gql)
    print(finall_ngql)
