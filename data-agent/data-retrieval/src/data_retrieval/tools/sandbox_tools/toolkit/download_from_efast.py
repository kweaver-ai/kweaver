import asyncio
from typing import Optional, List, Dict, Any
from langchain_core.callbacks import CallbackManagerForToolRun, AsyncCallbackManagerForToolRun
from langchain_core.pydantic_v1 import Field

from data_retrieval.logs.logger import logger
from data_retrieval.tools.base import ToolName
from data_retrieval.tools.base import construct_final_answer, async_construct_final_answer
from data_retrieval.errors import SandboxError
from data_retrieval.tools.sandbox_tools.toolkit.base_sandbox_tool import BaseSandboxTool, BaseSandboxToolInput
from data_retrieval.settings import get_settings
from data_retrieval.utils._common import run_blocking

_settings = get_settings()


class DownloadFromEfastInput(BaseSandboxToolInput):
    """从文档库(EFAST)下载文件工具的输入参数"""
    file_params: List[Dict[str, Any]] = Field(
        description="下载文件参数列表，格式为：[{'id': '文档ID', 'name': '文件名.docx', 'details': {'docid': 'gns://...', 'size': 文件大小}}]"
    )
    save_path: Optional[str] = Field(
        default="",
        description="保存路径，可选，默认保存到会话目录"
    )
    efast_url: Optional[str] = Field(
        default="",
        description="EFAST地址，可选，默认使用默认URL"
    )
    timeout: Optional[int] = Field(
        default=300,
        description="超时时间(秒)，可选，默认300秒"
    )
    token: Optional[str] = Field(
        default="",
        description="EFAST认证令牌，可选，默认使用默认令牌"
    )


class DownloadFromEfastTool(BaseSandboxTool):
    """从文档库(EFAST)下载文件工具"""

    name: str = "download_from_efast"
    description: str = "从文档库(EFAST)下载文件到沙箱环境，支持批量下载多个文件"
    args_schema: type[BaseSandboxToolInput] = DownloadFromEfastInput

    @construct_final_answer
    def _run(
        self,
        file_params: List[Dict[str, Any]],
        save_path: str = "",
        efast_url: str = "",
        timeout: int = 300,
        token: str = "",
        title: str = "",
        run_manager: Optional[CallbackManagerForToolRun] = None
    ):
        try:
            # 创建事件循环来运行异步操作
            result = run_blocking(self._download_from_efast(
                file_params, save_path, efast_url, timeout, token
            ))
            return result
        except Exception as e:
            logger.error(f"Download from EFAST failed: {e}")
            raise SandboxError(reason="从EFAST下载文件失败", detail=str(e)) from e

    @async_construct_final_answer
    async def _arun(
        self,
        file_params: List[Dict[str, Any]],
        save_path: str = "",
        efast_url: str = "",
        timeout: int = 300,
        token: str = "",
        title: str = "",
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ):
        try:
            result = await self._download_from_efast(file_params, save_path, efast_url, timeout, token)
            if self._random_session_id:
                result["session_id"] = self.session_id
            
            if title:
                result["title"] = title
            else:
                result["title"] = result["download_result"]["message"]

            return result
        except Exception as e:
            logger.error(f"Download from EFAST failed: {e}")
            raise SandboxError(reason="从EFAST下载文件失败", detail=str(e)) from e

    async def _download_from_efast(
        self,
        file_params: List[Dict[str, Any]],
        save_path: str,
        efast_url: str,
        timeout: int,
        token: str
    ) -> dict:
        """执行具体的文件下载操作"""
        if not file_params:
            raise SandboxError(reason="下载文件失败", detail="file_params 参数不能为空")

        # 将用户提供的格式转换为sandbox期望的格式
        converted_file_params = []
        for file_param in file_params:
            # 检查必需字段
            if 'details' not in file_param or 'docid' not in file_param['details']:
                raise SandboxError(
                    reason="下载文件失败",
                    detail=f"文件参数格式错误，缺少必需字段: {file_param}"
                )

            converted_param = {
                'docid': file_param['details']['docid'],
                'savename': file_param.get('name', file_param.get('savename', 'unknown')),
                'rev': file_param.get('rev', '')  # 如果没有rev字段，设置为空字符串
            }
            converted_file_params.append(converted_param)

        sandbox = self._get_sandbox()

        try:
            # 调用sandbox的download_from_efast方法
            result = await sandbox.download_from_efast(
                file_params=converted_file_params,
                save_path=save_path,
                efast_url=efast_url,
                timeout=timeout,
                token=token
            )

            return {
                "action": "download_from_efast",
                "download_result": result,
            }
        except Exception as e:
            logger.error(f"Download from EFAST action failed: {e}")
            raise SandboxError(reason="从EFAST下载文件失败", detail=str(e)) from e


    @staticmethod
    async def get_api_schema():
        """获取 API Schema"""
        base_schema = await BaseSandboxTool.get_api_schema()
        base_schema["post"]["summary"] = "download_from_efast"
        base_schema["post"]["description"] = "从文档库(EFAST)下载文件到沙箱环境，支持批量下载多个文件。需要提供文件参数列表，格式为[{'id': '...', 'type': 'doc', 'name': '...', 'details': {'docid': 'gns://...', 'size': ...}}]"

        # 更新请求体 schema，添加工具特定参数
        base_schema["post"]["requestBody"]["content"]["application/json"]["schema"]["properties"].update({
            "file_params": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "文档ID"
                        },
                        "name": {
                            "type": "string",
                            "description": "文档名称"
                        },
                        "details": {
                            "type": "object",
                            "properties": {
                                "docid": {
                                    "type": "string",
                                    "description": "完整的文档ID"
                                }
                            },
                            "required": ["docid"]
                        }
                    },
                    "required": ["details"]
                },
                "description": "下载文件参数列表"
            },
            "save_path": {
                "type": "string",
                "description": "保存路径，可选，默认保存到会话目录"
            },
            "efast_url": {
                "type": "string",
                "description": "EFAST地址，可选，默认使用默认URL"
            },
            "timeout": {
                "type": "integer",
                "description": "超时时间(秒)，可选，默认300秒",
                "default": 300
            },
            "token": {
                "type": "string",
                "description": "认证令牌"
            }
        })
        base_schema["post"]["requestBody"]["content"]["application/json"]["schema"]["required"] = ["file_params"]

        # 添加示例
        base_schema["post"]["requestBody"]["content"]["application/json"]["examples"] = {
            "single_file": {
                "summary": "下载单个文件",
                "description": "从文档库(EFAST)下载单个文件",
                "value": {
                    "file_params": [
                        {
                            "id": "5CB5AA515EBD4CB785918D43982FCE42",
                            "type": "doc",
                            "name": "新能源汽车产业分析 (10).docx",
                            "details": {
                                "docid": "gns://00328E97423F42AC9DEE87B4F4B4631E/83D893844A0B4A34A64DFFB343BEF416/5CB5AA515EBD4CB785918D43982FCE42",
                                "size": 15635
                            }
                        }
                    ],
                    "save_path": "",
                    "efast_url": "https://efast.example.com",
                    "timeout": 300,
                    "token": "1234567890",
                    "server_url": "",
                    "session_id": "test_session_123"
                }
            },
            "multiple_files": {
                "summary": "批量下载文件",
                "description": "从文档库(EFAST)批量下载多个文件",
                "value": {
                    "file_params": [
                        {
                            "id": "5CB5AA515EBD4CB785918D43982FCE42",
                            "type": "doc",
                            "name": "新能源汽车产业分析 (10).docx",
                            "details": {
                                "docid": "gns://00328E97423F42AC9DEE87B4F4B4631E/83D893844A0B4A34A64DFFB343BEF416/5CB5AA515EBD4CB785918D43982FCE42",
                                "size": 15635
                            }
                        },
                        {
                            "id": "6CB5AA515EBD4CB785918D43982FCE43",
                            "type": "doc",
                            "name": "市场分析报告.pdf",
                            "details": {
                                "docid": "gns://00328E97423F42AC9DEE87B4F4B4631E/83D893844A0B4A34A64DFFB343BEF416/6CB5AA515EBD4CB785918D43982FCE43",
                                "size": 24567
                            }
                        }
                    ],
                    "save_path": "",
                    "timeout": 600,
                    "token": "1234567890",
                    "server_url": "",
                    "session_id": "test_session_123"
                }
            }
        }

        return base_schema
