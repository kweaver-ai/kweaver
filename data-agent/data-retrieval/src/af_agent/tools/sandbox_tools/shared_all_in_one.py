import re
import os
import sys
import asyncio
import uuid
from pathlib import Path
from typing import Any, Optional, Dict, List, Union
from enum import Enum
import json

import pandas as pd
from langchain.tools import BaseTool
from langchain_core.callbacks import CallbackManagerForToolRun, AsyncCallbackManagerForToolRun
from langchain_core.pydantic_v1 import BaseModel, Field, PrivateAttr
from pandas import Timestamp
from fastapi import Body
from af_agent.logs.logger import logger
from af_agent.sessions import BaseChatHistorySession, CreateSession
from af_agent.tools.base import ToolName
from af_agent.tools.base import ToolResult, ToolMultipleResult, AFTool
from af_agent.tools.base import construct_final_answer, async_construct_final_answer
from af_agent.errors import SandboxError
from af_agent.tools.base import api_tool_decorator

from sandbox_env.sdk.shared_env import SharedEnvSandbox
from sandbox_env.sdk.base import ServerSelectorType
from af_agent.settings import get_settings
from af_agent.utils._common import run_blocking, is_valid_url

_settings = get_settings()


class SandboxActionType(str, Enum):
    """Sandbox 工具支持的操作类型"""
    CREATE_FILE = "create_file"
    READ_FILE = "read_file"
    LIST_FILES = "list_files"
    EXECUTE_CODE = "execute_code"
    EXECUTE_COMMAND = "execute_command"
    UPLOAD_FILE = "upload_file"
    DOWNLOAD_FILE = "download_file"
    GET_STATUS = "get_status"
    CLOSE_SANDBOX = "close_sandbox"


class SandboxToolInput(BaseModel):
    """Sandbox 工具的输入参数"""
    action: str = Field(
        default=SandboxActionType.EXECUTE_CODE.value,
        description="操作类型：create_file(创建文件)、read_file(读取文件)、list_files(列出文件)、execute_code(执行代码)、execute_command(执行命令)、upload_file(上传文件)、download_file(下载文件)"
    )
    content: Optional[str] = Field(
        default="",
        description="文件内容或代码内容，用于 create_file 和 execute_code 操作，如果 result_cache_key 参数不为空，则无需设置 content 参数"
    )
    filename: Optional[str] = Field(
        default="",
        description="文件名，用于 create_file、read_file、upload_file、download_file 操作，如果生成代码需要指定文件名，也使用该参数"
    )
    file_path: Optional[str] = Field(
        default="",
        description="本地文件路径，用于 upload_file 和 download_file 操作"
    )
    result_cache_key: Optional[str] = Field(
        default="",
        description="之前工具的结果缓存key，可以用于将结果写入到文件中，即 create_file 操作，有此参数则无需设置 content 参数，或者将 content 参数设置为空"
    )
    command: Optional[str] = Field(
        default="",
        description="要执行的命令，用于 execute_command 操作"
    )
    args: Optional[List[str]] = Field(
        default=[],
        description="命令参数，用于 execute_command 操作"
    )
    output_params: Optional[List[str]] = Field(
        default=[],
        description="输出参数列表，用于 execute_code 操作, 只支持 python 代码"
    )


class SandboxTool(AFTool):
    """Sandbox 工具，支持文件操作和代码执行"""
    
    name: str = ToolName.sandbox.value
    description: str = "沙箱环境工具，支持文件操作、代码执行、命令执行等功能，注意沙箱环境是受限环境，也没有网络连接，不能使用 pip 安装第三方库"
    args_schema: type[BaseModel] = SandboxToolInput
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
        
        logger.info(f"SandboxTool initialized with session_id: {self.session_id}")
        logger.info(f"SandboxTool initialized with session_type: {self.session_type}")
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
    
    @construct_final_answer
    def _run(
        self,
        action: str = SandboxActionType.EXECUTE_CODE.value,
        content: str = "",
        filename: str = "",
        file_path: str = "",
        command: str = "",
        args: List[str] = [],
        output_params: List[str] = [],
        result_cache_key: str = "",
        run_manager: Optional[CallbackManagerForToolRun] = None
    ):        
        try:
            # 创建事件循环来运行异步操作
            result = run_blocking(self._execute_action(
                action, content, filename, file_path, command, args, output_params, result_cache_key
            ))
            return result
        except Exception as e:
            logger.error(f"Sandbox operation failed: {e}")
            raise SandboxError(reason=f"沙箱操作失败: {action}", detail=str(e)) from e
    
    @async_construct_final_answer
    async def _arun(
        self,
        action: str = SandboxActionType.EXECUTE_CODE.value,
        content: str = "",
        filename: str = "",
        file_path: str = "",
        command: str = "",
        args: List[str] = [],
        output_params: List[str] = [],
        result_cache_key: str = "",
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ):
        try:
            result = await self._execute_action(
                action, content, filename, file_path, command, args, output_params, result_cache_key
            )
            if self._random_session_id:
                result["session_id"] = self.session_id
            return result
        except Exception as e:
            logger.error(f"Sandbox operation failed: {e}")
            raise SandboxError(reason=f"沙箱操作失败: {action}", detail=str(e)) from e
    
    async def _execute_action(
        self,
        action: str,
        content: str,
        filename: str,
        file_path: str,
        command: str,
        args: List[str],
        output_params: List[str],
        result_cache_key: str
    ) -> Dict[str, Any]:
        """执行具体的沙箱操作"""
        sandbox = self._get_sandbox()
        
        try:
            add_content = ""
            if action == SandboxActionType.CREATE_FILE.value:
                # 保证一定的容错性
                if not filename:
                    filename = file_path.split("/")[-1]
                if result_cache_key and self.session:
                    result = self.session.get_agent_logs(result_cache_key)
                    if result:
                        content = result.get("data", [])
                        logger.info(f"got data from result_cache_key: {result_cache_key}, content: {content}")
                        if content and isinstance(content, dict) or isinstance(content, list):
                            content = json.dumps(content)
                            add_content = f"文件内容前100字符: {content[:100]}"

                if not content or not filename:
                    raise SandboxError(reason="创建文件失败", detail="content 和 filename 参数不能为空")
                result = await sandbox.create_file(content, filename)
                message = f"文件 {filename} 创建成功，{add_content}"

                return {
                    "action": action,
                    "result": result,
                    "message": message
                }
            
            elif action == SandboxActionType.READ_FILE.value:
                if not filename:
                    filename = file_path.split("/")[-1]

                if not filename:
                    raise SandboxError(reason="读取文件失败", detail="filename 参数不能为空")
                
                # 结果格式
                # {
                #     "content": text_content,
                #     "is_binary": is_binary,
                #     "offset": next_offset,
                #     "size": file_size,
                #     "is_eof": next_offset >= file_size
                # }
                result = await sandbox.read_file(filename)

                res_full_output = {
                    "action": action,
                    "result": result,
                    "message": f"文件 {filename} 读取成功"
                }               

                res_output = {
                    "action": action,
                    "result": {
                        "content(part)": result.get("content")[:100],
                        "is_binary": result.get("is_binary"),
                        "offset": result.get("offset"),
                        "size": result.get("size"),
                        "is_eof": result.get("is_eof")
                    },
                    "message": f"文件 {filename} 读取成功，前100字符(如有): {result.get('content', '')[:100]}"
                }

                if self.session:
                    try:
                        cache_data = json.loads(result.get("content", "{}"))
                        self.session.add_agent_logs(
                            self._result_cache_key,
                            {
                                "data": cache_data,
                            }
                        )
                        res_output["result_cache_key"] = self._result_cache_key
                    except Exception as e:
                        logger.error(f"Error adding agent logs: {e}")

                return {
                    "output": res_output,
                    "full_output": res_full_output
                }
            
            elif action == SandboxActionType.LIST_FILES.value:
                result = await sandbox.list_files()
                return {
                    "action": action,
                    "result": result,
                    "message": "文件列表获取成功"
                }
            
            elif action == SandboxActionType.EXECUTE_CODE.value:
                if not filename:
                    filename = file_path.split("/")[-1]

                if not content:
                    raise SandboxError(reason="执行代码失败", detail="content 参数不能为空")

                result = await sandbox.execute_code(
                    content, 
                    filename=filename if filename else None,
                    args=args if args else None,
                    output_params=output_params if output_params else None
                )
                
                # 检查执行结果，处理异常情况
                self._check_execution_result(result, "代码执行")
                
                return {
                    "action": action,
                    "result": result,
                    "message": "代码执行成功"
                }
            
            elif action == SandboxActionType.EXECUTE_COMMAND.value:
                if not command:
                    raise SandboxError(reason="执行命令失败", detail="command 参数不能为空")
                result = await sandbox.execute(command, *args)
                
                # 检查执行结果，处理异常情况
                self._check_execution_result(result, f"命令 {command} 执行")
                
                return {
                    "action": action,
                    "result": result,
                    "message": f"命令 {command} 执行成功"
                }
            
            elif action == SandboxActionType.UPLOAD_FILE.value:
                if not file_path:
                    raise SandboxError(reason="上传文件失败", detail="file_path 参数不能为空")
                if not os.path.exists(file_path):
                    raise SandboxError(reason="上传文件失败", detail=f"文件 {file_path} 不存在")
                result = await sandbox.upload_file(Path(file_path))
                return {
                    "action": action,
                    "result": result,
                    "message": f"文件 {file_path} 上传成功"
                }
            
            elif action == SandboxActionType.DOWNLOAD_FILE.value:
                if not filename or not file_path:
                    raise SandboxError(reason="下载文件失败", detail="filename 和 file_path 参数不能为空")
                await sandbox.download_file(filename, Path(file_path))
                return {
                    "action": action,
                    "result": {"local_path": file_path},
                    "message": f"文件 {filename} 下载到 {file_path} 成功"
                }
            
            elif action == SandboxActionType.GET_STATUS.value:
                result = await sandbox.get_status()
                return {
                    "action": action,
                    "result": result,
                    "message": "沙箱状态获取成功"
                }
            
            elif action == SandboxActionType.CLOSE_SANDBOX.value:
                result = await sandbox.close()
                return {
                    "action": action,
                    "result": result,
                    "message": "工作区清理成功"
                }
            
            else:
                raise SandboxError(reason="不支持的操作", detail=f"未知的操作类型: {action}")
        
        except Exception as e:
            logger.error(f"Sandbox action {action} failed: {e}")
            raise SandboxError(reason=f"沙箱操作失败: {action}", detail=str(e)) from e

    
    @staticmethod
    async def get_api_schema():
        """获取 API Schema"""
        return {
            "post": {
                "summary": ToolName.sandbox.value,
                "description": "沙箱环境工具，提供一个 Linux 虚拟工作区，包含 Python3 环境，支持文件操作、代码执行、命令执行等功能，注意沙箱环境是受限环境，也没有网络连接，不能使用 pip 安装第三方库。支持 pandas 等数据分析库，可以直接使用。运行代码时，需要通过 print 输出结果，或者设置输出变量 output_params 参数，返回结果",
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
                                    "session_type": {
                                        "type": "string",
                                        "description": "可选，会话缓存的类型，可选 redis 和 in_memory，为空代表不使用缓存",
                                        "default": ""
                                    },
                                    "action": {
                                        "type": "string",
                                        "enum": [
                                            "create_file", "read_file", "list_files", 
                                            "execute_code", "execute_command", 
                                            "upload_file", "download_file", "get_status",
                                            "close_sandbox"
                                        ],
                                        "description": "操作类型，create_file: 创建文件, read_file: 读取文件, list_files: 列出文件, execute_code: 执行代码, execute_command: 执行命令, upload_file: 上传文件, download_file: 下载文件, get_status: 获取状态, close_sandbox: 清理工作区",
                                        "default": "execute_code"
                                    },
                                    "content": {
                                        "type": "string",
                                        "description": "文件内容或代码内容，用于 create_file 和 execute_code 操作，如果 create_file 时 result_cache_key 参数不为空，则无需设置 content 参数"
                                    },
                                    "filename": {
                                        "type": "string",
                                        "description": "文件名, 用于 create_file、read_file、upload_file、download_file 操作，如果生成代码需要指定文件名，也使用该参数"
                                    },
                                    "file_path": {
                                        "type": "string",
                                        "description": "本地文件路径, 只用于 upload_file 和 download_file 操作"
                                    },
                                    "result_cache_key": {
                                        "type": "string",
                                        "description": "之前工具的结果缓存key，可以用于将结果写入到文件中，即 create_file 操作，有此参数则无需设置 content 参数，或者将 content 参数设置为空"
                                    },
                                    "command": {
                                        "type": "string",
                                        "description": "要执行的命令"
                                    },
                                    "args": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                        "description": "命令参数"
                                    },
                                    "output_params": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                        "description": "写 python 代码时，需要返回的参数列表，用于 execute_code 操作"
                                    },
                                    "timeout": {
                                        "type": "number",
                                        "description": "超时时间",
                                        "default": 120
                                    }
                                },
                                "required": ["action"]
                            },
                            "examples": {
                                "execute_code": {
                                    "summary": "执行 Python 代码",
                                    "description": "在沙箱环境中执行 Python 代码",
                                    "value": {
                                        "action": "execute_code",
                                        "content": "print('Hello World')\nx = 10\ny = 20\nresult = x + y\nprint(f'{x} + {y} = {result}')",
                                        "filename": "hello.py",
                                        "output_params": ["result"],
                                        "session_id": "test_session_123"
                                    }
                                },
                                "create_file": {
                                    "summary": "创建文件",
                                    "description": "在沙箱环境中创建新文件",
                                    "value": {
                                        "action": "create_file",
                                        "content": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\n# 计算前10个斐波那契数\nfor i in range(10):\n    print(f'F({i}) = {fibonacci(i)}')",
                                        "filename": "fibonacci.py",
                                        "session_id": "test_session_123",
                                        "result_cache_key": "1323-123123-123123"
                                    }
                                },
                                "read_file": {
                                    "summary": "读取文件",
                                    "description": "读取沙箱环境中的文件内容",
                                    "value": {
                                        "action": "read_file",
                                        "filename": "fibonacci.py",
                                        "session_id": "test_session_123"
                                    }
                                },
                                "list_files": {
                                    "summary": "列出文件",
                                    "description": "列出沙箱环境中的所有文件",
                                    "value": {
                                        "action": "list_files",
                                        "session_id": "test_session_123"
                                    }
                                },
                                "execute_command": {
                                    "summary": "执行命令",
                                    "description": "在沙箱环境中执行系统命令",
                                    "value": {
                                        "action": "execute_command",
                                        "command": "ls",
                                        "args": ["-la"],
                                        "session_id": "test_session_123"
                                    }
                                },
                                "data_analysis": {
                                    "summary": "数据分析示例",
                                    "description": "使用 pandas 进行数据分析",
                                    "value": {
                                        "action": "execute_code",
                                        "content": "import pandas as pd\nimport numpy as np\n\n# 创建示例数据\ndata = {\n    'name': ['Alice', 'Bob', 'Charlie'],\n    'age': [25, 30, 35],\n    'salary': [50000, 60000, 70000]\n}\ndf = pd.DataFrame(data)\n\n# 计算统计信息\nstats = {\n    'mean_age': df['age'].mean(),\n    'mean_salary': df['salary'].mean(),\n    'total_records': len(df)\n}\n\nprint('数据统计:')\nfor key, value in stats.items():\n    print(f'{key}: {value}')\n\nresult = stats",
                                        "filename": "data_analysis.py",
                                        "output_params": ["result", "df"],
                                        "session_id": "test_session_123"
                                    }
                                },
                                "upload_file": {
                                    "summary": "上传文件",
                                    "description": "将本地文件上传到沙箱环境",
                                    "value": {
                                        "action": "upload_file",
                                        "file_path": "/path/to/local/file.txt",
                                        "session_id": "test_session_123"
                                    }
                                },
                                "download_file": {
                                    "summary": "下载文件",
                                    "description": "从沙箱环境下载文件到本地",
                                    "value": {
                                        "action": "download_file",
                                        "filename": "remote_file.txt",
                                        "file_path": "/path/to/local/download.txt",
                                        "session_id": "test_session_123"
                                    }
                                },
                                "get_status": {
                                    "summary": "获取状态",
                                    "description": "获取沙箱环境的当前状态",
                                    "value": {
                                        "action": "get_status",
                                        "session_id": "test_session_123"
                                    }
                                },
                                "close_sandbox": {
                                    "summary": "清理工作区",
                                    "description": "清理沙箱工作区",
                                    "value": {
                                        "action": "close_sandbox",
                                        "session_id": "test_session_123"
                                    }
                                },
                                "complex_workflow": {
                                    "summary": "复杂工作流示例",
                                    "description": "演示完整的工作流程：创建文件 -> 执行代码 -> 读取结果",
                                    "value": {
                                        "action": "execute_code",
                                        "content": "import json\nimport os\n\n# 创建配置文件\nconfig = {\n    'app_name': 'Sandbox Demo',\n    'version': '1.0.0',\n    'features': ['file_ops', 'code_exec', 'data_analysis']\n}\n\nwith open('config.json', 'w') as f:\n    json.dump(config, f, indent=2)\n\n# 创建工具函数\nutils_code = '''\ndef load_config(filename):\n    with open(filename, 'r') as f:\n        return json.load(f)\n\ndef save_result(data, filename):\n    with open(filename, 'w') as f:\n        json.dump(data, f, indent=2)\n'''\n\nwith open('utils.py', 'w') as f:\n    f.write(utils_code)\n\n# 执行主程序\nfrom utils import load_config, save_result\n\nconfig = load_config('config.json')\nprint(f'应用名称: {config[\"app_name\"]}')\nprint(f'版本: {config[\"version\"]}')\n\n# 保存结果\nresult = {\n    'status': 'success',\n    'config': config,\n    'files_created': ['config.json', 'utils.py']\n}\nsave_result(result, 'output.json')\nprint('工作流执行完成')\n\nworkflow_result = result",
                                        "filename": "workflow.py",
                                        "output_params": ["workflow_result"],
                                        "session_id": "test_session_123"
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
                                        "action": {
                                            "type": "string",
                                            "description": "执行的操作类型"
                                        },
                                        "result": {
                                            "description": "操作结果"
                                        },
                                        "message": {
                                            "type": "string",
                                            "description": "操作状态消息"
                                        }
                                    }
                                },
                                "examples": {
                                    "execute_code_success": {
                                        "summary": "代码执行成功",
                                        "value": {
                                            "action": "execute_code",
                                            "result": {
                                                "output": "Hello World\n10 + 20 = 30",
                                                "variables": {
                                                    "result": 30
                                                }
                                            },
                                            "message": "代码执行成功"
                                        }
                                    },
                                    "create_file_success": {
                                        "summary": "文件创建成功",
                                        "value": {
                                            "action": "create_file",
                                            "result": {
                                                "filename": "hello.py",
                                                "size": 1024
                                            },
                                            "message": "文件 hello.py 创建成功"
                                        }
                                    },
                                    "list_files_success": {
                                        "summary": "文件列表获取成功",
                                        "value": {
                                            "action": "list_files",
                                            "result": [
                                                "hello.py",
                                                "fibonacci.py",
                                                "config.json"
                                            ],
                                            "message": "文件列表获取成功"
                                        }
                                    },
                                    "error_response": {
                                        "summary": "操作失败",
                                        "value": {
                                            "action": "execute_code",
                                            "error": "执行代码失败",
                                            "detail": "content 参数不能为空",
                                            "message": "沙箱操作失败: execute_code"
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
    
    @classmethod
    @api_tool_decorator
    async def as_async_api_cls(
        cls,
        params: dict = Body(...),
        stream: bool = False,
        mode: str = "http"
    ):
        server_url = params.get("server_url", _settings.SANDBOX_URL)
        session_id = params.get("session_id", "")
        session_type = params.get("session_type", "")
        logger.info(f"as_async_api_cls params: {params}")

        tool = cls(server_url=server_url, session_id=session_id, session_type=session_type)

        # 提取工具参数
        action = params.get("action", SandboxActionType.EXECUTE_CODE.value)
        content = params.get("content", "")
        filename = params.get("filename", "")
        file_path = params.get("file_path", "")
        command = params.get("command", "")
        args = params.get("args", [])
        output_params = params.get("output_params", [])
        result_cache_key = params.get("result_cache_key", "")

        # invoke tool
        res = await tool.ainvoke({
            "action": action,
            "content": content,
            "filename": filename,
            "file_path": file_path,
            "command": command,
            "args": args,
            "output_params": output_params,
            "result_cache_key": result_cache_key
        })
        return res
