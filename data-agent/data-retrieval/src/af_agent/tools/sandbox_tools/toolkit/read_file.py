import asyncio
import json
import traceback
from typing import Optional
from langchain_core.callbacks import CallbackManagerForToolRun, AsyncCallbackManagerForToolRun
from langchain_core.pydantic_v1 import BaseModel, Field

from af_agent.logs.logger import logger
from af_agent.tools.base import construct_final_answer, async_construct_final_answer
from af_agent.errors import SandboxError
from af_agent.tools.sandbox_tools.toolkit.base_sandbox_tool import BaseSandboxTool, BaseSandboxToolInput
from af_agent.utils._common import run_blocking


class ReadFileInput(BaseSandboxToolInput):
    """读取文件工具的输入参数"""
    filename: str = Field(
        description="要读取的文件名"
    )

    session_type: Optional[str] = Field(
        default="redis",
        description="会话类型, 可选值为: redis, in_memory, 默认值为 redis"
    )

    # result_cache_key: Optional[str] = Field(
    #     default="",
    #     description="从其他工具的缓存 key 读取文件，用于缓存读取的文件内容"
    # )


class ReadFileTool(BaseSandboxTool):
    """读取文件工具，读取沙箱环境中的文件内容"""
    
    name: str = "read_file"
    description: str = "读取沙箱环境中的文件内容，支持文本文件和二进制文件"
    args_schema: type[BaseSandboxToolInput] = ReadFileInput

    @construct_final_answer
    def _run(
        self,
        filename: str,
        buffer_size: int = 4096,
        # result_cache_key: str = "",
        run_manager: Optional[CallbackManagerForToolRun] = None
    ):
        try:
            # 创建事件循环来运行异步操作
            result = run_blocking(self._read_file(filename, buffer_size))
            return result
        except Exception as e:
            logger.error(f"Read file failed: {e}")
            raise SandboxError(reason="读取文件失败", detail=str(e)) from e
    
    @async_construct_final_answer
    async def _arun(
        self,
        filename: str,
        title: str = "",
        buffer_size: int = 4096,
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ):
        try:
            result = await self._read_file(filename, buffer_size)
            if self._random_session_id:
                result["session_id"] = self.session_id

            if title:
                result["title"] = title
            else:
                result["title"] = result["output"]["message"]

            return result
        except Exception as e:
            logger.error(f"Read file failed: {e}")
            raise SandboxError(reason="读取文件失败", detail=str(e)) from e
    
    async def _read_file(
        self,
        filename: str,
        buffer_size: int = 4096
    ) -> dict:
        """执行具体的文件读取操作"""
        if not filename:
            raise SandboxError(reason="读取文件失败", detail="filename 参数不能为空")

        sandbox = self._get_sandbox()
        
        try:
            # 循环读取文件，直到读取到文件末尾，将结果拼接起来
            iter_times = 1
                        
            # 如果迭代次数过多，要么文件过大，要么出bug了，单个文件不超过50MB， 默认一次读 4KB
            offset = 0
            result = {"content": "", "is_eof": False, "size": 0}
            while True or iter_times > 1024 * 10:
                part_result = await sandbox.read_file(filename, offset=offset, buffer_size=buffer_size)
                if "is_eof" not in part_result or "offset" not in part_result or "size" not in part_result:
                    raise SandboxError(reason="读取文件失败", detail="返回参数中缺少必要的信息")

                if part_result["size"] >= 50 * 1024 * 1024:
                    raise SandboxError(reason="读取文件失败", detail="文件过大，单个文件不超过50MB")
            
                offset = part_result["offset"]
                size = part_result["size"]

                logger.info(f"文件大小: {size} bytes, 已读取: {offset} bytes, remain: {size - offset} bytes")
                
                result["content"] += part_result["content"]
                result["is_eof"] = part_result["is_eof"]

                iter_times += 1

                eof =  part_result.get("is_eof", True)
                if eof:
                    break


            
            # res_full_output = {
            #     "action": "read_file",
            #     "result": {
            #         "size": result['size'],
            #     },
            #     "message": f"文件 {filename} 读取成功"
            # }               

            res_output = {
                "action": "read_file",
                "result": {
                    "content(head100)": result["content"][:100],
                    "is_binary": result.get("is_binary", False),
                    "size": size
                },
                "message": f"文件 {filename} 读取成功，前100字符(如有): {result.get('content', '')[:100]}"
            }

            # 如果提供了缓存key，则缓存结果
            if self.session:
                try:
                    cache_data = json.loads(result["content"])
                    self.session.add_agent_logs(
                        self._result_cache_key,
                        {
                            "data": cache_data,
                        }
                    )
                    res_output["result_cache_key"] = self._result_cache_key
                except Exception as e:
                    traceback.format_exc()
                    logger.warning(f"Load to json failed: {str(e)}")

            return {
                "output": res_output
            }
        except Exception as e:
            logger.error(f"Read file action failed: {e}")
            raise SandboxError(reason=f"文件读取失败", detail=str(e)) from e

    @staticmethod
    async def get_api_schema():
        """获取 API Schema"""
        base_schema = await BaseSandboxTool.get_api_schema()
        base_schema["post"]["summary"] = "read_file"
        base_schema["post"]["description"] = "读取沙箱环境中的文件内容，支持文本文件和二进制文件"
        
        # 更新请求体 schema，添加工具特定参数
        base_schema["post"]["requestBody"]["content"]["application/json"]["schema"]["properties"].update({
            "filename": {
                "type": "string",
                "description": "要读取的文件名"
            },
            "session_type": {
                "type": "string",
                "description": "会话类型, 可选值为: redis, in_memory, 默认值为 redis"
            },
            # "result_cache_key": {
            #     "type": "string",
            #     "description": "结果缓存key，用于缓存读取的文件内容"
            # }
        })
        base_schema["post"]["requestBody"]["content"]["application/json"]["schema"]["required"] = ["filename"]
        
        # 添加示例
        base_schema["post"]["requestBody"]["content"]["application/json"]["examples"] = {
            "read_python_file": {
                "summary": "读取 Python 文件",
                "description": "读取 Python 源代码文件",
                "value": {
                    "filename": "hello.py",
                    "server_url": "http://localhost:8080",
                    "session_id": "test_session_123"
                }
            }
        }
        
        return base_schema 