import asyncio
import uuid
from typing import Optional, Dict, Any
from langchain_core.pydantic_v1 import PrivateAttr, BaseModel, Field
from fastapi import Body
from data_retrieval.logs.logger import logger
from data_retrieval.sessions import BaseChatHistorySession, CreateSession
from data_retrieval.tools.base import AFTool
from data_retrieval.tools.base import api_tool_decorator
from data_retrieval.settings import get_settings
from sandbox_env.sdk.shared_env import SharedEnvSandbox
from sandbox_env.sdk.base import ServerSelectorType
from data_retrieval.errors import SandboxError
from data_retrieval.settings import get_settings
from data_retrieval.utils._common import is_valid_url


_settings = get_settings()


class BaseSandboxToolInput(BaseModel):
    """基础沙箱工具输入参数"""
    title: str = Field(
        default="",
        description="对于当前操作的简单描述，便于用户理解"
    )


class BaseSandboxTool(AFTool):
    """基础沙箱工具类，提供共享的沙箱管理功能"""
    
    session_id: str = ""
    server_url: str = _settings.SANDBOX_URL
    session: Optional[BaseChatHistorySession] = None
    session_type: Optional[str] = "redis"

    _sandbox: Optional[SharedEnvSandbox] = PrivateAttr(None)
    _selector_type: str = PrivateAttr(ServerSelectorType.STATIC.value)
    _random_session_id: bool = PrivateAttr(False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.session_id:
            self.session_id = str(uuid.uuid4())
            self._random_session_id = True
            logger.info(f"Randomly generated session_id: {self.session_id}")
        
        logger.info(f"BaseSandboxTool initialized with session_id: {self.session_id}")
        logger.info(f"BaseSandboxTool initialized with session_type: {self.session_type}")
        self.session = CreateSession(
            self.session_type
        )

        if not is_valid_url(self.server_url):
            self.server_url = _settings.SANDBOX_URL
            logger.warning(f"Invalid server URL: {self.server_url}, using default URL: {_settings.SANDBOX_URL}")
    
    def _get_sandbox(self) -> SharedEnvSandbox:
        """获取或创建沙箱实例"""
        if self._sandbox is None:
            self._sandbox = SharedEnvSandbox(
                session_id=self.session_id,
                servers=[self.server_url],
                selector_type=self._selector_type
            )
        return self._sandbox
    
    def _check_execution_result(self, result: dict, operation_name: str):
        """检查执行结果，判断是否有错误"""
        if not isinstance(result, dict):
            return
        
        # 检查 stderr
        stderr = result.get("stderr", "")
        if stderr and stderr.strip():
            logger.warning(f"{operation_name} 有错误输出: {stderr}")
            # 如果 stderr 不为空，记录警告但不抛出异常，因为有些警告不影响执行
        
        # 检查 return_code
        return_code = result.get("return_code", 0)
        if return_code != 0:
            error_msg = f"{operation_name} 返回非零退出码: {return_code}"
            if stderr:
                error_msg += f", 错误信息: {stderr}"
            logger.error(error_msg)
            raise SandboxError(
                reason=f"{operation_name}失败", 
                detail=f"退出码: {return_code}, 错误信息: {stderr}"
            )
        
        # 检查是否有其他错误信息
        error = result.get("error")
        if error:
            logger.error(f"{operation_name} 返回错误: {error}")
            raise SandboxError(
                reason=f"{operation_name}失败", 
                detail=str(error)
            )

    @classmethod
    @api_tool_decorator
    async def as_async_api_cls(
        cls,
        params: dict = Body(...),
        stream: bool = False,
        mode: str = "http"
    ):
        """异步API调用方法，由子类继承使用"""
        server_url = params.get("server_url", _settings.SANDBOX_URL)
        session_id = params.get("session_id", "")
        session_type = params.get("session_type", "redis")
        logger.info(f"as_async_api_cls params: {params}")

        tool = cls(server_url=server_url, session_id=session_id, session_type=session_type)

        # 移除通用参数，保留工具特定参数
        tool_params = {k: v for k, v in params.items() 
                      if k not in ["server_url", "session_id", "session_type"]}

        # invoke tool
        res = await tool.ainvoke(tool_params)
        return res

    @staticmethod
    async def get_api_schema():
        """获取API Schema的基类方法，包含共同参数"""
        return {
            "post": {
                "summary": "Base Sandbox Tool",
                "description": "基础沙箱工具，子类应该重写此方法提供具体的API Schema",
                "parameters": [
                    {
                        "name": "stream",
                        "in": "query",
                        "description": "是否流式返回",
                        "schema": {
                            "type": "boolean",
                            "default": False
                        },
                    },
                    {
                        "name": "mode",
                        "in": "query",
                        "description": "请求模式",
                        "schema": {
                            "type": "string",
                            "enum": ["http", "sse"],
                            "default": "http"
                        },
                    }
                ],
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "server_url": {
                                        "type": "string",
                                        "description": "可选，沙箱服务器URL，默认使用配置文件中的 SANDBOX_URL",
                                        "default": _settings.SANDBOX_URL
                                    },
                                    "session_id": {
                                        "type": "string",
                                        "description": "沙箱会话ID"
                                    },
                                    "timeout": {
                                        "type": "number",
                                        "description": "超时时间",
                                        "default": 120
                                    },
                                    "title": {
                                        "type": "string",
                                        "description": "对于当前操作的简单描述，便于用户理解"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful operation",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "result": {
                                            "type": "object",
                                            "description": "操作结果, 包含标准输出、标准错误输出、返回值"
                                        },
                                        "message": {
                                            "type": "string",
                                            "description": "操作状态消息"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "400": {
                        "description": "Bad request",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "error": {
                                            "type": "string",
                                            "description": "错误信息"
                                        },
                                        "detail": {
                                            "type": "string",
                                            "description": "详细错误信息"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
