import sys

import aiohttp

import app.common.stand_log as log_oper
from app.common import errors
from app.common.config import Config
from app.common.errors import CodeException
from app.common.stand_log import StandLogger
from app.utils.common import is_valid_url
from app.domain.enum.common.user_account_header_key import set_user_account_id


class EmbeddingClient:
    def __init__(self):
        # self.embedding_url = Config.EMB_URL
        self.embedding_url = f"http://{Config.services.mf_model_api.host}:{Config.services.mf_model_api.port}/api/private/mf-model-api/v1/small-model/embedding"
        self.headers = {}
        set_user_account_id(self.headers, "fake-user-id")

    async def ado_embedding_v1(self, texts):
        """以前调用方式"""
        StandLogger.info("开始embedding")

        if not is_valid_url(self.embedding_url):
            error_log = log_oper.get_error_log(
                self.embedding_url + " is not a valid url", sys._getframe()
            )
            StandLogger.error(error_log, log_oper.SYSTEM_LOG)
            raise Exception("The embedding service model_url has not been configured.")

        body = {"texts": texts}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.embedding_url, json=body) as response:
                    if response.status != 200:
                        err = self.embedding_url + " 调用embedding服务失败:  {}".format(
                            await response.text()
                        )
                        error_log = log_oper.get_error_log(err, sys._getframe())
                        StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                        raise CodeException(errors.ExternalServiceError(), err)
                    embeddings = await response.json()
                    StandLogger.info("embedding结束")
                    return embeddings
        except Exception as e:
            raise Exception(f"调用embedding服务失败: {repr(e)}")

    async def ado_embedding(self, texts):
        StandLogger.info("开始embedding")

        if not is_valid_url(self.embedding_url):
            error_log = log_oper.get_error_log(
                self.embedding_url + " is not a valid url", sys._getframe()
            )
            StandLogger.error(error_log, log_oper.SYSTEM_LOG)
            raise Exception("The embedding service model_url has not been configured.")

        body = {"model": "embedding", "input": texts}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.embedding_url, json=body, headers=self.headers
                ) as response:
                    if response.status != 200:
                        err = self.embedding_url + " 调用embedding服务失败:  {}".format(
                            await response.text()
                        )

                        error_log = log_oper.get_error_log(err, sys._getframe())
                        StandLogger.error(error_log, log_oper.SYSTEM_LOG)

                        raise CodeException(errors.ExternalServiceError(), err)

                    response_data = await response.json()
                    # 从新的响应格式中提取 embedding 向量
                    embeddings = [item["embedding"] for item in response_data["data"]]
                    StandLogger.info("embedding结束")

                    return embeddings

        except Exception as e:
            raise Exception(f"调用embedding服务失败: {repr(e)}")


embedding_client = EmbeddingClient()
