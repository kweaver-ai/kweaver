# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-5-23
import json
import traceback
import uuid
from typing import Any, Optional, Type, Dict, Union, List
from enum import Enum
from collections import OrderedDict
from langchain.callbacks.manager import (AsyncCallbackManagerForToolRun,
                                         CallbackManagerForToolRun)
from langchain.pydantic_v1 import BaseModel, Field, PrivateAttr
from langchain_core.tools import ToolException
from fastapi import Body

from af_agent.api.error import VirEngineError
from af_agent.errors import SQLHelperException
from af_agent.datasource.db_base import DataSource
from af_agent.datasource.dip_dataview import DataView, get_datasource_from_kg_params
from af_agent.api.agent_retrieval import get_datasource_from_agent_retrieval_async
from af_agent.logs.logger import logger
from af_agent.sessions import CreateSession, BaseChatHistorySession # 重新导入 session 相关模块
from af_agent.tools.base import ToolMultipleResult, ToolName
from af_agent.tools.base import construct_final_answer, async_construct_final_answer
from af_agent.tools.base import AFTool, _TOOL_MESSAGE_KEY
from af_agent.tools.base import api_tool_decorator
from af_agent.errors import ToolFatalError
from af_agent.api import VegaType
from af_agent.settings import get_settings
from af_agent.utils.func import JsonParse
from af_agent.utils._common import run_blocking

import asyncio
import time

_SETTINGS = get_settings()

error_message1 = "sql_helper 工具无法回答此问题，请尝试更换其它工具，并不再使用 sql_helper 工具"
error_message2 = "工具调用失败，请再次尝试，或者更换其它工具, 异常信息: {error_info}"

_DESCS = {
    "tool_description": {
        "cn": "专门用于调用 SQL 语句的工具，支持获取元数据信息和执行 SQL 语句。注意：此工具不生成 SQL 语句，只执行已提供的 SQL 语句。",
        "en": "A tool specifically for calling SQL statements, supporting metadata retrieval and SQL execution. Note: This tool does not generate SQL statements, only executes provided SQL statements.",
    },
    "sql": {
        "cn": "要执行的 SQL 语句",
        "en": "SQL statement to execute",
    },
    "title": {
        "cn": "数据的标题，可选参数",
        "en": "Title of the data, optional parameter",
    },
    "command": {
        "cn": "命令类型：get_metadata(获取元数据信息)、execute_sql(执行 SQL 语句)",
        "en": "Command type: get_metadata (get metadata information), execute_sql (execute SQL statement)",
    },
    "desc_from_datasource": {
        "cn": "\n- 包含的视图信息：{desc}",
        "en": "\nHere's the data description for the SQL helper tool:\n{desc}",
    }
}

class CommandType(str, Enum):
    GET_METADATA = "get_metadata"
    EXECUTE_SQL = "execute_sql"


class SQLHelperInput(BaseModel):
    command: str = Field(
        default=CommandType.EXECUTE_SQL.value,
        description=_DESCS["command"]["cn"]
    )
    sql: Optional[str] = Field(
        default="",
        description=_DESCS["sql"]["cn"]
    )
    title: Optional[str] = Field(
        default="",
        description=_DESCS["title"]["cn"]
    )


class SQLHelperTool(AFTool):
    """SQL Helper Tool

    Use from_data_source to create a new instance of SQLHelperTool

    @params
        name: Tool Name of SQLHelper
        description: Tool Description of SQLHelper
        language: Language of the tool, cn and en are supported
        args_schema: Input schema of tables
        data_source: DataSource instance
        # llm: Language model instance
        return_record_limit: Limit of returned records
        return_data_limit: Limit of returned data
    """
    name: str = "sql_helper"
    description: str = _DESCS["tool_description"]["cn"]
    args_schema: Type[BaseModel] = SQLHelperInput
    data_source: DataView # 修改为 DataView 类型
    return_record_limit: int = _SETTINGS.RETURN_RECORD_LIMIT
    return_data_limit: int = _SETTINGS.RETURN_DATA_LIMIT
    view_num_limit: int = _SETTINGS.SQL_HELPER_RECALL_TOP_K  # 仅在 get_metadata 命令时有效，用于限制返回的视图数量
    dimension_num_limit: int = _SETTINGS.SQL_HELPER_DIMENSION_NUM_LIMIT  # 仅在 get_metadata 命令时有效，用于限制返回的维度数量。注意：在 execute_sql 命令时无效，因为工具会严格执行 SQL
    with_sample: bool = True
    session_id: Optional[str] = "" # 重新引入 session_id
    session_type: Optional[str] = "redis" # 重新引入 session_type
    session: Optional[BaseChatHistorySession] = None # 重新引入 session
    force_limit: int = _SETTINGS.SQL_HELPER_FORCE_LIMIT
    # handle_tool_error: bool = True
    get_desc_from_datasource: bool = False

    _initial_view_ids: List[str] = PrivateAttr(default=[])

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        if kwargs.get("session") is None:
            self.session = CreateSession(self.session_type) # 重新引入 session 初始化
        
        # 保存初始化的视图id列表
        if self.data_source and self.data_source.get_tables():
            self._initial_view_ids = self.data_source.get_tables()
        else:
            self.args_schema = SQLHelperInput

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
    def from_data_source(cls, data_source: DataView, *args, **kwargs):
        """Create a new instance of SQLHelperTool

        Args:
            data_source (DataSource): DataSource instance
            # llm: Language model instance

        Examples:
            data_source = DataView(
                view_list=["view_id"],
                token="token"
            )
            tool = SQLHelperTool.from_data_source(
                data_source=data_source,
                # llm=llm
            )
        """
        return cls(data_source=data_source, *args, **kwargs)

    def _run(
            self,
            command: str = CommandType.EXECUTE_SQL.value,
            sql: str = "",
            title: str = "",
            run_manager: Optional[CallbackManagerForToolRun] = None
    ):
        """同步运行方法，直接调用异步版本"""
        coroutine = self._arun(
            command=command,
            sql=sql,
            title=title,
            run_manager=run_manager
        )
        return run_blocking(coroutine)

    @async_construct_final_answer
    async def _arun(
            self,
            command: str = CommandType.EXECUTE_SQL.value,
            sql: str = "",
            title: str = "",
            run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ):
        try:
            logger.info(f"sql_helper _arun command: {command}, sql: {sql}, title: {title}")
            if not title:
                logger.warning(f"sql_helper _arun title is empty, set to 所有数据")
                title = "所有数据"
            self._get_desc_from_datasource(self.get_desc_from_datasource)        
            # 根据命令类型执行不同操作
            if command == CommandType.GET_METADATA.value:
                # return await self._get_metadata()
                
                # 如果数据源为空，则抛出异常
                if not self.data_source.get_tables():
                    raise SQLHelperException("数据源为空，请检查 view_list 参数。如果涉及知识网络，请检查 kn 参数。如果是老版本知识网络，请检查 kg 参数。")
        
                return await self._get_meta_sample_data(
                    input_query=title,
                    view_limit=self.view_num_limit,
                    dimension_num_limit=self.dimension_num_limit,
                    with_sample=self.with_sample
                )
            elif command == CommandType.EXECUTE_SQL.value:
                return await self._execute_sql(sql, title)
            else:
                raise SQLHelperException(f"不支持的命令类型: {command}")
            
        except SQLHelperException as e:
            traceback.print_exc()
            raise ToolException(error_message2.format(error_info=e.json()))

        except Exception as e:
            print(traceback.format_exc())
            raise ToolException(error_message2.format(error_info=e))

    async def _get_metadata(self):
        """获取元数据信息"""
        try:
            metadata = await self.data_source.get_metadata_async()
            
            summary = []
            for detail in metadata:
                summary.append({
                    "name": detail["name"],
                    "comment": detail["comment"],
                    "table_path": detail["path"]
                })

            # 格式化元数据信息
            return {
                "summary": summary,
                "metadata": metadata,
                "message": "成功获取元数据信息"
            }
            
        except Exception as e:
            logger.error(f"获取元数据信息失败: {e}")
            raise SQLHelperException(f"获取元数据信息失败: {str(e)}")

    async def _get_meta_sample_data(self, input_query="", view_limit=5, dimension_num_limit=30, with_sample=True):
        """获取元数据样本数据
        
        注意：view_limit 和 dimension_num_limit 参数在此方法中有效，
        用于限制返回的视图数量和维度数量，避免返回过多数据。
        """
        try:
            meta_sample_data = await self.data_source.get_meta_sample_data_async(
                input_query=input_query,
                view_limit=view_limit,
                dimension_num_limit=dimension_num_limit,
                with_sample=with_sample
            )

            summary = []
            for detail in meta_sample_data.get("detail", []):
                detail.pop("en2cn", None)
                summary.append({
                    "name": detail["name"],
                    "comment": detail["comment"],
                    "table_path": detail["path"]
                })

            return {
                "summary": summary,
                "metadata": meta_sample_data.get("detail", []),
                "sample": meta_sample_data.get("sample", {}),
                "message": "成功获取元数据样本数据",
                "title": input_query
            }
        except Exception as e:
            logger.error(f"获取元数据样本数据失败: {e}")
            raise SQLHelperException(f"获取元数据样本数据失败: {str(e)}")


    def _add_force_limit(self, sql: str):
        """添加 force_limit 限制"""
        alias = "_outer_" + uuid.uuid4().hex[:8]
        inner = sql.rstrip().rstrip(";")
        return f"SELECT * FROM (\n{inner}\n) AS {alias}\nLIMIT {self.force_limit}"


    async def _execute_sql(self, sql: str, title: str = ""):
        """执行 SQL 语句
        
        注意：view_num_limit 和 dimension_num_limit 参数在此方法中无效，
        因为工具会严格执行 SQL 语句，不会限制视图或维度数量。
        这两个参数仅在 get_metadata 命令时有效。
        """
        if not sql.strip():
            raise SQLHelperException("SQL 语句不能为空")
        
        try:
            # 执行 SQL 查询
            if self.force_limit > 0:
                sql = self._add_force_limit(sql)
                logger.info(f"添加 force_limit 限制后的 SQL 语句: {sql}")

            logger.info(f"执行 SQL 语句: {sql}")
            query_result = await self.data_source.query_async(
                sql,
                as_gen=False,
                as_dict=True
            )
            
            # 处理查询结果
            if query_result.get("data"):
                # 转换数据格式
                parse = JsonParse(query_result)
                # md_res = parse.to_markdown()
                dict_data = parse.to_dict()

                base_result = {
                    "command": CommandType.EXECUTE_SQL.value,
                    "sql": sql,
                    "title": title,
                    "message": "SQL 执行成功",
                    "result_cache_key": self._result_cache_key
                }
                
                # 记录日志, 完整数据
                full_result = {
                    **base_result,
                    "data": dict_data,
                    "data_desc": {
                        "return_records_num": len(dict_data),
                        "real_records_num": len(dict_data)
                    },
                }
                
                if self.session:
                    try:
                        self.session.add_agent_logs(
                                self._result_cache_key,
                                logs=full_result
                            )
                    except Exception as e:
                        logger.error(f"添加缓存失败: str{e}")
                
                # 限制返回数据量
                limited_data = parse.to_dict(
                    self.return_record_limit, 
                    self.return_data_limit
                )

                result = {
                    **base_result,
                    "data": limited_data,
                    "data_desc": {
                        "return_records_num": len(limited_data),
                        "real_records_num": len(dict_data)
                    },
                }
                
            else:
                result = {
                    "command": CommandType.EXECUTE_SQL.value,
                    "sql": sql,
                    "title": title,
                    "data": [],
                    "data_desc": {
                        "return_records_num": 0,
                        "real_records_num": 0
                    },
                    "message": "SQL 执行成功，但无返回数据"
                }

                full_result = result
            
            if self.api_mode:
                return {
                    "output": result,
                    "full_output": full_result
                }
            else:   
                return result
                
        except VirEngineError as e:
            logger.error(f"SQL 执行错误: {e}")
            raise SQLHelperException(f"SQL 执行错误: {e.detail}")
        except Exception as e:
            logger.error(f"SQL 执行失败: {e}")
            raise SQLHelperException(f"SQL 执行失败: {str(e)}")

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
                
                if tool_res.get("command") == CommandType.GET_METADATA.value:
                    # 处理元数据信息
                    ans_multiple.text.append(f"元数据信息: {tool_res.get('message', '')}")
                    ans_multiple.cites = tool_res.get("metadata", [])
                elif tool_res.get("command") == CommandType.EXECUTE_SQL.value:
                    # 处理 SQL 执行结果
                    data = tool_res.get("data", [])
                    title = tool_res.get("title", "")
                    sql = tool_res.get("sql", "")
                    
                    ans_multiple.table.append(sql)
                    
                    # 如果有title，使用它作为标题，否则使用默认标题
                    if title:
                        table_title = f"{title}: {sql}"
                    else:
                        table_title = f"SQL 执行结果: {sql}"
                    
                    ans_multiple.new_table.append({
                        "title": table_title, 
                        "data": data
                    })
                    ans_multiple.text.append(tool_res.get("message", ""))

                ans_multiple.cache_keys[self._result_cache_key] = {
                    "tool_name": "sql_helper",
                    "title": f"SQL Helper - {tool_res.get('command', '')}",
                    "sql": tool_res.get("sql", ""),
                    "is_empty": len(tool_res.get("data", [])) == 0,
                    "fields": list(tool_res.get("data", [{}])[0].keys()) if tool_res.get("data") else [],
                }
        # pass # 暂时不做任何处理

    @classmethod
    @api_tool_decorator
    async def as_async_api_cls(
            cls,
            params: dict = Body(...),
            stream: bool = False,
            mode: str = "http"
    ):
        logger.info(f"sql_helper as_async_api_cls params: {params}")
        # data_source Params
        data_source_dict = params.get('data_source', {})
        kg_params = data_source_dict.get('kg', {})
        config_dict = params.get("config", {})

        base_url = data_source_dict.get('base_url', '') # 直接获取 base_url
        token = data_source_dict.get('token', '')
        user_id = data_source_dict.get('user_id', '')
        account_type = data_source_dict.get('account_type', 'user')
        view_list = data_source_dict.get('view_list', [])

        kn_params = data_source_dict.get('kn', [])
        recall_mode = data_source_dict.get('recall_mode', _SETTINGS.DEFAULT_AGENT_RETRIEVAL_MODE)
        search_scope = data_source_dict.get('search_scope', [])
        
        # 获取 headers
        headers = {}

        if user_id:
            headers["x-user"] = user_id
            headers["x-account-id"] = user_id
            headers["x-account-type"] = account_type

        if token:
            if not token.startswith("Bearer "):
                token = f"Bearer {token}"
            headers["Authorization"] = token

        command = params.get('command', CommandType.EXECUTE_SQL.value)
        
        if command == CommandType.GET_METADATA.value:
            # 将 kg 参数配置到 data_source_dict 中
            if kg_params:
                datasources_in_kg = await get_datasource_from_kg_params(
                    addr=base_url,
                    kg_params=kg_params,
                    headers=headers,
                )

                logger.info(f"datasources_in_kg: {datasources_in_kg}")
                view_list = [ds.get("id") for ds in datasources_in_kg]
                data_source_dict['view_list'] = view_list
            
            # 业务知识网络的配置
            if kn_params:
                for kn_param in kn_params:
                    if type(kn_param) == dict:
                        kn_id = kn_param.get('knowledge_network_id', '')
                    else:
                        kn_id = kn_param

                    data_views, _, _ = await get_datasource_from_agent_retrieval_async(
                        kn_id=kn_id,
                        query=params.get('title', '所有数据'),
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
            user_id=user_id,
            token=token,
            account_type=account_type
        )

        with_sample = params.get("with_sample", False)

        if with_sample is not None:
            config_dict["with_sample"] = bool(with_sample)
        # tool = cls(data_source=data_source, llm=llm, api_mode=True, **config_dict)
        tool = cls(data_source=data_source, api_mode=True, **config_dict)

        # Input Params
        input_dict = {
            "command": params.get('command', CommandType.EXECUTE_SQL.value),
            "sql": params.get('sql', ''),
            "title": params.get('title', '')
        }

        logger.info(f"params: {params}")
        logger.info(f"input_dict: {input_dict}")
        logger.info(f"config_dict: {config_dict}")

        # invoke tool
        res = await tool.ainvoke(input=input_dict)
        return res
    
    @staticmethod
    async def get_api_schema():
        inputs = {
            'data_source': {
                'view_list': ['view_id'],
                'base_url': 'https://xxxxx',
                'token': '',
                'user_id': '',
                'account_type': 'user',
                'kn': [
                    {
                        'knowledge_network_id': '129',
                        'object_types': ['data_view', 'metric'],
                    }
                ],
                'search_scope': ['object_types', 'relation_types', 'action_types'],
                'recall_mode': 'keyword_vector_retrieval'
            },
            'config': {
                'session_type': 'redis',
                'session_id': '123',
                'return_record_limit': 10,
                'return_data_limit': 1000,
                'get_desc_from_datasource': False,
                'with_sample': True,
                'view_num_limit': 5,
                'dimension_num_limit': 30,
                'force_limit': 200,
            },
            'command': 'execute_sql',
            'sql': 'SELECT * FROM table LIMIT 10',
            'title': '数据的标题',
            'timeout': 120
        }

        outputs = {
            "output": {
                "command": "execute_sql",
                "sql": "SELECT * FROM table LIMIT 10",
                "data": [{"column1": "value1", "column2": "value2"}],
                "data_desc": {"return_records_num": 1, "real_records_num": 1},
                "message": "SQL 执行成功",
                "result_cache_key": "RESULT_CACHE_KEY"
            },
            "tokens": "100",
            "time": "14.328890085220337"
        }

        return {
            "post": {
                "summary": "sql_helper",
                "description": _DESCS["tool_description"]["cn"],
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
                                            "view_list": {
                                                "type": "array",
                                                "description": "逻辑视图ID列表",
                                                "items": {
                                                    "type": "string"
                                                }
                                            },
                                            "base_url": {
                                                "type": "string",
                                                "description": "服务器地址，用于连接数据源服务"
                                            },
                                            "token": {
                                                "type": "string",
                                                "description": "认证令牌，如提供则无需用户名和密码"
                                            },
                                            "user_id": {
                                                "type": "string",
                                                "description": "用户ID"
                                            },
                                            "account_type": {
                                                "type": "string",
                                                "description": "调用者的类型，user 代表普通用户，app 代表应用账号, anonymous 代表匿名用户",
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
                                                "description": "知识网络配置参数，用于从知识网络中获取数据源",
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

                                        },
                                        "required": []
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
                                                "description": "会话ID，用于标识和管理会话状态，同一会话ID可以共享历史数据和缓存"
                                            },
                                            "view_num_limit": {
                                                "type": "integer",
                                                "description": f"获取元数据时引用视图数量限制，-1表示不限制，原因是数据源包含大量视图，可能导致大模型上下文token超限，内置的召回算法会自动筛选最相关的视图。系统默认为 {_SETTINGS.TEXT2SQL_RECALL_TOP_K}。注意：此参数仅在 command 为 get_metadata 时有效，在 command 为 execute_sql 时无效，因为工具会严格执行 SQL，不会限制视图数量",
                                                "default": _SETTINGS.TEXT2SQL_RECALL_TOP_K
                                            },
                                            "dimension_num_limit": {
                                                "type": "integer",
                                                "description": f"获取元数据时维度数量限制，-1表示不限制, 系统默认为 {_SETTINGS.TEXT2SQL_DIMENSION_NUM_LIMIT}。注意：此参数仅在 command 为 get_metadata 时有效，在 command 为 execute_sql 时无效，因为工具会严格执行 SQL，不会限制维度数量",
                                                "default": _SETTINGS.TEXT2SQL_DIMENSION_NUM_LIMIT
                                            },
                                            "return_record_limit": {
                                                "type": "integer",
                                                "description": f"SQL 执行后返回数据条数限制，-1表示不限制，原因是SQL执行后返回大量数据，可能导致大模型上下文token超限。系统默认为 {_SETTINGS.RETURN_RECORD_LIMIT}。注意：此参数在 command 为 execute_sql 时有效，用于限制返回结果的数据条数",
                                                "default": _SETTINGS.RETURN_RECORD_LIMIT
                                            },
                                            "return_data_limit": {
                                                "type": "integer",
                                                "description": f"SQL 执行后返回数据总量限制，单位是字节，-1表示不限制，原因是SQL执行后返回大量数据，可能导致大模型上下文token超限。系统默认为 {_SETTINGS.RETURN_DATA_LIMIT}。注意：此参数在 command 为 execute_sql 时有效，用于限制返回结果的数据大小",
                                                "default": _SETTINGS.RETURN_DATA_LIMIT
                                            },
                                            "force_limit": {
                                                "type": "integer",
                                                "description": f"强制限制SQL查询的行数。在SQL执行前，工具会将原始SQL包装为子查询并添加 LIMIT 子句，限制返回的数据条数。系统默认为 {_SETTINGS.SQL_HELPER_FORCE_LIMIT}。如果设置为 0 或负数，则不添加 LIMIT 限制。注意：此参数仅在 command 为 execute_sql 时有效，在 SQL 执行前生效，会影响实际查询的数据量",
                                                "default": _SETTINGS.SQL_HELPER_FORCE_LIMIT
                                            },
                                            "with_sample": {
                                                "type": "boolean",
                                                "description": "查询元数据时是否包含样例数据",
                                                "default": True
                                            }
                                        }
                                    },
                                    "command": {
                                        "type": "string",
                                        "description": "命令类型，其中 get_metadata 表示获取元数据信息，execute_sql 表示执行 SQL 语句",
                                        "enum": ["get_metadata", "execute_sql"],
                                        "default": "execute_sql"
                                    },
                                    "sql": {
                                        "type": "string",
                                        "description": "要执行的 SQL 语句，当 command 为 execute_sql 时必填"
                                    },
                                    "title": {
                                        "type": "string",
                                        "description": "数据的标题，获取元数据则必填"
                                    },
                                    "timeout": {
                                        "type": "number",
                                        "description": "请求超时时间（秒），超过此时间未完成则返回超时错误，默认120秒",
                                        "default": 120
                                    },
                                    "with_sample": {
                                        "type": "boolean",
                                        "description": "查询元数据时是否包含样例数据",
                                        "default": True
                                    },
                                },
                                "required": ["data_source", "command"]
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
                                        "command": {
                                            "type": "string",
                                            "description": "执行的命令类型"
                                        },
                                        "sql": {
                                            "type": "string",
                                            "description": "执行的SQL语句"
                                        },
                                        "title": {
                                            "type": "string",
                                            "description": "数据的标题"
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
                                        "message": {
                                            "type": "string",
                                            "description": "执行结果消息"
                                        },
                                        "result_cache_key": {
                                            "type": "string",
                                            "description": "结果缓存键，用于从缓存中获取完整查询结果，前端可通过此键获取完整数据"
                                        },
                                        "metadata": {
                                            "type": "object",
                                            "description": "元数据信息，当 command 为 get_metadata 时返回"
                                        },
                                        "sample": {
                                            "type": "object",
                                            "description": "样例数据，当 command 为 get_metadata 且 with_sample 为 true 时返回"
                                        },
                                        "summary": {
                                            "type": "array",
                                            "description": "数据源摘要信息，当 command 为 get_metadata 时返回",
                                            "items": {
                                                "type": "object"
                                            }
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
    from af_agent.datasource.dip_dataview import DataView

    # 示例 DataView 初始化参数，根据实际情况修改
    data_view_params = {
        "view_list": [
            # 替换为您的实际视图ID
            "your_view_id_1",
            "your_view_id_2",
        ],
        "base_url": "http://your_data_model_service_url", # 替换为您的实际 DataModelService URL
        "user_id": "your_user_id", # 替换为您的实际用户ID
        "token": "your_token" # 替换为您的实际token
    }

    datasource = DataView(**data_view_params)

    tool = SQLHelperTool.from_data_source(
        language="cn",
        data_source=datasource,
        get_desc_from_datasource=True
    )

    # 测试获取元数据
    print("测试获取元数据:")
    metadata_result = tool.invoke({"command": "get_metadata"})
    print(metadata_result)

    # 测试执行 SQL
    print("\n测试执行 SQL:")
    sql_query = "SELECT * FROM your_view_table LIMIT 5" # 替换为您的实际SQL查询
    sql_result = tool.invoke({"command": "execute_sql", "sql": sql_query, "title": "示例SQL查询结果"})
    print(sql_result)
