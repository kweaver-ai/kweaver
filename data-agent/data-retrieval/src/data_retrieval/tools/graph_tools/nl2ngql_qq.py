import regex as re
from typing import Dict
import traceback, logging
from fastapi import APIRouter, Body, Request, HTTPException, Depends
from data_retrieval.tools.graph_tools.common.config import Config
from data_retrieval.tools.graph_tools.common.stand_log import StandLogger
from data_retrieval.tools.graph_tools.utils.nebula import NebulaConnector, graph_util, NebulaRequests
from data_retrieval.tools.graph_tools.utils.redis import RedisClient
from data_retrieval.tools.graph_tools.utils.opensearch import OpenSearchConnector
from data_retrieval.tools.graph_tools.nl2ngql_block import Text2nGQLSystem
from data_retrieval.tools.graph_tools.nl2ngql_block.common.structs import Text2nGQLRequest, Text2nGQLResponse, IntermediateResult, HeaderParams
from data_retrieval.tools.base import ToolName, api_tool_decorator
from data_retrieval.errors import ErrorResponse, ErrorCode, NGQLSchemaError, NGQLConnectionError, Text2NGQLError


class Text2nGQLTool():
    # def __init__(self, *args, **kwargs):
    #     pass
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        # 初始化
        self._initialized = True

    @classmethod
    async def as_async_api_cls(
        cls,
        params: dict = Body(...),
        stream: bool = False,
        mode: str = "http",
        header_params: HeaderParams = Depends()
    ):
        try:
            # 将字典参数转换为Text2nGQLRequest对象
            request = Text2nGQLRequest(**params)
            
            # 确保 inner_llm 是一个字典
            if request.inner_llm is None:
                request.inner_llm = {}
            
            # 从 HeaderParams 中提取 account_id 和 account_type，并添加到 inner_llm 中
            if header_params.account_id:
                request.inner_llm["account_id"] = header_params.account_id
            if header_params.account_type:
                request.inner_llm["account_type"] = header_params.account_type
            
            # 执行对应的操作
            if request.action == "get_schema":
                return await cls().run_func_get_schema(request)
            elif request.action == "keyword_retrieval":
                return await cls().run_func_keyword_retrieval(request)
            return await cls().run_func_nl2ngql(request)
        
        except HTTPException:
            raise
        except (NGQLSchemaError, NGQLConnectionError, Text2NGQLError) as e:
            # 判断是否为参数验证错误
            is_param_error = (
                isinstance(e, (NGQLSchemaError, Text2NGQLError)) and 
                ("参数" in e.description or "kg_id" in str(e.detail) or "validation error" in str(e.detail).lower())
            )
            raise HTTPException(
                status_code=400 if is_param_error else 500,
                detail=e.json()
            )
        except Exception as e:
            # 统一处理其他异常
            StandLogger.error(f"nl2ngql 工具执行失败: {str(e)}", exc_info=True)
            # 根据异常信息判断错误类型
            error_msg = str(e).lower()
            is_param_error = "validation error" in error_msg or "field required" in error_msg
            is_schema_error = "schema" in error_msg or "redis" in error_msg or "graph" in error_msg
            is_connection_error = "connection" in error_msg or "connect" in error_msg or "nebula" in error_msg
            
            if is_param_error:
                error = Text2NGQLError(
                    detail={"error": str(e)},
                    description="参数验证失败",
                    solution="请检查请求参数格式是否正确"
                )
                status_code = 400
            elif is_schema_error:
                error = NGQLSchemaError(
                    detail={"error": str(e)},
                    description="Schema 处理失败"
                )
                status_code = 500
            elif is_connection_error:
                error = NGQLConnectionError(
                    detail={"error": str(e)},
                    description="数据库连接失败"
                )
                status_code = 500
            else:
                error = Text2NGQLError(
                    detail={"error": str(e)},
                    description="nl2ngql 工具执行失败"
                )
                status_code = 500
            
            raise HTTPException(
                status_code=status_code,
                detail=error.json()
            )

    async def run_func_keyword_retrieval(self, params: Text2nGQLRequest):
        intermediate_result = self.load_env(params)
        from data_retrieval.tools.graph_tools.nl2ngql_block.retrieval_engine import BaseRetrievalEngine
        base_retrieval = BaseRetrievalEngine(intermediate_result.retrieval_params)
        result = await base_retrieval.retrieval(intermediate_result)
        return result

    def load_env(self, params):
        # 1、准备schema
        graph_id = params.inner_kg.get("kg_id")
        if not graph_id:
            raise NGQLSchemaError(
                detail={"error": "kg_id 参数缺失"},
                description="inner_kg.kg_id 是必传参数"
            )
        
        # 获取 schema
        schema_res = graph_util.find_redis_graph_cache(graph_id=graph_id)
        if not schema_res:
            raise NGQLSchemaError(
                detail={"error": f"未找到图谱 schema，graph_id: {graph_id}"},
                description="Redis 中不存在该图谱的 schema 信息"
            )
        
        # 连接 Nebula
        nebula_engine = NebulaConnector(
            ips=Config.GRAPHDB_HOST.split(','),
            ports=Config.GRAPHDB_PORT.split(','),
            user=Config.GRAPHDB_READ_ONLY_USER,
            password=Config.GRAPHDB_READ_ONLY_PASSWORD
        )

        # 创建 IntermediateResult
        intermediate_result = IntermediateResult(**params.dict())

        # 初始化 Redis 和 Nebula 参数
        redis_connect = RedisClient()
        intermediate_result.redis_params = {
            "redis_engine": redis_connect,
            "dbname": 3,
        }
        intermediate_result.nebula_params = {
            "nebula_engine": nebula_engine,
            "dbname": schema_res["dbname"],
            "quantized_flag": schema_res["quantized_flag"]
        }

        # 处理 schema
        from data_retrieval.tools.graph_tools.nl2ngql_block.common.utils.ngql_util import SchemaParser
        schema_parser = SchemaParser()
        schema = schema_parser.reformat_schema(intermediate_result, schema_res)
        intermediate_result.schema = schema
        
        return intermediate_result

    async def load_env_async(self, params):
        """
        异步版本的load_env方法，使用asyncio.to_thread在线程池中执行同步操作
        避免阻塞事件循环，提高应用性能和响应能力
        """
        import asyncio
        result = await asyncio.to_thread(self.load_env, params)
        return result

    # @api_tool_decorator
    async def run_func_get_schema(self, params: Text2nGQLRequest):
        intermediate_result = await self.load_env_async(params)
        return {"schema": intermediate_result.schema}



    async def run_func_nl2ngql(self, params: Text2nGQLRequest) -> Text2nGQLResponse:
        # 1、准备环境
        intermediate_result = await self.load_env_async(params)
        text2ngql_system = Text2nGQLSystem(params)
        response = await text2ngql_system.process(intermediate_result)
        format_response = Text2nGQLResponse()
        if "response" in response:
            answer = response["response"]
            if len(answer) == 1:
                answer = answer[0]
                format_response.result = {"sql":answer["ngql"], "data": answer["executed_res"]}
            elif len(answer) > 1:
                ngql_str = "\n\n".join([item["ngql"] for item in answer])
                format_response.result = {"sql":ngql_str, "data": [item["executed_res"] for item in answer]}
            else:
                format_response.result = {"sql":"", "data": []}
        return format_response

    @staticmethod
    async def get_api_schema():
        """获取 API Schema"""
        return  {
            "post": {
                "summary": "text2ngql",
                "description": "将问题生成nGQL查询语句，并获取执行结果，复杂问题务必拆分子问题，工具一次只能解决一个子问题",
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
                    },
                    {
                        "name": "x-account-id",
                        "in": "header",
                        "required": False,
                        "schema": {
                            "type": "string"
                        },
                        "description": "账户ID，用于内部服务调用时传递账户信息"
                    },
                    {
                        "name": "x-account-type",
                        "in": "header",
                        "required": False,
                        "schema": {
                            "type": "string",
                            "enum": ["user", "app", "anonymous"],
                            "default": "user"
                        },
                        "description": "账户类型：user(用户), app(应用), anonymous(匿名)"
                    }
                ],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "query": {
                                        "type": "string",
                                        "description": "自然语言查询语句",
                                        "default": ""
                                    },
                                    "inner_kg": {
                                        "type": "object",
                                        "description": "知识图谱相关配置, 通用引用变量，使用self_config.data_source.kg[0] 获取",
                                        "default": {}
                                    },
                                    "inner_llm": {
                                        "type": "object",
                                        "description": "大语言模型参数配置, 通用选择模型获取。如果提供了 x-account-id 和 x-account-type header，这些值会自动添加到 inner_llm 中",
                                        "default": {},
                                        "properties": {
                                            "account_id": {
                                                "type": "string",
                                                "description": "账户ID（可选，如果提供了 x-account-id header，会自动添加）"
                                            },
                                            "account_type": {
                                                "type": "string",
                                                "description": "账户类型（可选，如果提供了 x-account-type header，会自动添加）",
                                                "enum": ["user", "app", "anonymous"]
                                            }
                                        }
                                    },
                                    "rewrite_query": {
                                        "type": "string",
                                        "description": "重写后的查询语句，如有，会加入prompt中",
                                        "default": ""
                                    },
                                    "background": {
                                        "type": "string",
                                        "description": "背景信息，如有，会加入prompt中",
                                        "default": ""
                                    },
                                    "retrieval": {
                                        "type": "boolean",
                                        "description": "是否启用检索增强，默认True，会做关键词抽取，向量召回，如果多轮对话时可以使用false，因为之前history带入了schema和检索信息",
                                        "default": True
                                    },
                                    "retrieval_params": {
                                        "type": "object",
                                        "description": "图谱检索相关配置",
                                        "properties": {
                                            "score": {
                                                "type": "number",
                                                "description": "opensearch向量召回阈值",
                                                "default": 0.9
                                            },
                                            "select_num": {
                                                "type": "integer",
                                                "description": "召回数量",
                                                "default": 5
                                            },
                                            "label_name": {
                                                "type": "string",
                                                "description": "选中某个实体类型召回",
                                                "default": "*"
                                            },
                                            "keywords_extract": {
                                                "type": "boolean",
                                                "description": "是否用大模型对问题做关键词抽取",
                                                "default": True
                                            }
                                        },
                                        "default": {
                                            "score": 0.9,
                                            "select_num": 5,
                                            "label_name": "*",
                                            "keywords_extract": True
                                        }
                                    },
                                    "history": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "additionalProperties": True
                                        },
                                        "description": "对话历史记录，多轮对话时需要",
                                        "default": []
                                    },
                                    "cache_cover": {
                                        "type": "boolean",
                                        "description": "是否覆盖缓存，如果True，会重新获取最新的schema或者数据",
                                        "default": False
                                    },
                                    "action": {
                                        "type": "string",
                                        "description": "操作类型，可选值: nl2ngql(自然语言转查询) 或 或 get_schema(获取schema) 或 keyword_retrieval（获取图谱检索结果）",
                                        "enum": [
                                            "nl2ngql",
                                            "get_schema",
                                            "keyword_retrieval"
                                        ],
                                        "default": "nl2ngql"
                                    },
                                    "timeout": {
                                        "type": "number",
                                        "description": "超时时间",
                                        "default": 120
                                    }
                                },
                                "required": [
                                    "inner_kg"
                                ]
                            },
                            "examples": {
                                "图谱查询示例": {
                                    "summary": "查询人物信息示例",
                                    "value": {
                                        "query": "Rose是谁",
                                        "inner_kg": {
                                            "kg_id": "14",
                                            "fields": ["orgnization", "person", "district"]
                                        },
                                        "inner_llm": {
                                            "name": "deepseek-v3",
                                            "temperature": 0.01,
                                            "top_k": 2,
                                            "top_p": 0.5,
                                            "frequency_penalty": 0.5,
                                            "max_tokens": 10000,
                                            "presence_penalty": 0.5
                                        },
                                        "background": "",
                                        "rewrite_query": "无",
                                        "retrieval": True,
                                        "cache_cover": False,
                                        "history": [
                                            {
                                                "role": "user",
                                                "content": "图谱存储了爱数公司所有的人和部门信息，当查询爱数总人数时，不需要指定部门名称，直接查询所有人即可。"
                                            }
                                        ]
                                    }
                                },
                                "向量检索示例":  {
                                    "summary": "向量检索示例",
                                    "value": {
                                            "query": "Rose是谁",
                                            "inner_kg": {
                                                "kg_id": "5", 
                                                "fields": ["orgnization", "person", "district"]
                                            },
                                            "inner_llm": {
                                                "name": "ali-deepseek-v3",
                                                "temperature": 0.01,
                                                "top_k": 2,
                                                "top_p": 0.5,
                                                "frequency_penalty": 0.5,
                                                "max_tokens": 10000,
                                                "presence_penalty": 0.5
                                            },
                                            "action": "keyword_retrieval",
                                            "retrieval_params": {
                                                "keywords_extract": False,
                                                "score": 0,
                                                "label_name": "*"
                                            }
                                    },
                                },
                                "获取图谱schema示例":  {
                                    "summary": "向量检索示例",
                                    "value": {
                                        "inner_kg": {
                                            "kg_id": "5", 
                                            "fields": ["orgnization", "person", "district"]
                                        },
                                        "action": "get_schema"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "result": {
                                            "type": "object",
                                            "description": "简化版查询结果",
                                            "properties": {
                                                "sql": {
                                                    "type": "string",
                                                    "description": "生成的nGQL查询语句"
                                                },
                                                "data": {
                                                    "type": "object",
                                                    "description": "查询结果数据"
                                                }
                                            }
                                        },
                                        "full_result": {
                                            "type": "object",
                                            "description": "完整版查询结果",
                                            "properties": {
                                                "sql": {
                                                    "type": "string",
                                                    "description": "生成的nGQL查询语句"
                                                },
                                                "data": {
                                                    "type": "object",
                                                    "description": "查询结果数据"
                                                },
                                                "messages": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object"
                                                    },
                                                    "description": "交互过程中的消息记录"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
if __name__ == '__main__':
    pass
