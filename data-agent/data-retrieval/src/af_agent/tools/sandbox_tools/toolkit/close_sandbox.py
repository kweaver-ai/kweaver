from typing import Optional
import asyncio
from langchain_core.callbacks import CallbackManagerForToolRun, AsyncCallbackManagerForToolRun

from af_agent.logs.logger import logger
from af_agent.tools.base import construct_final_answer, async_construct_final_answer
from af_agent.errors import SandboxError
from af_agent.tools.sandbox_tools.toolkit.base_sandbox_tool import BaseSandboxTool, BaseSandboxToolInput
from af_agent.utils._common import run_blocking


class CloseSandboxInput(BaseSandboxToolInput):
    """关闭沙箱工具的输入参数"""
    # 目前不需要额外参数，但保留结构以便未来扩展
    pass


class CloseSandboxTool(BaseSandboxTool):
    """关闭沙箱工具，清理沙箱工作区"""
    
    name: str = "close_sandbox"
    description: str = "清理沙箱工作区，关闭沙箱连接"
    args_schema: type[BaseSandboxToolInput] = CloseSandboxInput

    @construct_final_answer
    def _run(
        self,
        title: str = "",
        run_manager: Optional[CallbackManagerForToolRun] = None
    ):
        try:
            result = run_blocking(self._close_sandbox())
            if title:
                result["title"] = title
            else:
                result["title"] = result["message"]

            return result
        except Exception as e:
            logger.error(f"Close sandbox failed: {e}")
            raise SandboxError(reason="关闭沙箱失败", detail=str(e)) from e
    
    @async_construct_final_answer
    async def _arun(
        self,
        title: str = "",
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ):
        try:
            result = await self._close_sandbox()
            if self._random_session_id:
                result["session_id"] = self.session_id
            
            if title:
                result["title"] = title
            else:
                result["title"] = result["message"]

            return result
        except Exception as e:
            logger.error(f"Close sandbox failed: {e}")
            raise SandboxError(reason="关闭沙箱失败", detail=str(e)) from e
    
    async def _close_sandbox(self) -> dict:
        """执行具体的沙箱关闭操作"""
        sandbox = self._get_sandbox()
        
        try:
            result = await sandbox.close()
            # 清理内部沙箱实例
            self._sandbox = None
            return {
                "action": "close_sandbox",
                "result": result,
                "message": "工作区清理成功"
            }
        except Exception as e:
            logger.error(f"Close sandbox action failed: {e}")
            raise SandboxError(reason=f"沙箱关闭失败", detail=str(e)) from e

    @staticmethod
    async def get_api_schema():
        """获取 API Schema"""
        base_schema = await BaseSandboxTool.get_api_schema()
        base_schema["post"]["summary"] = "close_sandbox"
        base_schema["post"]["description"] = "清理沙箱工作区，关闭沙箱连接"
        
        # 更新请求体 schema - 不需要额外参数
        base_schema["post"]["requestBody"]["content"]["application/json"]["schema"]["required"] = []
        
        # 添加示例
        base_schema["post"]["requestBody"]["content"]["application/json"]["examples"] = {
            "close_sandbox": {
                "summary": "清理工作区",
                "description": "清理沙箱工作区，关闭沙箱连接",
                "value": {
                    "server_url": "http://localhost:8080",
                    "session_id": "test_session_123"
                }
            }
        }
        
        return base_schema 