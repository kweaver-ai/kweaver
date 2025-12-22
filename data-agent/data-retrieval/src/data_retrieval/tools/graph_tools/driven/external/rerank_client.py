import sys

import aiohttp

from data_retrieval.tools.graph_tools.common.config import Config
import data_retrieval.tools.graph_tools.common.stand_log as log_oper
from data_retrieval.tools.graph_tools.common.stand_log import StandLogger
from data_retrieval.tools.graph_tools.utils.common import is_valid_url

class RerankClient:
    def __init__(self):
        self.rerank_url = Config.RERANK_URL

    async def ado_rerank(self, slices, query):
        if not is_valid_url(self.rerank_url):
            error_log = log_oper.get_error_log(self.rerank_url + " is not a valid url", sys._getframe())
            StandLogger.error(error_log, log_oper.SYSTEM_LOG)
            raise Exception("The rerank service model_url has not been configured.")

        # 旧版
        body = {
            "slices":slices,
            "query":query
        }
        # 新版
        body = {
            "documents":slices,
            "query":query,
            "model": "reranker"
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.rerank_url, json=body) as response:
                    if response.status != 200:
                        err = await response.text()
                        raise Exception(f"{self.rerank_url} 调用rerank服务失败: {err}")
                    rerank_scores = await response.json()     
                    rerank_scores = rerank_scores["results"]
                    return rerank_scores
        except Exception as e:
            raise Exception(f"调用rerank服务失败: {repr(e)}")