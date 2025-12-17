import json
import logging
from typing import List

import aiohttp

from af_agent.tools.graph_tools.common.config import ConfigClass as Config
from af_agent.tools.graph_tools.common.stand_log import StandLogger


class KnKnowledgeDataService(object):
    """图分析服务和认知搜索服务调用"""

    def __init__(self, headers: dict = None):
        self._basic_url = "http://{}:{}".format(
            Config.HOST_KN_KNOWLEDGE_DATA, Config.PORT_KN_KNOWLEDGE_DATA
        )
        self.headers = headers or {}

    async def get_datasources(self, id_list: List[str]):
        """
        @deprecated: 数据源管理不再由kn-knowledge-data提供，而是由dp-data-source提供(参考:https://confluence.aishu.cn/pages/viewpage.action?pageId=267724865)
        获取数据源列表
        :param id_list: 数据源ID列表
        :return: 数据源列表
        """
        api = "{}/api/kn-knowledge-data/v1/ds/list?ds_type=as7&size=9999&page=1&order=descend&id_list={}".format(
            self._basic_url, ",".join(id_list)
        )
        async with aiohttp.ClientSession() as session:
            async with session.get(api, headers=self.headers) as response:
                if response.status != 200:
                    error_str = await response.text()
                    StandLogger.error(
                        "service error, api: {}, error: {}".format(api, error_str)
                    )
                    raise Exception(
                        "service error, api: {}, error: {}".format(api, error_str)
                    )

                res = await response.json()
                if "res" not in res:
                    raise Exception(
                        "service error, api: {}, error: {}".format(api, res)
                    )

                return res["res"]

    async def get_kg_ontology(self, kg_id: str):
        """
        获取图谱的ontology
        :param kg_id: 图谱ID
        :return: ontology
        """
        api = "{}/api/kn-knowledge-data/v0/graph/info/onto?graph_id={}&compensation_cache=true".format(
            self._basic_url, kg_id
        )
        async with aiohttp.ClientSession() as session:
            async with session.get(api, headers=self.headers) as response:
                if response.status != 200:
                    error_str = await response.text()
                    StandLogger.error(
                        "service error, api: {}, error: {}".format(api, error_str)
                    )
                    raise Exception(
                        "service error, api: {}, error: {}".format(api, error_str)
                    )
                res_text = await response.text()
                res = json.loads(res_text)
                if "res" not in res:
                    raise Exception(
                        "service error, api: {}, error: {}".format(api, res)
                    )

                return res["res"]
