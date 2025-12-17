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

# import faiss
from langchain.callbacks.manager import (AsyncCallbackManagerForToolRun,
                                         CallbackManagerForToolRun)

from langchain.pydantic_v1 import BaseModel, Field, PrivateAttr
from langchain.pydantic_v1.dataclasses import dataclass
from langchain.tools import BaseTool

from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS
from langchain_community.vectorstores.utils import DistanceStrategy

from langchain_core.documents import Document
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate
)
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.messages import SystemMessage, HumanMessage
from af_agent.errors import Text2MetricError, ToolFatalError
from af_agent.logs.logger import logger
from af_agent.parsers.text2metric_parser import Text2MetricParser
from af_agent.prompts.tools_prompts.text2metric_prompt import Text2MetricPrompt, Text2MetricPromptFunc
from af_agent.prompts.tools_prompts.text2metric_prompt.rewrite_query import RewriteMetricQueryPrompt
from af_agent.parsers.base import BaseJsonParser

from af_agent.sessions import CreateSession, BaseChatHistorySession
from af_agent.tools.base import construct_final_answer, async_construct_final_answer, ToolCallbackHandler
from af_agent.tools.base import LLMTool, ToolMultipleResult, ToolName
from af_agent.tools.base_tools.context2question import achat_history_to_question, chat_history_to_question
from af_agent.utils.embeddings import M3EEmbeddings, MSE_EMBEDDING_SIZE
from af_agent.utils.func import JsonParse, json_to_markdown
from af_agent.tools.base import LLMTool, _TOOL_MESSAGE_KEY
from af_agent.prompts.manager.base import BasePromptManager
from af_agent.settings import get_settings
from af_agent.tools.base import api_tool_decorator, _TOOL_MESSAGE_KEY
from af_agent.utils.llm import CustomChatOpenAI
from af_agent.api.auth import get_authorization
from af_agent.datasource.af_indicator import AFIndicator
from af_agent.tools.base import parse_llm_from_model_factory

from af_agent.utils.model_types import ModelType4Prompt


_SETTINGS = get_settings()

_DESCS = {
    "tool_description": {
        "cn": "根据文本，以及指标的列表来生成指标调用参数，每次工具只能调用一个指标但是可以设置不同的查询条件。如果获取的数据太长的话，只返回局部数据，全部数据在缓存中。结果中有一个 data_desc 的对象来记录返回数据条数和实际结果条数，请告知用户查看详细数据，应用程序会获取",
        "en": "call corresponding indicators based on user input text, only one indicator at a time, if the question contains multiple indicators, please call multiple times, the result has a data_desc object to record the number of returned data and the actual number of results, please tell the user to check the detailed data, the application will get it",
    },
    "chat_history": {
        "cn": "对话历史",
        "en": "chat history",
    },
    "input": {
        "cn": "一个清晰完整的文本",
        "en": "A clear and complete question",
    },
    "desc_for_yoy_or_mom": {
        "cn": "\n支持同比环比计算，直接输入包含同环比计算的问题，不需要调用多次获取不同统计周期的数据",
        "en": "\nSupport period-on-period calculation, it can be called directly without calling multiple times to get data of different periods",
    },
    "desc_from_datasource": {
        "cn": "\n- 包含的指标信息：{desc}",
        "en": "\nThe detailed description of the indicator: \n{desc}",
    }
}


class MetricDescSchema(BaseModel):
    id: str = Field(description="指标的 id, 格式为 str")
    name: str = Field(description="指标的名称")
    type: str = Field(description="指标的类型")


class Text2MetricInput(BaseModel):
    input: str = Field(description=_DESCS["input"]["cn"])
    knowledge_enhanced_information: Optional[Any] = Field(default={}, description="调用知识增强工具获取的信息，如果调用知识增强工具，请填写该参数")

    extra_info: Optional[str] = Field(
        default="",
        description="附加信息，但不是知识增强的信息"
    )


class Text2MetricInputWithMetricList(Text2MetricInput):
    metric_list: List[MetricDescSchema] = Field(default=[], description=f"指标列表，注意指标指的一个数据源，不是字段信息，当已经初始化过虚拟视图列表时，不需要填写该参数。如果需要填写该参数，请确保`上下文缓存的数据资源中存在`，不要随意生成。注意参数一定要准确。格式为 {MetricDescSchema.schema_json(ensure_ascii=False)}")


class Text2MetricTool(LLMTool):
    name: str = ToolName.from_text2metric.value
    description: str = _DESCS["tool_description"]["cn"]
    background: str = ""
    args_schema: Type[BaseModel] = Text2MetricInput
    indicator: AFIndicator = None
    retry_times: int = 3
    session_type: str = "redis"
    session_id: Optional[str] = ""
    session: Optional[BaseChatHistorySession] = None
    # with_context: bool = False  # 是否使用上下文
    with_execution: bool = True  # 是否执行指标函数
    get_desc_from_datasource: bool = False  # 是否从数据源获取描述
    enable_yoy_or_mom: bool = False  # 是否启用同比环比
    essential_explain: bool = True  # 是否只展示必要的解释
    with_sample_data: bool = True   # 是否从逻辑是同中获取样例数据
    dimension_num_limit: int = int(_SETTINGS.TEXT2METRIC_DIMENSION_NUM_LIMIT)
    recall_top_k: int = int(_SETTINGS.INDICATOR_RECALL_TOP_K)
    rewrite_query: bool = bool(_SETTINGS.INDICATOR_REWRITE_QUERY)  # 是否重写指标查询语句
    model_type: str = _SETTINGS.TEXT2METRIC_MODEL_TYPE
    return_record_limit: int = _SETTINGS.RETURN_RECORD_LIMIT
    return_data_limit: int = _SETTINGS.RETURN_DATA_LIMIT    

    _initial_metric_ids: List[str] = PrivateAttr(default=[]) # 工具初始化时设置的指标id列表

    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)
        if self.enable_yoy_or_mom:
            self.description += _DESCS["desc_for_yoy_or_mom"][self.language]

        if kwargs.get("session") is None:
            self.session = CreateSession(self.session_type)
        
        if kwargs.get("manager") is not None:
            self.prompt_manager = kwargs.get("manager")
        
        if self.indicator and self.indicator.get_data_list():
            self._initial_metric_ids = self.indicator.get_data_list()
        else:
            self.args_schema = Text2MetricInputWithMetricList

        # 如果 get_desc_from_datasource 为 True，则获取数据源的描述
        self._get_desc_from_datasource(self.get_desc_from_datasource)

    def _get_desc_from_datasource(self, get_desc_from_datasource: bool):
        
        if get_desc_from_datasource:
            if self.indicator:
                desc = self.indicator.get_description()
                if desc:
                    self.description += _DESCS["desc_from_datasource"][self.language].format(
                        desc=desc
                )
        if not self.indicator.get_data_list():
            self.description += _DESCS["desc_from_datasource"]["cn"].format(
                desc=f"工具初始化时没有提供指标数据源，调用前需要使用 `{ToolName.from_sailor.value}` 工具搜索，并基于结果初始化"
            )

    @classmethod
    def from_indicator(
        cls,
        indicator: AFIndicator,
        llm: Optional[Any] = None,
        prompt_manager: Optional[BasePromptManager] = None,
        session_id: Optional[str] = "",
        *args,
        **kwargs
    ):
        """Create a new instance of Text2MetricTool

        Args:
            indicator (AFIndicator): AFIndicator instance
            llm (Optional[Any], optional): Language model instance. Defaults to None.

        Returns:
            Text2MetricTool: Text2MetricTool instance
        """
        return cls(indicator=indicator, llm=llm, manager=prompt_manager, session_id=session_id, *args, **kwargs)

    def get_chat_history(
        self,
        session_id,
    ):
        history = self.session.get_chat_history(
            session_id=session_id
        )
        return history

    def _init_indicator_details_and_samples(self, input_question=""):
        details = self.indicator.get_details(
            input_question,
            self.recall_top_k,
            self.dimension_num_limit).get("details", [])

        indicator_details = []
        # docs_in_vectorstore = []

        samples_dict = {}
        samples = []
        for i, detail in enumerate(details):
            desc = {
                "id": detail["id"],
                "name": detail["name"],
                "description": detail["description"],
            }

            if self.with_sample_data:
                desc["refer_view_name"] = detail["refer_view_name"]

                if desc["refer_view_name"] != "" and desc["refer_view_name"] not in samples_dict:
                    refer_view_id = detail["refer_view_id"]
                    old_sample = samples_dict.get(desc["refer_view_name"], {})

                    sample = self.indicator.get_sample_from_data_view(
                        refer_view_id,
                        [ dim["technical_name"] for dim in detail["dimensions"] ]
                    )

                    samples_dict[desc["refer_view_name"]] = sample | old_sample

            # Markdown can be more confusing for some model
            detail_str = f"#### Inidcator - {i+1}: \n"
            detail_str += json_to_markdown([desc]) + '\n'
            detail_str += "**Dimensions Details**: \n" + json_to_markdown(detail["dimensions"]) + '\n\n'


            # desc["dimensions"] = detail["dimensions"]
            # detail_str = json.dumps(desc, ensure_ascii=False)

            # Use metadata to store detail_str, use name + description to search
            # to prevent additional information from affecting the search results
            indicator_details.append(detail_str)
            
            # 如果 input_question 为空，说明是第一次调用，需要将指标详情添加到向量存储中
            # if not input_question:
            #     docs_in_vectorstore.append(
            #         Document(
            #             page_content=f"{desc['name']}\n{desc['description']}",
            #         metadata={
            #             "detail": detail_str
            #         }
            #         )
            #     )

        # try:
        #     if not input_question and self.vectorstore:
        #         # Clear vector store before add new docs
        #         assert len(docs_in_vectorstore) > 0
        #         if len(docs_in_vectorstore) > 0:
        #             self.vectorstore.add_documents(docs_in_vectorstore)
        #         else:
        #             raise ToolFatalError(reason="未获取到指标详情", detail="")
        # # TODO i18n
        # except Exception as e:
        #     logger.error(f"Error: {e}, traceback: {traceback.format_exc()}")
        #     self.vectorstore = None
        #     # raise ToolFatalError(reason="指标描述向量存储失败", detail=e) from e

        for k, v in samples_dict.items():
            samples.append({
                "refer_view_name": k,
                "sample_data": v
            })
        logger.debug(f"indicator_details: {indicator_details}\n, samples: {samples}")

        # self._indicator_details, self._sample_data = indicator_details, samples
        return indicator_details, samples

    # def _search_indicator_details(self, question: str):
    #     res = []
    #     if self.vectorstore:
    #         search_res = self.vectorstore.similarity_search_with_score(
    #             question,
    #             k=self.retriever_config.top_k
    #         )
    #         res = [
    #             doc.metadata["detail"]
    #             for doc, score in search_res
    #             #    if score > self.retriever_config.threshold
    #         ]

    #     return res

    # async def _asearch_indicator_details(self, question: str):
    #     res = []
    #     if self.vectorstore:
    #         search_res = await self.vectorstore.asimilarity_search_with_score(
    #             question,
    #             k=self.retriever_config.top_k
    #         )
    #         res = [
    #             doc.metadata["detail"]
    #             for doc, score in search_res
    #             #    if score > self.retriever_config.threshold
    #         ]
    #     return res

    def _config_chain(self, indicator_details: list, samples: list, errors: dict, background: str = ''):
        if background == '':
            background = self.background

        system_prompt = Text2MetricPrompt(
            indicators=indicator_details,
            samples=samples,
            background=background,
            errors=errors,
            language=self.language,
            enable_yoy_or_mom=self.enable_yoy_or_mom,
            prompt_manager=self.prompt_manager,
        )

        logger.debug(f"text2metric -> model_type: {self.model_type}")
        logger.debug(f"text2metric -> system_prompt: {system_prompt.render()}")

        if self.model_type == ModelType4Prompt.DEEPSEEK_R1.value:
            prompt = ChatPromptTemplate.from_messages(
                [
                    HumanMessage(
                        content="下面是你的任务，请务必牢记\n" + system_prompt.render(),
                        additional_kwargs={_TOOL_MESSAGE_KEY: "text2metric"}
                    ),
                    HumanMessagePromptTemplate.from_template("{input}"),
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
            | Text2MetricParser(indicator=self.indicator, essential_explain=self.essential_explain)
        )

        return chain

    def _add_extra_info(self, extra_info, knowledge_enhanced_information):
        new_background = self.background
        if extra_info:
            if isinstance(extra_info, dict):
                extra_info = json.dumps(extra_info, ensure_ascii=False)

            new_background = dedent(
                "\n"
                + new_background
                + extra_info
            )
        else:
            extra_info = ""

        if knowledge_enhanced_information:
            if isinstance(knowledge_enhanced_information, dict):
                if knowledge_enhanced_information.get("output"):
                    knowledge_enhanced_information = json.dumps(knowledge_enhanced_information.get("output"))
                else:
                    knowledge_enhanced_information = json.dumps(knowledge_enhanced_information)
            elif isinstance(knowledge_enhanced_information, list):
                knowledge_enhanced_information = json.dumps(knowledge_enhanced_information)

            try:
                if isinstance(knowledge_enhanced_information, str):
                    info = json.loads(knowledge_enhanced_information)
                    knowledge_enhanced_information = json.dumps(info, ensure_ascii=False)
            except Exception as e:
                logger.debug(f"Convert Error, use original str. Error: {e}\n, Original str:{knowledge_enhanced_information}")


            if knowledge_enhanced_information:
                new_background += dedent("\n"
                + "知识增强工具中包含了维度相关的信息, 请在条件允许的情况下，与现有 filter 合并:\n"
                + knowledge_enhanced_information
            )
        else:
            knowledge_enhanced_information = ""

        return new_background, extra_info, knowledge_enhanced_information

    def _map_column_name(self, indicator_id: str, columns: list, dimension_params: list) -> dict:
        # just in case
        if len(columns) == 0:
            return columns
        
        def _is_default_name(name: str):
            if name.startswith("_col"):
                return True
            return False

        indicator_info = self.indicator.get_description_by_id(indicator_id)
        indicator_name = indicator_info.get("name", "")
        # last column is indicator name

        if _is_default_name(columns[-1]["name"]):
            columns[-1]["name"] = indicator_name

        if len(columns) == 1:
            return columns

        for i, col in enumerate(columns):
            if i >= len(dimension_params):
                break

            if not _is_default_name(col.get("name", "_col")):
                continue

            dim = dimension_params[i]

            if dim.get("display_name"):
                col["name"] = dim["display_name"]
            elif dim.get("business_name"):
                col["name"] = dim["business_name"]

        # expression is like sum(\"sales_std\"), sum(\"target_std\")
        if indicator_info.get("indicator_type") == "atomic":
            indicator_expressions = indicator_info.get("expression","").replace("\"", "").split(",")
            if len(indicator_expressions) > 1:
                for i, exp in enumerate(indicator_expressions):
                    if i + len(dimension_params) < len(columns):
                        columns[i + len(dimension_params)]["name"] = exp


        return columns

    def _run(
        self,
        input: str,
        extra_info: str = "",
        metric_list: list = [],
        knowledge_enhanced_information: str = "",
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ):
        asyncio.run(self._arun(input, extra_info, metric_list, knowledge_enhanced_information, run_manager))

    @async_construct_final_answer
    async def _arun(
        self,
        input: str,
        extra_info: str = "",
        metric_list: list = [],
        knowledge_enhanced_information: Any = "",
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None,
        # sessions: RedisHistorySession = RedisHistorySession(),
    ):
        """
        Run the tool asynchronously with the given text and chat history.

        Args:
            input (str): The text to run the tool with.
        """
        try:
            if metric_list:
                # 如果已经初始化过，则该参数不合法
                if self._initial_metric_ids:
                    logger.warning("已经初始化过指标列表，请不要随意生成")
                else:
                    metric_ids = []
                    for metric in metric_list:
                        if isinstance(metric, str):
                            metric_ids.append(metric)
                        elif isinstance(metric, dict):
                            metric_ids.append(metric.get("id"))
                        elif isinstance(metric, MetricDescSchema):
                            metric_ids.append(metric.id)
                    if metric_ids:
                        self.indicator.set_data_list(metric_ids)

            # 如果指标为空，则抛出异常
            if not self.indicator.get_data_list():
                raise Text2MetricError("指标为空，请先设置指标")

            # 根据问题重新筛选字段，因为indicator 已经做了缓存，不会重复请求数据
            new_background, extra_info, knowledge_enhanced_information = self._add_extra_info(extra_info, knowledge_enhanced_information)
            indicator_details, sample_data = self._init_indicator_details_and_samples(
                ("\n".join([input, extra_info, knowledge_enhanced_information]))
            )

            question = input
            logger.debug(f"text2metric -> input: {input}")

            # if we add chat history, the question could be changed
            # if self.with_context:
            #     logger.debug("尝试使用上下文去总结问题")
            #     chat_history = self.get_chat_history(self.session_id)
            #     question = await achat_history_to_question(self.llm, input, chat_history, self.language)

            if isinstance(question, dict):
                question = question.get("question", "")

            errors = {}
            res = {}

            for i in range(self.retry_times):
                logger.debug(f"============" * 10)
                logger.debug(f"{i + 1} times to generate indicator......")
                try:
                    llm_res, call_res = {}, {}

                    # 如果 top_k 不为 0，则使用向量检索
                    # if self.retriever_config.top_k != 0:
                    #     indicator_details = await self._asearch_indicator_details(question)
                    #     logger.debug("============" * 10)
                    #     logger.debug(f"indicator_details: {indicator_details}")
                    #     if not indicator_details:
                    #         indicator_details = self.indicator_details
                    # else:
                    #     indicator_details = self.indicator_details

                    chain = self._config_chain(indicator_details, sample_data, errors, new_background)
                    
                    # callback_handler = ToolCallbackHandler()

                    # 重写指标查询语句，提高指标查询的准确性
                    # 这里必须分开调用，否则会让 deepseek 误以为已经结束了
                    if self.rewrite_query:
                        question = await self._arewrite_metric_query(question, new_background, indicator_details, sample_data)
                        logger.debug(f"重写后的指标查询语句->: {question}")

                    llm_res = await chain.ainvoke({"input": question})

                    logger.info(f"LLM res: {llm_res}")

                    indicator_id = llm_res.get("id", "")
                    param = llm_res.get("params", {})

                    # 屏蔽这个错误后，反而不会出结果
                    if indicator_id == "":
                        raise Text2MetricError(llm_res.get("explanation", ""))

                    # Add cites and text to res
                    indicators = self.indicator.get_description()
                    indicator_name = ""

                    for indicator in indicators["description"]:
                        if indicator["id"] == indicator_id:
                            res["cites"] = [
                                {
                                    "id": indicator_id,
                                    "name": indicator["name"],
                                    "type": "indicator",
                                    "description": indicator["description"]
                                }
                            ]

                            res["indicator_unit"] = indicator.get("indicator_unit", "")
                            break

                    res.update(llm_res)

                    # if not with execution, add logs and return
                    if not self.with_execution:
                        self.session.add_agent_logs(
                            self._result_cache_key,
                            logs=res
                        )
                        return res

                    # get call result
                    res["res"] = []     # Markdown format
                    res["data"] = {}    # JSON Format
                    if self.with_execution:
                        if indicator_id:
                            call_res = await self.indicator.acall(indicator_id, param)

                            if call_res.get("columns"):
                                call_res["columns"] = self._map_column_name(
                                    indicator_id,
                                    call_res["columns"],
                                    param["dimensions"]
                                )
                            logger.info(f"Indicator call res: {call_res}")
                        else:
                            return res["res"]["未找到合适的指标"]

                        if call_res.get("data"):
                            if len(call_res["data"]) == 0:
                                res["data"] = {}
                            elif len(call_res["data"]) == 1 and call_res["data"][0][0] is None:
                                res["data"] = {}
                            else:
                                # convert result to json
                                parse = JsonParse(call_res)
                                md_res = parse.to_markdown()
                                res["res"] = md_res  # markdown 数据用于 前端做
                                res["data"] = parse.to_dict()

                        if res.get("title", "") == "":
                            # res["title"] = question.get("question", input) if self.with_context else question
                            res["title"] = question

                        res["result_cache_key"] = self._result_cache_key

                        full_output = res.copy()
                        if self.session:
                            self.session.add_agent_logs(
                                self._result_cache_key,
                                logs=full_output
                            )

                        # result for LLM
                        res["data_desc"] = {
                            "return_records_num": 0,
                            "real_records_num": 0
                        }
                        if res["data"]:
                            res["data"] = parse.to_dict(
                                self.return_record_limit, self.return_data_limit
                            )   # 给大模型返回的数据量

                            res["data_desc"] = {
                                "return_records_num": len(res["data"]),
                                "real_records_num": parse.get_records_num()
                            }
                                                # 转完换后，删除 res 字段
                        del res["res"]
                        
                        # 将包含大量数据的字段移动到末尾
                        llm_res = OrderedDict(res)
                        llm_res.move_to_end("data")

                        if self.api_mode:
                            return {
                                "output": llm_res,
                                "full_output": full_output
                            }
                        else:
                            return res  

                except Exception as e:
                    print("=====")
                    print(traceback.format_exc())
                    if llm_res:
                        res.update(llm_res)
                    if call_res:
                        res.update(call_res)
                    errors["error"] = e.__str__()
                    if param:
                        errors["params"] = param
                        logger.error(f"Error: {errors}, params: {param}")
                    else:
                        logger.error(f"Error: {errors}")

            # has tried retry_times times, but still not success
            if errors:
                res["error"] = errors
                raise ToolFatalError(reason=f"调用指标错误达到 {self.retry_times} 次", detail=errors)

        except Exception as e:
            logger.error(f"Error: {e}")
            raise ToolFatalError(reason="指标调用失败", detail=e) from e
            
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

                # tool_data = tool_res.get("res", "")
                ans_multiple.table.append(tool_res.get("res", ""))

                # if tool_data:
                data = tool_res.get("data", [])
                ans_multiple.new_table.append({"title": tool_res["title"], "data": data})
                # else:
                # ans_multiple.new_table.append({})
                ans_multiple.cites = tool_res.get("cites", [])
                ans_multiple.explain.append(
                    {"explanation": tool_res["explanation"]})

                cache_result = {
                    "tool_name": "text2metric",
                    "title": tool_res.get("title", "text2metric"),
                    "is_empty": tool_res.get("is_empty", len(data) == 0),
                    "fields": tool_res.get("fields", list(data[0].keys()) if data else []),
                }
                
                ans_multiple.cache_keys[self._result_cache_key] = cache_result

    @classmethod
    @api_tool_decorator
    async def as_async_api_cls(
        cls,
        params: dict
    ):
        # TODO: 需要按照 DIP 进行重构
        # Indicator Params
            # indicator_list: list[str]
            # token: str
        indicator_dict = params.get("indicator", {})

        # just for test
        token = indicator_dict.get('token', '')
        if not token or token == "''":
            user = indicator_dict.get("user", "")
            password = indicator_dict.get("password", "")

            try:
                indicator_dict["token"] = get_authorization(indicator_dict.get("auth_url", _SETTINGS.AF_DEBUG_IP), user, password)
            except Exception as e:
                logger.error(f"Error: {e}")
                raise ToolFatalError(reason="获取 token 失败", detail=e) from e

        indicator = AFIndicator(**indicator_dict)
        
        # LLM Params
        # client_params = {
        #     "openai_api_key",
        #     "openai_organization",
        #     "openai_project",
        #     "openai_api_base",
        #     "max_retries",
        #     "request_timeout",
        #     "default_headers",
        #     "default_query",
        # }
        # http_params = {
        #     "proxies",
        #     "transport",
        #     "limits",
        # }

        # qwen_72b_tool = CustomChatOpenAI(
        #     model_name="Qwen-72B-Chat",
        #     openai_api_key="EMPTY",
        #     openai_api_base="http://10.4.117.180:8304/v1",
        #     temperature=0.99,
        # )
        # llm_dict = {
        #     "model_name": _SETTINGS.TOOL_LLM_MODEL_NAME,
        #     "openai_api_key": _SETTINGS.TOOL_LLM_OPENAI_API_KEY,
        #     "openai_api_base": _SETTINGS.TOOL_LLM_OPENAI_API_BASE,
        # }
        llm_dict = parse_llm_from_model_factory(params.get("inner_llm", {}))
        llm_dict.update(params.get("llm", {}))
        

        # llm_dict = params.get("llm", {})
        llm = CustomChatOpenAI(**llm_dict)

        # config of text2metric tool
            # background: str = ""
            # retry_times: int = 3
            # session_type: str = "redis"
            # session_id: Optional[Any] = None
            # with_execution: bool = True  # 是否执行指标函数
            # get_desc_from_datasource: bool = True  # 是否从数据源获取描述
            # enable_yoy_or_mom: bool = True  # 是否启用同比环比
            # essential_explain: bool = True  # 是否只展示必要的解释
            # with_sample_data: bool = True   # 是否从逻辑是同中获取样例数据
            # dimension_num_limit: int = -1   # 维度数量限制
            # return_record_limit: int = -1  # 返回数据条数，与字节数相互作用, -1 代表不限制
            # return_data_limit: int = -1  # 返回数据总量，与字节数相互作用, -1 

        config_dict = params.get("config", {})
        # if config_dict.get("retriever_config"):
        #     config_dict["retriever_config"] = RetrieverConfig(**config_dict["retriever_config"])

        tool = cls.from_indicator(indicator, llm=llm, api_mode=True, **config_dict)

        # Infos Params
        #   extra_info: str = "",
        #   knowledge_enhanced_information: Any = "",
        infos = params.get("infos", {})
        infos['input'] = params.get('input', '')


        # invoke tool
        res = await tool.ainvoke(input=infos)
        return res
    
    @staticmethod
    async def get_api_schema():
        inputs = {
            "indicator": {
                "indicator_list": ["Metric_ID_1", "Metric_ID_2", "Metric_ID_3"],
                'auth_url': 'https://Auth_URL',
                'user': 'User',
                'password': '******',
                'token': '',
                'user_id': ''
            },
            "llm": {
                'model_name': 'Model Name',
                'openai_api_key': '******',
                'openai_api_base': 'http://xxxx',
                'max_tokens': 4000,
                'temperature': 0.1
            },
            "config": {
                "background": "",
                "retry_times": 3,
                "session_type": "in_memory",
                "session_id": "123",
                "with_execution": True,
                "get_desc_from_datasource": True,
                "enable_yoy_or_mom": True,
                "essential_explain": True,
                "with_sample_data": True,
                "recall_top_k": 5,
                "dimension_num_limit": 30,
                "return_record_limit": 10,
                "return_data_limit": 1000,
                "rewrite_query": True,
            },
            "infos": {
                "knowledge_enhanced_information": {},
                "extra_info": ""
            },
            'input': '用户输入的自然语言查询'
        }

        outputs = {
            "output": {
                "title": "查询标题",
                "data": [{"日期": "2024-01-01", "指标": 100}],
                "data_desc": {
                    "return_records_num": 1,
                    "real_records_num": 1
                },
                "indicator_unit": "单位",
                "params": {
                    "dimensions": ["日期"],
                    "filters": [],
                    "time_constraint": {
                        "start_time": "2024-01-01",
                        "end_time": "2024-12-31"
                    }
                },
                "cites": [{"id": "Metric_ID_1", "name": "Metric_Name_1", "type": "indicator", "description": "Metric_Description_1"}],
                "result_cache_key": "RESULT_CACHE_KEY"
            }
        }
        return {
            "post": {
                "summary": ToolName.from_text2metric.value,
                "description": _DESCS["tool_description"]["cn"] + "\n" + _DESCS["desc_for_yoy_or_mom"]["cn"],
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "indicator": {
                                        "type": "object",
                                        "description": "指标配置信息",
                                        "properties": {
                                            "indicator_list": {
                                                "type": "array",
                                                "description": "指标ID列表",
                                                "items": {
                                                    "type": "string"
                                                }
                                            },
                                            "auth_url": {
                                                "type": "string",
                                                "description": "认证服务URL"
                                            },
                                            "user": {
                                                "type": "string",
                                                "description": "用户名"
                                            },
                                            "password": {
                                                "type": "string",
                                                "description": "密码"
                                            },
                                            "token": {
                                                "type": "string",
                                                "description": "认证令牌，如提供则无需用户名和密码"
                                            },
                                            "user_id": {
                                                "type": "string",
                                                "description": "用户ID"
                                            }
                                        },
                                        "required": ["indicator_list"]
                                    },
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
                                    "inner_llm": {
                                        "type": "object",
                                        "description": "内部语言模型配置"
                                    },
                                    "config": {
                                        "type": "object",
                                        "description": "工具配置参数",
                                        "properties": {
                                            "background": {
                                                "type": "string",
                                                "description": "背景信息"
                                            },
                                            "retry_times": {
                                                "type": "integer",
                                                "description": "重试次数",
                                                "default": 3
                                            },
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
                                            "with_execution": {
                                                "type": "boolean",
                                                "description": "是否执行指标函数",
                                                "default": True
                                            },
                                            "get_desc_from_datasource": {
                                                "type": "boolean",
                                                "description": "是否从数据源获取描述",
                                                "default": True
                                            },
                                            "enable_yoy_or_mom": {
                                                "type": "boolean",
                                                "description": "是否启用同比环比",
                                                "default": True
                                            },
                                            "essential_explain": {
                                                "type": "boolean",
                                                "description": "是否只展示必要的解释",
                                                "default": True
                                            },
                                            "with_sample_data": {
                                                "type": "boolean",
                                                "description": "是否从逻辑视图中获取样例数据",
                                                "default": True
                                            },
                                            "recall_top_k": {
                                                "type": "integer",
                                                "description": "召回指标数量限制，-1表示不限制",
                                                "default": 5
                                            },
                                            "dimension_num_limit": {
                                                "type": "integer",
                                                "description": "维度数量限制，-1表示不限制",
                                                "default": -1
                                            },
                                            "return_record_limit": {
                                                "type": "integer",
                                                "description": "返回数据条数限制，-1表示不限制",
                                                "default": -1
                                            },
                                            "return_data_limit": {
                                                "type": "integer",
                                                "description": "返回数据总量限制，-1表示不限制",
                                                "default": -1
                                            },
                                            "rewrite_query": {
                                                "type": "boolean",
                                                "description": "是否重写指标查询语句",
                                                "default": False
                                            }
                                        }
                                    },
                                    "infos": {
                                        "type": "object",
                                        "description": "输入参数",
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
                                    }
                                },
                                "required": ["indicator", "input"]
                            },
                            "example": inputs
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
                                        "indicator_unit": {
                                            "type": "string",
                                            "description": "指标单位"
                                        },
                                        "params": {
                                            "type": "object",
                                            "description": "查询参数"
                                        },
                                        "cites": {
                                            "type": "array",
                                            "description": "引用指标",
                                            "items": {
                                                "type": "object"
                                            }
                                        },
                                        "result_cache_key": {
                                            "type": "string",
                                            "description": "结果缓存键"
                                        }
                                    }
                                },
                                "example": outputs
                            }
                        }
                    }
                }
            }
        }
    
    def _config_rewrite_metric_query_chain(self, question: str, background: str, metrics: list, samples: list):
        prompt = RewriteMetricQueryPrompt(
            question=question,
            metrics=metrics,
            samples=samples,
            language=self.language,
            background=background
        )

        if self.model_type == ModelType4Prompt.DEEPSEEK_R1.value:
            messages = [
                HumanMessage(content=prompt.render(escape_braces=False), additional_kwargs={_TOOL_MESSAGE_KEY: "text2metric_rewrite_query"}),
                HumanMessage(content=question)
            ]
        else:
            messages = [
                SystemMessage(content=prompt.render(escape_braces=False), additional_kwargs={_TOOL_MESSAGE_KEY: "text2metric_rewrite_query"}),
                HumanMessage(content=question)
            ]

        chain = self.llm | BaseJsonParser()
        return chain, messages

    async def _arewrite_metric_query(self, question: str, background: str, metrics: list, samples: list):
        chain, messages = self._config_rewrite_metric_query_chain(question, background, metrics, samples)
        new_question = await chain.ainvoke(messages)

        # 输出是字符串，帮助后续问题理解
        return json.dumps(new_question, ensure_ascii=False)
    
    def _rewrite_metric_query(self, question: str, background: str, metrics: list, samples: list):
        chain, messages = self._config_rewrite_metric_query_chain(question, background, metrics, samples)
        new_question = chain.invoke(messages)

        return json.dumps(new_question, ensure_ascii=False)



if __name__ == "__main__":
    from af_agent.datasource.af_indicator import AFIndicator
    # from langchain_community.chat_models import ChatOllama
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(
        model_name='Qwen-72B-Chat',
        openai_api_key="EMPTY",
        openai_api_base="http://192.168.173.19:8304/v1",
        max_tokens=2000,
        temperature=0.01,
    )
    # llm = ChatOllama(model="phi3:latest")
    # llm = ChatOllama(model="codegemma")

    from af_agent.api.auth import get_authorization

    # indicator_list = ["532179399886306706"]
    # token = get_authorization("https://10.4.109.201", "liberly", "111111")
    # text2metric = AFIndicator(
    #     indicator_list=indicator_list,
    #     token=token
    # )
    # indicator_list = ["535772491461722839", "536195966831723223", "536195625633481431", "536196205823165143"]
    # token = get_authorization("http://10.4.109.201", "liberly", "111111")

    indicator_list = ["541569060106716947"]
    token = get_authorization("http://10.4.109.142", "liberly", "111111")

    text2metric = AFIndicator(
        indicator_list=indicator_list,
        token=token,
    )

    # from af_agent.datasource.af_indicator import MockAFIndicator
    # text2metric = MockAFIndicator()

    tool = Text2MetricTool.from_indicator(
        indicator=text2metric,
        llm=llm,
        with_execution=True,
        retry_times=2,
        get_desc_from_datasource=True,
        session_id="-7-",
        enable_yoy_or_mom=True
    )

    print(tool.description)

    res = tool.invoke({"input": "上海装货的运量是多少"})
    print("============")
    print(res)

    # from af_agent.datasource.af_indicator import MockAFIndicator
    # text2indicator = MockAFIndicator()

    # for i in range(10000):
    #     tool = Text2IndicatorTool.from_indicator(
    #         indicator=text2indicator,
    #         llm=llm,
    #         with_execution=False,
    #         retry_times=2,
    #         get_desc_from_datasource=True,
    #         session_id="-7-"
    #     )
    #
    #     print(tool.description)


    async def main():
        res = await tool.ainvoke({"input": "‘小白白品牌’Q1销量同比增长"})
        print("============")
        print(res)


    import asyncio
    asyncio.run(main())

    # print(tool.invoke({"input": "近三年大区为东部大区各个片区的销量"}))
    # print(tool.invoke({"input": "按下单地点、渠道分析指标，并按滤渠道是拼多多进行过滤，时间是近三年"}))




