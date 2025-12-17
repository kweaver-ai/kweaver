# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-08-26
import json
import os
import traceback
from textwrap import dedent
from typing import Any, Optional, Type, Dict, List
from enum import Enum
from collections import OrderedDict

from langchain.callbacks.manager import (AsyncCallbackManagerForToolRun,
                                         CallbackManagerForToolRun)

from langchain.pydantic_v1 import BaseModel, Field, PrivateAttr
from langchain.pydantic_v1.dataclasses import dataclass
from langchain.tools import BaseTool
from fastapi import Body

from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate
)
from langchain_core.messages import SystemMessage, HumanMessage

from af_agent.errors import Text2DIPMetricError, ToolFatalError
from af_agent.logs.logger import logger
from af_agent.prompts.tools_prompts.text2dip_metric_prompt import Text2DIPMetricPrompt

from af_agent.sessions import CreateSession, BaseChatHistorySession
from af_agent.tools.base import construct_final_answer, async_construct_final_answer, ToolCallbackHandler
from af_agent.tools.base import LLMTool, ToolMultipleResult, ToolName
from af_agent.tools.base_tools.context2question import achat_history_to_question, chat_history_to_question
from af_agent.utils.func import JsonParse, json_to_markdown
from af_agent.tools.base import LLMTool, _TOOL_MESSAGE_KEY
from af_agent.prompts.manager.base import BasePromptManager
from af_agent.settings import get_settings
from af_agent.tools.base import api_tool_decorator, _TOOL_MESSAGE_KEY
from af_agent.utils.llm import CustomChatOpenAI
from af_agent.api.auth import get_authorization
from af_agent.datasource.dip_metric import DIPMetric
from af_agent.tools.base import parse_llm_from_model_factory
from af_agent.api.data_model import DataModelService
from af_agent.utils._common import run_blocking
from af_agent.utils.model_types import ModelType4Prompt
from af_agent.api.agent_retrieval import get_datasource_from_agent_retrieval_async



_SETTINGS = get_settings()

_DESCS = {
    "tool_description": {
        "cn": "根据文本，以及DIP指标的列表来生成指标调用参数，每次工具只能调用一个指标但是可以设置不同的查询条件。如果获取的数据太长的话，只返回局部数据，全部数据在缓存中。结果中有一个 data_desc 的对象来记录返回数据条数和实际结果条数，请告知用户查看详细数据，应用程序会获取。",
        "en": "call corresponding DIP indicators based on user input text, only one indicator at a time, if the question contains multiple indicators, please call multiple times, the result has a data_desc object to record the number of returned data and the actual number of results, please tell the user to check the detailed data, the application will get it.",
    },
    "chat_history": {
        "cn": "对话历史",
        "en": "chat history",
    },
    "input": {
        "cn": "一个清晰完整的文本",
        "en": "A clear and complete question",
    },
    "action": {
        "cn": "操作类型：show_ds 显示数据源信息，query 执行查询（默认）",
        "en": "Action type: show_ds to show data source info, query to execute query (default)",
    },
    "desc_from_datasource": {
        "cn": "\n- 包含的指标信息：{desc}",
        "en": "\nThe detailed description of the indicator: \n{desc}",
    }
}


class DIPMetricDescSchema(BaseModel):
    id: str = Field(description="指标的 id, 格式为 str")
    name: str = Field(description="指标的名称")
    metric_type: str = Field(description="指标的类型")
    query_type: str = Field(description="查询类型")
    unit: str = Field(description="单位")


class Text2DIPMetricInput(BaseModel):
    input: str = Field(description=_DESCS["input"]["cn"])
    action: str = Field(
        default="query",
        description=_DESCS["action"]["cn"]
    )
    knowledge_enhanced_information: Optional[Any] = Field(default={}, description="调用知识增强工具获取的信息，如果调用知识增强工具，请填写该参数")

    extra_info: Optional[str] = Field(
        default="",
        description="附加信息，但不是知识增强的信息"
    )


class Text2DIPMetricInputWithMetricList(Text2DIPMetricInput):
    metric_list: List[DIPMetricDescSchema] = Field(default=[], description=f"指标列表，注意指标指的一个数据源，不是字段信息，当已经初始化过虚拟视图列表时，不需要填写该参数。如果需要填写该参数，请确保`上下文缓存的数据资源中存在`，不要随意生成。注意参数一定要准确。格式为 {DIPMetricDescSchema.schema_json(ensure_ascii=False)}")


class Text2DIPMetricTool(LLMTool):
    name: str = ToolName.from_text2metric.value
    description: str = _DESCS["tool_description"]["cn"]
    background: str = ""
    args_schema: Type[BaseModel] = Text2DIPMetricInput
    dip_metric: DIPMetric = None
    retry_times: int = 3
    session_type: str = "redis"
    session_id: Optional[str] = ""
    session: Optional[BaseChatHistorySession] = None
    get_desc_from_datasource: bool = False  # 是否从数据源获取描述
    with_sample_data: bool = True   # 是否从逻辑视图中获取样例数据
    dimension_num_limit: int = int(_SETTINGS.TEXT2METRIC_DIMENSION_NUM_LIMIT)
    recall_top_k: int = int(_SETTINGS.INDICATOR_RECALL_TOP_K)
    rewrite_query: bool = bool(_SETTINGS.INDICATOR_REWRITE_QUERY)  # 是否重写指标查询语句
    model_type: str = _SETTINGS.TEXT2METRIC_MODEL_TYPE
    return_record_limit: int = _SETTINGS.RETURN_RECORD_LIMIT
    return_data_limit: int = _SETTINGS.RETURN_DATA_LIMIT    
    api_mode: bool = False  # 是否为 API 模式
    force_limit: int = _SETTINGS.TEXT2METRIC_FORCE_LIMIT  # 限制指标查询的行数

    _initial_metric_ids: List[str] = PrivateAttr(default=[]) # 工具初始化时设置的指标id列表
    _result_cache_key: str = PrivateAttr(default="")  # 结果缓存键

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if kwargs.get("session") is None:
            self.session = CreateSession(self.session_type)
        
        if kwargs.get("manager") is not None:
            self.prompt_manager = kwargs.get("manager")
        
        if self.dip_metric and self.dip_metric.get_data_list():
            self._initial_metric_ids = self.dip_metric.get_data_list()
        else:
            self.args_schema = Text2DIPMetricInputWithMetricList
        
    def _init_dip_metric_details_and_samples(self, input_question=""):
        """初始化 DIP Metric 详情和样例数据"""
        coroutine = self._ainit_dip_metric_details_and_samples(input_question)
        return run_blocking(coroutine)

    async def _ainit_dip_metric_details_and_samples(self, input_question=""):
        """异步初始化 DIP Metric 详情和样例数据"""
        try:
            if not self.dip_metric:
                logger.warning("DIP Metric 数据源未初始化")
                return
            
            # 获取指标详情
            metric_details = []
            sample_data = {
                "mapping": [],
                "data": []
            }
            
            # 异步获取可用指标列表
            details = await self.dip_metric.aget_details(input_question)
            if details:
                for metric in details:
                    metric_details.append({
                        "id": metric.get("id"),
                        "name": metric.get("name"),
                        "comment": metric.get("comment"),
                        "formula_config": metric.get("formula_config"),
                        "analysis_dimensions": metric.get("analysis_dimensions"),
                        "date_field": metric.get("date_field"),
                        "unit_type": metric.get("unit_type"),
                        "unit": metric.get("unit"),
                        "data_source": metric.get("data_source", {})
                    })
                logger.info(f"异步获取到 {len(metric_details)} 个指标详情")
            
            if self.with_sample_data and metric_details:
                
                for metric in metric_details:
                    data_source = metric.get("data_source", {})
                    if not data_source:
                        continue

                    sample_data["mapping"].append({
                        "metric_id": metric.get("id"),
                        "data_view_id": metric.get("data_source", {}).get("id"),
                    })
                    data_view_id = metric.get("data_source", {}).get("id")

                    if data_view_id in sample_data:
                        continue
                    
                    sample = await self.dip_metric.service.get_view_data_preview_async(
                        data_view_id,
                        fields=metric.get("analysis_dimensions")
                    )
                    sample_data["data"].append({
                        "view_id": data_view_id,
                        "data": sample.get("entries", [])
                    })

            return metric_details, sample_data

        except Exception as e:
            logger.error(f"异步初始化 DIP Metric 详情和样例数据失败: {e}")
            raise e

    def _config_chain(self, metric_details: list, samples: list, errors: dict, background: str = ''):
        """配置 LLM 链"""
        try:
            # 获取 prompt
            system_prompt = Text2DIPMetricPrompt(
                metrics=metric_details,
                samples=samples,
                background=background,
                errors=errors
            )

            logger.debug(f"text2dip_metric -> system_prompt: {system_prompt.render()}")

            if self.model_type == ModelType4Prompt.DEEPSEEK_R1.value:
                prompt = ChatPromptTemplate.from_messages(
                    [
                        HumanMessage(
                            content="下面是你的任务，请务必牢记" + system_prompt.render(),
                            additional_kwargs={_TOOL_MESSAGE_KEY: "text2metric"}
                        ),
                        HumanMessagePromptTemplate.from_template("{input}")
                    ]
                )
            else:
                prompt = ChatPromptTemplate.from_messages(
                    [
                        SystemMessage(
                            content=system_prompt.render(),
                            additional_kwargs={_TOOL_MESSAGE_KEY: "text2metric"}
                        ),
                        HumanMessagePromptTemplate.from_template("{input}")
                    ]
                )

            chain = (
                    prompt
                    | self.llm
            )
            return chain
        except Exception as e:
            logger.error(f"配置 LLM 链失败: {e}")
            raise e

    def _add_extra_info(self, extra_info, knowledge_enhanced_information = ""):
        """添加额外信息"""
        background = self.background
        
        if extra_info:
            background += f"\n额外信息：{extra_info}"
        
        if knowledge_enhanced_information:
            if isinstance(knowledge_enhanced_information, dict):
                background += f"\n知识增强信息：{json.dumps(knowledge_enhanced_information, ensure_ascii=False)}"
            else:
                background += f"\n知识增强信息：{knowledge_enhanced_information}"
        
        return background

    def _get_configured_metrics_info(self):
        """获取配置的指标信息"""
        try:
            if not self.dip_metric:
                return {
                    "error": "DIP Metric 数据源未初始化",
                    "message": "无法获取配置的指标信息，因为 DIP Metric 数据源未初始化"
                }
            
            # 获取配置的指标列表
            metric_list = self.dip_metric.get_data_list()
            
            if not metric_list:
                return {
                    "message": "当前未配置任何指标",
                    "available_metrics": [],
                    "title": "配置的指标信息"
                }
            
            # 获取指标详细信息
            metric_details = self.dip_metric.get_description_by_ids(metric_list)
            
            # 格式化指标信息
            
            return {
                "title": "配置的指标信息",
                "message": f"当前配置了 {len(metric_details)} 个指标",
                "metric_num": len(metric_details),
                "metric_details": metric_details
            }
            
        except Exception as e:
            logger.error(f"获取配置的指标信息失败: {e}")
            return {
                "error": f"获取配置的指标信息失败: {e}",
                "message": "无法获取配置的指标信息"
            }

    async def _aget_configured_metrics_info(self):
        """异步获取配置的指标信息"""
        try:
            if not self.dip_metric:
                return {
                    "error": "DIP Metric 数据源未初始化",
                    "message": "无法获取配置的指标信息，因为 DIP Metric 数据源未初始化"
                }
            
            # 获取配置的指标列表
            metric_list = self.dip_metric.get_data_list()
            
            if not metric_list:
                return {
                    "message": "当前未配置任何指标",
                    "available_metrics": [],
                    "title": "配置的指标信息"
                }
            
            # 异步获取指标详细信息
            metric_details = await self.dip_metric.aget_description_by_ids(metric_list)
            
            # 格式化指标信息
            
            return {
                "title": "配置的指标信息",
                "message": f"当前配置了 {len(metric_details)} 个指标",
                "metric_num": len(metric_details),
                "metric_details": metric_details
            }
            
        except Exception as e:
            logger.error(f"异步获取配置的指标信息失败: {e}")
            return {
                "error": f"异步获取配置的指标信息失败: {e}",
                "message": "无法获取配置的指标信息"
            }

    @construct_final_answer
    def _run(
        self,
        input: str,
        action: str = "query",
        extra_info: str = "",
        knowledge_enhanced_information: str = "",  # 知识增强信息，暂时不用
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ):
        """同步运行"""
        return self._process_query(input, action, extra_info, knowledge_enhanced_information, run_manager)

    @async_construct_final_answer
    async def _arun(
        self,
        input: str,
        action: str = "query",
        extra_info: str = "",
        knowledge_enhanced_information: Any = "",  # 知识增强信息，暂时不用
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None,
    ):
        """异步运行"""
        return await self._aprocess_query(input, action, extra_info, knowledge_enhanced_information, run_manager)

    def _process_query(self, input: str, action: str = "query", extra_info: str = "", knowledge_enhanced_information: Any = "", run_manager=None):
        """处理查询，参考 text2metric.py 的实现"""
        try:
            # 如果 action 不是 show_ds，且 input 为空，则抛出异常
            if action != "show_ds" and (not input or not input.strip()):
                raise Text2DIPMetricError(detail="输入问题不能为空", reason="输入问题不能为空")
            
            # 根据 action 参数决定行为
            if action == "show_ds":
                return self._get_configured_metrics_info()
            
            # 添加额外信息
            background = self._add_extra_info(extra_info, knowledge_enhanced_information)
            
            # 初始化指标详情和样例
            metric_details, sample_data = self._init_dip_metric_details_and_samples(input)
            
            errors = {}
            res = {}
            
            for i in range(self.retry_times):
                logger.debug(f"============" * 10)
                logger.debug(f"{i + 1} times to process DIP metric query......")
                try:
                    llm_res, call_res = {}, {}
                    
                    # 配置 LLM 链
                    chain = self._config_chain(
                        metric_details=metric_details,
                        samples=sample_data,
                        errors=errors,
                        background=background
                    )
                    
                    # 调用 LLM
                    response = chain.invoke({"input": input})
                    
                    # 解析响应
                    llm_res = self._parse_response(response)
                    
                    # 获取指标ID和查询参数
                    metric_id = llm_res.get("metric_id", "")
                    param = llm_res.get("query_params", {})
                    
                    if metric_id == "":
                        raise Text2DIPMetricError(llm_res.get("explanation", "指标ID为空"))
                    
                    # 添加引用信息
                    res["cites"] = [
                        {
                            "id": metric_id,
                            "name": metric_id,
                            "type": "metric",
                            "description": "DIP Metric 指标"
                        }
                    ]
                    
                    res.update(llm_res)

                    # 执行查询
                    if metric_id and param:
                        call_res = self._execute_query(metric_id, param)
                        logger.info(f"DIP Metric 调用结果: {call_res}")
                        
                        if call_res.get("error"):
                            raise Text2DIPMetricError(call_res["error"])
                        
                        # 先拷贝一份给大模型的结果
                        res_for_llm = res.copy()

                        # 处理执行结果
                        execution_result, raw_result = self._process_execution_result(call_res)

                        res_for_llm.update(execution_result)
                        res.update(raw_result)

                        # 设置标题
                        if res.get("title", "") == "":
                            res["title"] = input

                        if not raw_result.get("data"):
                            res_for_llm.pop("result_cache_key")
                            res_for_llm["message"] = "查询结果为空"

                            res.pop("result_cache_key")
                            break

                        # 将完整结果写入缓存, 如果数据为空，则不写入缓存
                        if self.session and raw_result.get("data"):
                            self.session.add_agent_logs(
                                self._result_cache_key,
                                logs=res
                            )

                        # 如果成功获取结果，跳出重试循环
                        break
                    
                except Exception as e:
                    logger.error(f"第 {i + 1} 次处理查询失败: {e}")
                    logger.error(f"错误详情: {traceback.format_exc()}")
                    errors[f"error_{i+1}"] = str(e)
                    
                    # 如果是最后一次重试，抛出异常
                    if i == self.retry_times - 1:
                        logger.error(f"处理查询失败，已重试 {self.retry_times} 次")
                        raise Text2DIPMetricError(f"处理查询失败，已重试 {self.retry_times} 次: {errors}")
                    
                    # 继续下一次重试
                    continue
  
            if self.api_mode:
                return {
                    "output": res_for_llm,
                    "full_output": res
                }
            else:   
                return res
            
        except Exception as e:
            logger.error(f"处理查询失败: {e}")
            raise Text2DIPMetricError(f"处理查询失败: {e}")

    async def _aprocess_query(self, input: str, action: str = "query", extra_info: str = "", knowledge_enhanced_information: Any = "", run_manager=None):
        """异步处理查询，参考 text2metric.py 的实现"""
        try:
            if not self.dip_metric.get_data_list():
                raise Text2DIPMetricError(detail="DIP Metric 数据源未初始化", reason="DIP Metric 数据源未初始化, 当前任务无法使用该工具")

            # 如果 action 不是 show_ds，且 input 为空，则抛出异常
            if action != "show_ds" and (not input or not input.strip()):
                raise Text2DIPMetricError(detail="输入问题不能为空", reason="输入问题不能为空")

            # 根据 action 参数决定行为
            if action == "show_ds":
                return await self._aget_configured_metrics_info()
            
            # 添加额外信息
            background = self._add_extra_info(extra_info, knowledge_enhanced_information)
            
            # 异步初始化指标详情和样例
            metric_details, sample_data = await self._ainit_dip_metric_details_and_samples(input)
            
            errors = {}
            res = {}
            
            for i in range(self.retry_times):
                logger.debug(f"============" * 10)
                logger.debug(f"{i + 1} times to process DIP metric query (async)......")
                try:
                    llm_res, call_res = {}, {}
                    
                    # 配置 LLM 链
                    chain = self._config_chain(
                        metric_details=metric_details,
                        samples=sample_data,
                        errors=errors,
                        background=background
                    )
                    
                    # 异步调用 LLM
                    response = await chain.ainvoke({"input": input})
                    logger.debug(f"LLM 响应: {response.content}")
                    
                    # 解析响应
                    llm_res = self._parse_response(response.content)
                    logger.debug(f"解析后的结果: {llm_res}")
                    
                    # 获取指标ID和查询参数
                    metric_id = llm_res.get("metric_id", "")
                    param = llm_res.get("query_params", {})
                    
                    if metric_id == "":
                        if self.api_mode:
                            return {
                                "output": llm_res,
                                "full_output": llm_res
                            }
                        else:   
                            return llm_res
                    
                    metric_name = ""
                    for detail in metric_details:
                        if detail.get("id") == metric_id:
                            metric_name = detail.get("name")
                            break

                    # 添加引用信息
                    res["cites"] = [
                        {
                            "id": metric_id,
                            "name": metric_name,
                            "type": "metric"
                        }
                    ]
                    
                    res.update(llm_res)

                    # 执行查询
                    if metric_id and param:
                        call_res = await self._aexecute_query(metric_id, param)
                        logger.info(f"DIP Metric 调用结果: {call_res}")
                        
                        if call_res.get("error"):
                            raise Text2DIPMetricError(call_res["error"])
                        
                        # 先拷贝一份给大模型的结果
                        res_for_llm = res.copy()

                       
                        # 处理执行结果
                        execution_result, raw_result = self._process_execution_result(call_res)

                        # 更新给大模型的结果和原始结果
                        res_for_llm.update(execution_result)
                        res.update(raw_result)

                        # 设置标题
                        if res.get("title", "") == "":
                            res["title"] = input

                        if not raw_result.get("data"):
                            res_for_llm.pop("result_cache_key", None)
                            res_for_llm["message"] = "查询结果为空"

                            res.pop("result_cache_key", None)
                            break

                        # 将完整结果写入缓存, 如果数据为空，则不写入缓存
                        if self.session and raw_result.get("data"):
                            try:
                                self.session.add_agent_logs(
                                        self._result_cache_key,
                                        logs=res
                                    )
                            except Exception as e:
                                logger.error(f"添加缓存失败: str{e}")

                        # 如果成功获取结果，跳出重试循环
                        break
                    
                except Exception as e:
                    logger.error(f"第 {i + 1} 次异步处理查询失败: {e}")
                    logger.error(f"错误详情: {traceback.format_exc()}")
                    errors[f"error_{i+1}"] = str(e)
                    
                    print(traceback.format_exc())

                    # 如果是最后一次重试，抛出异常
                    if i == self.retry_times - 1:
                        logger.error(f"异步处理查询失败，已重试 {self.retry_times} 次, 错误详情: {errors}")
                        raise Text2DIPMetricError(reason=f"异步处理查询失败，已重试 {self.retry_times} 次", detail=errors)
                    
                    # 继续下一次重试
                    continue

            if self.api_mode:
                return {
                    "output": res_for_llm,
                    "full_output": res
                }
            else:   
                return res
            
        except Exception as e:
            logger.error(f"异步处理查询失败: {e}")
            print(traceback.format_exc())
            raise Text2DIPMetricError(f"异步处理查询失败: {e}")

    def _parse_response(self, response):
        """解析 LLM 响应"""
        try:
            # 尝试解析 JSON
            if isinstance(response, str):
                # 提取 JSON 部分
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start != -1 and json_end != 0:
                    json_str = response[json_start:json_end]
                    result = json.loads(json_str)
                else:
                    # 如果没有找到 JSON，返回默认格式
                    result = {
                        "metric_id": "",
                        "query_params": {},
                        "explanation": response
                    }
            else:
                result = {
                    "metric_id": "",
                    "query_params": {},
                    "explanation": str(response)
                }
            
            return result
            
        except Exception as e:
            logger.error(f"解析响应失败: {e}")
            return {
                "metric_id": "",
                "query_params": {},
                "explanation": f"解析响应失败: {e}",
                "raw_response": str(response)
            }

    def _execute_query(self, metric_id: str, query_params: dict):
        """执行指标查询"""
        try:
            if not self.dip_metric:
                return {"error": "DIP Metric 数据源未初始化"}
            
            # 调用指标查询
            result = self.dip_metric.call(metric_id, query_params)
            return result
            
        except Exception as e:
            logger.error(f"执行指标查询失败: {e}")
            return {"error": f"执行指标查询失败: {e}"}

    async def _aexecute_query(self, metric_id: str, query_params: dict):
        """异步执行指标查询"""
        try:
            if not self.dip_metric:
                return {"error": "DIP Metric 数据源未初始化"}
            
            # 异步调用指标查询
            result = await self.dip_metric.acall(metric_id, query_params)
            return result
            
        except Exception as e:
            logger.error(f"异步执行指标查询失败: {e}")
            return {"error": f"异步执行指标查询失败: {e}"}

    def _process_execution_result(self, result):
        """处理执行结果，参考 text2metric.py 的实现"""
        try:
            # 提取关键信息
            raw_result = {
                "step": result.get("step", ""),
                "unit": result.get("unit", ""),
                "unit_type": result.get("unit_type", ""),
                "data_summary": {},
                "result_cache_key": self._result_cache_key,
                # "dim_mapping": result.get("dim_mapping", {}),
                "data": []
            }

            processed = {}
            
            data = result["data"]
            total_records = len(data)

            # 数据统计信息
            raw_result["data_summary"] = {
                "total_data_points": total_records,
                "force_limit": self.force_limit,
                "step": result.get("step", ""),
                "unit": result.get("unit", ""),
                "unit_type": result.get("unit_type", "")
            }

            processed = raw_result.copy()

            # 处理数据摘要和精简
            if "data" in result and result["data"]:
                # 设置完整的数据
                raw_result["data"] = data

                # 加上 force_limit 限制
                if self.force_limit > 0:
                    data = data[:self.force_limit]
                    total_records = min(self.force_limit, total_records)
                
                if self.return_record_limit > 0 or self.return_data_limit > 0:
                    limited_data = []
                    data_len = 0
                    for i in range(total_records):
                        limited_data.append(data[i])
                        data_len += len(json.dumps(data[i], ensure_ascii=False))

                        # 超出数据量限制，至少返回一条数据
                        if self.return_data_limit > 0 and data_len >= self.return_data_limit:
                            break

                        # 超出记录数限制
                        if self.return_record_limit > 0 and len(limited_data) >= self.return_record_limit:
                            break

                    processed["data"] = limited_data
                    processed["data_desc"] = {
                        "return_records_num": len(limited_data),
                        "real_records_num": total_records,
                    }
                else:
                    processed["data"] = data
                    processed["data_desc"] = {
                        "return_records_num": total_records,
                        "real_records_num": total_records
                    }

            return processed, raw_result
            
        except Exception as e:
            logger.error(f"处理执行结果失败: {e}")
            print(traceback.format_exc())
            return {"error": f"处理执行结果失败: {e}"}

    def handle_result(
        self,
        log: Dict[str, Any],
        ans_multiple: ToolMultipleResult
    ) -> None:
        """处理结果，参考 text2metric.py 的实现"""
        if self.session:
            tool_res = self.session.get_agent_logs(
                self._result_cache_key
            )
            if tool_res:
                log["result"] = tool_res

                # 获取缓存的数据
                full_result = tool_res.get("full_result", {})
                data = full_result.get("data", [])
                
                # 添加到结果中
                ans_multiple.table.append(full_result)
                ans_multiple.new_table.append({"title": full_result.get("title", "DIP Metric 查询结果"), "data": data})
                
                # 设置缓存键信息
                cache_result = {
                    "tool_name": "text2metric",
                    "title": full_result.get("title", "text2metric"),
                    "is_empty": len(data) == 0,
                    "fields": list(data[0].keys()) if data else [],
                }
                
                ans_multiple.cache_keys[self._result_cache_key] = cache_result

    @classmethod
    def from_dip_metric(
        cls,
        dip_metric: DIPMetric,
        llm: Optional[Any] = None,
        prompt_manager: Optional[BasePromptManager] = None,
        session_id: Optional[str] = "",
        api_mode: bool = False,
        *args,
        **kwargs
    ):
        """从 DIP Metric 创建工具实例"""
        instance = cls(
            dip_metric=dip_metric,
            llm=llm,
            prompt_manager=prompt_manager,
            session_id=session_id,
            api_mode=api_mode,
            *args, **kwargs)

        return instance

    @classmethod
    @api_tool_decorator
    async def as_async_api_cls(
        cls,
        params: dict = Body(...),
        stream: bool = False,
        mode: str = "http"
    ):
        """异步 API 调用"""
        try:
            logger.debug(f"异步 API 调用参数: {params}")
            # Data Source Params (参考 text2sql 的结构)
            data_source = params.get("data_source", {})
            token = data_source.get('token', '')
            # user = data_source.get('user', '')
            # password = data_source.get('password', '')
            base_url = data_source.get('base_url', '')
            user_id = data_source.get('user_id', '')
            account_type = data_source.get('account_type', 'user')
            kn_params = data_source.get('kn', [])
            search_scope = data_source.get('search_scope', [])
            recall_mode = data_source.get('recall_mode', _SETTINGS.DEFAULT_AGENT_RETRIEVAL_MODE)

            # 设置指标列表（从 data_source 中获取）
            # 可能格式为：
            # {
            #     "metric_list": ["metric_id1", "metric_id2", "metric_id3"]
            # }
            # 或者
            # {
            #     "metric_list": [
            #         {
            #             "metric_model_id": "metric_id1"
            #         }
            #       ]
            # }
            metric_list = data_source.get("metric_list", [])

            if metric_list:
                if isinstance(metric_list, str):
                    metric_list = metric_list.split(",")
                elif isinstance(metric_list, list):
                    if isinstance(metric_list[0], str):
                        # 预期的正确结构
                        pass
                    elif isinstance(metric_list[0], dict):
                        # Data Agent 的结构
                        metric_list = [item.get("metric_model_id", "") for item in metric_list]
                    else:
                        logger.error(f"指标列表格式不正确: {metric_list}")
                        raise Text2DIPMetricError(detail="指标列表格式不正确", reason="指标列表格式不正确")
                else:
                    logger.error(f"指标列表格式不正确: {metric_list}")
                    raise Text2DIPMetricError(detail="指标列表格式不正确", reason="指标列表格式不正确")

            # 从知识网络中获取指标列表
            if kn_params:
                headers = {
                    "x-user": user_id,
                    "x-account-id": user_id,
                    "x-account-type": account_type
                }
                if token:
                    headers["Authorization"] = token
                
                for kn_param in kn_params:
                    if type(kn_param) == dict:
                        kn_id = kn_param.get('knowledge_network_id', '')
                    else:
                        kn_id = kn_param

                    _, metrics, _ = await get_datasource_from_agent_retrieval_async(
                        kn_id=kn_id,
                        query=params.get('input', '_'),
                        headers=headers,
                        base_url=base_url,
                        search_scope=search_scope,
                        mode=recall_mode
                    )

                # "id", "name", "display_name", "comment"
                for metric in metrics:
                    metric_list.append(metric.get("id", ""))

            # 创建 DIP Metric 实例
            dip_metric = DIPMetric(
                token=token,
                user_id=user_id,
                base_url=base_url,
                account_type=account_type,
                metric_list=metric_list
            )

            llm_headers = {
                "x-user": user_id,
                "x-account-id": user_id,
                "x-account-type": account_type
            }
 
            # LLM Params
            llm_dict = parse_llm_from_model_factory(params.get("inner_llm", {}), headers=llm_headers)
            llm_dict.update(params.get("llm", {}))
            llm = CustomChatOpenAI(**llm_dict)
            
            # Config Params
            config_dict = params.get("config", {}).copy()  # 复制一份，避免修改原始字典
            
            # 提取并设置配置参数
            recall_top_k = config_dict.pop("recall_top_k", _SETTINGS.INDICATOR_RECALL_TOP_K)
            dimension_num_limit = config_dict.pop("dimension_num_limit", _SETTINGS.TEXT2METRIC_DIMENSION_NUM_LIMIT)

            # 创建工具实例
            tool = cls.from_dip_metric(
                dip_metric,
                llm=llm,
                api_mode=True,
                recall_top_k=recall_top_k,
                dimension_num_limit=dimension_num_limit,
                **config_dict
            )

            # Infos Params
            infos = params.get("infos", {})
            infos['input'] = params.get('input', '')
            infos['action'] = params.get('action', 'query')
            
            # 执行查询
            result = await tool.ainvoke(input=infos)
            return result
            
        except Exception as e:
            logger.error(f"异步 API 调用失败: {e}")
            raise e

    @staticmethod
    async def get_api_schema():
        """获取 API Schema"""
        return {
            "post": {
                "summary": "text2metric",
                "description": "根据文本生成指标查询参数, 并查询指标数据",
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
                                    "data_source": {
                                        "type": "object",
                                        "description": "数据源配置信息",
                                        "properties": {
                                            "metric_list": {
                                                "type": "array",
                                                "description": "指标ID列表",
                                                "items": {
                                                    "type": "string"
                                                }
                                            },
                                            "base_url": {
                                                "type": "string",
                                                "description": "服务器地址"
                                            },
                                            "token": {
                                                "type": "string",
                                                "description": "认证令牌"
                                            },
                                            "user_id": {
                                                "type": "string",
                                                "description": "用户ID"
                                            },
                                            "account_type": {
                                                "type": "string",
                                                "description": "调用者的类型，user 代表普通用户，app 代表应用账号，anonymous 代表匿名用户",
                                                "enum": ["user", "app", "anonymous"],
                                                "default": "user"
                                            },
                                            "kn": {
                                                "type": "array",
                                                "description": "知识网络配置参数",
                                                "items": {
                                                    "type": "object",
                                                    "properties": {
                                                        "knowledge_network_id": {
                                                            "type": "string",
                                                            "description": "知识网络ID"
                                                        },
                                                        "object_types": {
                                                            "type": "array",
                                                            "description": "知识网络对象类型",
                                                            "items": {
                                                                "type": "string"
                                                            }
                                                        }
                                                    },
                                                    "required": ["knowledge_network_id"]
                                                }
                                            },
                                            "search_scope": {
                                                "type": "array",
                                                "description": "知识网络搜索范围，支持 object_types, relation_types, action_types",
                                                "items": {
                                                    "type": "string"
                                                }
                                            },
                                            "recall_mode": {
                                                "type": "string",
                                                "description": "召回模式，支持 keyword_vector_retrieval(默认), agent_intent_planning, agent_intent_retrieval",
                                                "enum": ["keyword_vector_retrieval", "agent_intent_planning", "agent_intent_retrieval"],
                                                "default": "keyword_vector_retrieval"
                                            }
                                        }
                                    },
                                    "inner_llm": {
                                        "type": "object",
                                        "description": "内部语言模型配置，用于指定内部使用的 LLM 模型参数，如模型ID、名称、温度、最大token数等。支持通过模型工厂配置模型"
                                    },
                                    "llm": {
                                        "type": "object",
                                        "description": "外部大语言模型配置，一般不需要配置，除非需要使用外部模型",
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
                                            },
                                            "max_tokens": {
                                                "type": "integer",
                                                "description": "最大生成令牌数"
                                            },
                                            "temperature": {
                                                "type": "number",
                                                "description": "生成温度参数"
                                            }
                                        }
                                    },
                                    "config": {
                                        "type": "object",
                                        "description": "工具配置参数",
                                        "properties": {
                                            "background": {
                                                "type": "string",
                                                "description": "背景信息"
                                            },
                                            "session_type": {
                                                "type": "string",
                                                "description": "会话类型",
                                                "enum": [
                                                    "in_memory",
                                                    "redis"
                                                ],
                                                "default": "redis"
                                            },
                                            "session_id": {
                                                "type": "string",
                                                "description": "会话ID"
                                            },
                                            "force_limit": {
                                                "type": "integer",
                                                "description": f"查询指标时，如果没有设置返回数据条数限制，在采用该参数设置的值作为限制, -1表示不限制, 系统默认为 {_SETTINGS.TEXT2METRIC_FORCE_LIMIT}",
                                                "default": _SETTINGS.TEXT2METRIC_FORCE_LIMIT
                                            },
                                            "recall_top_k": {
                                                "type": "integer",
                                                "description": f"指标召回数量限制，用于限制从数据源中召回的指标数量，-1表示不限制, 系统默认为 {_SETTINGS.INDICATOR_RECALL_TOP_K}",
                                                "default": _SETTINGS.INDICATOR_RECALL_TOP_K
                                            },
                                            "dimension_num_limit": {
                                                "type": "integer",
                                                "description": f"给大模型选择时维度数量限制，-1表示不限制, 系统默认为 {_SETTINGS.TEXT2METRIC_DIMENSION_NUM_LIMIT}",
                                                "default": _SETTINGS.TEXT2METRIC_DIMENSION_NUM_LIMIT
                                            },
                                            "return_record_limit": {
                                                "type": "integer",
                                                "description": f"结果返回时数据条数限制，-1表示不限制, 原因是指标查询执行后返回大量数据，可能导致大模型上下文token超限。系统默认为 {_SETTINGS.RETURN_RECORD_LIMIT}",
                                                "default": _SETTINGS.RETURN_RECORD_LIMIT
                                            },
                                            "return_data_limit": {
                                                "type": "integer",
                                                "description": f"结果返回时数据总量限制，单位是字节，-1表示不限制, 原因是指标查询执行后返回大量数据，可能导致大模型上下文token超限。系统默认为 {_SETTINGS.RETURN_DATA_LIMIT}",
                                                "default": _SETTINGS.RETURN_DATA_LIMIT
                                            },
                                        }
                                    },
                                    "infos": {
                                        "type": "object",
                                        "description": "额外的输入信息, 包含额外信息和知识增强信息",
                                        "properties": {
                                            "knowledge_enhanced_information": {
                                                "type": "object",
                                                "description": "知识增强信息"
                                            },
                                            "extra_info": {
                                                "type": "string",
                                                "description": "额外信息(非知识增强)"
                                            }
                                        }
                                    },
                                    "input": {
                                        "type": "string",
                                        "description": "用户输入的自然语言查询"
                                    },
                                    "action": {
                                        "type": "string",
                                        "description": "操作类型：show_ds 显示数据源信息，query 执行查询（默认）",
                                        "enum": [
                                            "show_ds",
                                            "query"
                                        ],
                                        "default": "query"
                                    },
                                    "timeout": {
                                        "type": "number",
                                        "description": "请求超时时间（秒），超过此时间未完成则返回超时错误，默认120秒",
                                        "default": 120
                                    }
                                },
                                "required": [
                                    "data_source",
                                    "input"
                                ]
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
                                        "title": {
                                            "type": "string",
                                            "description": "查询标题"
                                        },
                                        "data": {
                                            "type": "array",
                                            "description": "查询结果数据",
                                            "items": {
                                                "type": "object"
                                            }
                                        },
                                        "data_desc": {
                                            "type": "object",
                                            "description": "数据描述信息",
                                            "properties": {
                                                "return_records_num": {
                                                    "type": "integer",
                                                    "description": "返回记录数"
                                                },
                                                "real_records_num": {
                                                    "type": "integer",
                                                    "description": "实际记录数"
                                                }
                                            }
                                        },
                                        "metric_id": {
                                            "type": "string",
                                            "description": "选择的指标ID，基于用户输入自动匹配并选择的指标标识符"
                                        },
                                        "query_params": {
                                            "type": "object",
                                            "description": "生成的查询参数，包含时间范围、过滤条件、步长等指标查询所需的参数"
                                        },
                                        "explanation": {
                                            "type": "object",
                                            "description": "查询解释说明，以字典形式展示指标选择、时间范围、过滤条件等信息的业务含义"
                                        },
                                        "cites": {
                                            "type": "array",
                                            "description": "引用的指标列表，包含指标ID、名称、类型等信息",
                                            "items": {
                                                "type": "object"
                                            }
                                        },
                                        "result_cache_key": {
                                            "type": "string",
                                            "description": "结果缓存键，用于从缓存中获取完整查询结果，前端可通过此键获取完整数据"
                                        },
                                        "execution_result": {
                                            "type": "object",
                                            "description": "指标执行结果详情，包含指标元信息、数据摘要、样例数据等"
                                        }
                                    }
                                },
                                "example": {
                                    "output": {
                                        "metric_id": "cpu_usage_metric",
                                        "query_params": {
                                            "instant": False,
                                            "start": 1646360670123,
                                            "end": 1646471470123,
                                            "step": "1m",
                                            "filters": [
                                                {
                                                    "name": "labels.host",
                                                    "value": [
                                                        "server-1",
                                                        "server-2"
                                                    ],
                                                    "operation": "in"
                                                }
                                            ]
                                        },
                                        "explanation": {
                                            "CPU使用率": [
                                                {
                                                    "指标": "使用 'CPU使用率' 指标，按 '时间' '最近1小时' 的数据，并设置过滤条件 '主机为server-1和server-2'"
                                                },
                                                {
                                                    "时间": "从 2024-01-01 到 2024-01-02"
                                                },
                                                {
                                                    "主机": "包含 server-1, server-2"
                                                }
                                            ]
                                        },
                                        "cites": [
                                            {
                                                "id": "cpu_usage_metric",
                                                "name": "CPU使用率",
                                                "type": "metric",
                                                "description": "CPU使用率指标"
                                            }
                                        ],
                                        "data": [
                                            {
                                                "时间": "2024-01-01 10:00:00",
                                                "主机": "server-1",
                                                "CPU使用率": 75.5
                                            },
                                            {
                                                "时间": "2024-01-01 10:01:00",
                                                "主机": "server-1",
                                                "CPU使用率": 78.2
                                            }
                                        ],
                                        "title": "最近1小时CPU使用率",
                                        "data_desc": {
                                            "return_records_num": 2,
                                            "real_records_num": 120
                                        },
                                        "execution_result": {
                                            "success": True,
                                            "model_info": {
                                                "id": "cpu_usage_metric",
                                                "name": "CPU使用率",
                                                "metric_type": "atomic",
                                                "query_type": "dsl",
                                                "unit": "%"
                                            },
                                            "data_summary": {
                                                "total_data_points": 120,
                                                "step": "1m",
                                                "is_variable": False,
                                                "is_calendar": False
                                            },
                                            "sample_data": [
                                                {
                                                    "index": 1,
                                                    "labels": {
                                                        "host": "server-1"
                                                    },
                                                    "time_points": 120,
                                                    "value_points": 120,
                                                    "sample_times": [
                                                        1646360670123,
                                                        1646360730123
                                                    ],
                                                    "sample_values": [
                                                        75.5,
                                                        78.2
                                                    ]
                                                }
                                            ]
                                        },
                                        "result_cache_key": "cpu_usage_metric_1646360670123_1646471470123"
                                    },
                                    "time": "2.5",
                                    "tokens": "150"
                                }
                            }
                        }
                    }
                }
            }
        }
    
    @staticmethod
    def get_mock_result():
        res =  {
            "cites": [{
                    "id": "mock",
                    "name": "立白销量",
                    "type": "metric"
                }
            ],
            "unit": "件",
            "id": "mock",
            "params": {
                "filters": [{
                    "name": "品牌",
                    "operation": "=",
                    "value": "小白白品牌"
                }
                ],
                "start": 1646360670123,
                "end": 1646471470123,
                "step": "1m",
                "instant": False
            },
            "explanation": {
                "立白销量": [{
                        "指标": "使用 '立白销量' 指标，按 '时间' '2024年1月到2024年12月' 的数据，并设置过滤条件 '品牌为小白白品牌'"
                    }, {
                        "时间": "从 2024-01-01 到 2024-12-31"
                    }, {
                        "日期(按月)": "全部"
                    }, {
                        "品牌": "等于 小白白品牌"
                    }
                ]
            },
            "title": "2024年小白白品牌每月销量",
            "data": [{
                    "日期(月)": "2024-01",
                    "立白销量": 1694.1372677178583
                }, {
                    "日期(月)": "2024-02",
                    "立白销量": 1667.5650000348517
                }, {
                    "日期(月)": "2024-03",
                    "立白销量": 1691.206653715858
                }
            ],
            "result_cache_key": "mock_result_key",
            "execution_result": {
                "success": True,
                "model_info": {
                    "id": "mock",
                    "name": "立白销量",
                    "metric_type": "atomic",
                    "query_type": "sql",
                    "unit": "件"
                },
                "data_summary": {
                    "total_data_points": 120,
                    "step": "1m",
                    "is_variable": False,
                    "is_calendar": False
                },
                "sample_data": []
            },
            "time": "18.41778826713562",
            "tokens": "0",
        }

        return {
            "output": res,
            "full_output": res
        }
    

if __name__ == '__main__':
    async def main():
        """测试函数"""
        from af_agent.tools.base import validate_openapi_schema
        is_valid, error_msg = validate_openapi_schema(await Text2DIPMetricTool.get_api_schema())
        print(f"验证结果: {is_valid}, 错误信息: {error_msg}")

        # 创建 Mock DIP Metric
        # from af_agent.datasource.dip_metric import MockDIPMetric
        
        # dip_metric = MockDIPMetric(token="test_token")
        # dip_metric.set_data_list(["metric_1", "metric_2"])
        
        # # 创建工具实例
        # tool = Text2DIPMetricTool.from_dip_metric(dip_metric)
        
        # # 测试查询
        # result = await tool._aprocess_query(
        #     "查询最近1小时的CPU使用率",
        #     "",
        #     [],
        #     {}
        # )
        
        # print("查询结果:", json.dumps(result, ensure_ascii=False, indent=2))

    import asyncio
    asyncio.run(main())
