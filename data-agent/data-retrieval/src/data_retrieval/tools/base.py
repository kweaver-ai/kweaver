import json
import time
import asyncio
from enum import Enum
from functools import wraps
from textwrap import dedent
from typing import Any, Callable, List, Dict, Optional, OrderedDict, Union, Tuple

from abc import ABC, abstractmethod
from dataclasses import dataclass

from langchain_community.callbacks import get_openai_callback
from langchain.tools import BaseTool
from langchain.pydantic_v1 import PrivateAttr
from langchain.schema import BaseMessage

from fastapi import HTTPException

from data_retrieval.prompts.manager.base import BasePromptManager
from data_retrieval.settings import get_settings
from data_retrieval.utils.model_types import get_standard_model_type
from langchain.callbacks.base import AsyncCallbackHandler, BaseCallbackHandler

from data_retrieval.utils.id_gen import generate_task_id

from data_retrieval.utils.dip_services.services.builder import Builder
from data_retrieval.logs.logger import logger
from data_retrieval.settings import get_settings


_settings = get_settings()
_TOOL_MESSAGE_KEY = "tool_type"

def is_tool_message(message: BaseMessage) -> bool:
    if message.additional_kwargs.get(_TOOL_MESSAGE_KEY, ""):
        return True
    return False

def parse_llm_from_model_factory(inner_llm_dict: dict, headers: dict = {"x-user": "any", "x-account-id": "any", "x-account-type": "user"}) -> dict:
    """
    解析模型工厂调用参数
    """
    # {
    #      'frequency_penalty': 0,
    #      'id': '1935601639213895680', 
    #      'max_tokens': 1000, 
    #      'name': 'doubao-seed-1.6-flash', 
    #      'presence_penalty': 0, 
    #      'temperature': 1, 
    #      'top_k': 1, 
    #      'top_p': 1
    # }
    llm_dict = {}
    if inner_llm_dict:
        logger.info(f"inner_llm_dict: {inner_llm_dict}")
        
        inner_llm_dict.pop("id", "")
        llm_dict["model_name"] = inner_llm_dict.pop("name", "")
        llm_dict["openai_api_key"] = "EMPTY"
        llm_dict["openai_api_base"] = _settings.DIP_MODEL_API_URL

        if "max_tokens" in inner_llm_dict:
            llm_dict["max_tokens"] = inner_llm_dict.pop("max_tokens")
        if "temperature" in inner_llm_dict:
            llm_dict["temperature"] = inner_llm_dict.pop("temperature")

        model_kwargs = {}
        if "frequency_penalty" in inner_llm_dict:
            model_kwargs["frequency_penalty"] = inner_llm_dict.pop("frequency_penalty")
        if "presence_penalty" in inner_llm_dict:
            model_kwargs["presence_penalty"] = inner_llm_dict.pop("presence_penalty")

        if model_kwargs:
            llm_dict["model_kwargs"] = model_kwargs

        logger.info(f"params not effective: {inner_llm_dict}")

        # llm_dict["model_kwargs"] = inner_llm_dict

        llm_dict["default_headers"] = headers
    
    else:
            # 不设置时, 从内部获取
        llm_dict = {
            "model_name": _settings.TOOL_LLM_MODEL_NAME,
            "openai_api_key": _settings.TOOL_LLM_OPENAI_API_KEY,
            "openai_api_base": _settings.TOOL_LLM_OPENAI_API_BASE,
        }
        
    return llm_dict


def make_json_response(result: Any):
    if isinstance(result, Exception):
        raise HTTPException(status_code=500, detail=str(result))
    else:
        if isinstance(result, str):
            try:
                result = json.loads(result)
            except ValueError as e:
                pass

        if isinstance(result, dict):
            output = result.get("output", result)
            full_output = result.get("full_output", {})
        else:
            output = result
            full_output = {}

        res = {
            "result": output,
        }

        if full_output:
            res["full_result"] = full_output
        return res


def api_tool_decorator(func: Callable):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            if asyncio.iscoroutinefunction(func):
                res = await func(*args, **kwargs)
            else:
                res = func(*args, **kwargs)
        except Exception as e:
            return make_json_response(e)
        logger.info(f"api_tool_decorator res: {res}")
        return make_json_response(res)
    return wrapper


class AFTool(BaseTool, ABC):
    return_record_limit: int = -1  # 返回数据条数，与字节数相互作用, -1 代表不限制
    return_data_limit: int = -1  # 返回数据总量，与字节数相互作用, -1 
    session_id: str = ""
    api_mode: bool = False
    timeout: int = 120

    _task_id: str = PrivateAttr("")
    _result_cache_key: str = PrivateAttr("")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._task_id = generate_task_id()
        self._result_cache_key = self.session_id + "_" + self._task_id

    def handle_result(self,
                      log,
                      ans_multiple):
        """ A abstract method to deal with tool answers
        """
        pass

    def refresh_result_cache_key(self):
        self._result_cache_key = self.session_id + "_" + self._task_id

    @api_tool_decorator
    @classmethod
    async def as_async_api_cls(cls, *args, **kwargs):
        """将工具转换为异步函数
        """
        tool = cls(*args, **kwargs, api_mode=True)
        return tool._arun(*args, **kwargs)
    
    # def as_function(self, *args, **kwargs):
    #     """将工具转换为同步函数
    #     """
    #     pass

class LLMTool(AFTool):
    language: str = "cn"
    llm: Any = None
    prompt_manager: BasePromptManager = None
    model_type: str = get_standard_model_type(_settings.MODEL_TYPE)


class ToolName(Enum):

    # base tools
    from_sailor = "search"
    from_json2plot = "json2plot"
    from_human = "询问用户"
    from_text2sql = "text2sql"
    from_text2metric = "text2metric"
    from_get_tool_cache = "get_tool_cache"
    GetTableDDLAndSampleToolName = "get_ddl_and_sample"
    VirtualizationEngineToolName = "execute"
    from_knowledge_enhanced = "knowledge_enhanced"
    from_analyzer_with_code = "analyzer_with_code"
    context2question = "context2question"
    from_text2ngql = "text2ngql"
    from_sql_helper = "sql_helper"

    # special tools
    arima_prediction = "arima_prediction"
    detect_anomalies = "detect_anomalies"
    decision_maker = "decision_maker"
    from_get_metadata = "get_metadata"
    from_datasource_filter = "datasource_filter"

    # sandbox tools
    sandbox = "sandbox"

@dataclass
class RetrieverConfig:
    """Use vector store to retrieve information

    Attributes:
        top_k: retrieve top k documents, default 1, if set to 0, NOT use retriever
        threshold: similarity threshold, default 0.5
    """
    top_k: int = 0
    threshold: float = 0.5

class ToolResult:
    def __init__(
        self,
        cites: Any = None,
        table: str | dict = None,
        new_table: str | dict = None,
        df2json: str = None,
        text: str = None,
        explain: str = None,
        chart: str | dict = None,
        new_chart: str | dict = None,
    ):
        self.cites = cites
        self.table = table
        self.new_table = new_table
        self.df2json = df2json
        self.text = text
        self.explain = explain
        self.chart = chart
        self.new_chart = new_chart
        
    def __repr__(self):
        return dedent(
            f"""
             ToolResult(
                 cites={self.cites},
                 table={self.table}, 
                 df2json={self.df2json}, 
                 text={self.text}, 
                 explain={self.explain},
                 chart={self.chart},
                 new_table={self.new_table},
                 new_chart={self.new_chart}
             )
        """
        )

    def to_ori_json(self):
        return {
            "cites": self.cites,
            "table": self.table,
            "new_table": self.new_table,
            "chart": self.chart,
            "new_chart": self.new_chart,
            "df2json": self.df2json,
            "text": self.text,
            "explain": self.explain
        }

    def to_json(self):
        return {
            "result": {
                "status": "answer",
                "res": {
                    "cites": self.cites if self.cites else [],
                    "table": [self.table] if self.table else [],
                    "new_table": [self.new_table] if self.new_table else [],
                    "chart": [self.chart] if self.chart else [],
                    "new_chart": [self.new_chart] if self.new_chart else [],
                    "df2json": [self.df2json] if self.df2json else [],
                    "text": [self.text] if self.text else [],
                    "explain": [self.explain] if self.explain else []
                }
            }
        }


class ToolMultipleResult:

    def __init__(
        self,
        cites: Any = [],
        table: list = [],  # 表名
        df2json: list = [],  # 表数据
        text: list = [],  # 文本
        explain: list = [],  # 解释
        chart: list = [],  # 图表
        new_table: list = [],  # 新表，由于超市和数据应用的 节奏不一样，通过定义一个新表来过度，主要存储包含 title 的表
        new_chart: list = [],  # 新图，同理
        sailor_search_result: list = [],  # 搜索结果
        cache_keys: OrderedDict = OrderedDict(),
        graph: list = [],  # 图表
    ):
        print("=============== 进入 ToolMultipleResult 初始化 ===============")
        if cites:
            cites = []
        if table:
            table = []
        if df2json:
            df2json = []
        if text:
            text = []
        if explain:
            explain = []
        if chart:
            chart = []
        if new_table:
            new_table = []
        if new_chart:
            new_chart = []
        if cache_keys:
            cache_keys = OrderedDict()
        if sailor_search_result:
            sailor_search_result = []
        if graph:
            graph = []

        self.cites = cites
        self.table = table
        self.df2json = df2json
        self.text = text
        self.explain = explain
        self.chart = chart
        self.new_table = new_table
        self.new_chart = new_chart
        self.cache_keys = cache_keys
        self.sailor_search_result = sailor_search_result
        self.graph = graph

    def __repr__(self):
        return dedent(
            f"""
             ToolMultipleResult(
                 cites={self.cites},
                 table={self.table}, 
                 df2json={self.df2json}, 
                 text={self.text}, 
                 explain={self.explain},
                 chart={self.chart},
                 new_table={self.new_table},
                 new_chart={self.new_chart},
                 cache_keys={self.cache_keys},
                 sailor_search_result={self.sailor_search_result},
                 graph={self.graph}
             )
        """
        )

    def to_ori_json(self):
        return {
            "cites": self.cites,
            "table": self.table,
            "chart": self.chart,
            "df2json": self.df2json,
            "text": self.text,
            "explain": self.explain,
            "new_table": self.new_table,
            "new_chart": self.new_chart,
            "cache_keys": self.cache_keys,
            "sailor_search_result": self.sailor_search_result,
            "graph": self.graph
        }

    def to_json(self):
        return {
            "result": {
                "status": "answer",
                "res": {
                    "cites": self.cites,
                    "table": self.table,
                    "chart": self.chart,
                    "df2json": self.df2json,
                    "text": self.text,
                    "explain": self.explain,
                    "new_table": self.new_table,
                    "new_chart": self.new_chart,
                    "cache_keys": self.cache_keys,
                    "sailor_search_result": self.sailor_search_result,
                    "graph": self.graph
                }
            }
        }


class LogResult:
    def __init__(
        self,
        observation: str = '',
        tool_name: str = "",
        tool_input: str = "",
        thought: str = "",
        result: Any = {},
        time: str = "",
        tokens: str = "",
    ):
        self.observation = observation
        self.tool_name = tool_name
        self.tool_input = tool_input
        self.thought = thought
        self.result = result
        self.time = time
        self.tokens = tokens

    def __repr__(self):
        return dedent(
            f"""
             LogResult(  
                 observation={self.observation},               
                 tool_name={self.tool_name}, 
                 tool_input={self.tool_input},
                 thought={self.thought},
                 result={self.result},
                 time={self.time},
                 tokens={self.tokens}
             )
            """
        )

    def to_json(self):
        return {
            'observation': self.observation,
            "tool_name": self.tool_name,
            "tool_input": self.tool_input,
            "thought": self.thought,
            "result": self.result,
            "time": self.time,
            "tokens": self.tokens
        }


def construct_final_answer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        with get_openai_callback() as cb:
            output = func(*args, **kwargs)
            print(cb)
        print(f"time: {time.time() - start}")

        if "full_output" in output:
            full_output = output.pop("full_output")
        else:
            full_output = {}

        if "output" in output:
            output = output.pop("output")

        res = {
            "output": output,
            "tokens": str(cb.total_tokens),
            "time": str(time.time() - start)
        }
        if full_output:
            res["full_output"] = full_output
        return json.dumps(res, ensure_ascii=False)

    return wrapper


def async_construct_final_answer(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.time()
        with get_openai_callback() as cb:
            output = await func(*args, **kwargs)
            print(cb)
        print(f"time: {time.time() - start}")

        if "full_output" in output:
            full_output = output.pop("full_output")
        else:
            full_output = {}

        if "output" in output:
            output = output.pop("output")

        res = {
            "output": output,
            "tokens": str(cb.total_tokens),
            "time": str(time.time() - start)
        }
        if full_output:
            res["full_output"] = full_output
        return json.dumps(res, ensure_ascii=False)

    return wrapper

class ToolCallbackHandler(AsyncCallbackHandler):
    messages: List = []
    llm_response: Any = None
    llm_response_reasoning: Any = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    async def on_llm_start(self, **kwargs):
        self.messages = kwargs.get("messages", [])
    
    async def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[Any],
        *,
        run_id: Any,
        parent_run_id: Optional[Any] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Any:
        self.messages = messages

    async def on_llm_end(
        self,
        response: Any,
        *,
        run_id: Any,
        parent_run_id: Optional[Any] = None,
        tags: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> None:
        self.llm_response = response

    async def on_chain_start(
        self,
        serialized: Dict[str, Any],
        inputs: Dict[str, Any],
        *,
        run_id: Any,
        parent_run_id: Optional[Any] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any
    ):
        pass
    
    async def on_chain_end(
        self,
        outputs: Dict[str, Any],
        *,
        run_id: Any,
        parent_run_id: Optional[Any] = None,
        tags: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> None:
        pass


def validate_openapi_schema(schema: dict) -> Tuple[bool, Optional[str]]:
    """
    验证 OpenAPI Schema 语法
    
    Args:
        schema: API Schema 字典
        
    Returns:
        (is_valid, error_message): (是否合法, 错误信息)
    """
    real_schema = {
        "openapi": "3.0.3",
        "info": {
            "title": "validate_openapi_schema",
            "description": "Validate OpenAPI Schema",
            "version": "1.0.11"
        },
        "servers": [
            {
                "url": "http://example.com"
            }
        ],
        "paths": {}
    }

    real_schema["paths"]["/validate_openapi_schema"] = schema

    # 尝试使用 openapi-spec-validator 库（可选依赖）
    try:
        from openapi_spec_validator import validate_spec  # type: ignore
        # 验证 OpenAPI spec
        validate_spec(real_schema)
        return True, None
    except Exception as e:
        return False, f"验证失败: {str(e)}"
