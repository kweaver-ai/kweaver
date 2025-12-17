import asyncio
from typing import Optional, List
from langchain_core.callbacks import CallbackManagerForToolRun, AsyncCallbackManagerForToolRun
from langchain_core.pydantic_v1 import BaseModel, Field

from af_agent.logs.logger import logger
from af_agent.tools.base import construct_final_answer, async_construct_final_answer
from af_agent.errors import SandboxError
from af_agent.tools.sandbox_tools.toolkit.base_sandbox_tool import BaseSandboxTool, BaseSandboxToolInput
from af_agent.utils._common import run_blocking


class ExecuteCommandInput(BaseSandboxToolInput):
    """执行命令工具的输入参数"""
    command: str = Field(
        description="要执行的系统命令"
    )
    args: Optional[List[str]] = Field(
        default=[],
        description="命令参数列表"
    )


class ExecuteCommandTool(BaseSandboxTool):
    """执行命令工具，在沙箱环境中执行系统命令"""
    
    name: str = "execute_command"
    description: str = "在沙箱环境中执行系统命令，如 ls、cat、grep 等 Linux 命令"
    args_schema: type[BaseSandboxToolInput] = ExecuteCommandInput

    @construct_final_answer
    def _run(
        self,
        command: str,
        args: List[str] = [],
        run_manager: Optional[CallbackManagerForToolRun] = None
    ):
        try:
            # 创建事件循环来运行异步操作
            result = run_blocking(self._execute_command(command, args))
            return result
        except Exception as e:
            logger.error(f"Execute command failed: {e}")
            raise SandboxError(reason="执行命令失败", detail=str(e)) from e
    
    @async_construct_final_answer
    async def _arun(
        self,
        command: str,
        args: List[str] = [],
        title: str = "",
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ):
        try:
            result = await self._execute_command(command, args)
            if self._random_session_id:
                result["session_id"] = self.session_id

            if title:
                result["title"] = title
            else:
                result["title"] = result["message"]

            return result
        except Exception as e:
            logger.error(f"Execute command failed: {e}")
            raise SandboxError(reason="执行命令失败", detail=str(e)) from e
    
    async def _execute_command(
        self,
        command: str,
        args: List[str]
    ) -> dict:
        """执行具体的命令执行操作"""
        if not command:
            raise SandboxError(reason="执行命令失败", detail="command 参数不能为空")

        sandbox = self._get_sandbox()
        
        try:
            result = await sandbox.execute(command, *args)
            
            # 检查执行结果，处理异常情况
            self._check_execution_result(result, f"命令 {command} 执行")
            
            return {
                "action": "execute_command",
                "result": result,
                "message": f"命令 {command} 执行成功"
            }
        except Exception as e:
            logger.error(f"Execute command action failed: {e}")
            raise SandboxError(reason=f"命令执行失败", detail=str(e)) from e
    


    @staticmethod
    async def get_api_schema():
        """获取 API Schema"""
        base_schema = await BaseSandboxTool.get_api_schema()
        base_schema["post"]["summary"] = "execute_command"
        base_schema["post"]["description"] = "在沙箱环境中执行系统命令，如 ls、cat、grep 等 Linux 命令"
        
        # 更新请求体 schema，添加工具特定参数
        base_schema["post"]["requestBody"]["content"]["application/json"]["schema"]["properties"].update({
            "command": {
                "type": "string",
                "description": "要执行的系统命令"
            },
            "args": {
                "type": "array",
                "items": {"type": "string"},
                "description": "命令参数列表"
            }
        })
        base_schema["post"]["requestBody"]["content"]["application/json"]["schema"]["required"] = ["command"]
        
        # 添加示例
        base_schema["post"]["requestBody"]["content"]["application/json"]["examples"] = {
            "list_files": {
                "summary": "列出文件",
                "description": "列出当前目录下的所有文件",
                "value": {
                    "command": "ls",
                    "args": ["-la"],
                    "server_url": "http://localhost:8080",
                    "session_id": "test_session_123"
                }
            },
            "view_file": {
                "summary": "查看文件内容",
                "description": "查看指定文件的内容",
                "value": {
                    "command": "cat",
                    "args": ["hello.py"],
                    "server_url": "http://localhost:8080",
                    "session_id": "test_session_123"
                }
            },
            "search_content": {
                "summary": "搜索内容",
                "description": "在文件中搜索指定内容",
                "value": {
                    "command": "grep",
                    "args": ["-n", "print", "*.py"],
                    "server_url": "http://localhost:8080",
                    "session_id": "test_session_123"
                }
            }
        }
        
        return base_schema 