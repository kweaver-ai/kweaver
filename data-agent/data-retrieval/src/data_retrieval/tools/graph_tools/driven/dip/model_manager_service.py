# -*- coding: utf-8 -*-
import json
import sys

import aiohttp
from circuitbreaker import circuit

import data_retrieval.tools.graph_tools.common.stand_log as log_oper
from data_retrieval.tools.graph_tools.common import errors
from data_retrieval.tools.graph_tools.common.config import Config
from data_retrieval.tools.graph_tools.common.errors import CodeException
from data_retrieval.tools.graph_tools.common.stand_log import StandLogger
from data_retrieval.tools.graph_tools.utils.common import GetFailureThreshold, GetRecoveryTimeout


class ModelManagerService(object):
    def __init__(self):
        self._host = Config.HOST_MF_MODEL_API
        self._port = Config.PORT_MF_MODEL_API
        self._basic_url = "http://{}:{}".format(self._host, self._port)
        self.headers = {"x-account-id": "b32ad442-aadd-11ef-ac00-3e62f794970", "x-account-type": "user"}

    @circuit(
        failure_threshold=GetFailureThreshold(), recovery_timeout=GetRecoveryTimeout()
    )
    async def call_stream_obj(
        self,
        model: str,  # 模型名
        messages: list,  # 输入内容,字典列表，key为role和content
        top_p: float = None,  # 核采样，取值0-1，默认为1
        temperature: float = None,  # 模型在做出下一个词预测时的确定性和随机性程度。取值0-2，默认为1
        presence_penalty: float = None,  # 话题新鲜度，取值-2~2，默认为0
        frequency_penalty: float = None,  # 频率惩罚度，取值-2~2，默认为0
        max_tokens: int = None,  # 单次回复限制，取值10-该模型最大tokens数，默认为1000
        top_k: int = None,  # 取值大于等于1，默认为1
        account_id: str = "",
        account_type: str = "user"
    ):
        """
        流式调用大模型
        返回的是async_generator, 需要用async for来迭代生成
        生成器返回的类型为dict，里面有content和reasoning_content字段
        """
        req = {"model": model, "messages": messages, "stream": True}

        headers = {
            "content_type": "application/json", 
            "x-account-id": account_id, 
            "x-account-type": account_type,

            "x-user": account_id,  # 兼容旧版本
            "x-visitor_type": account_type  # 兼容旧版本
        }

        if top_p:
            req["top_p"] = top_p

        if top_k:
            req["top_k"] = top_k
        else:
            req["top_k"] = 100

        if temperature:
            req["temperature"] = temperature

        if presence_penalty:
            req["presence_penalty"] = presence_penalty

        if frequency_penalty:
            req["frequency_penalty"] = frequency_penalty

        if max_tokens:
            req["max_tokens"] = max_tokens

        url = self._basic_url + "/api/private/mf-model-api/v1/chat/completions"
        # StandLogger.info("call llm body = {}".format(req))
        StandLogger.info("call llm header = {}".format(headers))
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=req, headers=headers) as response:
                if response.status != 200:
                    err = self._host + " 调用大模型失败 error: {}".format(
                        await response.text()
                    )
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise CodeException(errors.AgentExecutor_ExternalServiceError, err)

                while True:
                    line = await response.content.readline()
                    if not line:
                        break
                    line = line.decode()
                    if line.startswith("data:"):
                        event_data = line.strip()[6:]
                        try:
                            resp = json.loads(event_data)
                            if resp.get("choices"):
                                yield resp["choices"][0]["delta"]
                        except Exception as e:
                            continue

    async def call_stream(
        self,
        model: str,  # 模型名
        messages: list,  # 输入内容,字典列表，key为role和content
        top_p: float = None,  # 核采样，取值0-1，默认为1
        temperature: float = None,  # 模型在做出下一个词预测时的确定性和随机性程度。取值0-2，默认为1
        presence_penalty: float = None,  # 话题新鲜度，取值-2~2，默认为0
        frequency_penalty: float = None,  # 频率惩罚度，取值-2~2，默认为0
        max_tokens: int = None,  # 单次回复限制，取值10-该模型最大tokens数，默认为1000
        top_k: int = None,  # 取值大于等于1，默认为1
        account_id: str = "",
        account_type: str = "user"
    ):
        """
        流式调用大模型
        返回的是async_generator, 需要用async for来迭代生成
        生成器返回的类型为字符串，内容为content的值
        """
        async for item in self.call_stream_obj(
            model=model,
            messages=messages,
            top_p=top_p,
            temperature=temperature,
            presence_penalty=presence_penalty,
            frequency_penalty=frequency_penalty,
            max_tokens=max_tokens,
            top_k=top_k,
            account_id=account_id,
            account_type=account_type,
        ):
            yield item.get("content") or ""

    @circuit(
        failure_threshold=GetFailureThreshold(), recovery_timeout=GetRecoveryTimeout()
    )
    async def call_obj(
        self,
        model: str,  # 模型名
        messages: list,  # 输入内容,字典列表，key为role和content
        top_p: float = None,  # 核采样，取值0-1，默认为1
        temperature: float = None,  # 模型在做出下一个词预测时的确定性和随机性程度。取值0-2，默认为1
        presence_penalty: float = None,  # 话题新鲜度，取值-2~2，默认为0
        frequency_penalty: float = None,  # 频率惩罚度，取值-2~2，默认为0
        max_tokens: int = None,  # 单次回复限制，取值10-该模型最大tokens数，默认为1000
        top_k: int = None,  # 取值大于等于1，默认为1
        account_id: str = "",
        account_type: str = "user"
    ):
        """
        非流式调用大模型
        返回dict，里面有content和reasoning_content字段
        """
        req = {"model": model, "messages": messages, "stream": False}
        headers = {
            "content_type": "application/json", 
            "x-account-id": account_id, 
            "x-account-type": account_type,

            "x-user": account_id,  # 兼容旧版本
            "x-visitor_type": account_type  # 兼容旧版本
        }
        if top_p:
            req["top_p"] = top_p

        if top_k:
            req["top_k"] = top_k
        else:
            req["top_k"] = 100

        if temperature:
            req["temperature"] = temperature

        if presence_penalty:
            req["presence_penalty"] = presence_penalty

        if frequency_penalty:
            req["frequency_penalty"] = frequency_penalty

        if max_tokens:
            req["max_tokens"] = max_tokens

        url = self._basic_url + "/api/private/mf-model-api/v1/chat/completions"
        # StandLogger.info("call llm body = {}".format(req))
        StandLogger.info("call llm header = {}".format(headers))
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=req, headers=headers) as response:
                if response.status != 200:
                    res = await response.content.read()
                    res = res.decode("utf-8")
                    err = self._host + " call llm error: {}".format(res)
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise CodeException(errors.AgentExecutor_ExternalServiceError, err)
                res = ""
                resp = await response.read()
                resp_dict = json.loads(resp.decode())
                return resp_dict["choices"][0]["message"]

    async def call(
        self,
        model: str,  # 模型名
        messages: list,  # 输入内容,字典列表，key为role和content
        top_p: float = None,  # 核采样，取值0-1，默认为1
        temperature: float = None,  # 模型在做出下一个词预测时的确定性和随机性程度。取值0-2，默认为1
        presence_penalty: float = None,  # 话题新鲜度，取值-2~2，默认为0
        frequency_penalty: float = None,  # 频率惩罚度，取值-2~2，默认为0
        max_tokens: int = None,  # 单次回复限制，取值10-该模型最大tokens数，默认为1000
        top_k: int = None,  # 取值大于等于1，默认为1
        account_id: str = "",
        account_type: str = "user"
    ):
        """
        非流式调用大模型
        返回字符串
        """
        res = await self.call_obj(
            model=model,
            messages=messages,
            top_p=top_p,
            temperature=temperature,
            presence_penalty=presence_penalty,
            frequency_penalty=frequency_penalty,
            max_tokens=max_tokens,
            top_k=top_k,
            account_id=account_id,
            account_type=account_type,
        )
        return res.get("content") or ""



model_manager_service = ModelManagerService()
