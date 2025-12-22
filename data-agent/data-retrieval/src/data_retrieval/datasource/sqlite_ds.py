# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-5-23

import sqlite3
from typing import Any, List, Optional, Tuple
from data_retrieval.datasource.db_base import DataSource
from data_retrieval.parsers.text2sql_parser import RuleBaseSource


class SQLiteDataSource(DataSource):
    """SQLite data source
    Connect SQLite database with read-only mode
    """
    db_file: str
    tables: Optional[List[str]]
    connection: Any

    def __init__(
        self,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.connection = sqlite3.connect(
            f"file:{self.db_file}?mode=ro",
            uri=True,
            check_same_thread=False
        )

    def _query(self, cur, query: str, as_dict):
        res = cur.execute(query)
        headers = [desc[0] for desc in res.description]

        data = res.fetchall()
        if as_dict:
            return headers, [dict(zip(headers, row)) for row in data]

        return headers, data

    def _query_generator(self, cur, query: str, as_dict):
        res = cur.execute(query)
        headers = [desc[0] for desc in res.description]

        def result_gen():
            for row in res:
                if as_dict:
                    yield dict(zip(headers, row))
                yield row

        return headers, result_gen()

    def test_connection(self):
        return True

    def query(self, query: str, as_gen=True, as_dict=True) -> Tuple[List, Any]:
        cursor = self.connection.cursor()
        if as_gen:
            return self._query_generator(cursor, query, as_dict)

        return self._query(cursor, query, as_dict)

    def get_metadata(self, identities=None) -> List[Any]:
        if not identities:
            identities = self.tables

        if isinstance(identities, str):
            identities = [identities]
        res = []

        if identities is None or len(identities) == 0:
            return res

        cursor = self.connection.cursor()
        #
        # sample = json.dumps(samples.get(meta['id']), ensure_ascii=False, indent=4)
        # meta_sample_data += (
        #     f"这是第{i + 1}张表：{meta['name']},{meta['description']} \n"
        #     f"{meta['ddl']}"
        #     f"这是其样例数据：\n"
        #     f"{sample} \n"
        # )

        tables = ",".join(["'"+table+"'" for table in identities if table])

        if tables:
            _, data = self._query(
                cursor,
                f"""SELECT * FROM sqlite_master WHERE type IN ('table', 'view') AND name IN ({tables})""",
                as_dict=True
            )
            if len(data) >= 0:
                for meta in data:
                    res.append(
                        {
                            "id": meta["name"],
                            "name": meta["name"],
                            "description": meta["name"],
                            "ddl": meta["sql"]
                        }
                    )

        return res

    def get_sample(
        self,
        identities=None,
        num: int = 5,
        as_dict: bool = False
    ) -> Tuple[List, Any]:
        if not identities:
            identities = self.tables

        if isinstance(identities, str):
            identities = [identities]
        res = {}

        if identities is None or len(identities) == 0:
            return res

        cursor = self.connection.cursor()
        for identity in identities:
            if not identity:
                continue
            header, data = self._query(
                cursor,
                f"SELECT * FROM {identity} LIMIT {num}",
                as_dict=as_dict
            )
            if as_dict:
                res[identity] = data
            else:
                res[identity] = (header, data)
        return res

    def get_rule_base_params(self):
        # meta = self.get_metadata(self.tables)
        # print(meta)
        en2types = {}
        for table in self.tables:
            en2types[table] = {}
            cursor = self.connection.cursor()
            _, data = self._query(
                cursor,
                f"""PRAGMA table_info({table})""",
                as_dict=True
            )
            for col in data:
                en2types[table][col["name"]] = col["type"]

        print(en2types)

        rule_base = RuleBaseSource(
            tables=self.tables if self.tables else [],
            en2types=en2types
        )
        return rule_base

    def query_correction(self, query: str) -> str:
        return query

    def close(self):
        self.connection.close()


if __name__ == "__main__":
    def test():
        sqlite_ds = SQLiteDataSource(db_file="./tests/agent_test/fake.db")
        # sqlite_ds.init()
        # print(sqlite_ds.test_connection())
        print(sqlite_ds.get_description())
        print(sqlite_ds.get_metadata("movie"))
        # print(sqlite_ds.get_sample("movie", 3, as_dict=True))

        header, data = sqlite_ds.query("SELECT * FROM movie LIMIT 5")
        print(header)
        print(list(data))
        print(sqlite_ds.get_metadata("movie"))

    test()
