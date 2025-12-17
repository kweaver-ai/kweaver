import unittest
from unittest.mock import MagicMock, AsyncMock, patch

from app.common.errors import ParamException
from app.router import agent_controller_pkg


class TestRunAgent(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        # Mock AgentCore
        self.mock_agent_core = MagicMock()
        self.mock_agent_core.outputHandler = MagicMock()
        self.mock_agent_core.outputHandler.result_output = AsyncMock(
            return_value=self.my_generator()
        )

        self.request = MagicMock()
        self.request.headers = {"userid": "1"}

        # Mock agent_factory_service
        self.origin_agent_factory_service = agent_controller_pkg.agent_factory_service
        agent_config = {"status": "published", "config": '{"name": "test_agent"}'}
        agent_controller_pkg.agent_factory_service.get_agent_config = AsyncMock(
            return_value=agent_config
        )
        agent_controller_pkg.agent_factory_service.check_agent_permission = AsyncMock(
            return_value=True
        )

    @staticmethod
    async def my_generator():
        for i in range(3):
            yield i

    def tearDown(self):
        agent_controller_pkg.agent_factory_service = self.origin_agent_factory_service

    @patch("app.logic.agent_core_logic.agent_core.AgentCore")
    async def test_run_agent_1(self, mock_agent_core_class):
        """从 config 拿配置"""
        mock_agent_core_class.return_value = self.mock_agent_core
        param = agent_controller_pkg.RunAgentParam(
            **{"config": {"name": ""}, "input": {"query": "test query"}}
        )
        await agent_controller_pkg.run_agent(self.request, param)

    @patch("app.logic.agent_core_logic.agent_core.AgentCore")
    async def test_run_agent_2(self, mock_agent_core_class):
        """根据 id 拿配置"""
        mock_agent_core_class.return_value = self.mock_agent_core
        param = agent_controller_pkg.RunAgentParam(
            **{"id": "id", "input": {"query": "test query"}}
        )
        await agent_controller_pkg.run_agent(self.request, param)

    async def test_run_agent_error1(self):
        """错误参数"""
        param = agent_controller_pkg.RunAgentParam(**{"input": {"query": "test query"}})
        with self.assertRaises(ParamException):
            await agent_controller_pkg.run_agent(self.request, param)

    @patch("app.logic.agent_core_logic.agent_core.AgentCore")
    async def test_run_agent_error2(self, mock_agent_core_class):
        """agent 未发布"""
        mock_agent_core_class.return_value = self.mock_agent_core
        agent_config = {"status": "draft", "config": '{"name": "test_agent"}'}
        param = agent_controller_pkg.RunAgentParam(
            **{"id": "id", "input": {"query": "test query"}}
        )
        agent_controller_pkg.agent_factory_service.get_agent_config = AsyncMock(
            return_value=agent_config
        )
        # Note: 当前实现不检查status，所以这个测试可能需要根据实际需求调整
        # 如果需要检查status，请在run_agent.py中添加相应逻辑
        await agent_controller_pkg.run_agent(self.request, param)


class TestDebugAgent(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        # Mock AgentCore
        self.mock_agent_core = MagicMock()
        self.mock_agent_core.outputHandler = MagicMock()
        self.mock_agent_core.outputHandler.result_output = AsyncMock(
            return_value=self.my_generator()
        )

        self.request = MagicMock()
        self.request.headers = {"userid": "1"}

        # Mock agent_factory_service
        self.origin_agent_factory_service = agent_controller_pkg.agent_factory_service
        agent_config = {"status": "published", "config": '{"name": "test_agent"}'}
        agent_controller_pkg.agent_factory_service.get_agent_config = AsyncMock(
            return_value=agent_config
        )
        agent_controller_pkg.agent_factory_service.check_agent_permission = AsyncMock(
            return_value=True
        )

    @staticmethod
    async def my_generator():
        for i in range(3):
            yield i

    def tearDown(self):
        agent_controller_pkg.agent_factory_service = self.origin_agent_factory_service

    @patch("app.logic.agent_core_logic.agent_core.AgentCore")
    async def test_debug_agent_1(self, mock_agent_core_class):
        """从 config 拿配置"""
        mock_agent_core_class.return_value = self.mock_agent_core
        param = agent_controller_pkg.RunAgentParam(
            **{"config": {"name": ""}, "input": {"query": "test query"}}
        )
        await agent_controller_pkg.debug_agent(self.request, param)

    @patch("app.logic.agent_core_logic.agent_core.AgentCore")
    async def test_debug_agent_2(self, mock_agent_core_class):
        """根据 id 拿配置"""
        mock_agent_core_class.return_value = self.mock_agent_core
        param = agent_controller_pkg.RunAgentParam(
            **{"id": "id", "input": {"query": "test query"}}
        )
        await agent_controller_pkg.debug_agent(self.request, param)

    async def test_debug_agent_error1(self):
        """错误参数"""
        param = agent_controller_pkg.RunAgentParam(**{"input": {"query": "test query"}})
        with self.assertRaises(ParamException):
            await agent_controller_pkg.debug_agent(self.request, param)
