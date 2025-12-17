# -*- coding: utf-8 -*-
import json

import aiohttp
from circuitbreaker import circuit

from app.common import errors
from app.common.config import Config
from app.common.errors import CodeException
from app.common.struct_logger import struct_logger
from app.utils.common import GetFailureThreshold, GetRecoveryTimeout
from app.domain.enum.common.user_account_header_key import set_user_account_id
from app.infra.common.infra_constant.const import HTTP_REQUEST_TIMEOUT


class ModelManagerService(object):
    def __init__(self):
        self._host = Config.services.mf_model_manager.host
        self._port = Config.services.mf_model_manager.port
        self._basic_url = "http://{}:{}".format(self._host, self._port)
        self.headers = {}
        set_user_account_id(self.headers, "b32ad442-aadd-11ef-ac00-3e62f794970")

    @circuit(
        failure_threshold=GetFailureThreshold(), recovery_timeout=GetRecoveryTimeout()
    )
    async def get_llm_config(self, model_id):
        """
        获取大模型配置
        """

        if Config.local_dev.is_mock_get_llm_config_resp:
            return {"max_model_len": 10000}

        try:
            url = self._basic_url + "/api/private/mf-model-manager/v1/llm/get"
            params = {"model_id": model_id}

            timeout = aiohttp.ClientTimeout(total=HTTP_REQUEST_TIMEOUT)

            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(
                    url, params=params, headers=self.headers
                ) as response:
                    if response.status != 200:
                        response_text = await response.text()
                        try:
                            response_json = json.loads(response_text)
                        except:
                            response_json = response_text

                        # 使用结构化日志记录错误
                        struct_logger.error(
                            "get_llm_config failed",
                            req_url=url,
                            req_params=params,
                            response_status=response.status,
                            response_body=response_json,
                        )

                        err = (
                            "req_url: "
                            + url
                            + "req_params: "
                            + json.dumps(params)
                            + " get_llm_config error: {}".format(response_text)
                        )
                        raise CodeException(errors.ExternalServiceError(), err)
                    res = await response.json()
                    return res
        except Exception as e:
            # 使用结构化日志记录异常
            struct_logger.error(
                "get_llm_config exception",
                exc_info=e,
                model_id=model_id,
            )
            raise e


model_manager_service = ModelManagerService()
