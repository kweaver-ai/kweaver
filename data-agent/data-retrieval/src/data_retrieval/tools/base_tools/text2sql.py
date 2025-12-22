# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-5-23
import json, time
import traceback
from textwrap import dedent
from typing import Any, Optional, Type, Dict, Union, List
from enum import Enum
from collections import OrderedDict
from langchain.callbacks.manager import (AsyncCallbackManagerForToolRun,
                                         CallbackManagerForToolRun)
from langchain.pydantic_v1 import BaseModel, Field, PrivateAttr
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate
)
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import ToolException
from sql_metadata.compat import get_query_tables
from fastapi import Body

from data_retrieval.api.error import (
    VirEngineError
)
from data_retrieval.errors import Text2SQLException
from data_retrieval.datasource.db_base import DataSource
from data_retrieval.datasource.dip_dataview import DataView, get_datasource_from_kg_params
from data_retrieval.api.agent_retrieval import get_datasource_from_agent_retrieval_async
from data_retrieval.utils.dip_services.base import ServiceType
from data_retrieval.logs.logger import logger
from data_retrieval.parsers.base import BaseJsonParser
from data_retrieval.parsers.text2sql_parser import JsonText2SQLRuleBaseParser
from data_retrieval.prompts.tools_prompts.text2sql_prompt.text2sql import Text2SQLPrompt
from data_retrieval.prompts.tools_prompts.text2sql_prompt.rewrite_query import RewriteQueryPrompt

from data_retrieval.sessions import CreateSession, BaseChatHistorySession
from data_retrieval.tools.base import ToolMultipleResult, ToolName
from data_retrieval.tools.base import construct_final_answer, async_construct_final_answer
from data_retrieval.tools.base_tools.context2question import achat_history_to_question, chat_history_to_question
from data_retrieval.utils.func import JsonParse
from data_retrieval.utils.func import add_quotes_to_fields_with_data_self
from data_retrieval.tools.base import LLMTool, _TOOL_MESSAGE_KEY
from data_retrieval.tools.base import api_tool_decorator
from data_retrieval.utils.llm import CustomChatOpenAI
from data_retrieval.api.auth import get_authorization
from data_retrieval.errors import ToolFatalError
from data_retrieval.utils.model_types import ModelType4Prompt
from data_retrieval.utils.sql_to_graph import build_graph
from data_retrieval.api import VegaType
from data_retrieval.tools.base import parse_llm_from_model_factory

from data_retrieval.settings import get_settings

import asyncio

_SETTINGS = get_settings()

# from data_retrieval.api.error import DataSourceNum, Errors
error_message1 = "textsql 工具无法回答此问题，请尝试更换其它工具，并不再使用 text2sql 工具"
error_message2 = "工具调用失败，请再次尝试，或者更换其它工具, 异常信息: {error_info}"

_DESCS = {
    "table_list": {
        "cn": "需要查询的表名列表",
        "en": "tables to query",
    },
    "tool_description": {
        "cn": "根据用户输入的文本和数据视图信息来生成 SQL 语句，并查询数据库。注意: input参数只接受问题，不接受SQL。工具具有更优秀的SQL生成能力，你只需要告诉工具需要查询的内容即可。有时用户只需要生成SQL，不需要查询，需要给出解释\n注意：为了节省 token 数，输出的结果可能不完整，这是正常情况。data_desc 对象来记录返回数据条数和实际结果条数",
        "en": "Generate SQL according to user's input, the result has a data_desc object to record the number of returned data and the actual number of results, please tell the user to check the detailed data, the application will get it",
    },
    "chat_history": {
        "cn": "对话历史",
        "en": "chat history",
    },
    "input": {
        "cn": "一个没有歧义的表述清晰的问题",
        "en": "The original question from the user.",
    },
    "desc_from_datasource": {
        "cn": "\n- 包含的视图信息：{desc}",
        "en": "\nHere's the data description for the SQL generation tool:\n{desc}",
    }
}

class DataViewDescSchema(BaseModel):
    id: str = Field(description="数据视图的 id, 格式为 uuid")
    name: str = Field(description="数据视图的名称")
    type: str = Field(description="数据视图的类型")


class Text2SQLInput(BaseModel):
    input: str = Field(default="", description=_DESCS["input"]["cn"])
    knowledge_enhanced_information: Optional[Any] = Field(default={}, description="调用知识增强工具获取的信息，如果调用知识增强工具，请填写该参数")
    extra_info: Optional[str] = Field(
        default="",
        description="附加信息，但不是知识增强的信息"
    )
    action: str = Field(
        default="gen_exec",
        description="工具的行为类型：gen(只生成SQL)、gen_exec(生成并执行SQL)、show_ds(只展示配置的数据源的元数据信息)"
    )
    
    # call_count: int = Field(default=0, description="记录工具被调用的次数")


class Text2SQLInputWithViewList(Text2SQLInput):
    view_list: Optional[List[DataViewDescSchema]] = Field(default=[], description=f"数据视图的列表，当已经初始化过虚拟视图列表时，不需要填写该参数。如果需要填写该参数，请确保`上下文缓存的数据资源中存在`，不要随意生成。格式如下：{DataViewDescSchema.schema_json(ensure_ascii=False)}")


class ActionType(str, Enum):
    GEN = "gen"
    GEN_EXEC = "gen_exec"
    SHOW_DS = "show_ds"


class Text2SQLTool(LLMTool):
    """Text2SQL Tool

    Use from_data_source to create a new instance of Text2SQLTool

    @params
        name: Tool Name of Text2SQL
        description: Tool Description of Text2SQL
        language: Language of the tool, cn and en are supported
        background: Background knowledge of the tool
        args_schema: Input schema of tables
        data_source: DataSource instance
        llm: Language model instance
        with_execution: If the tool needs to execute the SQL, set it to True,
            otherwise set it to False
        only_essential_dim: If the tool only needs to query essential dimensions, set it to True,
            otherwise set it to False
    """
    name: str = ToolName.from_text2sql.value
    description: str = _DESCS["tool_description"]["cn"]
    background: str = "--"
    args_schema: Type[BaseModel] = Text2SQLInput
    data_source: DataSource
    # with_execution: bool = True  # 是否执行SQL
    force_limit: int = _SETTINGS.TEXT2SQL_FORCE_LIMIT  # 限制SQL的行数
    retry_times: int = 3  # 重试次数
    get_desc_from_datasource: bool = False  # 是否从数据源获取描述
    chat_history: Optional[Any] = None
    session_id: Optional[str] = ""
    session_type: Optional[str] = "redis"
    session: Optional[BaseChatHistorySession] = None
    # handle_tool_error: bool = True
    with_context: bool = False
    only_essential_dim: bool = True
    dimension_num_limit: int = _SETTINGS.TEXT2SQL_DIMENSION_NUM_LIMIT
    view_num_limit: int = int(_SETTINGS.TEXT2SQL_RECALL_TOP_K)
    model_type: str = _SETTINGS.TEXT2SQL_MODEL_TYPE
    rewrite_query: bool = _SETTINGS.TEXT2SQL_REWRITE_QUERY
    return_record_limit: int = _SETTINGS.RETURN_RECORD_LIMIT
    return_data_limit: int = _SETTINGS.RETURN_DATA_LIMIT
    show_sql_graph: bool = _SETTINGS.SHOW_SQL_GRAPH

    _initial_view_ids: List[str] = PrivateAttr(default=[]) # 工具初始化时设置的视图id列表

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        if not self.chat_history:
            self.chat_history = []

        if kwargs.get("session") is None:
            self.session = CreateSession(self.session_type)
        
        # 保存初始化的视图id列表
        if self.data_source and self.data_source.get_tables():
            self._initial_view_ids = self.data_source.get_tables()
        else:
            self.args_schema = Text2SQLInputWithViewList

        # 如果 get_desc_from_datasource 为 True，则获取数据源的描述
        self._get_desc_from_datasource(self.get_desc_from_datasource)

    def _get_desc_from_datasource(self, get_desc_from_datasource: bool):
        if get_desc_from_datasource:
            if self.data_source:
                desc = self.data_source.get_description()
                if desc:
                    self.description += _DESCS["desc_from_datasource"]["cn"].format(
                        desc=desc
                    )
        if not self.data_source.get_tables():
            self.description += _DESCS["desc_from_datasource"]["cn"].format(
                desc=f"工具初始化时没有提供数据源，调用前需要使用 `{ToolName.from_sailor.value}` 工具搜索，并基于结果初始化"
            )

    @classmethod
    def from_data_source(cls, data_source: DataSource, llm, prompt_manager, *args, **kwargs):
        """Create a new instance of Text2SQLTool

        Args:
            data_source (DataSource): DataSource instance
            llm: Language model instance

        Examples:
            data_source = SQLiteDataSource(
                db_file="{your file}.db",
                tables=[{your table}]
            )
            tool = Text2SQLTool.from_data_source(
                data_source=sqlite,
                llm=llm
            )
        """
        return cls(data_source=data_source, llm=llm, prompt_manager=prompt_manager, *args, **kwargs)

    def _config_chain(
            self,
            # tables: Optional[list] = None,
            errors: Optional[dict] = None,
            data_info: dict = {},
    ):
        # 1. 处理异常
        # 2. 选择指定表进行问答(DONE)
        # 3. 利用 Chat history 生成一个新的 SQL
        if errors is None:
            errors = {}

        sample = data_info["sample"]
        metadata = data_info["detail"]
        system_prompt = Text2SQLPrompt(
            sample=sample,
            metadata=metadata,
            background=self.background,
            errors=errors,
            prompt_manager=self.prompt_manager,
            language=self.language
        )

        logger.debug(f"text2sql -> model_type: {self.model_type}")

        if self.model_type == ModelType4Prompt.DEEPSEEK_R1.value:
            prompt = ChatPromptTemplate.from_messages(
                [
                    HumanMessage(
                        content="下面是你的任务，请务必牢记" + system_prompt.render(),
                        additional_kwargs={_TOOL_MESSAGE_KEY: "text2sql"}
                    ),
                    HumanMessagePromptTemplate.from_template("{input}")
                ]
            )
        else:
            prompt = ChatPromptTemplate.from_messages(
                [
                    SystemMessage(
                        content=system_prompt.render(),
                        additional_kwargs={_TOOL_MESSAGE_KEY: "text2sql"}
                    ),
                    HumanMessagePromptTemplate.from_template("{input}")
                ]
            )

        chain = (
                prompt
                | self.llm
        )
        return chain
    
    def _config_rewrite_query_chain(self, question: str, metadata_and_samples: dict):
        prompt = RewriteQueryPrompt(
            question=question,
            metadata_and_samples=metadata_and_samples,
            background=self.background
        )
        
        if self.model_type == ModelType4Prompt.DEEPSEEK_R1.value:
            messages = [
                HumanMessage(content=prompt.render(escape_braces=False), additional_kwargs={_TOOL_MESSAGE_KEY: "text2sql_rewrite_query"}),
                HumanMessage(content=question)
            ]
        else:
            messages = [
                SystemMessage(content=prompt.render(escape_braces=False), additional_kwargs={_TOOL_MESSAGE_KEY: "text2sql_rewrite_query"}),
                HumanMessage(content=question)
            ]

        chain = self.llm | BaseJsonParser()
        return chain, messages

    def _rewrite_sql_query(self, question: str, metadata_and_samples: dict):
        chain, messages = self._config_rewrite_query_chain(question, metadata_and_samples)
        new_question = chain.invoke(messages)

        return json.dumps(new_question, ensure_ascii=False)
    
    async def _arewrite_sql_query(self, question: str, metadata_and_samples):
        chain, messages = self._config_rewrite_query_chain(question, metadata_and_samples)
        new_question = await chain.ainvoke(messages)

        return json.dumps(new_question, ensure_ascii=False)

    def _parse_explanation(
            self,
            tables,
            dataview,
            explanation: dict
    ):
        res = {}

        for table in tables:
            explain01 = {}
            explain02 = {}

            if table not in dataview:
                fixed_table_name = self._fix_table_name(table)
                if fixed_table_name in dataview:
                    table = fixed_table_name
                else:
                    logger.warning(f"table {table} not found in dataview")
                    continue

            infor = dataview[table]
            en2cn: dict = infor["en2cn"]
            for key, value in en2cn.items():
                if key in explanation and explanation[key] != "全部":
                    explain01[value] = explanation[key]
                else:
                    explain02[value] = "全部"
            date = explain01.pop("日期", "全部")
            explain03 = {"指标": explanation.get("目标"), "日期": date}

            explain = {**explain03, **explain01}

            if not self.only_essential_dim:
                explain = {**explain, **explain02}

            # 配合立白，删除下面的 key：
            explain.pop("行序号 自增", None)
            explain.pop("目标（标准化）", None)
            explain.pop("销量（标准化）", None)
            explain = [{key: value} for key, value in explain.items()]
            res[infor["name"]] = explain
        return res

    # 处理sql, 如果有白名单筛选sql,
    def deal_sql(self, input_sql: str, view_white_list_sql_infos: dict, view_schema_infos: dict):
        new_sql = input_sql
        for view_id, view_table_name in view_schema_infos.items():
            if view_table_name in input_sql and view_white_list_sql_infos.get(view_id, {}).get("sql"):
                input_condition = view_white_list_sql_infos[view_id]["sql"]
                n_sql = input_sql
                group_by_index = input_sql.lower().find(" group by ")
                order_by_index = input_sql.lower().find(" order by ")
                limit_index = input_sql.lower().find(" limit ")
                if "where" in input_sql.lower():
                    if group_by_index != -1:
                        new_sql = n_sql[:group_by_index] + " and " + input_condition + n_sql[group_by_index:]
                    elif order_by_index != -1:
                        new_sql = n_sql[:order_by_index] + " and " + input_condition + n_sql[order_by_index:]
                    elif limit_index != -1:
                        new_sql = n_sql[:limit_index] + " and " + input_condition + n_sql[limit_index:]
                    else:
                        new_sql = n_sql + " and " + input_condition
                else:
                    if group_by_index != -1:
                        new_sql = n_sql[:group_by_index] + " where " + input_condition + n_sql[group_by_index:]
                    elif order_by_index != -1:
                        new_sql = n_sql[:order_by_index] + " where " + input_condition + n_sql[order_by_index:]
                    elif limit_index != -1:
                        new_sql = n_sql[:limit_index] + " where " + input_condition + n_sql[limit_index:]
                    else:
                        new_sql = n_sql + " where " + input_condition
                break
        return new_sql



    def fetch(
            self,
            question: str,
            errors: Optional[dict] = None,
            only_sql: bool = False,
            extra_info: str = "",
            knowledge_enhanced_information: str = ""
    ):
        
        data_info = self.data_source.get_meta_sample_data(
            "\n".join([question, extra_info, knowledge_enhanced_information]),
            self.view_num_limit,
            self.dimension_num_limit
        )

        if self.rewrite_query:
            question = self._rewrite_sql_query(question, data_info, use_metadata=True)
            logger.debug(f"重写后的问题->: {question}")

        chain = self._config_chain(errors, data_info)
        generated = chain.invoke({"input": question})

        rule_base = self.data_source.get_rule_base_params()
        res = {
            "sql": "",
            "explanation": "",
            "res": "",
            "title": "",
            "message": ""
        }
        parser = JsonText2SQLRuleBaseParser(
            rule_base,
            sql_limit=self.force_limit
        )
        generated_res = parser.invoke(generated)

        if 'sql' not in generated_res:
            return res
        n_sql = add_quotes_to_fields_with_data_self(generated_res['sql'])
        logger.info("new sql is: {}".format(n_sql))

        nn_sql = self.deal_sql(n_sql, data_info.get("view_white_list_sql_infos", {}), data_info["view_schema_infos"])
        logger.info("add white list sql {}".format(nn_sql))
        # 使用白名单后的sql, 展示白名单前的sql
        res['sql'] = n_sql

        if 'explanation' in generated_res:
            res['explanation'] = generated_res['explanation']

        # 获取 title 和 message
        res['title'] = generated_res.get("title", "")
        res['message'] = generated_res.get("message", "")

        # if self.with_execution is False:
        if only_sql or not res.get("sql"):
            return res
        try:
            query_res = self.data_source.query(
                nn_sql,
                as_gen=False,
                as_dict=True
            )

            res['res'] = query_res
            return res

        except VirEngineError as e:
            logger.error(e)
            res["error"] = e.detail
            return res

    async def afetch(
            self,
            question: str,
            errors: Optional[dict] = None,
            only_sql: bool = False,
            extra_info: str = "",
            knowledge_enhanced_information: str = ""
    ):
        if not self.data_source:
            raise ToolException("数据源为空，请检查 view_list 参数。如果涉及知识网络，请检查 kn 参数。如果是老版本知识网络，请检查 kg 参数。")

        data_info = await self.data_source.get_meta_sample_data_async(
            "\n".join([question, extra_info, knowledge_enhanced_information]),
            self.view_num_limit,
            self.dimension_num_limit
        )
        
        if self.rewrite_query:
            question = await self._arewrite_sql_query(question, data_info)
            logger.debug(f"重写后的问题->: {question}")

        chain = self._config_chain(errors, data_info)
        generated = await chain.ainvoke({"input": question})
        rule_base = self.data_source.get_rule_base_params()
        res = {
            "sql": "",
            "explanation": "",
            "res": "",
            "title": "",
            "message": ""
        }
        parser = JsonText2SQLRuleBaseParser(
            rule_base,
            sql_limit=self.force_limit
        )
        generated_res = await parser.ainvoke(generated)

        if 'sql' not in generated_res:
            return res
        n_sql = add_quotes_to_fields_with_data_self(generated_res['sql'])
        logger.info("new sql is: {}".format(n_sql))

        nn_sql = self.deal_sql(n_sql, data_info.get("view_white_list_sql_infos", {}), data_info["view_schema_infos"])
        logger.info("add white list sql {}".format(nn_sql))
        # 使用白名单后的sql, 展示白名单前的sql
        res['sql'] = n_sql
        if 'explanation' in generated_res:
            res['explanation'] = generated_res['explanation']
        
        # 获取 title 和 message
        res['title'] = generated_res.get("title", "")
        res['message'] = generated_res.get("message", "")

        # if self.with_execution is False:
        if only_sql or not res.get("sql"):
            return res
        try:
            query_res = await self.data_source.query_async(
                nn_sql,
                as_gen=False,
                as_dict=True
            )
            res['res'] = query_res
            return res

        except VirEngineError as e:
            logger.error(e)
            res["error"] = e.detail
            return res

    def _add_extra_info(self, extra_info, knowledge_enhanced_information):
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
            else:
                knowledge_enhanced_information = json.dumps(knowledge_enhanced_information, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Convert Error, use original str. Error: {e}")

        self.background += dedent(
            "\n"
            + extra_info
            + "\n"
            + "- 请在条件允许的情况下，尝试将以下字段作为筛选条件在 SQL 中使用："
            + "\n"
            + knowledge_enhanced_information
        )

        return extra_info, knowledge_enhanced_information

    @staticmethod
    def _fix_table_name(table_name: str) -> str:
        parts = table_name.split(".")
        if len(parts) != 3:
            return table_name
        
        part0, part1, part2 = parts[0], parts[1], parts[2]

        if not part1.startswith("\"") and not part1.endswith("\""):
            part1 = f"\"{part1}\""
        if not part2.startswith("\"") and not part2.endswith("\""):
            part2 = f"\"{part2}\""
                
        return f"{part0}.{part1}.{part2}"

    def _run(
            self,
            input: str,
            action: str = ActionType.GEN_EXEC.value,
            extra_info: Any = "",
            knowledge_enhanced_information: Any = "",
            view_list: list = [],
            errors: Optional[dict] = None,
            run_manager: Optional[CallbackManagerForToolRun] = None
    ):
        """同步运行方法，直接调用异步版本"""
        return asyncio.run(self._arun(
            input=input,
            action=action,
            extra_info=extra_info,
            knowledge_enhanced_information=knowledge_enhanced_information,
            view_list=view_list,
            errors=errors,
            run_manager=run_manager
        ))

    @async_construct_final_answer
    async def _arun(
            self,
            input: str,
            action: str = ActionType.GEN_EXEC.value,
            extra_info: Any = "",
            knowledge_enhanced_information: Any = "",
            view_list: list = [],
            run_manager: Optional[AsyncCallbackManagerForToolRun] = None,
            errors: Optional[dict] = None
    ):
        # 如果 action 不合法，则默认使用 gen_exec
        if action not in [ActionType.GEN.value, ActionType.GEN_EXEC.value, ActionType.SHOW_DS.value]:
            action = ActionType.GEN_EXEC.value
        
        # 如果 action 不是 show_ds，且 input 为空，则抛出异常
        if action != ActionType.SHOW_DS.value and (not input or not input.strip()):
            raise Text2SQLException(detail="输入问题不能为空", reason="输入问题不能为空")
        
        try:
            # 如果 view_list 不为空，则设置 data_source 的 tables
            if view_list:
                # 如果已经初始化过，则该参数不合法
                if self._initial_view_ids:
                    logger.warning("已经初始化过虚拟视图列表，请不要随意生成")
                else:
                    view_ids = []
                    for view in view_list:
                        if isinstance(view, str):
                            view_ids.append(view)
                        elif isinstance(view, dict):
                            view_ids.append(view.get("id"))
                        elif isinstance(view, DataViewDescSchema):
                            view_ids.append(view.id)
                    self.data_source.set_tables(view_ids)

            # 如果数据源为空，则抛出异常
            if not self.data_source.get_tables():
                raise Text2SQLException("数据源为空，请检查 view_list 参数。如果涉及知识网络，请检查 kn 参数。如果是老版本知识网络，请检查 kg 参数。")
    
            self._get_desc_from_datasource(self.get_desc_from_datasource)
            
            # 如果是 show_ds 模式，直接返回数据源信息
            if action == "show_ds":
                if not self.data_source.get_tables():
                    return {
                        "data_sources": f"未设置数据资源，需要用 {ToolName.from_sailor.value} 工具设置数据资源"
                    }
                
                data_view_metadata = await self.data_source.get_meta_sample_data_async(
                    input,
                    self.view_num_limit,
                    self.dimension_num_limit,
                    with_sample=False
                )

                summary = []

                details = data_view_metadata.get("detail", {})
                for detail in details:
                    detail.pop("en2cn")
                    summary.append({
                        "name": detail["name"],
                        "comment": detail["comment"],
                        "table_path": detail["path"]
                    })

                # 精简数据源信息
                return {
                    "data_summary": summary,
                    "data_sources": data_view_metadata,
                    "title": input if input else "获取数据源信息"
                }

            extra_info, knowledge_enhanced_information = self._add_extra_info(extra_info, knowledge_enhanced_information)

            question = input
            logger.debug(f"text2sql -> input: {input}")

            # try to execute the SQL once more
            for i in range(self.retry_times):
                logger.info(f"第 {i + 1} 次生成SQL......")
                res = await self.afetch(
                    question,
                    errors,
                    only_sql=(action == ActionType.GEN.value),
                    extra_info=extra_info,
                    knowledge_enhanced_information=knowledge_enhanced_information
                )

                logger.info(f"LLM res: {res}")

                if res.get("error") is not None:
                    errors = {"error": res["error"], "sql": res["sql"]}
                    continue

                # 添加引用
                metadata = self.data_source.get_metadata()
                tables = JsonText2SQLRuleBaseParser.get_tables_by_query(res["sql"])
                dataview = {
                    infor["path"]: infor
                    for infor in metadata
                }

                cites = []
                for table in tables:
                    # Table 名称有可能出错，比如包含 ""
                    if table not in dataview:
                        logger.warning(f"table {table} not found in dataview")

                        fixed_table_name = self._fix_table_name(table)
                        logger.warning(f"try to fix table {table} to {fixed_table_name}")
                        if not fixed_table_name in dataview:
                            logger.warning("datavire still not found in dataview")
                            continue
                        else:
                            table = fixed_table_name

                    cites.append({
                        "id": dataview[table]["id"],
                        "name": dataview[table]["name"],
                        "type": "data_view",
                        "description": dataview[table]["comment"]
                    })

                res["cites"] = cites

                # 修正解释
                res['explanation'] = self._parse_explanation(
                    tables,
                    dataview,
                    explanation=res['explanation']
                )

                # 获取所有en2cn 信息
                en2cn_info = dict()
                for table in tables:
                    data_view_single = dataview[table]
                    if "en2cn" in data_view_single:
                        en2cn_info.update(data_view_single["en2cn"])

                columns_list = []
                columns_success_list = []
                # 如果技术字段能够匹配，就通过 en2cn 进行转换
                if "columns" in res["res"] and len(en2cn_info):
                    for column in res["res"]["columns"]:
                        n_column = {
                            "name": en2cn_info.get(column["name"], column["name"]),
                            "type": column["type"],
                            "name_in_sql": column["name"],
                        }
                        columns_list.append(n_column)
                        if en2cn_info.get(column["name"]):
                            columns_success_list.append(column["name"])
                    logger.info("en2cn 转换了字段有 {}".format(columns_success_list))
                    res["res"]["columns"] = columns_list

                    logger.info(f"res: {res}")

                # 如果是 gen 模式，直接返回结果
                if action == ActionType.GEN.value or not res.get("sql"):
                    return res
                
                # 转化为 graph
                if self.show_sql_graph:
                    try:
                        graph = build_graph(res["sql"], res["res"].get("columns", []), res["res"].get("data", []))
                        logger.info(f"转化为 graph 成功: {graph}")

                        # 将实体名称转成业务名称
                        for node in graph["nodes"]:
                            for k, v in dataview.items():
                                if v["en_name"] == node["data_source_name"]:
                                    node["data_source_name"] = v["name"]
                                    node["data_source_id"] = v["id"]
                                    break
                        res["graph"] = graph
                        
                    except Exception as e:
                        logger.error(f"转化为 graph 失败: {e}")
                

                # ==
                # 补丁，如果data为空，大模型有可能会总结查询数据为0，这里添加一个提示
                if not res["res"].get("data") and not res.get("message"):
                    res["message"] = "没有查询到数据"
                # ==

                parse = JsonParse(res["res"])
                if res["res"].get("data"):
                    # md_res = parse.to_markdown()
                    res["data"] = parse.to_dict()
                    # res["res"] = md_res  # dict 数据用于 前端做表
                    res.pop("res")
                else:
                    # res["res"] = ""
                    res["data"] = []
                    # res.pop("res")

                if res.get("title", "") == "":
                    res["title"] = question.get("question", input) if self.with_context else question

                res["result_cache_key"] = self._result_cache_key

                # 记录日志
                full_output = res.copy()
                if self.session:
                    self.session.add_agent_logs(
                        self._result_cache_key,
                        logs=full_output
                    )

                # 生成给大模型的数据
                data_for_llm = parse.to_dict(
                    self.return_record_limit, self.return_data_limit
                )

                # 转完换后，删除 res 字段
                if "res" in res:
                    del res["res"]
                if "columns" in res:
                    del res["columns"]
                if "graph" in res:
                    del res["graph"]

                # 返回数据描述
                res["data_desc"] = {
                    "return_records_num": len(data_for_llm),
                    "real_records_num": len(res["data"])
                }

                res["data"] = data_for_llm

                # 将包含大量数据的字段移动到末尾
                llm_res = OrderedDict(res)
                llm_res.move_to_end("data")

                logger.info(f"llm_res with ordered dict: {llm_res}")
                
                if self.api_mode:
                    return {
                        "output": llm_res,
                        "full_output": full_output
                    }
                else:   
                    return res
            
        except Text2SQLException as e:
            raise ToolException(error_message2.format(error_info=e.json()))

        except Exception as e:
            print(traceback.format_exc())
            raise ToolException(error_message2.format(error_info=e))

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
                ans_multiple.table.append(tool_res.get("res", ""))

                # This is wrong, because the res is a markdown string
                # ans_multiple.new_table.append({"title": tool_res["title"], "data": tool_res.get("data", [])})
                data = tool_res.get("data", [])
                ans_multiple.new_table.append({"title": tool_res["title"], "data": data})

                ans_multiple.cites = tool_res.get("cites", [])
                ans_multiple.explain.append(
                    {
                        "sql": tool_res["sql"],
                        "explanation": tool_res["explanation"]
                    }
                )

                ans_multiple.cache_keys[self._result_cache_key] = {
                    "tool_name": "text2sql",
                    "title": tool_res.get("title", "text2sql"),
                    "sql": tool_res.get("sql", ""),
                    "is_empty": tool_res.get("is_empty", len(data) == 0),
                    "fields": tool_res.get("fields", list(data[0].keys()) if data else []),
                }

                if tool_res.get("graph"):
                    ans_multiple.graph.append({
                        "title": tool_res["title"],
                        "graph": tool_res["graph"]
                    })

    @classmethod
    @api_tool_decorator
    async def as_async_api_cls(
            cls,
            params: dict = Body(...),
            stream: bool = False,
            mode: str = "http"
    ):
        logger.info(f"text2sql as_async_api_cls params: {params}")
        # return {'text2sql': '测试接口'}
        # data_source Params
        data_source_dict = params.get('data_source', {})
        kg_params = data_source_dict.get('kg', {})
        vega_type = data_source_dict.get('vega_type', VegaType.DIP.value)
        config_dict = params.get("config", {})

        kn_params = data_source_dict.get('kn', [])
        search_scope = data_source_dict.get('search_scope', [])
        recall_mode = data_source_dict.get('recall_mode', _SETTINGS.DEFAULT_AGENT_RETRIEVAL_MODE)

        view_list = data_source_dict.get('view_list', [])

        # 如果 vega_type 不合法，则默认使用 AF
        if vega_type not in [VegaType.AF.value, VegaType.DIP.value]:
            vega_type = VegaType.DIP.value

        # 获取 base_url
        if vega_type == VegaType.AF.value:
            auth_url = data_source_dict.get('auth_url', _SETTINGS.AF_DEBUG_IP)
        else:
            auth_url = data_source_dict.get('auth_url', _SETTINGS.OUTTER_VEGA_URL)

        base_url = data_source_dict.get('base_url', auth_url)
        token = data_source_dict.get('token', '')

        # 如果 base_url 不为空 或 token 为空，则获取 token,
        # 如果 base_url 为空，则说明调用的是内部的 vega 服务，不需要获取 token
        # 只有 AF 才去获取
        if base_url and (not token or token == "''") and vega_type == VegaType.AF.value:
            user = data_source_dict.get("user", "")
            password = data_source_dict.get("password", "")

            max_retries = 5
            retry_count = 0
            
            while retry_count < max_retries:
                try:
                    data_source_dict["token"] = get_authorization(
                        base_url,
                        user,
                        password
                    )
                    break  # 如果成功获取 token，跳出循环
                except Exception as e:
                    retry_count += 1
                    logger.error(f"获取 token 失败，尝试第 {retry_count} 次，报错信息: {e}\n{traceback.format_exc()}")
                    if retry_count == max_retries:
                        raise ToolFatalError(reason="获取 token 失败，已尝试 {} 次".format(max_retries), detail=e) from e
                    # 如果需要延迟重试，可以在这里添加 sleep
                    time.sleep(1)  # 例如，延迟 1 秒后重试
        
        # 设置 data_source 参数
        data_source_dict['base_url'] = base_url
        data_source_dict['vega_type'] = vega_type

        # 如果指定了地址，则说明是外部的 DIP 服务，需要使用 OUTTER_DIP 类型
        if base_url and vega_type == VegaType.DIP.value:
            dip_type = ServiceType.OUTTER_DIP.value
        else:
            dip_type = ServiceType.DIP.value

        headers = {}
        userid = data_source_dict.get("user_id", "")
        account_type = data_source_dict.get("account_type", "user")

        if userid:
            headers = {
                "x-user": userid,
                "x-account-id": userid,
                "x-account-type": account_type
            }
        if token:
            if not token.startswith("Bearer "):
                token = f"Bearer {token}"
            headers["Authorization"] = token


        # 将 kg 参数配置到 data_source_dict 中，如果是 kg 默认全走内部的参数调用
        if kg_params:
            datasources_in_kg = await get_datasource_from_kg_params(
                addr=base_url,
                kg_params=kg_params,
                headers=headers,
                dip_type=dip_type
            )

            logger.info(f"datasources_in_kg: {datasources_in_kg}")
            view_list = [ds.get("id") for ds in datasources_in_kg]

        if kn_params:
            for kn_param in kn_params:
                if type(kn_param) == dict:
                    kn_id = kn_param.get('knowledge_network_id', '')
                else:
                    kn_id = kn_param

            data_views, _, _ = await get_datasource_from_agent_retrieval_async(
                kn_id=kn_id,
                query=params.get('input', ''),
                search_scope=search_scope,
                headers=headers,
                base_url=base_url,
                max_concepts=config_dict.get('view_num_limit', _SETTINGS.DEFAULT_AGENT_RETRIEVAL_MAX_CONCEPTS),
                mode=recall_mode
            )
            view_list.extend([view.get("id") for view in data_views])

        data_source = DataView(
            view_list=view_list,
            base_url=base_url,
            user_id=userid,
            token=token,
            account_type=account_type
        )

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

        # 解析 inner_llm 参数
        inner_llm_dict = params.get("inner_llm", {})
        logger.info(f"inner_llm_dict: {inner_llm_dict}")

        llm_headers = {
            "x-user": userid,
            "x-account-id": userid,
            "x-account-type": account_type
        }

        llm_dict = parse_llm_from_model_factory(inner_llm_dict, headers=llm_headers)
        llm_dict.update(params.get("llm", {}))

        logger.info(f"real llm_dict: {llm_dict}")

        llm = CustomChatOpenAI(**llm_dict)

        tool = cls(data_source=data_source, llm=llm, api_mode=True, **config_dict)

        # Input Params
        in_put_infos = params.get("infos", {})
        
        in_put_infos['input'] = params.get('input', '')
        if not in_put_infos.get('action'):
            in_put_infos['action'] = params.get('action', ActionType.GEN_EXEC.value)

        # invoke tool
        res = await tool.ainvoke(input=in_put_infos)
        return res
    
    @staticmethod
    async def get_api_schema():
        inputs = {
            'data_source': {
                'view_list': ['view_id'],
                'base_url': 'https://xxxxx',
                'token': '',
                'user_id': '',
                'kg': [
                    {
                        'kg_id': '129',
                        'fields': ['regions', 'comments'],
                    }
                ],
                'kn_id': '',
                'search_scope': ['object_types', 'relation_types', 'action_types'],
                'recall_mode': 'keyword_vector_retrieval'
            },
            'llm': {
                'model_name': 'Model Name',
                'openai_api_key': '******',
                'openai_api_base': 'http://xxxx',
                'max_tokens': 4000,
                'temperature': 0.1
            },
            'inner_llm': {
                'frequency_penalty': 0, 
                'id': '1935601639213895680', 
                'max_tokens': 1000, 
                'name': 'doubao-seed-1.6-flash', 
                'presence_penalty': 0, 
                'temperature': 1, 
                'top_k': 1,
                'top_p': 1
            },
            'config': {
                'background': '',
                'retry_times': 3,
                'session_type': 'in_memory',
                'session_id': '123',
                'force_limit': 100,
                'only_essential_dim': True,
                'dimension_num_limit': 10,
                'return_record_limit': 10,
                'return_data_limit': 1000,
                'view_num_limit': 5,
                'rewrite_query': False,
                'show_sql_graph': False,
                'force_limit': 1000,
                'recall_mode': 'keyword_vector_retrieval'
            },
            'infos': {
                'knowledge_enhanced_information': {},
                'extra_info': '',
            },
            'input': '去年的业绩',
            'action': 'gen_exec'
        }

        outputs = {
            "output": {
                "sql": "SELECT ... FROM ... WHERE ... LIMIT 100",
                "explanation": {
                    "XX 视图": [
                        {"指标": "XX 销量"},
                        {"日期": "XX 日期范围"},
                        {"品牌": "XX 品牌"}
                    ]
                },
                "cites": [{"id": "VIEW_ID", "name": "XX 视图", "type": "data_view", "description": "XX 视图描述"}],
                "data": [{"日期": "2024-01-01", "品牌": "XX 品牌", "销量": 200}],
                "title": "XX 标题",
                "data_desc": {"return_records_num": 1, "real_records_num": 1},
                "result_cache_key": "RESULT_CACHE_KEY"
            },
            "tokens": "100",
            "time": "14.328890085220337"
        }

        return {
            "post": {
                "summary": ToolName.from_text2sql.value,
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
                "description": _DESCS["tool_description"]["cn"],
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "data_source": {
                                        "type": "object",
                                        "description": "视图配置信息",
                                        "properties": {
                                            "view_list": {
                                                "type": "array",
                                                "description": "逻辑视图ID列表",
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
                                            "kg": {
                                                "type": "array",
                                                "description": "知识图谱配置参数，用于从知识图谱中获取数据源",
                                                "items": {
                                                    "type": "object",
                                                    "properties": {
                                                        "kg_id": {
                                                            "type": "string",
                                                            "description": "知识图谱ID"
                                                        },
                                                        "fields": {
                                                            "type": "array",
                                                            "description": "用户选中的实体字段列表",
                                                            "items": {
                                                                "type": "string"
                                                            }
                                                        }
                                                    },
                                                    "required": ["kg_id", "fields"]
                                                }
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
                                            'search_scope': {
                                                'type': 'array',
                                                'description': '知识网络搜索范围，支持 object_types, relation_types, action_types',
                                                'items': {
                                                    'type': 'string'
                                                }
                                            },
                                            'recall_mode': {
                                                'type': 'string',
                                                'description': '召回模式，支持 keyword_vector_retrieval(默认), agent_intent_planning, agent_intent_retrieval',
                                                'enum': ['keyword_vector_retrieval', 'agent_intent_planning', 'agent_intent_retrieval'],
                                                'default': 'keyword_vector_retrieval'
                                            }
                                        },
                                        "required": []
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
                                        },
                                        "required": []
                                    },
                                    "inner_llm": {
                                        "type": "object",
                                        "description": "内部语言模型配置，用于指定内部使用的 LLM 模型参数，如模型ID、名称、温度、最大token数等。支持通过模型工厂配置模型"
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
                                            "only_essential_dim": {
                                                "type": "boolean",
                                                "description": "在生成的结果解释说明中，是否只展示必要的维度",
                                                "default": True
                                            },
                                            "rewrite_query": {
                                                "type": "boolean",
                                                "description": "是否重写用户输入的自然语言查询，即在生成 SQL 时，根据数据源的描述和样本数据，重写用户输入的自然语言查询，以更符合数据源的实际情况",
                                                "default": False
                                            },
                                            "view_num_limit": {
                                                "type": "integer",
                                                "description": "给大模型选择时引用视图数量限制，-1表示不限制，原因是数据源包含大量视图，可能导致大模型上下文token超限，内置的召回算法会自动筛选最相关的视图",
                                                "default": 5
                                            },
                                            "dimension_num_limit": {
                                                "type": "integer",
                                                "description": f"给大模型选择时维度数量限制，-1表示不限制, 系统默认为 {_SETTINGS.TEXT2SQL_DIMENSION_NUM_LIMIT}",
                                                "default": _SETTINGS.TEXT2SQL_DIMENSION_NUM_LIMIT
                                            },
                                            "force_limit": {
                                                "type": "integer",
                                                "description": f"生成的 SQL 的 LIMIT 子句限制，-1表示不限制, 系统默认为 {_SETTINGS.TEXT2SQL_FORCE_LIMIT}",
                                                "default": _SETTINGS.TEXT2SQL_FORCE_LIMIT
                                            },
                                            "return_record_limit": {
                                                "type": "integer",
                                                "description": "SQL 执行后返回数据条数限制，-1表示不限制，原因是SQL执行后返回大量数据，可能导致大模型上下文token超限",
                                                "default": -1
                                            },
                                            "return_data_limit": {
                                                "type": "integer",
                                                "description": "SQL 执行后返回数据总量限制，单位是字节，-1表示不限制，原因是SQL执行后返回大量数据，可能导致大模型上下文token超限",
                                                "default": -1
                                            }
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
                                        "description": "工具行为类型，其中gen表示只生成SQL，gen_exec表示生成并执行SQL，show_ds表示只展示数据源信息",
                                        "enum": ["gen", "gen_exec", "show_ds"],
                                        "default": "gen_exec"
                                    },
                                    "timeout": {
                                        "type": "number",
                                        "description": "请求超时时间（秒），超过此时间未完成则返回超时错误，默认120秒",
                                        "default": 120
                                    }
                                },
                                "required": ["data_source", "input", "action"]
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
                                        "sql": {
                                            "type": "string",
                                            "description": "生成的SQL语句，基于用户输入的自然语言查询自动生成"
                                        },
                                        "explanation": {
                                            "type": "object",
                                            "description": "SQL解释说明，以字典形式展示查询条件、指标、维度等信息的业务含义"
                                        },
                                        "cites": {
                                            "type": "array",
                                            "description": "引用的数据视图列表，包含视图ID、名称、类型和描述等信息",
                                            "items": {
                                                "type": "object"
                                            }
                                        },
                                        "result_cache_key": {
                                            "type": "string",
                                            "description": "结果缓存键，用于从缓存中获取完整查询结果，前端可通过此键获取完整数据"
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
    

if __name__ == "__main__":
    # if not run_manager:
    #     run_manager.on_text("正在生成 SQL 语句")
    # if not run_manager:
    #     run_manager.on_text("生成结束: SQL: {sql}")

    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(
        model_name='Qwen-72B-Chat',
        openai_api_key="EMPTY",
        openai_api_base="http://192.168.173.19:8304/v1",
        max_tokens=2000,
        temperature=0.01,
    )
    # llm = ChatOpenAI(
    #     model_name='loom-7B',
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://192.168.173.19:8789/v1",
    #     max_tokens=2000,
    #     temperature=0.01,
    # )

    # os.environ["OPENAI_API_KEY"] = "your key"
    # llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    # llm = ChatOllama(model="phi3:latest")
    # llm = ChatOllama(model="codegemma")

    # sqlite = SQLiteDataSource(
    #     db_file="./tests/agent_test/fake.db",
    #     tables=["movie"]
    # )

    # tool = Text2SQLTool(
    #     language="cn",
    #     data_source=sqlite,
    #     llm=llm,
    #     background="电影表中的年份字段是年份，如果用户使用两位数的年份，要注意转换成四位数的年份。",
    # )
    from data_retrieval.api.auth import get_authorization
    from data_retrieval.datasource.vega_datasource import VegaDataSource

    token = get_authorization("https://10.4.110.170", "xia", "111111")
    datasource = VegaDataSource(
        view_list=[
            "330755ad-6126-415e-adb5-79adb12a0455",
            "ee4aaa09-498c-4126-ae29-8a8590c2d1f0",
        ],
        token=token,
        user_id="fa1ee91a-643d-11ef-8405-a214ef0d99c8"
    )

    tool = Text2SQLTool.from_data_source(
        language="cn",
        data_source=datasource,
        llm=llm,
        get_desc_from_datasource=True
    )

    # print(tool.description)

    print(tool.invoke({"input": "各种苹果的销量分组", }))
