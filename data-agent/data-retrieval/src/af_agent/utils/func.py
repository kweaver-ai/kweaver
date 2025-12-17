import re
import json
from typing import List

import pandas as pd


class JsonParse(object):

    def __init__(self, input_json: dict):
        """
        input_json: dict with keys (data columns) and values ()
        input_json = {
            "data": [["2024-01-01", 92], ["2024-01-02", 113], ["2024-01-03", 150]],
            "columns": [{"name": "日期", "type": "date"}, {"name": "销量", "type": "integer"}]
        }
        """

        self.df = None
        self.input_json = input_json
        self.to_dataframe()

    def to_dataframe(self):
        columns = [c["name"] for c in self.input_json["columns"]]
        self.df = pd.DataFrame(data=self.input_json["data"], columns=columns)
        # 删除全为空的行
        self.df.dropna(how="all", inplace=True)
        # 填充空值
        self.df.fillna("--", inplace=True)
        self.records_num = len(self.df)
        self.data_size = self.df.memory_usage(deep=True).sum().item()

    def to_markdown(
        self,
        records_num: int = -1,
        data_limit: int = -1
    ) -> str:
        if self.df.empty:
            return ""
        
        # df_to_convert = self.df.copy()
        df_to_convert = self.df

        if records_num != -1:
            df_to_convert = df_to_convert.head(records_num)

        # 第一次转换, 计算长度
        markdown = df_to_convert.to_markdown(
            index=False,
            disable_numparse=True
        )

        # 没有超标则返回
        if data_limit == -1 or data_limit > len(markdown):
            return markdown

        # 超标则计算新的返回条数, 不能少于1条
        records_num = int(records_num * (data_limit / len(markdown)))
        if records_num == 0:
            records_num = 1
        
        markdown = df_to_convert.head(records_num).to_markdown(
            index=False,
            disable_numparse=True
        )

        return markdown

    def to_json(
        self,
        records_num: int = -1,
        data_limit: int = -1
    ):
        df_to_convert = self.df.copy()
        if records_num != -1:
            df_to_convert = df_to_convert.head(records_num)

        # 处理浮点数
        # for col in df_to_convert.columns:
        #     if df_to_convert[col].dtype in ["float64", "float32", "float16", "float"]:
        #         df_to_convert[col] = df_to_convert[col].apply(lambda x: f"{x:f}")

        # 第一次转换, 计算长度
        res_json = df_to_convert.to_json(
            force_ascii=False
        )

        # 没有超标则返回
        if data_limit == -1 or data_limit > len(res_json):
            return res_json

        # 超标则计算新的返回条数, 不能少于1条
        records_num = int(records_num * (data_limit / len(res_json)))
        if records_num == 0:
            records_num = 1

        res_json = df_to_convert.head(records_num).to_json(
            force_ascii=False
        )
        return res_json

    def to_dict(
        self,
        records_num: int = -1,
        data_limit: int = -1
    ):
        df_to_convert = self.df.copy()
        if records_num != -1:
            df_to_convert = df_to_convert.head(records_num)

        # 处理浮点数
        # for col in df_to_convert.columns:
        #     if df_to_convert[col].dtype in ["float64", "float32", "float16", "float"]:
        #         df_to_convert[col] = df_to_convert[col].apply(lambda x: f"{x:f}")

        # 第一次转换, 计算长度
        res_dict = df_to_convert.to_dict(
            orient="records"
        )

        # 转换为json字符串
        dict_str = json.dumps(res_dict, ensure_ascii=False)

        if data_limit == -1 or data_limit > len(dict_str):
            return res_dict

        # 超标则计算新的返回条数, 不能少于1条
        records_num = int(records_num * (data_limit / len(dict_str)))
        if records_num == 0:
            records_num = 1

        res_dict = df_to_convert.head(records_num).to_dict(
            orient="records"
        )

        return res_dict

    def get_records_num(self):
        return self.records_num

    def get_data_size(self):
        return self.data_size


def json_to_markdown(
    json_data: List[dict]
) -> str:
    """
    Convert a list of dictionaries to a markdown table.

    json_data: List[dict]
    example:
        json_data = [
            {
                "name": "日期",
                "type": "date"
            },
            {
                "name": "销量",
                "type": "integer"
            }
        ]
    return markdown:
        | name | type |
        | --- | --- |
        | 日期 | date |
        | 销量 | integer |
    """
    if isinstance(json_data, list) and len(json_data) > 0:
        # 假设所有字典有相同的键
        headers = list(json_data[0].keys())
        markdown = "| " + " | ".join(headers) + " |\n"
        markdown += "| " + " | ".join(["---" for _ in headers]) + " |\n"

        for item in json_data:
            row = "| " + " | ".join([str(item.get(header, "")) for header in headers]) + " |"
            markdown += row + "\n"

        return markdown
    else:
        # 如果不是列表或是空列表，返回原始的 JSON 字符串
        return json.dumps(json_data, ensure_ascii=False, indent=2)


def construct_text_from_cites(cites: list):
    text = "根据"
    for j, cite in enumerate(cites):
        text += f"<strong>'{cite['name']}'</strong><i slice_idx=0>{j + 1}</i>,"
    text += "检索到如下数据："

    return text

def add_quotes_to_fields_with_dash(input_sql):
    # 定义正则表达式，匹配包含 '-' 的字段名
    # 假设字段名由字母、数字、下划线和破折号组成，并且以点（.）或空格（ ）分隔（可选）
    pattern = r'(?:\b|\.)([a-zA-Z0-9_.-]+-[a-zA-Z0-9_.-]+)(?:\s*,\s*|\s*=|(?:\s|$|\)))'

    def replace_field(match):
        field_name = match.group(1)
        suffix = match.group(0)[match.end(1):]  # 获取字段名后的部分，包括逗号（如果有的话）
        # 清理后缀中的前导空格（可选，根据实际的 SQL 格式要求）
        suffix = suffix.lstrip() if suffix.startswith(' ') else suffix
        return f'"{field_name}"' + suffix

    # 使用正确的替换逻辑
    modified_sql = re.sub(pattern, replace_field, input_sql)

    return modified_sql

def add_quotes_to_fields_with_data_self(input_sql):
    if "-" not in input_sql:
        return input_sql
    # input_sql = input_sql.replace("'", "\"")
    sql_list = input_sql.split(" ")
    # pattern = r'(?:\b|\.)([a-zA-Z0-9_-]+-[a-zA-Z0-9_-]+)\b(?:\s*=|(?:\s|,|\)))'
    pattern = r'([a-zA-Z0-9_]+(?:-[a-zA-Z0-9_]+)+)'

    n_sql_list = []
    for item in sql_list:
        if "-" in item:
            if "'" in item or "\"" in item:
                n_sql_list.append(item)
            elif item.endswith(","):
                n_item = item[:-1]

                n_item = re.sub(pattern, lambda match: f'"{match.group(1)}"', n_item)+","
                # n_item = re.sub(pattern, lambda match: f'"{match.group(1)}"', item[:-1])
                n_sql_list.append(n_item)
            else:

                n_item = item

                n_item = re.sub(pattern, lambda match: f'"{match.group(1)}"', n_item)
                n_sql_list.append(n_item)
        else:
            n_sql_list.append(item)

    return " ".join(n_sql_list)


if __name__ == '__main__':
    data = {
        "data": [["2024-01-01", 92], ["2024-01-02", 113], ["2024-01-03", 150],
                 ["2024-01-04", 125], ["2024-01-05", 97]],
        "columns": [{"name": "日期", "type": "date"}, {"name": "销量", "type": "integer"}],
        "total_count": 5
    }

    parse = JsonParse(data)
    print(parse.to_markdown())
    print(parse.to_json())
    print(parse.to_dict())

    data = "SELECT aaa.first-name, bb.last-name, age FROM users WHERE xxx.first-name = 'John' AND last-name = 'Doe';"

    print(add_quotes_to_fields_with_dash(data))

    data = 'SELECT aaa.first-a, bb.last_a,  age FROM users WHERE h.first_b = "J-ohn" AND have(h.b-b) = "Doe";'

    print(add_quotes_to_fields_with_data_self(data))
    #
    # data = 'year(first-a)'
    # pattern = r"([a-zA-Z0-9_]+-[a-zA-Z0-9_]+)"
    # modified_sql = re.sub(pattern, lambda match: f'"{match.group(1)}"', data)

    # print(modified_sql)

    test_data = """SELECT comprehensive-unit-price FROM vdm_mysql_znc5em0v.default._select_from_ti_assets_ta_inner_join_tv_assets_ta2_on_ta_code_ta AS T1
WHERE T1.maintenance-END-TIME LIKE '2024/%'
LIMIT 100
    """

    res = add_quotes_to_fields_with_data_self(test_data)
    print(res)

    t_res = """SELECT "comprehensive-unit-price" FROM vdm_mysql_znc5em0v.default._select_from_ti_assets_ta_inner_join_tv_assets_ta2_on_ta_code_ta AS T1
WHERE T1."maintenance-END-TIME" LIKE '2024/%'
LIMIT 100
    """

    assert res == t_res

    data = """
        SELECT SUM(allocated-amount) AS "分配数量总计"
FROM vdm_mysql_znc5em0v.default._select_from_ti_assets_ta_inner_join_tv_assets_ta2_on_ta_code_ta AS T1
WHERE T1.maintenance-END-TIME LIKE '2024/%'
LIMIT 100
    """

    print(add_quotes_to_fields_with_data_self(data))