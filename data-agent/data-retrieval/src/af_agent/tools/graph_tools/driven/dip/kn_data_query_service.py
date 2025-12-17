#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2023/10/19 15:12
# @Author  : Jay.zhu
# @File    : kg_engine_service.py
# @Desc    :
import json
import logging

import aiohttp

from af_agent.tools.graph_tools.common.config import ConfigClass as Config

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class KnDataQueryService(object):
    """图分析服务和认知搜索服务调用"""

    def __init__(self):
        self._basic_url = 'http://{}:{}'.format(Config.HOST_KN_DATA_QUERY, Config.PORT_KN_DATA_QUERY)
        self.headers = {}

    async def nebula_execute(self, kg_id, statements):
        api = "{}/api/kn-data-query/v1/open/custom-search/kgs/{}".format(self._basic_url, kg_id)
        if isinstance(statements, str):
            statements = [statements]
        # payload = json.dumps({"statements": statements})
        payload = {"statements": statements}
        async with aiohttp.ClientSession() as session:
            async with session.post(api, json=payload) as response:
                if response.status != 200:
                    error_str = await response.text()
                    logger.error("service error, api: {}, param: {}, {}".format(api, payload, error_str))

                res = await response.text()
                return {
                    "code": response.status,
                    "message": json.loads(res)
                }


kn_data_query_service = KnDataQueryService()
