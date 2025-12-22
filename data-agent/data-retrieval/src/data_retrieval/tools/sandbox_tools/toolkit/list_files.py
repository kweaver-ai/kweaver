import asyncio
from typing import Optional
from langchain_core.callbacks import CallbackManagerForToolRun, AsyncCallbackManagerForToolRun
from langchain_core.pydantic_v1 import BaseModel

from data_retrieval.logs.logger import logger
from data_retrieval.tools.base import construct_final_answer, async_construct_final_answer
from data_retrieval.errors import SandboxError
from data_retrieval.tools.sandbox_tools.toolkit.base_sandbox_tool import BaseSandboxTool, BaseSandboxToolInput
from data_retrieval.utils._common import run_blocking


class ListFilesInput(BaseSandboxToolInput):
    """列出文件工具的输入参数"""
    # 目前不需要额外参数，但保留结构以便未来扩展
    pass


class ListFilesTool(BaseSandboxTool):
    """列出文件工具，列出沙箱环境中的所有文件"""
    
    name: str = "list_files"
    description: str = "列出沙箱环境中的所有文件和目录"
    args_schema: type[BaseSandboxToolInput] = ListFilesInput

    @construct_final_answer
    def _run(
        self,
        run_manager: Optional[CallbackManagerForToolRun] = None
    ):
        try:
            # 创建事件循环来运行异步操作
            result = run_blocking(self._list_files())
            return result
        except Exception as e:
            logger.error(f"List files failed: {e}")
            raise SandboxError(reason="列出文件失败", detail=str(e)) from e
    
    @async_construct_final_answer
    async def _arun(
        self,
        title: str = "",
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ):
        try:
            result = await self._list_files()
            if self._random_session_id:
                result["session_id"] = self.session_id

            if title:
                result["title"] = title
            else:
                result["title"] = result["message"]

            return result
        except Exception as e:
            logger.error(f"List files failed: {e}")
            raise SandboxError(reason="列出文件失败", detail=str(e)) from e
    
    async def _list_files(self) -> dict:
        """执行具体的文件列表操作"""
        sandbox = self._get_sandbox()
        
        try:
            result = await sandbox.list_files()
            return {
                "action": "list_files",
                "result": result,
                "message": "文件列表获取成功"
            }
        except Exception as e:
            logger.error(f"List files action failed: {e}")
            raise SandboxError(reason=f"文件列表获取失败", detail=str(e)) from e

    @staticmethod
    async def get_api_schema():
        """获取 API Schema"""
        base_schema = await BaseSandboxTool.get_api_schema()
        base_schema["post"]["summary"] = "list_files"
        base_schema["post"]["description"] = "列出沙箱环境中的所有文件和目录"
        
        # 更新请求体 schema - 不需要额外参数
        base_schema["post"]["requestBody"]["content"]["application/json"]["schema"]["required"] = []
        
        # 添加示例
        base_schema["post"]["requestBody"]["content"]["application/json"]["examples"] = {
            "list_all_files": {
                "summary": "列出所有文件",
                "description": "列出沙箱环境中的所有文件和目录",
                "value": {
                    "server_url": "http://localhost:8080",
                    "session_id": "test_session_123"
                }
            }
        }
        
        return base_schema 