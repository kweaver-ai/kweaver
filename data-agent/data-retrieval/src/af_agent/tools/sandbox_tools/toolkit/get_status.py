from typing import Optional
import asyncio
from langchain_core.callbacks import CallbackManagerForToolRun, AsyncCallbackManagerForToolRun
from langchain_core.pydantic_v1 import BaseModel

from af_agent.logs.logger import logger
from af_agent.tools.base import construct_final_answer, async_construct_final_answer
from af_agent.errors import SandboxError
from af_agent.tools.sandbox_tools.toolkit.base_sandbox_tool import BaseSandboxTool, BaseSandboxToolInput
from af_agent.utils._common import run_blocking


class GetStatusInput(BaseSandboxToolInput):
    """获取状态工具的输入参数"""
    # 目前不需要额外参数，但保留结构以便未来扩展
    pass


class GetStatusTool(BaseSandboxTool):
    """获取状态工具，获取沙箱环境的当前状态"""
    
    name: str = "get_status"
    description: str = "获取沙箱环境的当前状态信息"
    args_schema: type[BaseSandboxToolInput] = GetStatusInput

    @construct_final_answer
    def _run(
        self,
        run_manager: Optional[CallbackManagerForToolRun] = None
    ):
        try:
            # 创建事件循环来运行异步操作
            result = run_blocking(self._get_status())
            return result
        except Exception as e:
            logger.error(f"Get status failed: {e}")
            raise SandboxError(reason="获取状态失败", detail=str(e)) from e
    
    @async_construct_final_answer
    async def _arun(
        self,
        title: str = "",
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ):
        try:
            result = await self._get_status()
            if self._random_session_id:
                result["session_id"] = self.session_id

            if title:
                result["title"] = title
            else:
                result["title"] = result["message"]

            return result
        except Exception as e:
            logger.error(f"Get status failed: {e}")
            raise SandboxError(reason="获取状态失败", detail=str(e)) from e
    
    async def _get_status(self) -> dict:
        """执行具体的状态获取操作"""
        sandbox = self._get_sandbox()
        
        try:
            result = await sandbox.get_status()
            return {
                "action": "get_status",
                "result": result,
                "message": "沙箱状态获取成功"
            }
        except Exception as e:
            logger.error(f"Get status action failed: {e}")
            raise SandboxError(reason=f"状态获取失败", detail=str(e)) from e

    @staticmethod
    async def get_api_schema():
        """获取 API Schema"""
        base_schema = await BaseSandboxTool.get_api_schema()
        base_schema["post"]["summary"] = "get_status"
        base_schema["post"]["description"] = "获取沙箱环境的当前状态信息"
        
        # 更新请求体 schema - 不需要额外参数
        base_schema["post"]["requestBody"]["content"]["application/json"]["schema"]["required"] = []
        
        # 添加示例
        base_schema["post"]["requestBody"]["content"]["application/json"]["examples"] = {
            "get_sandbox_status": {
                "summary": "获取沙箱状态",
                "description": "获取沙箱环境的当前状态信息",
                "value": {
                    "server_url": "http://localhost:8080",
                    "session_id": "test_session_123"
                }
            }
        }
        
        return base_schema 