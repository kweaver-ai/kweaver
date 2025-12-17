import sys

import aiohttp

import af_agent.tools.graph_tools.common.stand_log as log_oper
from af_agent.tools.graph_tools.common import errors
from af_agent.tools.graph_tools.common.config import Config
from af_agent.tools.graph_tools.common.errors import CodeException
from af_agent.tools.graph_tools.common.stand_log import StandLogger
from af_agent.tools.graph_tools.utils.common import is_valid_url


class EmbeddingClient:
    def __init__(self):
        self.embedding_url = Config.EMB_URL

    async def ado_embedding(self, texts):
        if not is_valid_url(self.embedding_url):
            error_log = log_oper.get_error_log(self.embedding_url + " is not a valid url", sys._getframe())
            StandLogger.error(error_log, log_oper.SYSTEM_LOG)
            raise Exception("The embedding service model_url has not been configured.")
        body = {
            "texts": texts
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.embedding_url, json=body) as response:
                    if response.status != 200:
                        err = self.embedding_url + " 调用embedding服务失败:  {}".format(await response.text())
                        error_log = log_oper.get_error_log(err, sys._getframe())
                        StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                        raise CodeException(errors.AgentApp_ExternalServiceError, err)
                    embeddings = await response.json()
                    return embeddings
        except Exception as e:
            raise Exception(f'调用embedding服务失败: {repr(e)}')


embedding_client = EmbeddingClient()
