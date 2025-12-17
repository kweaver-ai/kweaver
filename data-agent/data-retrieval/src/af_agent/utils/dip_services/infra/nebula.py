# -*- coding: utf-8 -*-
# calling nebula api
#
# @Time: 2024/01/15
# @Author: Xavier.chen
# @File: infra/opensearch.py
import asyncio
import json
from nebula3.gclient.net import ConnectionPool
from nebula3.Config import Config
from typing import List
import re

class NebulaGraph(object):
    """
    Nebula Graph Database Connect and Search API
    """

    def __init__(self, ips: List[str], ports: List[str], user: str, password: str):
        """
        Initialize a Connector
        :param ips: stand-alone service ip or distributed service ips
        :param ports: stand-alone service port or distributed service ports
        :param user: username to connect the service
        :param password: user password to connect the service
        """
        self.ips = ips
        self.ports = ports
        self.user = user
        self.password = password
        config = Config()
        config.max_connection_pool_size = 200
        # self.connect_pool = ConnectionPool()
        self.nebula_pool = False
        while len(self.ips) > 0:
            if self.nebula_pool:
                return
            try:
                self.connect_pool = ConnectionPool()
                host = [(ip, port) for ip, port in zip(self.ips, self.ports)]
                self.connect_pool.init(host, config)
                self.nebula_pool = True
            except Exception as e:
                err = str(e)
                # 节点挂掉时去除此节点并重试
                if "status: BAD" in err:
                    address = re.findall(r"[\[](.*?)[\]]", err)
                    for add in address:
                        if "status: BAD" in add:
                            bad_address = re.findall(r"[(](.*?)[)]", add)[0]
                            bad_address = eval(bad_address.split(',')[0])
                            self.ips.remove(bad_address)
                else:
                    raise Exception("Nebula connect error: {}".format(e.args[0]))
        raise Exception("All service are in BAD status!")

    def execute(self, space: str, sql: str):
        """
        execute a query
        """

        def _parse_result(result):
            records = []
            error_msg = result.error_msg()
            if error_msg:
                raise Exception(error_msg)
            for record in result:
                records.append(record.values())
            return records

        with self.connect_pool.session_context(self.user, self.password) as client:
            sql = "use `{space}`; ".format(space=space) + sql
            result = client.execute(sql)
        return _parse_result(result)

    def sys_execute_json(self, sql):
        with self.connect_pool.session_context(self.user, self.password) as client:
            result = client.execute_json(sql)
        return json.loads(result)

    async def execute_json(self, sql):
        loop = asyncio.get_event_loop()
        future = loop.run_in_executor(None, self.sys_execute_json, sql)
        result = await future
        return result

    @staticmethod
    def trim_quotation_marks(s: str):
        if not s:
            return s
        if s[0] == '"':
            return s[1:-1]

        return s

    async def get_vertex_by_id(self, space, vids: str or List):
        res = []
        if isinstance(vids, str):
            vids = [vids]
        sql = "MATCH (v) WHERE id(v) in {} RETURN v;".format(vids)
        # result_set = await self.execute(space=space,
        #                                 sql=sql)
        loop = asyncio.get_event_loop()
        future = loop.run_in_executor(None, self.execute, space, sql)
        result_set = await future
        for rowValue in result_set:
            values = []
            val_wrap = rowValue[0]
            node = val_wrap.as_node()
            properties = {}
            for v_tag in node.tags():
                proper = node.properties(v_tag)
                for pro in proper.items():
                    proper[pro[0]] = self.trim_quotation_marks(str(pro[1]))
                    values.append(proper[pro[0]])
                properties[v_tag] = proper
                res.append(properties)
        return res

    def __del__(self):
        self.connect_pool.close()


if __name__ == "__main__":
    # OpenSearch
    # opensearch_connector = OpenSearchConnector(ips=["10.4.109.191"],
    #                                            ports=[9200],
    #                                            user="admin",
    #                                            password="admin")
    # body = {
    #     "query": {
    #         "multi_match": {
    #             "type": "best_fields",
    #             "query": "GBT 20010-2005 信息安全技术 包过滤防火端评估准则"
    #         }
    #     },
    #     "_source": ["passage", "doc_name"],
    #     "from": 0,
    #     "size": 10
    # }
    # res = asyncio.run(opensearch_connector.execute(url="passage_retrieval_merge,passage_retrieval/_search",
    #                                                body=body))
    # print(res)

    # Nebula
    nebula_connector = NebulaGraph(ips=["10.4.133.84"],
                                       ports=["9669"],
                                       user="root",
                                       password="nebula")

    res = asyncio.run(nebula_connector.get_vertex_by_id(space="u895e892cc85a11ed8fcb9256262ff8e2-64",
                                                        vids=['00b566b558e51c373c4d2dbc75c51be5']))
    print(res)