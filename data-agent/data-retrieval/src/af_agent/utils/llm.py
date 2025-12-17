# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-11-06

from typing import (
    Any,
    cast,
    List,
    Optional,
    AsyncIterator,
)

from langchain_core.pydantic_v1 import Field
from httpx import Client, AsyncClient
import openai

from langchain_community.chat_models.openai import (
    ChatOpenAI,
    acompletion_with_retry,
    _convert_delta_to_message_chunk,
    convert_dict_to_message
)

from langchain_core.callbacks import (
    AsyncCallbackManagerForLLMRun,
    CallbackManagerForLLMRun,
)
from langchain_core.messages import BaseMessage
from langchain_core.outputs import ChatGeneration, ChatGenerationChunk, ChatResult
from langchain_core.messages import AIMessageChunk


from openai._base_client import SyncHttpxClientWrapper, AsyncHttpxClientWrapper
from openai._constants import DEFAULT_CONNECTION_LIMITS, DEFAULT_TIMEOUT, DEFAULT_MAX_RETRIES
from openai._types import Timeout
import re




# Deepseek need it, because it's output has <think></think> tag, that will
# influence the result of agent
def deal_think_tags(content):
    # 使用更高效的正则表达式
    pattern = re.compile(r'<think>(.*?)</think>', re.DOTALL)
    match = pattern.search(content)
    if match:
        think_content = match.group(1)
        before_think = content[:match.start()]
        after_think = content[match.end():]
    else:
        think_content = ""
        before_think = ""
        after_think = content

    return before_think, think_content, after_think

class CustomChatOpenAI(ChatOpenAI):
    """
    Custom ChatOpenAI class to support more parameters

    Parameters:
    """

    """verify_ssl: Default is True"""
    verify_ssl: bool = True
    # client: Any = Field(default=None)  #: :meta private:
    # async_client: Any = Field(default=None)  #: :meta private:

    def _get_client_params(self, **kwargs):
        # Client params of openai.OpenAI
        # api_key: str | None = None,
        # organization: str | None = None,
        # project: str | None = None,
        # base_url: str | httpx.URL | None = None,
        # timeout: Union[float, Timeout, None, NotGiven] = NOT_GIVEN,
        # max_retries: int = DEFAULT_MAX_RETRIES,
        # default_headers: Mapping[str, str] | None = None,
        # default_query: Mapping[str, object] | None = None,
        
        client_params = {
            "api_key": kwargs.get("openai_api_key"),
            "organization": kwargs.get("openai_organization"),
            "project": kwargs.get("openai_project"),
            "base_url": kwargs.get("openai_api_base"),
            "max_retries": kwargs.get("max_retries", DEFAULT_MAX_RETRIES),
            "timeout": cast(Timeout, kwargs.get("request_timeout", DEFAULT_TIMEOUT)),
            "default_headers": kwargs.get("default_headers"),
            "default_query": kwargs.get("default_query"),
        }

        http_params = {
            "proxies": kwargs.get("proxies"),
            "transport": kwargs.get("transport"),
            "limits": kwargs.get("limits", DEFAULT_CONNECTION_LIMITS),
        }

        return client_params, http_params


    def __init__(self, *args, **kwargs):
        client_params, http_params = self._get_client_params(**kwargs)

        # http_client or SyncHttpxClientWrapper(
        #     base_url=base_url,
        #     # cast to a valid type because mypy doesn't understand our type narrowing
        #     timeout=cast(Timeout, timeout),
        #     proxies=proxies,
        #     transport=transport,
        #     limits=limits,
        #     follow_redirects=True,
        # )
        http_client = SyncHttpxClientWrapper(
            verify=kwargs.get("verify_ssl", True),
            **http_params
        )

        client = openai.OpenAI(**client_params, http_client=http_client).chat.completions

        async_http_client = AsyncHttpxClientWrapper(
            verify=kwargs.get("verify_ssl", True),
            **http_params
        )

        async_client = openai.AsyncOpenAI(**client_params, http_client=async_http_client).chat.completions

        super().__init__(client=client, async_client=async_client, *args, **kwargs)


    async def _astream(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[AsyncCallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> AsyncIterator[ChatGenerationChunk]:
        message_dicts, params = self._create_message_dicts(messages, stop)
        params = {**params, **kwargs, "stream": True}

        default_chunk_class = AIMessageChunk
        async for chunk in await acompletion_with_retry(
            self, messages=message_dicts, run_manager=run_manager, **params
        ):
            if not isinstance(chunk, dict):
                chunk = chunk.dict()
            if len(chunk["choices"]) == 0:
                continue
            choice = chunk["choices"][0]
            chunk = _convert_delta_to_message_chunk(
                choice["delta"], default_chunk_class
            )

            # add reasoning to chunk
            if "reasoning_content" in choice["delta"]:
                chunk.additional_kwargs["reasoning_content"] = choice["delta"]["reasoning_content"]

            finish_reason = choice.get("finish_reason")
            generation_info = (
                dict(finish_reason=finish_reason) if finish_reason is not None else None
            )
            default_chunk_class = chunk.__class__
            cg_chunk = ChatGenerationChunk(
                message=chunk, generation_info=generation_info
            )
            if run_manager:
                await run_manager.on_llm_new_token(token=cg_chunk.text, chunk=cg_chunk)
            yield cg_chunk
    
    def _create_chat_result(self, response) -> ChatResult:
        generations = []
        if not isinstance(response, dict):
            response = response.dict()
        for res in response["choices"]:
            message = convert_dict_to_message(res["message"])
            generation_info = dict(finish_reason=res.get("finish_reason"))

            # add reasoning to generation_info
            if "reasoning_content" in res.get("message", {}):
                message.additional_kwargs["reasoning_content"] = res["message"]["reasoning_content"]

            if "logprobs" in res:
                generation_info["logprobs"] = res["logprobs"]
            gen = ChatGeneration(
                message=message,
                generation_info=generation_info,
            )
            generations.append(gen)
        token_usage = response.get("usage", {})
        llm_output = {
            "token_usage": token_usage,
            "model_name": self.model_name,
            "system_fingerprint": response.get("system_fingerprint", ""),
        }
        return ChatResult(generations=generations, llm_output=llm_output)
