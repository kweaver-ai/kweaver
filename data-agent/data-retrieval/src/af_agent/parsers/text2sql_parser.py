import json
import re
import traceback
from json import JSONDecodeError
from typing import Optional

import sqlparse
from pydantic import BaseModel, Field
from sql_metadata import Parser
from sql_metadata.compat import get_query_tables

from af_agent.errors import ResultParseError
from af_agent.logs.logger import logger
from af_agent.parsers.base import BaseJsonParser


class RuleBaseSource(BaseModel):
    tables: list = Field(..., description="所有表名：vdm_xxx.default.xxx")
    en2types: dict = Field(..., description="字段的中文到类型的映射")


class MysqlKeyword:
    from_select = "SELECT"
    from_in = "IN"
    from_date = "DATE"
    datatime = [
        "2", "3", "4",
        "timestamp", "datetime", "date", "time", "year", "timestamp with time zone", "time with time zone'",
        "DATE", "TIME", "TIMESTAMP", "TIMESTAMP WITH TIME ZONE", "TIME WITH TIME ZONE",
    ]  # 代表时间型 DATE '2022-11-22'


class JsonText2SQLRuleBaseParser(BaseJsonParser):
    used_table: Optional[list] = list()
    tables: Optional[list] = None
    en2types: Optional[dict] = None
    sql_limit: Optional[int] = 100

    def __init__(
        self,
        source: RuleBaseSource,
        sql_limit: int = 100
    ) -> None:
        super().__init__()
        self.tables = source.tables
        self.en2types = source.en2types
        self.sql_limit = sql_limit

    @staticmethod
    def _check_limit(
        sql: str,
        limit: int = 100
    ) -> str:
        lower_sql = sql.lower()
        if lower_sql.endswith("where"):
            sql = sql.replace("WHERE", "").replace("where", "")
        if "limit" not in lower_sql:
            sql += " LIMIT {}".format(limit)
        return sql

    def _parse_str_2_json(self, result):
        # 字符串的格式如下
        # '```sql\nSELECT COUNT(*) \nFROM vdm_maria_31sn42r0.default.fruittypes \nWHERE name LIKE \'%葡萄%\';\n```\n\n\n{\n    "sql": "SELECT COUNT(*) \\nFROM `vdm_maria_31sn42r0.default.fruittypes` \\nWHERE `name` LIKE \'%葡萄%\'",\n    "explanation": "这条SQL语句的目的是查询`fruittypes`表中所有包含\\"葡萄\\"字样的记录数量。使用了LIKE关键字和百分号通配符（%）来匹配包含\\"葡萄\\"的水果种类名称。"\n}'

        res = {
            "sql": "",
            "explanation": ""
        }

        # extract sql
        sql_pattern = r'SELECT.*?;'
        sql_match = re.search(sql_pattern, result, re.DOTALL)
        if sql_match:
            sql = sql_match.group(1).strip().replace("\\n", " ").replace("\n", " ").replace("\"", "")
            res["sql"] = sql

        # extract explanation
        explanation_pattern = r'explanation":\s*"(.*?)"'
        explanation_match = re.search(explanation_pattern, result, re.DOTALL)
        if explanation_match:
            explanation = explanation_match.group(1)
            res["explanation"] = explanation

        return res

    def _extract(self, result):
        patterns = [
            r'```json(.*?)```',
            r'```\njson(.*?)```',
            r'```sql(.*?)```',
            r'```(.*?)```',
        ]
        for pattern in patterns:
            match = re.search(pattern, result, re.DOTALL)
            if match:
                result = match.group(1).strip()
                break

        try:
            result = json.loads(result)
        except JSONDecodeError as e:
            logger.error(e)
            logger.error("result: {}".format(result))
            result = self._parse_str_2_json(result)

        if 'sql' not in result:
            result['sql'] = ""

        # if 'sql' not in result or result['sql'] == "":
        #     error_msg = "sql is empty: {}".format(result)
        #     err = ResultParseError(detail=Exception(error_msg))
        #     raise err

        return result

    def _check_limit(self, text: str):
        text = text.replace(";", "")
        if "limit" not in text.lower():
            text += " LIMIT {}".format(self.sql_limit)

        return text

    def _check_space(self, text: str):
        """ bad case: ANDstudent = '张三'
        """
        keywords = ["AND, WHERE"]
        new_text = ""
        for chunk in text.split():
            flag = False
            for keyword in keywords:
                if keyword in chunk and chunk != keyword:
                    new_text += keyword + " " + chunk[len(keyword):] + " "
                    flag = True
            if not flag:
                new_text += chunk + " "

        return new_text

    @staticmethod
    def _check_punctuation(
        query: str
    ) -> str:
        query = query.replace(";", "")
        query = query.replace("`", "")
        chunks = query.split()
        parser = Parser(query)
        columns_aliases_names = parser.columns_aliases_names
        for i, chunk in enumerate(chunks):
            if chunk.rsplit(",") in columns_aliases_names:
                if '"' not in chunk:
                    chunk = chunk.replace("'", "")
                    chunks[i] = f'"{chunk}"'

        return " ".join(chunks)

    @classmethod
    @staticmethod
    def get_tables_by_query(
        query: str,
    ) -> str:
        pattern = re.compile(
            r'\b(?:FROM|JOIN)\s+([`"]?[\w]+[`"]?(?:\.[`"]?[\w]+[`"]?)+)', 
            re.IGNORECASE
        )
        tables = pattern.findall(query)
        logger.info(f"tables: {tables}")
        return tables

    def _check_table(
        self,
        query: str,
        # ori_tables: list
    ) -> str:
        ori_tables = self.tables
        tables = self.get_tables_by_query(query)
        one_dim_tables = [msg.split(".")[-1] for msg in ori_tables]
        two_dim_tables = [msg.split(".")[-2] + "." + msg.split(".")[-1] for msg in ori_tables]
        chunks = query.split()
        for table in tables:
            if table not in ori_tables:
                try:
                    index = one_dim_tables.index(table)
                except ValueError:
                    try:
                        index = two_dim_tables.index(table)
                    except ValueError:
                        break
                # 如果直接 replace 可能会替换错误，因为字段可能包含表名：'SELECT penaltiestype, COUNT(*) AS count FROM penalties GROUP BY penaltiestype LIMIT 10'
                for i, chunk in enumerate(chunks):
                    if chunk == table:
                        chunks[i] = ori_tables[index]
                # query = query.replace(table, ori_tables[index])
        query = " ".join(chunks)
        return query

    def get_column_type(
        self,
        column: str,
        query: str,
        # en2types: dict
    ) -> str:
        # YEAR(IS1."date")
        if "(" in column:
            match = re.search(r'\(([^)]*)\)', column)
            if match:
                column = match.group(1)

        column = column.replace("'", "").replace('"', "")
        column_length = len(column.split("."))
        if column_length == 2:  # f1.data
            tables = Parser(query).tables_aliases
            tables_aliases = column.rsplit(".", 1)[0]
            aim_table = tables.get(tables_aliases)
        else:  # data
            if column_length == 4:  # vdm.default.xxx.data
                aim_table = column.rsplit(".", 1)[0]
            else:
                aim_table = self.get_tables_by_query(query)[0]  # data 单表

        en2type = self.en2types.get(aim_table)
        column_type = en2type.get(column.split(".")[-1])

        return column_type

    def _check_in(
        self,
        query: str,
        keyword=MysqlKeyword
        # en2types: dict
    ) -> str:

        chunks = query.split()
        if keyword.from_in not in chunks:
            return query

        index = chunks.index(keyword.from_in)

        # YEAR(IS1."date"), 不适合再加 DATE
        if "(" in chunks[index - 1]:
            return query

        column_type = self.get_column_type(
            chunks[index - 1],
            query,
        )
        if column_type not in keyword.datatime:
            return query
        for i, chunk in enumerate(chunks[index + 1:]):
            if keyword.from_date in chunk:
                return query
            if keyword.from_select in chunk:
                return query

            new_chunk = ""
            for char in chunk:
                if char in ["(", ")"]:
                    new_chunk += char
                else:
                    if keyword.from_date in new_chunk:
                        new_chunk += char
                    else:
                        new_chunk += keyword.from_date + " " + char
            chunks[i + index + 1] = new_chunk
            if ")" in chunk:
                break

        return " ".join(chunks)

    @staticmethod
    def format_sql(sql) -> str:
        sql = sqlparse.format(sql, reindent=True, keyword_case="upper")
        return sql

    def parse_result(self, result, *, partial: bool = False):
        """ Override the parse_result method to parse the result
            DON'T use the parse method to parse the result
        """
        # Extract info by ourselves
        logger.info("before extraction {result}")
        text = result[0].text
        text = text.strip()
        json_res = self._extract(text)
        try:
            # Extract again by parser
            # json_res = super().parse_result([Generation(text=json_res)], partial=partial)
            logger.info("rule base before: {}".format(json_res))
            sql = json_res.get("sql", "")
            if sql:
                sql = self._check_space(sql)
                sql = self._check_punctuation(sql)
                sql = self._check_limit(sql)
                sql = self._check_table(sql)
                sql = self._check_limit(sql)
                sql = self._check_in(sql)
                json_res["sql"] = sql
                format_sql = self.format_sql(sql)
                logger.debug("rule base after: {}".format(json_res.get("explanation", "")))
                logger.debug("rule base after:\n {}".format(format_sql))

        except Exception as e:
            logger.error(traceback.format_exc())
        return json_res

    def parse(self, text: str) -> str:
        """DON'T use the parse method to parse the result
        because the parse method will call the parse_result method,
        it's different from the parse method in StrOutputParser
        """
        return text
