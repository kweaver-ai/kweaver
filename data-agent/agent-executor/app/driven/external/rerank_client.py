import sys

import aiohttp

import app.common.stand_log as log_oper
from app.common.config import Config
from app.common.stand_log import StandLogger
from app.utils.common import is_valid_url
from app.domain.enum.common.user_account_header_key import set_user_account_id


class RerankClient:
    def __init__(self):
        # self.rerank_url = Config.RERANK_URL
        self.rerank_url = f"http://{Config.services.mf_model_api.host}:{Config.services.mf_model_api.port}/api/private/mf-model-api/v1/small-model/reranker"
        self.headers = {}
        set_user_account_id(self.headers, "fake-user-id")

    async def ado_rerank_v1(self, slices, query):
        """以前调用方式"""
        StandLogger.info("开始rerank")
        if not is_valid_url(self.rerank_url):
            error_log = log_oper.get_error_log(
                self.rerank_url + " is not a valid url", sys._getframe()
            )
            StandLogger.error(error_log, log_oper.SYSTEM_LOG)
            raise Exception("The rerank service model_url has not been configured.")
        body = {"slices": slices, "query": query}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.rerank_url, json=body) as response:
                    if response.status != 200:
                        err = await response.text()
                        raise Exception(f"{self.rerank_url} 调用rerank服务失败: {err}")
                    rerank_scores = await response.json()
                    StandLogger.info("rerank结束")
                    return rerank_scores
        except Exception as e:
            raise Exception(f"调用rerank服务失败: {repr(e)}")

    async def ado_rerank(self, documents, query):
        """新调用方式"""
        StandLogger.info("开始rerank")
        if not documents:
            StandLogger.info("rerank结束")
            return []

        if not is_valid_url(self.rerank_url):
            error_log = log_oper.get_error_log(
                self.rerank_url + " is not a valid url", sys._getframe()
            )
            StandLogger.error(error_log, log_oper.SYSTEM_LOG)
            raise Exception("The rerank service model_url has not been configured.")

        body = {"model": "reranker", "query": query, "documents": documents}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.rerank_url, json=body, headers=self.headers
                ) as response:
                    if response.status != 200:
                        err = await response.text()
                        raise Exception(f"{self.rerank_url} 调用rerank服务失败: {err}")

                    response_data = await response.json()

                    # 从新的响应结构中提取 relevance_score
                    rerank_scores = [
                        result["relevance_score"] for result in response_data["results"]
                    ]

                    StandLogger.info("rerank结束")
                    return rerank_scores
        except Exception as e:
            raise Exception(f"调用rerank服务失败: {repr(e)}")
