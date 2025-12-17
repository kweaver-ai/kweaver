import asyncio
import json
from typing import Optional
from langchain_core.callbacks import CallbackManagerForToolRun, AsyncCallbackManagerForToolRun
from langchain_core.pydantic_v1 import Field

from af_agent.logs.logger import logger
from af_agent.tools.base import construct_final_answer, async_construct_final_answer
from af_agent.errors import SandboxError
from af_agent.tools.sandbox_tools.toolkit.base_sandbox_tool import BaseSandboxTool, BaseSandboxToolInput
from af_agent.utils._common import run_blocking


class CreateFileInput(BaseSandboxToolInput):
    """创建文件工具的输入参数"""
    content: str = Field(
        description="文件内容, 如果 result_cache_key 参数不为空，则无需设置该参数",
        default=""
    )
    filename: str = Field(
        description="要创建的文件名",
    )

    session_type: Optional[str] = Field(
        default="redis",
        description="会话类型, 可选值为: redis, in_memory, 默认值为 redis"
    )

    result_cache_key: Optional[str] = Field(
        default="",
        description="之前工具的结果缓存key，可以将其他工具的结果写入到文件中，有此参数则无需设置 content 参数"
    )


class CreateFileTool(BaseSandboxTool):
    """创建文件工具，在沙箱环境中创建新文件"""
    
    name: str = "create_file"
    description: str = "在沙箱环境中创建新文件，支持文本内容或从缓存中获取内容"
    args_schema: type[BaseSandboxToolInput] = CreateFileInput

    @construct_final_answer
    def _run(
        self,
        content: str,
        filename: str,
        title: str = "",
        result_cache_key: str = "",
        run_manager: Optional[CallbackManagerForToolRun] = None
    ):
        try:
            # 创建事件循环来运行异步操作
            result = run_blocking(self._create_file(content, filename, result_cache_key))
            return result
        except Exception as e:
            logger.error(f"Create file failed: {e}")
            raise SandboxError(reason="创建文件失败", detail=str(e)) from e
    
    @async_construct_final_answer
    async def _arun(
        self,
        filename: str,
        content: Optional[str] = "",
        result_cache_key: Optional[str] = "",
        title: str = "",
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ):
        try:
            result = await self._create_file(filename=filename, content=content, result_cache_key=result_cache_key)
            if self._random_session_id:
                result["session_id"] = self.session_id
            
            if title:
                result["title"] = title
            else:
                result["title"] = result["message"]

            return result
        except Exception as e:
            logger.error(f"Create file failed: {e}")
            raise SandboxError(reason="创建文件失败", detail=str(e)) from e
    
    async def _create_file(
        self,
        filename: str,
        content: Optional[str] = "",
        result_cache_key: Optional[str] = ""
    ) -> dict:
        """执行具体的文件创建操作"""
        if not filename:
            raise SandboxError(reason="创建文件失败", detail="filename 参数不能为空")

        # 处理缓存内容
        add_content = ""
        if result_cache_key and self.session:
            result = self.session.get_agent_logs(result_cache_key)
            if result:
                content = result.get("data", [])
                logger.info(f"got data from result_cache_key: {result_cache_key}, content: {content}")
                if content and isinstance(content, dict) or isinstance(content, list):
                    content = json.dumps(content, ensure_ascii=False)
                    # content = json.dumps(content)

        if not content:
            raise SandboxError(reason="创建文件失败", detail="文件内容不能为空")

        sandbox = self._get_sandbox()
        
        try:
            result = await sandbox.create_file(content, filename)
            
            message = f"文件内容前100字符: {content[:100]}"
            
            return {
                "action": "create_file",
                "result": result,
                "message": message
            }
        except Exception as e:
            logger.error(f"Create file action failed: {e}")
            raise SandboxError(reason=f"文件创建失败", detail=str(e)) from e

    @staticmethod
    async def get_api_schema():
        """获取 API Schema"""
        base_schema = await BaseSandboxTool.get_api_schema()
        base_schema["post"]["summary"] = "create_file"
        base_schema["post"]["description"] = "在沙箱环境中创建新文件，支持文本内容或从缓存中获取内容"
        
        # 更新请求体 schema，添加工具特定参数
        base_schema["post"]["requestBody"]["content"]["application/json"]["schema"]["properties"].update({
            "content": {
                "type": "string",
                "description": "文件内容, 如果 result_cache_key 参数不为空，则无需设置该参数"
            },
            "filename": {
                "type": "string",
                "description": "要创建的文件名"
            },
            "session_type": {
                "type": "string",
                "description": "会话类型, 可选值为: redis, in_memory, 默认值为 redis"
            },
            "result_cache_key": {
                "type": "string",
                "description": "之前工具的结果缓存key，可以用于将结果写入到文件中，有此参数则无需设置 content 参数"
            }
        })
        base_schema["post"]["requestBody"]["content"]["application/json"]["schema"]["required"] = ["filename"]
        
        # 添加示例
        base_schema["post"]["requestBody"]["content"]["application/json"]["examples"] = {
            "create_python_file": {
                "summary": "创建 Python 文件",
                "description": "创建包含 Python 代码的文件",
                "value": {
                    "content": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\n# 计算前10个斐波那契数\nfor i in range(10):\n    print(f'F({i}) = {fibonacci(i)}')",
                    "filename": "fibonacci.py",
                    "server_url": "http://localhost:8080",
                    "session_id": "test_session_123"
                }
            },
            "create_from_cache": {
                "summary": "从缓存创建文件",
                "description": "使用缓存中的数据创建文件",
                "value": {
                    "filename": "data.json",
                    "result_cache_key": "cached_data_123",
                    "server_url": "http://localhost:8080",
                    "session_id": "test_session_123"
                }
            }
        }
        
        return base_schema 