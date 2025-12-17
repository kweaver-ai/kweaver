import asyncio
from typing import Optional, List
from langchain_core.callbacks import CallbackManagerForToolRun, AsyncCallbackManagerForToolRun
from langchain_core.pydantic_v1 import BaseModel, Field

from af_agent.logs.logger import logger
from af_agent.tools.base import ToolName
from af_agent.tools.base import construct_final_answer, async_construct_final_answer
from af_agent.errors import SandboxError
from af_agent.tools.sandbox_tools.toolkit.base_sandbox_tool import BaseSandboxTool, BaseSandboxToolInput
from af_agent.settings import get_settings
from af_agent.utils._common import run_blocking

_settings = get_settings()


class ExecuteCodeInput(BaseSandboxToolInput):
    """执行代码工具的输入参数"""
    content: str = Field(
        description="要执行的 Python 代码内容"
    )
    filename: Optional[str] = Field(
        default="",
        description="文件名，用于指定代码文件的名称, 若不指定，则自动生成一个类似 script_xxx.py 的文件名"
    )
    args: Optional[List[str]] = Field(
        default=[],
        description="代码执行参数"
    )
    output_params: Optional[List[str]] = Field(
        default=[],
        description="输出参数列表，用于指定要返回的变量名"
    )


class ExecuteCodeTool(BaseSandboxTool):
    """执行代码工具，在沙箱环境中执行 Python 代码"""
    
    name: str = "execute_code"
    description: str = "在沙箱环境中执行 Python 代码，支持 pandas 等数据分析库，注意沙箱环境是受限环境，没有网络连接，不能使用 pip 安装第三方库"
    args_schema: type[BaseSandboxToolInput] = ExecuteCodeInput

    @construct_final_answer
    def _run(
        self,
        content: str,
        filename: str = "",
        args: List[str] = [],
        output_params: List[str] = [],
        title: str = "",
        run_manager: Optional[CallbackManagerForToolRun] = None
    ):
        try:
            # 创建事件循环来运行异步操作
            result = run_blocking(self._execute_code(
                content, filename, args, output_params
            ))
            return result
        except Exception as e:
            logger.error(f"Execute code failed: {e}")
            raise SandboxError(reason="执行代码失败", detail=str(e)) from e
    
    @async_construct_final_answer
    async def _arun(
        self,
        content: str,
        filename: str = "",
        args: List[str] = [],
        output_params: List[str] = [],
        title: str = "",
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ):
        try:
            result = await self._execute_code(content, filename, args, output_params)
            if self._random_session_id:
                result["session_id"] = self.session_id
            
            if title:
                result["title"] = title
            else:
                result["title"] = result["message"]

            return result
        except Exception as e:
            logger.error(f"Execute code failed: {e}")
            raise SandboxError(reason="执行代码失败", detail=str(e)) from e
    
    async def _execute_code(
        self,
        content: str,
        filename: str,
        args: List[str],
        output_params: List[str]
    ) -> dict:
        """执行具体的代码执行操作"""
        if not content:
            raise SandboxError(reason="执行代码失败", detail="content 参数不能为空")

        sandbox = self._get_sandbox()
        
        try:
            result = await sandbox.execute_code(
                content, 
                filename=filename if filename else None,
                args=args if args else None,
                output_params=output_params if output_params else None
            )
            
            # 检查执行结果，处理异常情况
            self._check_execution_result(result, "代码执行")
            
            return {
                "action": "execute_code",
                "result": result,
                "message": "代码执行成功"
            }
        except Exception as e:
            logger.error(f"Execute code action failed: {e}")
            raise SandboxError(reason=f"代码执行失败", detail=str(e)) from e
    


    @staticmethod
    async def get_api_schema():
        """获取 API Schema"""
        base_schema = await BaseSandboxTool.get_api_schema()
        base_schema["post"]["summary"] = "execute_code"
        base_schema["post"]["description"] = "在沙箱环境中执行 Python 代码，支持 pandas 等数据分析库，注意沙箱环境是受限环境，没有网络连接，不能使用 pip 安装第三方库。运行代码时，需要通过 print 输出结果，或者设置输出变量 output_params 参数，返回结果"
        
        # 更新请求体 schema，添加工具特定参数
        base_schema["post"]["requestBody"]["content"]["application/json"]["schema"]["properties"].update({
            "content": {
                "type": "string",
                "description": "要执行的 Python 代码内容"
            },
            "filename": {
                "type": "string",
                "description": "文件名，用于指定代码文件的名称"
            },
            "args": {
                "type": "array",
                "items": {"type": "string"},
                "description": "代码执行参数"
            },
            "output_params": {
                "type": "array",
                "items": {"type": "string"},
                "description": "输出参数列表，用于指定要返回的变量名"
            }
        })
        base_schema["post"]["requestBody"]["content"]["application/json"]["schema"]["required"] = ["content"]
        
        # 添加示例
        base_schema["post"]["requestBody"]["content"]["application/json"]["examples"] = {
            "basic_execution": {
                "summary": "基础代码执行",
                "description": "执行简单的 Python 代码",
                "value": {
                    "content": "print('Hello World')\nx = 10\ny = 20\nresult = x + y\nprint(f'{x} + {y} = {result}')",
                    "filename": "hello.py",
                    "output_params": ["result"],
                    "server_url": "http://localhost:8080",
                    "session_id": "test_session_123"
                }
            },
            "data_analysis": {
                "summary": "数据分析示例",
                "description": "使用 pandas 进行数据分析",
                "value": {
                    "content": "import pandas as pd\nimport numpy as np\n\n# 创建示例数据\ndata = {\n    'name': ['Alice', 'Bob', 'Charlie'],\n    'age': [25, 30, 35],\n    'salary': [50000, 60000, 70000]\n}\ndf = pd.DataFrame(data)\n\n# 计算统计信息\nstats = {\n    'mean_age': df['age'].mean(),\n    'mean_salary': df['salary'].mean(),\n    'total_records': len(df)\n}\n\nprint('数据统计:')\nfor key, value in stats.items():\n    print(f'{key}: {value}')\n\nresult = stats",
                    "filename": "data_analysis.py",
                    "output_params": ["result", "df"],
                    "server_url": "http://localhost:8080",
                    "session_id": "test_session_123"
                }
            }
        }
        
        return base_schema 