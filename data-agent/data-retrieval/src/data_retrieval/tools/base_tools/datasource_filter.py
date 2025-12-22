import json
import traceback
from io import StringIO
from textwrap import dedent
from typing import Optional, Type, Any, List, Dict
from collections import OrderedDict
from enum import Enum
import re
import asyncio

import pandas as pd
from langchain.tools import BaseTool
from langchain_core.callbacks import CallbackManagerForToolRun, AsyncCallbackManagerForToolRun
from langchain_core.pydantic_v1 import BaseModel, Field, PrivateAttr
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate
)
from langchain_core.messages import HumanMessage, SystemMessage

from pandas import Timestamp
from data_retrieval.logs.logger import logger
from data_retrieval.sessions import BaseChatHistorySession, CreateSession
from data_retrieval.tools.base import ToolName
from data_retrieval.tools.base import ToolResult, ToolMultipleResult, LLMTool, _TOOL_MESSAGE_KEY
from data_retrieval.tools.base import construct_final_answer, async_construct_final_answer
from data_retrieval.errors import Json2PlotError, ToolFatalError
from data_retrieval.tools.base import api_tool_decorator

from data_retrieval.datasource.vega_datasource import VegaDataSource
from data_retrieval.datasource.af_indicator import AFIndicator

from data_retrieval.prompts.tools_prompts.datasource_filter_prompt import DataSourceFilterPrompt
from data_retrieval.utils.model_types import ModelType4Prompt
from data_retrieval.parsers.base import BaseJsonParser

from fastapi import FastAPI, HTTPException


class DataSourceDescSchema(BaseModel):
    id: str = Field(description="数据源的 id, 为一个字符串")
    title: str = Field(description="数据源的名称")
    type: str = Field(description="数据源的类型")
    description: str = Field(description="数据源的描述")
    columns: Any = Field(default=None, description="数据源的字段信息")


class ArgsModel(BaseModel):
    query: str = Field(default="", description="用户的完整查询需求，如果是追问，则需要根据上下文总结")
    search_tool_cache_key: str = Field(default="", description=f"搜索工具的缓存 key, 不能编造该信息, 注意不是数据资源的 ID, 只能是 {ToolName.from_sailor.value} 工具的缓存 key")
    # data_source_list: Optional[List[str]] = Field(default=[], description=f"数据源的列表, 每个列表都是一个字典, 格式为: {DataSourceDescSchema.schema_json(ensure_ascii=False)}")


class DataSourceFilterTool(LLMTool):
    name: str = ToolName.from_datasource_filter.value
    description: str = dedent(f"""
数据资源过滤工具，当用户使用 {ToolName.from_sailor.value} 工具查询到数据资源后，可以通过该工具在结果中过滤出符合要求的数据源，该工具会进一步查询出数据源的字段详情进行进一步过滤。该工具必须和 {ToolName.from_sailor.value} 工具配合使用。

参数:
- query: 查询语句
- search_tool_cache_key:  只能是 {ToolName.from_sailor.value} 工具的缓存 key，注意不是数据资源的 ID

如果没有 search_tool_cache_key 信息, 则不要使用该工具, 否则会出现严重错误
"""
    )
    args_schema: Type[BaseModel] = ArgsModel
    with_sample: bool = False
    data_source_num_limit: int = -1
    dimension_num_limit: int = -1
    session_type: str = "redis"
    session: Optional[BaseChatHistorySession] = None

    token: str = ""
    user_id: str = ""
    background: str = ""


    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if kwargs.get("session") is None:
            self.session = CreateSession(self.session_type)

    def _config_chain(
        self,
        data_source_list: List[dict] = [],
        data_source_list_description: str = ""
    ):
        system_prompt = DataSourceFilterPrompt(
            data_source_list=data_source_list,
            prompt_manager=self.prompt_manager,
            language=self.language,
            data_source_list_description=data_source_list_description,
            background=self.background
        )

        logger.debug(f"{ToolName.from_datasource_filter.value} -> model_type: {self.model_type}")

        if self.model_type == ModelType4Prompt.DEEPSEEK_R1.value:
            prompt = ChatPromptTemplate.from_messages(
                [
                    HumanMessage(
                        content="下面是你的任务，请务必牢记" + system_prompt.render(),
                        additional_kwargs={_TOOL_MESSAGE_KEY: ToolName.from_datasource_filter.value}
                    ),
                    HumanMessagePromptTemplate.from_template("{input}")
                ]
            )
        else:
            prompt = ChatPromptTemplate.from_messages(
                [
                    SystemMessage(
                        content=system_prompt.render(),
                        additional_kwargs={_TOOL_MESSAGE_KEY: ToolName.from_datasource_filter.value}
                    ),
                    HumanMessagePromptTemplate.from_template("{input}")
                ]
            )

        chain = (
            prompt
            | self.llm
            | BaseJsonParser()
        )
        return chain
        

    @construct_final_answer
    def _run(
        self,
        input: str,
        search_tool_cache_key: Optional[str] = "",
        # data_source_list: Optional[List[str]] = [],
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ):
        return asyncio.run(self._arun(
            input,
            search_tool_cache_key=search_tool_cache_key,
            #  data_source_list=data_source_list,
            run_manager=run_manager)
        )

    @async_construct_final_answer
    async def _arun(
        self,
        query: str,
        search_tool_cache_key: Optional[str] = "",
        # data_source_list: Optional[List[str]] = [],
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None,
    ):
        data_view_list, metric_list = OrderedDict(), OrderedDict()
        data_view_metadata, metric_metadata = {}, {}

        if search_tool_cache_key:
            tool_res = self.session.get_agent_logs(
                search_tool_cache_key
            )
            if tool_res:
                data_source_list = tool_res.get("cites", [])
                data_source_list_description = tool_res.get("description", "")
            else:
                return {
                    "result": f"搜索工具的缓存 key 不存在: {search_tool_cache_key}"
                }

        for data_source in data_source_list:
            if data_source["type"] == "data_view":
                data_view_list[data_source["id"]] = data_source
            elif data_source["type"] == "indicator":
                metric_list[data_source["id"]] = data_source
            else:
                return {
                    "result": f"数据源类型错误: {data_source['type']}"
                }

        if len(data_view_list) > 0:
            data_view_source = VegaDataSource(
                view_list=list(data_view_list.keys()),
                token=self.token,
                user_id=self.user_id
            )

            try:
                data_view_metadata = data_view_source.get_meta_sample_data(
                    query,
                    self.data_source_num_limit,
                    self.dimension_num_limit,
                    self.with_sample
                )

                for k, v in data_view_list.items():
                    for detail in data_view_metadata["detail"]:
                        if detail["id"] == k:
                            v["columns"] = detail.get("en2cn", {})
                            break
            except Exception as e:
                logger.error(f"获取数据视图元数据失败: {e}")
                # raise ToolFatalError(f"获取数据视图元数据失败: {e}")

        if len(metric_list) > 0:
            metric_source = AFIndicator(
                indicator_list=list(metric_list.keys()),
                token=self.token,
                user_id=self.user_id
            )
            try:    
                metric_metadata = metric_source.get_details(
                    input_query=query,
                    indicator_num_limit=self.data_source_num_limit,
                    input_dimension_num_limit=self.dimension_num_limit
                )

                for k, v in metric_list.items():
                    for detail in metric_metadata["details"]:
                        if detail["id"] == k:
                            v["columns"] = {
                                dimension["technical_name"]: dimension["business_name"]
                                for dimension in detail.get("dimensions", [])
                            }
                            break
            
            except Exception as e:
                logger.error(f"获取指标元数据失败: {str(e)}")
                # raise ToolFatalError(f"获取指标元数据失败: {e}")
        
        if not data_view_list and not metric_list:
            return {
                "result": f"没有找到符合要求的数据源"
            }
            # raise ToolFatalError(f"没有找到符合要求的数据源")

        chain = self._config_chain(
            data_source_list = list(data_view_list.values()) + list(metric_list.values()),
            data_source_list_description=data_source_list_description
        )

        try:
            result = await chain.ainvoke({"input": query})

            result_datasource_list = []

            view_ids = [data_view["id"] for data_view in data_view_list.values()]
            metric_ids = [metric["id"] for metric in metric_list.values()]

            for res in result["result"]:
                if res["id"] in view_ids:
                    # 结果中补充 title
                    res["title"] = data_view_list[res["id"]].get("title", "")
                    result_datasource_list.append(res)
                elif res["id"] in metric_ids:
                    res["title"] = metric_list[res["id"]].get("title", "")
                    result_datasource_list.append(res)

            logger.info(f"result_datasource_list: {result_datasource_list}")

            self.session.add_agent_logs(
                self._result_cache_key,
                logs={
                    "result": result_datasource_list,
                    "cites": [
                        {
                            "id": data_source["id"],
                            "type": data_source["type"],
                            "title": data_source["title"],
                        } for data_source in result_datasource_list
                    ]
                }
            )
        except Exception as e:
            logger.error(f"获取数据源失败: {str(e)}")
            raise ToolFatalError(f"获取数据源失败: {str(e)}")

        # 给大模型的数据
        return result_datasource_list

    def handle_result(
        self,
        log: Dict[str, Any],
        ans_multiple: ToolMultipleResult
    ) -> None:
        tool_res = self.session.get_agent_logs(
            self._result_cache_key
        )
        if tool_res:
            log["result"] = tool_res

            # 替换 cites
            if tool_res.get("cites"):
                ans_multiple.cites = tool_res.get("cites", [])
