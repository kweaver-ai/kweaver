import unittest
from unittest import mock
from unittest.mock import patch

from app.common.errors import CodeException
from app.driven.ad.model_factory_service import model_factory_service
from test import MockSession, MockStreamContent
from test.driven_test import myAssertRaises


class TestCallStream(unittest.IsolatedAsyncioTestCase):
    async def test_call_stream_success_1(self):
        # stream == True
        data = """data: {"id":"chat-b081dc8d697a4c2989dd97f6b5fd65d3","object":"chat.completion.chunk","created":1733220032,"model":"Tome-M","choices":[{"index":0,"delta":{"role":"assistant","content":""},"logprobs":null,"finish_reason":null}]}

data: {"id":"chat-b081dc8d697a4c2989dd97f6b5fd65d3","object":"chat.completion.chunk","created":1733220032,"model":"Tome-M","choices":[{"index":0,"delta":{"content":"你好"},"logprobs":null,"finish_reason":null}]}

data: {"id":"chat-b081dc8d697a4c2989dd97f6b5fd65d3","object":"chat.completion.chunk","created":1733220032,"model":"Tome-M","choices":[{"index":0,"delta":{"content":"！"},"logprobs":null,"finish_reason":null}]}

data: {"id":"chat-b081dc8d697a4c2989dd97f6b5fd65d3","object":"chat.completion.chunk","created":1733220032,"model":"Tome-M","choices":[{"index":0,"delta":{"content":"有什么"},"logprobs":null,"finish_reason":null}]}

data: {"id":"chat-b081dc8d697a4c2989dd97f6b5fd65d3","object":"chat.completion.chunk","created":1733220032,"model":"Tome-M","choices":[{"index":0,"delta":{"content":"可以帮助"},"logprobs":null,"finish_reason":null}]}

data: {"id":"chat-b081dc8d697a4c2989dd97f6b5fd65d3","object":"chat.completion.chunk","created":1733220032,"model":"Tome-M","choices":[{"index":0,"delta":{"content":"你的"},"logprobs":null,"finish_reason":null}]}

data: {"id":"chat-b081dc8d697a4c2989dd97f6b5fd65d3","object":"chat.completion.chunk","created":1733220032,"model":"Tome-M","choices":[{"index":0,"delta":{"content":"吗"},"logprobs":null,"finish_reason":null}]}

data: {"id":"chat-b081dc8d697a4c2989dd97f6b5fd65d3","object":"chat.completion.chunk","created":1733220032,"model":"Tome-M","choices":[{"index":0,"delta":{"content":"？"},"logprobs":null,"finish_reason":null}]}

data: {"id":"chat-b081dc8d697a4c2989dd97f6b5fd65d3","object":"chat.completion.chunk","created":1733220032,"model":"Tome-M","choices":[{"index":0,"delta":{"content":""},"logprobs":null,"finish_reason":"stop","stop_reason":null}]}

data: {"id": "chatcmpl-dX4YcT13r11uupSE2eD1ZWf5mdhQCCRa", "object": "chat.completion.chunk", "created": 1733219594, "model": "Tome-M", "choices": [{"index": 0, "delta": {"content": ""}, "finish_reason": "stop", "usage": {"prompt_tokens": 3, "completion_tokens": 9, "total_tokens": 12}}]}

data: [DONE]

"""
        content = MockStreamContent(data)
        with patch(
            "aiohttp.ClientSession", return_value=MockSession(200, content=content)
        ):
            result = model_factory_service.call_stream(
                model="model",
                messages=[],  # 输入内容,字典列表，key为role和content
                top_p=1,  # 核采样，取值0-1，默认为1
                temperature=1,  # 模型在做出下一个词预测时的确定性和随机性程度。取值0-2，默认为1
                presence_penalty=0,  # 话题新鲜度，取值-2~2，默认为0
                frequency_penalty=0,  # 频率惩罚度，取值-2~2，默认为0
                max_tokens=1000,  # 单次回复限制，取值10-该模型最大tokens数，默认为1000
                top_k=1,  # 取值大于等于1，默认为1
                userid="",
            )
            res = ""
            async for item in result:
                res += item
            self.assertEqual(res, "你好！有什么可以帮助你的吗？")


class TestCall(unittest.IsolatedAsyncioTestCase):
    async def test_call_success_2(self):
        # stream ！= True
        data = {
            "id": "chat-e2c2c71133bf430ca5e47a44b1e3135b",
            "object": "chat.completion",
            "created": 1733220442,
            "model": "Tome-M",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "你好！有什么可以帮助你的吗？",
                        "tool_calls": [],
                    },
                    "logprobs": None,
                    "finish_reason": "stop",
                    "stop_reason": None,
                }
            ],
            "usage": {"prompt_tokens": 14, "total_tokens": 22, "completion_tokens": 8},
            "prompt_logprobs": None,
        }
        with patch("aiohttp.ClientSession", return_value=MockSession(200, data)):
            result = await model_factory_service.call(
                model="model",
                messages=[],  # 输入内容,字典列表，key为role和content
                top_p=1,  # 核采样，取值0-1，默认为1
                temperature=1,  # 模型在做出下一个词预测时的确定性和随机性程度。取值0-2，默认为1
                presence_penalty=0,  # 话题新鲜度，取值-2~2，默认为0
                frequency_penalty=0,  # 频率惩罚度，取值-2~2，默认为0
                max_tokens=1000,  # 单次回复限制，取值10-该模型最大tokens数，默认为1000
                top_k=1,  # 取值大于等于1，默认为1
                userid="",
            )
            self.assertEqual(result, "你好！有什么可以帮助你的吗？")

    async def test_call_fail(self):
        content = mock.MagicMock()
        content.read = mock.AsyncMock(return_value="error".encode())
        with patch(
            "aiohttp.ClientSession", return_value=MockSession(500, content=content)
        ):
            await myAssertRaises(
                CodeException,
                model_factory_service.call,
                *(
                    "model",
                    [],
                ),
            )


class TestGetCOT(unittest.IsolatedAsyncioTestCase):
    async def test_get_cot_success(self):
        with patch("aiohttp.ClientSession", return_value=MockSession(200, {})):
            result = await model_factory_service.get_agent_config(["1"])
            self.assertEqual(result, {})

    async def test_get_cot_fail(self):
        with patch("aiohttp.ClientSession", return_value=MockSession(500, "error")):
            await myAssertRaises(
                CodeException, model_factory_service.get_agent_config, ["1"]
            )


class TestGetLLMConfig(unittest.IsolatedAsyncioTestCase):
    async def test_get_llm_config_success(self):
        with patch("aiohttp.ClientSession", return_value=MockSession(200, {"res": {}})):
            result = await model_factory_service.get_llm_config("model_name")
            self.assertEqual(result, {})

    async def test_get_llm_config_fail(self):
        with patch("aiohttp.ClientSession", return_value=MockSession(500, "error")):
            await myAssertRaises(
                CodeException, model_factory_service.get_llm_config, "model_name"
            )
