import json
import traceback
from io import StringIO
from textwrap import dedent
from typing import Optional, Type, Any, List, Dict
from enum import Enum
import re
import asyncio

import pandas as pd
from langchain.tools import BaseTool
from langchain_core.callbacks import CallbackManagerForToolRun, AsyncCallbackManagerForToolRun
from langchain_core.pydantic_v1 import BaseModel, Field, PrivateAttr
from pandas import Timestamp
from af_agent.logs.logger import logger
from af_agent.sessions import BaseChatHistorySession, CreateSession
from af_agent.tools.base import ToolName
from af_agent.tools.base import ToolResult, ToolMultipleResult, AFTool
from af_agent.tools.base import construct_final_answer, async_construct_final_answer
from af_agent.errors import Json2PlotError, ToolFatalError
from af_agent.tools.base import api_tool_decorator, validate_openapi_schema

from af_agent.datasource.dip_metric import DIPMetric
from af_agent.datasource.dip_dataview import DataView, get_datasource_from_kg_params
from af_agent.api.agent_retrieval import get_datasource_from_agent_retrieval_async
from af_agent.utils.dip_services.base import ServiceType
from af_agent.settings import get_settings
from fastapi import Body

_SETTINGS = get_settings()


class DataSourceDescSchema(BaseModel):
    id: str = Field(description="数据源的 id, 为一个字符串")
    title: str = Field(description="数据源的名称")
    type: str = Field(description="数据源的类型")
    description: str = Field(description="数据源的描述")


class ArgsModel(BaseModel):
    query: str = Field(default="", description="查询语句")


class GetMetadataTool(AFTool):
    name: str = ToolName.from_get_metadata.value
    description: str = dedent("""
        """
    )
    args_schema: Type[BaseModel] = ArgsModel
    with_sample: bool = False
    data_source_num_limit: int = -1
    dimension_num_limit: int = -1
    session_id: str = ""
    session_type: str = "redis"
    session: Optional[BaseChatHistorySession] = None

    data_source: Optional[DataView] = None
    dip_metric: Optional[DIPMetric] = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if kwargs.get("session") is None:
            self.session = CreateSession(self.session_type)
        
        # 如果提供了 data_source，直接使用
        if kwargs.get("data_source") is not None:
            self.data_source = kwargs.get("data_source")
        
        # 如果提供了 dip_metric，直接使用
        if kwargs.get("dip_metric") is not None:
            self.dip_metric = kwargs.get("dip_metric")

    def _run(
        self,
        *args,
        **kwargs
    ):
        from af_agent.utils._common import run_blocking
        return run_blocking(self._arun(*args, **kwargs))

    async def _arun(
        self,
        query: str,
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None,
    ):
        errors = []
        data_view_metadata, metric_metadata = {}, {}

        if self.data_source:
            try:
                result_data = await self.data_source.get_meta_sample_data_async(
                    input_query=query,
                    view_limit=self.data_source_num_limit,
                    dimension_num_limit=self.dimension_num_limit,
                    with_sample=self.with_sample
                )

                # 将返回的列表转换为字典，key 为 view_id
                for detail in result_data.get("detail", []):
                    data_view_metadata[detail["id"]] = detail
            except Exception as e:
                traceback.print_exc()
                logger.error(f"获取数据视图元数据失败: {str(e)}")
                errors.append(f"获取数据视图元数据失败: {str(e)}")
                # raise ToolFatalError(f"获取数据视图元数据失败: {e}")

        if self.dip_metric:
            try:    
                result_data = await self.dip_metric.aget_details(
                    input_query=query,
                    metric_num_limit=self.data_source_num_limit,
                    input_dimension_num_limit=self.dimension_num_limit
                )

                # 将返回的列表转换为字典，key 为 metric_id
                # DIPMetric.get_details 直接返回列表，而不是 {"details": [...]}
                if isinstance(result_data, list):
                    for detail in result_data:
                        metric_metadata[detail["id"]] = detail
                elif isinstance(result_data, dict) and "details" in result_data:
                    for detail in result_data.get("details", []):
                        metric_metadata[detail["id"]] = detail
            
            except Exception as e:
                traceback.print_exc()
                logger.error(f"获取指标元数据失败: {str(e)}")
                errors.append(f"获取指标元数据失败: {str(e)}")
                # raise ToolFatalError(f"获取指标元数据失败: {e}")
        
        result = {}
        
        # 生成数据视图 summary
        data_view_summary = []
        if data_view_metadata:
            for detail in data_view_metadata.values():
                # 创建 summary 项，移除 en2cn 字段（如果存在）
                detail_copy = detail.copy()
                detail_copy.pop("en2cn", None)
                
                summary_item = {
                    "name": detail.get("name", ""),
                    "comment": detail.get("comment", ""),
                    "table_path": detail.get("path", "")
                }
                data_view_summary.append(summary_item)
        
        # 生成指标 summary
        metric_summary = []
        if metric_metadata:
            for detail in metric_metadata.values():
                summary_item = {
                    "name": detail.get("name", ""),
                    "comment": detail.get("comment", ""),
                    "id": detail.get("id", "")
                }
                metric_summary.append(summary_item)

        if data_view_summary:
            result["data_view_summary"] = data_view_summary
        if metric_summary:
            result["metric_summary"] = metric_summary
        
        if data_view_metadata:
            result["data_view_metadata"] = data_view_metadata
        if metric_metadata:
            result["metric_metadata"] = metric_metadata
        
        if errors:
            result["errors"] = errors

        if not data_view_metadata and not metric_metadata:
            error_msg = '\n '.join(errors) if errors else "未获取到任何元数据"
            raise ToolFatalError(error_msg)
        
        result["title"] = query if query else "获取数据源信息"
        return result

    # def handle_result(
    #     self,
    #     log: Dict[str, Any],
    #     ans_multiple: ToolMultipleResult
    # ) -> None:
    #     tool_res = self.session.get_agent_logs(
    #         self._result_cache_key
    #     )
    #     if tool_res:
    #         log["result"] = tool_res

    #         ans_multiple.cites = []
    #         for data_view in tool_res["data_view_metadata"]:
    #             ans_multiple.cites.append({
    #                 "id": data_view["id"],
    #                 "type": "data_view",
    #                 "title": data_view["title"],
    #                 "description": data_view["description"]
    #             })
    #         for metric in tool_res["metric_metadata"]:
    #             ans_multiple.cites.append({
    #                 "id": metric["id"],
    #                 "type": "metric",
    #                 "title": metric["title"],
    #                 "description": metric["description"]
    #             })

    @classmethod
    @api_tool_decorator
    async def as_async_api_cls(
        cls,
        params: dict = Body(...),
        stream: bool = False,
        mode: str = "http"
    ):
        """异步 API 调用方法，支持从 kg 和 kn 中获取数据源"""
        try:
            logger.info(f"get_metadata as_async_api_cls params: {params}")
            
            # Data Source Params
            data_source_dict = params.get('data_source', {})
            kg_params = data_source_dict.get('kg', [])
            kn_params = data_source_dict.get('kn', [])
            search_scope = data_source_dict.get('search_scope', [])
            recall_mode = data_source_dict.get('recall_mode', _SETTINGS.DEFAULT_AGENT_RETRIEVAL_MODE)
            
            base_url = data_source_dict.get('base_url', '')
            token = data_source_dict.get('token', '')
            user_id = data_source_dict.get('user_id', '')
            account_type = data_source_dict.get('account_type', 'user')
            
            # Config Params (提前获取，后续会用到)
            config_dict = params.get("config", {})
            
            # 获取数据源类型过滤参数 (ds_type: "data_view", "metric", "all" 或 None 表示获取所有类型)
            ds_type = config_dict.get("ds_type")
            # 如果 ds_type 为 "all"，则视为 None（获取全部）
            if ds_type == "all":
                ds_type = None
            
            # 获取是否获取数据样例参数 (with_sample)
            with_sample = params.get("with_sample")
            if with_sample is None:
                with_sample = config_dict.get("with_sample", False)
            
            # 构建 headers
            headers = {}
            if user_id:
                headers = {
                    "x-user": user_id,
                    "x-account-id": user_id,
                    "x-account-type": account_type
                }
            # 为 headers 添加 token（带 Bearer 前缀）
            if token:
                auth_token = token if token.startswith("Bearer ") else f"Bearer {token}"
                headers["Authorization"] = auth_token
            
            # 初始化数据源列表
            view_list = []
            metric_list = []
            
            # 从 data_source 中获取直接指定的视图列表和指标列表
            direct_view_list = data_source_dict.get('view_list', [])
            direct_metric_list = data_source_dict.get('metric_list', [])
            
            # 处理 view_list
            if direct_view_list:
                if isinstance(direct_view_list, list):
                    # ds_type 为 None 表示获取全部，包括数据视图
                    if ds_type is None or ds_type == "data_view":
                        view_list.extend(direct_view_list)
                else:
                    logger.warning(f"view_list 格式不正确: {direct_view_list}")
            
            # 处理 metric_list
            if direct_metric_list:
                if isinstance(direct_metric_list, list):
                    # ds_type 为 None 表示获取全部，包括指标
                    if ds_type is None or ds_type == "metric":
                        metric_list.extend(direct_metric_list)
                else:
                    logger.warning(f"metric_list 格式不正确: {direct_metric_list}")

            # 从知识图谱 (kg) 中获取数据源
            if kg_params:
                try:
                    if base_url:
                        dip_type = ServiceType.OUTTER_DIP.value
                    else:
                        dip_type = ServiceType.DIP.value
                    datasources_in_kg = await get_datasource_from_kg_params(
                        addr=base_url,
                        kg_params=kg_params,
                        headers=headers,
                        dip_type=dip_type
                    )
                    
                    logger.info(f"从知识图谱获取到 {len(datasources_in_kg)} 个数据视图")
                    
                    # 将 kg 中的数据源添加到 view_list
                    # 注意：kg 只能获取数据视图（data_view），不能获取指标（metric）
                    # 如果 ds_type 指定为 "metric"，则跳过 kg 的数据源
                    if ds_type is None or ds_type == "data_view":
                        for ds in datasources_in_kg:
                            view_list.append(ds.get("id"))
                    elif ds_type == "metric":
                        logger.info(f"ds_type 为 'metric'，跳过从知识图谱获取的数据源（kg 只能获取数据视图）")
                except Exception as e:
                    logger.error(f"从知识图谱获取数据源失败: {e}")
                    logger.error(traceback.format_exc())
            
            # 从知识网络 (kn) 中获取数据源
            if kn_params:
                try:
                    for kn_param in kn_params:
                        if isinstance(kn_param, dict):
                            kn_id = kn_param.get('knowledge_network_id', '')
                        else:
                            kn_id = kn_param
                        
                        if not kn_id:
                            continue
                        
                        # 获取查询语句，如果没有则使用默认值
                        query = params.get('query', params.get('input', '所有数据'))
                        
                        data_views, metrics, relations = await get_datasource_from_agent_retrieval_async(
                            kn_id=kn_id,
                            query=query,
                            search_scope=search_scope,
                            headers=headers,
                            base_url=base_url,
                            max_concepts=config_dict.get('data_source_num_limit', _SETTINGS.DEFAULT_AGENT_RETRIEVAL_MAX_CONCEPTS),
                            mode=recall_mode
                        )
                        
                        logger.info(f"从知识网络获取到 {len(data_views)} 个数据视图和 {len(metrics)} 个指标")
                        
                        # 根据 ds_type 过滤数据源类型
                        # 注意：kn 可以获取数据视图（data_view）和指标（metric）
                        # ds_type 为 None 表示获取全部类型
                        # 将 data_views 添加到 view_list
                        if ds_type is None or ds_type == "data_view":
                            for view in data_views:
                                view_list.append(view.get("id"))
                        
                        # 将 metrics 添加到 metric_list
                        if ds_type is None or ds_type == "metric":
                            for metric in metrics:
                                metric_list.append(metric.get("id"))
                except Exception as e:
                    logger.error(f"从知识网络获取数据源失败: {e}")
                    logger.error(traceback.format_exc())
            
            # 创建数据源实例
            data_source = None
            if view_list:
                data_source = DataView(
                    view_list=view_list,
                    token=token,
                    user_id=user_id,
                    account_type=account_type,
                    base_url=base_url
                )
            
            dip_metric = None
            if metric_list:
                dip_metric = DIPMetric(
                    metric_list=metric_list,
                    token=token,
                    user_id=user_id,
                    base_url=base_url,
                    account_type=account_type
                )
            
            # 创建工具实例
            tool = cls(
                data_source=data_source,
                dip_metric=dip_metric,
                with_sample=with_sample,
                data_source_num_limit=config_dict.get("data_source_num_limit", -1),
                dimension_num_limit=config_dict.get("dimension_num_limit", -1),
                session_type=config_dict.get("session_type", "redis"),
                session_id=config_dict.get("session_id", ""),
                api_mode=True
            )
            
            # Input Params
            query = params.get('query', params.get('input', ''))
            
            # 调用工具
            result = await tool._arun(query=query)
            
            return result
            
        except Exception as e:
            logger.error(f"get_metadata as_async_api_cls 失败: {e}")
            logger.error(traceback.format_exc())
            raise ToolFatalError(f"get_metadata 工具调用失败: {e}") from e

    @staticmethod
    async def get_api_schema():
        """获取 API Schema"""
        inputs = {
            'data_source': {
                'view_list': ['view_id_1', 'view_id_2'],
                'metric_list': ['metric_id_1', 'metric_id_2'],
                'base_url': 'https://xxxxx',
                'token': '',
                'user_id': '',
                'account_type': 'user',
                'kg': [
                    {
                        'kg_id': '129',
                        'fields': ['regions', 'comments'],
                    }
                ],
                'kn': [
                    {
                        'knowledge_network_id': 'kn_id_1'
                    }
                ],
                'search_scope': ['object_types', 'relation_types', 'action_types'],
                'recall_mode': 'keyword_vector_retrieval'
            },
            'config': {
                'with_sample': False,
                'data_source_num_limit': 10,
                'dimension_num_limit': 30,
                'session_type': 'redis',
                'session_id': '123'
            },
            'query': '查询数据视图和指标的元数据',
            'ds_type': 'data_view',  # 可选: "data_view", "metric", "all" 或不传（获取全部）
            'with_sample': False
        }

        outputs = {
            "data_view_metadata": {
                "view_id_1": {
                    "id": "view_id_1",
                    "name": "数据视图名称",
                    "comment": "数据视图描述",
                    "fields": [
                        {
                            "name": "字段名",
                            "type": "string",
                            "comment": "字段描述"
                        }
                    ]
                }
            },
            "metric_metadata": {
                "metric_id_1": {
                    "id": "metric_id_1",
                    "name": "指标名称",
                    "comment": "指标描述",
                    "formula_config": {},
                    "analysis_dimensions": []
                }
            },
            "data_view_summary": [
                {
                    "name": "数据视图名称",
                    "comment": "数据视图描述",
                    "table_path": "catalog.schema.table"
                }
            ],
            "metric_summary": [
                {
                    "name": "指标名称",
                    "comment": "指标描述",
                    "id": "metric_id_1"
                }
            ],
            "title": "获取数据源信息"
        }

        return {
            "post": {
                "summary": ToolName.from_get_metadata.value,
                "description": "获取数据视图和指标的元数据信息，支持从知识图谱(kg)和知识网络(kn)中获取数据源",
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
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "data_source": {
                                        "type": "object",
                                        "description": "数据源配置信息",
                                        "properties": {
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
                                            "view_list": {
                                                "type": "array",
                                                "description": "数据视图ID列表",
                                                "items": {
                                                    "type": "string"
                                                }
                                            },
                                            "metric_list": {
                                                "type": "array",
                                                "description": "指标ID列表",
                                                "items": {
                                                    "type": "string"
                                                }
                                            },
                                            "kg": {
                                                "type": "array",
                                                "description": "知识图谱配置参数（老版本），用于从知识图谱中获取数据源。注意：kg 只能获取数据视图（data_view），不能获取指标（metric）",
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
                                                "description": "知识网络配置参数（新版本），用于从知识网络中获取数据源。注意：kn 可以获取数据视图（data_view）和指标（metric）",
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
                                        # "required": []
                                    },
                                    "config": {
                                        "type": "object",
                                        "description": "工具配置参数",
                                        "properties": {
                                            "with_sample": {
                                                "type": "boolean",
                                                "description": "是否获取数据样例",
                                                "default": False
                                            },
                                            "data_source_num_limit": {
                                                "type": "integer",
                                                "description": "数据源数量限制，-1表示不限制",
                                                "default": -1
                                            },
                                            "dimension_num_limit": {
                                                "type": "integer",
                                                "description": f"维度数量限制，-1表示不限制, 系统默认为 {_SETTINGS.TEXT2SQL_DIMENSION_NUM_LIMIT}",
                                                "default": _SETTINGS.TEXT2SQL_DIMENSION_NUM_LIMIT
                                            },
                                            "ds_type": {
                                                "type": "string",
                                                "description": "数据源类型过滤，data_view 表示只获取数据视图，metric 表示只获取指标，all 或不指定则获取所有类型",
                                                "enum": ["data_view", "metric", "all"]
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
                                            }
                                        }
                                    },
                                    "query": {
                                        "type": "string",
                                        "description": "查询语句，用于从知识网络中检索相关数据源"
                                    },
                                    "with_sample": {
                                        "type": "boolean",
                                        "description": "是否获取数据样例",
                                        "default": False
                                    },
                                    "timeout": {
                                        "type": "number",
                                        "description": "请求超时时间（秒），超过此时间未完成则返回超时错误，默认120秒",
                                        "default": 120
                                    }
                                },
                                "required": ["data_source"]
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
                                        "data_view_metadata": {
                                            "type": "object",
                                            "description": "数据视图元数据，key 为数据视图ID，value 为元数据信息",
                                        },
                                        "metric_metadata": {
                                            "type": "object",
                                            "description": "指标元数据，key 为指标ID，value 为元数据信息",
                                        },
                                        "data_view_summary": {
                                            "type": "array",
                                            "description": "数据视图摘要列表",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "name": {
                                                        "type": "string",
                                                        "description": "数据视图名称"
                                                    },
                                                    "comment": {
                                                        "type": "string",
                                                        "description": "数据视图描述"
                                                    },
                                                    "table_path": {
                                                        "type": "string",
                                                        "description": "数据视图路径"
                                                    }
                                                }
                                            }
                                        },
                                        "metric_summary": {
                                            "type": "array",
                                            "description": "指标摘要列表",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "name": {
                                                        "type": "string",
                                                        "description": "指标名称"
                                                    },
                                                    "comment": {
                                                        "type": "string",
                                                        "description": "指标描述"
                                                    },
                                                    "id": {
                                                        "type": "string",
                                                        "description": "指标ID"
                                                    }
                                                }
                                            }
                                        },
                                        "title": {
                                            "type": "string",
                                            "description": "结果标题"
                                        },
                                        "errors": {
                                            "type": "array",
                                            "description": "错误信息列表（如果存在）",
                                            "items": {
                                                "type": "string"
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
    import asyncio
    
    async def main():
        """测试 get_api_schema 并验证 OpenAPI 语法"""
        print("=" * 60)
        print("测试 GetMetadataTool.get_api_schema()")
        print("=" * 60)
        
        try:
            # 获取 API Schema
            print("\n1. 获取 API Schema...")
            schema = await GetMetadataTool.get_api_schema()
            print("✅ 成功获取 API Schema")
            
            # 验证 OpenAPI 语法
            print("\n2. 验证 OpenAPI 语法...")
            is_valid, error_msg = validate_openapi_schema(schema)
            
            if is_valid:
                print("✅ OpenAPI Schema 语法验证通过")
            else:
                print(f"❌ OpenAPI Schema 语法验证失败: {error_msg}")
            
            print("\n" + "=" * 60)
            print("测试完成")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ 测试过程中出现错误: {e}")
            import traceback
            traceback.print_exc()
    
    # 运行测试
    asyncio.run(main())
