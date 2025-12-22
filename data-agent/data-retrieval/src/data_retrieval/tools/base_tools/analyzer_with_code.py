# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2025-4-10
import json
import traceback
from textwrap import dedent
from typing import Any, Optional, Type, Dict, Union, List
from enum import Enum
from langchain.callbacks.manager import (AsyncCallbackManagerForToolRun,
                                         CallbackManagerForToolRun)
from langchain.pydantic_v1 import BaseModel, Field
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate
)

from langchain_core.messages import HumanMessage, SystemMessage
from jinja2.sandbox import SandboxedEnvironment

import pandas as pd
import numpy as np
# IPython导入放在这里，但保持注释状态，需要时取消注释
# from IPython.core.interactiveshell import InteractiveShell

from data_retrieval.logs.logger import logger
from data_retrieval.sessions import CreateSession, BaseChatHistorySession
from data_retrieval.tools.base import ToolMultipleResult, ToolName
from data_retrieval.tools.base import construct_final_answer, async_construct_final_answer
from data_retrieval.tools.base import LLMTool, _TOOL_MESSAGE_KEY
from data_retrieval.tools.base import api_tool_decorator
from data_retrieval.utils.llm import CustomChatOpenAI
from data_retrieval.errors import ToolFatalError, PythonCodeError
from data_retrieval.utils.model_types import ModelType4Prompt
from data_retrieval.settings import get_settings
from langchain_core.output_parsers import JsonOutputParser
from data_retrieval.prompts.tools_prompts.analyzer_with_code_prompt import AnalyzerWithCodePrompt
from data_retrieval.utils import convert
from data_retrieval.utils.code_runner import ExecRunner, IPythonRunner, JupyterGatewayRunner, BaseCodeRunner
from data_retrieval.utils.code_runner.jupyter_gateway_runner import get_runner
from data_retrieval.parsers.base import BaseJsonParser


_SETTINGS = get_settings()

_ENV = SandboxedEnvironment()

_TOOL_DESCS = dedent(
f"""
代码分析工具，根据用户需求生成代码并执行, 调用方式:
{ToolName.from_analyzer_with_code.value}(
    input: str,
    tool_result_cache_keys: List[str],
    kernel_id: str,
    sample_data: Optional[Dict] = None,
    extra_info: Optional[Union[str, Dict]] = "",
    knowledge_enhanced_infomation: Optional[Dict] = {{}}
)
""")

class AnalyzerWithCodeInput(BaseModel):
    input: str = Field(description="用户的分析需求")
    tool_result_cache_keys: List[str] = Field(default=[], description="之前工具的结果缓存位置，可能有多个,请务必填写正确")
    kernel_id: str = Field(default="", description="python 内核 ID, 如果之前调用过，请务必出入该参数")
    sample_data: Optional[Dict] = Field(default=None, description="需要分析的数据样例, 如果 tool_result_cache_key 存在则不需要设置")
    extra_info: str = Field(default="", description="额外信息, 注意不是知识增强工具返回的信息")
    knowledge_enhanced_infomation: Union[str, Dict] = Field(default="", description=f"{ToolName.from_knowledge_enhanced.value} 工具返回的信息, 如果之前调用过，传入该参数可以辅助代码的正确生成")
    # use_jupyter: bool = Field(default=True, description="是否使用 Jupyter 执行代码")


class AnalyzerWithCodeTool(LLMTool):
    name: str = ToolName.from_analyzer_with_code.value
    description: str = _TOOL_DESCS
    args_schema: Type[BaseModel] = AnalyzerWithCodeInput
    session_type: str = "redis"
    session_id: Optional[str] = ""
    session: Optional[BaseChatHistorySession] = None
    retry_times: int = 2
    background: str = ""
    runner_type: str = "jupyter_gateway"
    output_limit: int = _SETTINGS.CODE_RUNNER_OUTPUT_LIMIT
    output_lines_limit: int = _SETTINGS.CODE_RUNNER_OUTPUT_LINES_LIMIT
    kernel_id: str = ""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if kwargs.get("session") is None:
            self.session = CreateSession(self.session_type)
        
        # 初始化的时候可能 kernel_id 为空，让大模型通过上下文判断是否需要创建新的内核
        if kwargs.get("kernel_id"):
            self.kernel_id = kwargs.get("kernel_id")

    def _config_chain(
        self,
        sample_data: Optional[Union[List, Dict]] = None,
        code_runner: Optional[BaseCodeRunner] = None,
        errors: Any = None
    ):
        # 配置提示词
        if code_runner:
            working_context = code_runner.get_working_context(output_limit=self.output_limit, output_lines_limit=self.output_lines_limit)
        else:
            working_context = ""

        prompt = AnalyzerWithCodePrompt(
            sample_data=sample_data,
            language=self.language,
            background=self.background,
            jupyter=self.runner_type == "jupyter_gateway",
            notebook_context=working_context,
            errors=errors
        )

        if self.model_type == ModelType4Prompt.DEEPSEEK_R1.value:
            prompt_template = ChatPromptTemplate.from_messages([
                HumanMessage(
                    content="下面是你的任何即任务，请务必牢记：\n" + prompt.render(),
                    additional_kwargs={_TOOL_MESSAGE_KEY: "analyzer_with_code"}
                ),
                HumanMessagePromptTemplate.from_template("{input}")
            ])
        else:
            prompt_template = ChatPromptTemplate.from_messages([
                SystemMessage(
                    content=prompt.render(),
                    additional_kwargs={_TOOL_MESSAGE_KEY: "analyzer_with_code"}
                ),
                HumanMessagePromptTemplate.from_template("{input}")
            ])


        # 执行 LLM 调用
        chain = prompt_template | self.llm | BaseJsonParser()
        return chain
    
    def _add_extra_info(self, extra_info, knowledge_enhanced_information):
        # if isinstance(knowledge_enhanced_information, dict):
        #     if knowledge_enhanced_information.get("output"):
        #         knowledge_enhanced_information = json.dumps(knowledge_enhanced_information.get("output"))
        #     else:
        #         knowledge_enhanced_information = json.dumps(knowledge_enhanced_information)

        try:
            if not knowledge_enhanced_information:
                knowledge_enhanced_information = ""
            else:
                if isinstance(knowledge_enhanced_information, str):
                    info = json.loads(knowledge_enhanced_information)
                    knowledge_enhanced_information = json.dumps(info, ensure_ascii=False)
                else:
                    knowledge_enhanced_information = json.dumps(knowledge_enhanced_information, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Convert Error, use original str. Error: {e}")

        if extra_info:
            self.background += dedent(
                "\n"
                + extra_info
                + "\n")
        if knowledge_enhanced_information:
            self.background += dedent(
                "- 生成代码时考虑以下信息，不过请注意，这里的信息是原始数据库的信息，字段的名称可能会与当前数据集中的字段名称不一致，但是可能有一点过关联，请注意选择："
                + "\n"
                + knowledge_enhanced_information)

    def _get_code_runner(self, kernel_id: str):
        if not kernel_id:
            kernel_id = self.kernel_id
        try:
            if self.runner_type == "jupyter_gateway":
                code_runner = get_runner(kernel_id=kernel_id)
                self.kernel_id = code_runner.get_id()
            else:
                code_runner = ExecRunner()

            return code_runner
        except Exception as e:
            logger.error(f"Error: {e}")
            raise PythonCodeError(reason="创建代码执行器失败", detail=e) from e

    def _run_python_code(self, runner: BaseCodeRunner, code: str, data: Optional[Dict]=None, **namespace_kwargs):
        try:
            template = _ENV.from_string(code)   
            code = template.render()

            # 使用ExecRunner执行代码
            # return ExecRunner.static_run(code, data)
            return runner.run(code, data, **namespace_kwargs)
        except Exception as e:
            logger.error(f"Error: {e}")
            raise PythonCodeError(reason="分析代码生成失败", detail=e) from e

    def _run_python_code_with_exec(self, code: str, data: Optional[Dict]=None, **namespace_kwargs):
        try:
            template = _ENV.from_string(code)   
            code = template.render()

            # 使用ExecRunner执行代码
            # return ExecRunner.static_run(code, data)
            return ExecRunner.run(code, data, **namespace_kwargs)
        except Exception as e:
            logger.error(f"Error: {e}")
            raise PythonCodeError(reason="分析代码生成失败", detail=e) from e

    
    def _deal_with_result(self, code_result, reduce_result=False):
        # 记录原始记录数量
        if not isinstance(code_result, str):
            code_result = convert.to_str(code_result)
        if not reduce_result:
            return code_result, {
                "real_length": len(code_result),
                "return_length": len(code_result)
            }
        # 截断过长的字符串输出，防止大模型处理时卡死
        max_output_length = self.output_limit  # 设置最大输出长度
        if len(code_result) > max_output_length:
            middle_marker = f"\n... [输出过长，已截断约 {len(code_result) - max_output_length} 字符] ...\n"
            # 保留前后部分，中间用省略标记
            code_result = code_result[:max_output_length//2] + middle_marker + code_result[-max_output_length//2:]
            logger.warning(f"输出结果过长 ({len(code_result)} 字符)，已截断至约 {max_output_length} 字符")

        return code_result, {
            "real_length": len(code_result),
            "return_length": len(code_result)
        }


    @construct_final_answer
    def _run(
        self,
        input: str,
        tool_result_cache_keys: List[str] = [],
        sample_data: Optional[Dict] = None,
        extra_info: Optional[Union[str, Dict]] = "",
        knowledge_enhanced_infomation: Optional[Dict] = {},
        kernel_id: str = "",
        run_manager: Optional[Any] = None,
    ):
        try:
            self._add_extra_info(extra_info, knowledge_enhanced_infomation)

            logger.debug(f"analyzer_with_code -> input: {input}")
            errors = {}
            res = {}

            for i in range(self.retry_times):
                logger.debug(f"============" * 10)
                logger.debug(f"{i + 1} times to generate analysis code......")
                
                try:
                    # 准备输入数据
                    input_data = {}
                    sample_from_cache = {}

                    # 获取上一轮工具的结果
                    if tool_result_cache_keys and self.session:
                        for i, tool_result_cache_key in enumerate(tool_result_cache_keys):
                            tool_result = self.session.get_agent_logs(tool_result_cache_key)

                            if tool_result:
                                tool_data = tool_result.get("data", {})
                                title = tool_result.get("title", f"data_{i}")
                                input_data[title] = tool_data

                                if isinstance(tool_data, list) and len(tool_data) > 0:
                                    sample_from_cache[title] = tool_data[0]
                                else:
                                    sample_from_cache[title] = tool_data
                            else:
                                raise ToolFatalError(detail="没有可用的输入数据")

                    code_runner = self._get_code_runner(kernel_id=kernel_id)

                    if sample_from_cache:
                        sample_data = sample_from_cache

                    chain = self._config_chain(sample_data=sample_data, code_runner=code_runner)
                    llm_res = chain.invoke(input)

                    result = self._run_python_code(code_runner=code_runner, code=llm_res.get("code", ""), data=input_data)
                    # 记录日志时，不减少结果
                    res["result"], _ = self._deal_with_result(result)
                    res.update(llm_res)

                    # 添加日志
                    if self.session:
                        self.session.add_agent_logs(
                            self._result_cache_key,
                            logs=res
                        )

                    # 减少为大模型的输出
                    logger.debug(f"code: {res.get('code', '')}")
                    del res["code"]
                    res["result"], res["data_desc"] = self._deal_with_result(result, reduce_result=False)

                    return res

                except Exception as e:
                    print("=====")
                    print(traceback.format_exc())
                    if llm_res and isinstance(llm_res, dict):
                        res.update(llm_res)
                    errors["error"] = e.__str__()
                    logger.error(f"Error: {errors}")

            # 重试次数用完
            if errors:
                res["error"] = errors
                raise ToolFatalError(reason=f"生成分析代码错误达到 {self.retry_times} 次", detail=errors)

        except Exception as e:
            logger.error(f"Error: {e}")
            return res

    @async_construct_final_answer
    async def _arun(
        self,
        input: str,
        tool_result_cache_keys: List[str] = [],
        sample_data: Optional[Dict] = None,
        extra_info: Optional[Union[str, Dict]] = "",
        knowledge_enhanced_infomation: Optional[Dict] = {},
        kernel_id: str = "",
        run_manager: Optional[Any] = None,
    ):
        try:
            self._add_extra_info(extra_info, knowledge_enhanced_infomation)

            logger.debug(f"analyzer_with_code -> input: {input}")
            errors = {}
            res = {}

            
            # 准备输入数据
            input_data = {}
            sample_from_cache = {}

            # 获取上一轮工具的结果
            if tool_result_cache_keys and self.session:
                for i, tool_result_cache_key in enumerate(tool_result_cache_keys):
                    tool_result = self.session.get_agent_logs(tool_result_cache_key)

                    if tool_result:
                        tool_data = tool_result.get("data", {})
                        title = tool_result.get("title", f"data_{i}")
                        input_data[title] = tool_data

                        if isinstance(tool_data, list) and len(tool_data) > 0:
                            sample_from_cache[title] = tool_data[0]
                        else:
                            sample_from_cache[title] = tool_data
                    else:
                        continue

                # if not input_data:
                #     raise ToolFatalError(detail="没有可用的输入数据")
                if sample_data:
                    input_data = sample_data

                if sample_from_cache:
                    sample_data = sample_from_cache
                
                # 尝试重新执行代码
                for i in range(self.retry_times):
                    try:
                        logger.debug(f"============" * 10)
                        logger.debug(f"{i + 1} times to generate analysis code......")
                                        
                        code_runner = self._get_code_runner(kernel_id=kernel_id)

                        chain = self._config_chain(sample_data=sample_data, code_runner=code_runner, errors=errors)
                        llm_res = await chain.ainvoke(input)

                        code_result = self._run_python_code(
                            runner=code_runner,
                            code=llm_res.get("code", ""),
                            data = input_data
                        )
        
                        # 记录日志时，不减少结果
                        res["result"], _ = self._deal_with_result(code_result)
                        res.update(llm_res)

                        # 添加日志
                        if self.session:
                            self.session.add_agent_logs(
                                self._result_cache_key,
                                logs=res
                            )

                        logger.debug(f"code: {res.get('code', '')}")
                        del res["code"]

                        if self.return_record_limit != -1:
                            # 减少为大模型的输出
                            res["result"], res["data_desc"] = self._deal_with_result(code_result, reduce_result=False)

                        return res
                
                    except Exception as e:
                        print("=====")
                        print(traceback.format_exc())
                        if llm_res and isinstance(llm_res, dict):
                            res.update(llm_res)
                        errors["error"] = e.__str__()
                        logger.error(f"Error: {errors}")

            # 重试次数用完
            if errors:
                res["error"] = errors
                raise ToolFatalError(reason=f"生成分析代码错误达到 {self.retry_times} 次", detail=errors)

        except Exception as e:
            logger.error(f"Error: {e}")
            return res

    def handle_result(
        self,
        log: Dict[str, Any],
        ans_multiple: ToolMultipleResult
    ) -> None:
        if self.session:
            tool_res = self.session.get_agent_logs(
                self._result_cache_key
            )
            if tool_res:
                log["result"] = tool_res
                # ans_multiple.explain.append(
                #     {"explanation": tool_res.get("explanation", "")}
                # )
                # ans_multiple.code.append(tool_res.get("code", ""))
                ans_multiple.cache_keys[self._result_cache_key] = {
                    "kernel_id": self.kernel_id,
                    "tool_name": "analyzer_with_code",
                    "title": tool_res.get("title", "analyze_with_code")
                }

    @classmethod
    @api_tool_decorator
    async def as_async_api_cls(
        cls,
        params: dict
    ):
        # LLM Params
        llm_dict = {
            "model_name": params.get("llm", {}).get("model_name", "gpt-4"),
            "openai_api_key": params.get("llm", {}).get("openai_api_key", ""),
            "openai_api_base": params.get("llm", {}).get("openai_api_base", ""),
        }
        llm = CustomChatOpenAI(**llm_dict)

        # Config Params
        config_dict = params.get("config", {})
        tool = cls(llm=llm, **config_dict)

        # Input Params
        input = params.get("input", "")
        tool_result_cache_key = params.get("tool_result_cache_key", "")
        sample_data = params.get("sample_data", None)

        # invoke tool
        res = await tool.ainvoke(
            input=input,
            tool_result_cache_key=tool_result_cache_key,
            sample_data=sample_data
        )
        return res

    @staticmethod
    async def get_api_schema():
        inputs = {
            "llm": {
                "model_name": "gpt-4",
                "openai_api_key": "******",
                "openai_api_base": "http://xxxx"
            },
            "config": {
                "session_type": "in_memory",
                "session_id": "123",
                "retry_times": 3
            },
            "input": "分析数据中的趋势和异常值",
            "tool_result_cache_key": "tool_result_cache_key",
            "sample_data": {
                "date": ["2024-01-01", "2024-01-02", "2024-01-03"],
                "value": [100, 120, 80]
            }
        }

        outputs = {
            "output": {
                "explanation": "数据分析结果说明",
                "code": "import pandas as pd\nimport numpy as np\n# 分析代码...",
                "result": {
                    "trend": "上升",
                    "anomalies": ["2024-01-03"]
                }
            }
        }

        return {
            "post": {
                "summary": ToolName.from_analyzer_with_code.value,
                "description": _TOOL_DESCS,
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "llm": {
                                        "type": "object",
                                        "description": "语言模型配置",
                                        "properties": {
                                            "model_name": {
                                                "type": "string",
                                                "description": "模型名称"
                                            },
                                            "openai_api_key": {
                                                "type": "string",
                                                "description": "OpenAI API密钥"
                                            },
                                            "openai_api_base": {
                                                "type": "string",
                                                "description": "OpenAI API基础URL"
                                            }
                                        }
                                    },
                                    "config": {
                                        "type": "object",
                                        "description": "工具配置参数",
                                        "properties": {
                                            "session_type": {
                                                "type": "string",
                                                "description": "会话类型",
                                                "enum": ["in_memory", "redis"],
                                                "default": "redis"
                                            },
                                            "session_id": {
                                                "type": "string",
                                                "description": "会话ID"
                                            },
                                            "retry_times": {
                                                "type": "integer",
                                                "description": "重试次数",
                                                "default": 3
                                            }
                                        }
                                    },
                                    "input": {
                                        "type": "string",
                                        "description": "用户的分析需求"
                                    },
                                    "tool_result_cache_key": {
                                        "type": "string",
                                        "description": "上一轮工具的结果缓存键"
                                    },
                                    "sample_data": {
                                        "type": "object",
                                        "description": "需要分析的数据样例，辅助分析代码生成"
                                    }
                                },
                                "required": ["input"],
                                "example": inputs
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
                                    "type": "object"
                                },
                                "example": outputs
                            }
                        }
                    }
                }
            }
        }
