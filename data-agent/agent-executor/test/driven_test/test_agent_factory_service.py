import json
import unittest
from unittest import mock
from unittest.mock import patch

import app.driven.ad.agent_factory_service as agent_factory_service_pkg
from app.common.errors import CodeException
from app.driven.ad.agent_factory_service import agent_factory_service
from test import MockSession
from test.driven_test import myAssertRaises


class TestGetToolInfo(unittest.IsolatedAsyncioTestCase):
    async def test_get_tool_info(self):
        with patch("aiohttp.ClientSession", return_value=MockSession(200, {"res": {}})):
            result = await agent_factory_service.get_tool_info("box_id", "tool_id")
            self.assertEqual(result, {})

    async def test_get_tool_info_error(self):
        # 模拟一个失败的响应
        with patch(
            "aiohttp.ClientSession", return_value=MockSession(500, "Error response")
        ):
            await myAssertRaises(
                CodeException,
                agent_factory_service.get_tool_info,
                *(
                    "box_id",
                    "tool_id",
                ),
            )


class TestGetToolBoxInfo(unittest.IsolatedAsyncioTestCase):
    async def test_get_tool_box_info(self):
        with patch("aiohttp.ClientSession", return_value=MockSession(200, {"res": {}})):
            result = await agent_factory_service.get_tool_box_info("box_id")
            self.assertEqual(result, {})

    async def test_get_tool_box_info_error(self):
        # 模拟一个失败的响应
        with patch(
            "aiohttp.ClientSession", return_value=MockSession(500, "Error response")
        ):
            await myAssertRaises(
                CodeException, agent_factory_service.get_tool_box_info, *("box_id",)
            )


class TestGetAgentConfig(unittest.IsolatedAsyncioTestCase):
    async def test_get_agent_config1(self):
        """从redis中获取配置"""
        agent_factory_service_pkg.redisConnect = mock.MagicMock()
        mock_redis_conn = (
            agent_factory_service_pkg.redisConnect.connect_redis_async.return_value
        )
        mock_redis_res = json.dumps({"release_config": {}}).encode("utf-8")
        mock_redis_conn.get = mock.AsyncMock(return_value=mock_redis_res)
        result = await agent_factory_service.get_agent_config("agent_id")
        self.assertEqual(result, {"release_config": {}})

    async def test_get_agent_config2(self):
        """从agent_factory_service中获取配置"""
        agent_factory_service_pkg.redisConnect = mock.MagicMock()
        mock_redis_conn = (
            agent_factory_service_pkg.redisConnect.connect_redis_async.return_value
        )
        mock_redis_conn.get = mock.AsyncMock(return_value=None)
        with patch("aiohttp.ClientSession", return_value=MockSession(200, {"res": {}})):
            result = await agent_factory_service.get_agent_config("agent_id")
            self.assertEqual(result, {})

    async def test_get_agent_config_error(self):
        # 模拟一个失败的响应
        agent_factory_service_pkg.redisConnect = mock.MagicMock()
        mock_redis_conn = (
            agent_factory_service_pkg.redisConnect.connect_redis_async.return_value
        )
        mock_redis_conn.get = mock.AsyncMock(return_value=None)
        with patch(
            "aiohttp.ClientSession", return_value=MockSession(500, "Error response")
        ):
            await myAssertRaises(
                CodeException, agent_factory_service.get_agent_config, *("agent_id",)
            )
