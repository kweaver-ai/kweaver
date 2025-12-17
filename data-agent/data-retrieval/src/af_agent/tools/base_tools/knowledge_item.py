# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-5-23
import json
import traceback
from typing import Any, Optional, Type, Dict, Union, List
from enum import Enum
from fastapi import Body
from langchain.callbacks.manager import (AsyncCallbackManagerForToolRun,
                                         CallbackManagerForToolRun)
from langchain.pydantic_v1 import BaseModel, Field, PrivateAttr
from langchain_core.tools import ToolException

from af_agent.logs.logger import logger
from af_agent.tools.base import async_construct_final_answer, AFTool
from af_agent.tools.base import api_tool_decorator
from af_agent.utils.llm import CustomChatOpenAI
from af_agent.api.auth import get_authorization
from af_agent.errors import ToolFatalError, KnowledgeItemError
from af_agent.settings import get_settings
from af_agent.utils.func import JsonParse
from af_agent.api.data_model import DataModelService
from af_agent.utils._common import run_blocking
from af_agent.utils.ranking import HybridRetriever
from af_agent.utils.embeddings import EmbeddingServiceFactory

import asyncio
import time

_SETTINGS = get_settings()

_DESCS = {
    "tool_description": {
        "cn": "根据输入的文本，获取知识条目信息，知识条目可用于为其他工具提供背景知识",
        "en": "Get knowledge item information based on the input text, knowledge items can be used to provide background knowledge for other tools",
    }
}

class KnowledgeItemInput(BaseModel):
    input: str = Field(
        default="",
        description="输入的文本，如果为空则获取全部的知识条目"
    )

class KnowledgeItemTool(AFTool):
    """Knowledge Item Tool

    Use from_data_source to create a new instance of KnowledgeItemTool

    @params
        name: Tool Name of KnowledgeItem
        description: Tool Description of KnowledgeItem
        args_schema: Input schema of tables
        llm: Language model instance
        data_model_service: DataModelService instance
    """
    name: str = "knowledge_items"
    description: str = _DESCS["tool_description"]["cn"]
    args_schema: Type[BaseModel] = KnowledgeItemInput
    data_model: DataModelService
    return_record_limit: int = _SETTINGS.KNOWLEDGE_ITEM_RETURN_RECORD_LIMIT
    user_id: str = ""
    token: str = ""
    knowledge_item_ids: list[str] = []
    knowledge_item_limit: int = _SETTINGS.KNOWLEDGE_ITEM_LIMIT

    @classmethod
    def from_data_model_service(
        cls,
        data_model: DataModelService,
        knowledge_item_ids: list[str],
        *args, **kwargs):
        """Create a new instance of SQLHelperTool

        Args:
            data_model (DataModelService): DataModelService instance

        Examples:
            tool = KnowledgeItemTool.from_data_model_service(
                data_model=data_model
            )
        """
        return cls(
            data_model=data_model,
            knowledge_item_ids=knowledge_item_ids,
            *args,
            **kwargs
        )

    def _run(
            self,
            input: str = "",
            run_manager: Optional[CallbackManagerForToolRun] = None
    ):
        """同步运行方法，直接调用异步版本"""
        coro = self._arun(input=input, run_manager=run_manager)
        return run_blocking(coro)

    @async_construct_final_answer
    async def _arun(
            self,
            input: str = "",
            run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ):
        try:
            if not self.data_model:
                raise KnowledgeItemError("数据模型为空，请先设置数据模型")

            if len(self.knowledge_item_ids) > self.knowledge_item_limit:
                self.knowledge_item_ids = self.knowledge_item_ids[:self.knowledge_item_limit]

            knowledge_item_ids = ",".join(self.knowledge_item_ids)
            
            if not knowledge_item_ids:
                raise KnowledgeItemError("知识条目ID列表为空，请先设置知识条目ID列表")
            
            knowledge_items = self.data_model.get_knowledge_items_by_ids(knowledge_item_ids)

            result = []

            embedding = EmbeddingServiceFactory(
                embedding_type="model_factory",
                user_id=self.user_id,
                token=self.token
            ).get_service()
            
            for knowledge_item in knowledge_items:
                ki_type = knowledge_item.get("type", "")
                
                message = ""
                items = knowledge_item.get("items", [])
                if len(items) > _SETTINGS.KNOWLEDGE_ITEM_HARD_LIMIT:
                    message = f"知识条目 {knowledge_item['name']} 的 items 数量超过 {_SETTINGS.KNOWLEDGE_ITEM_HARD_LIMIT}，超过部分不参与检索"
                    logger.warning(message)

                items = items[:_SETTINGS.KNOWLEDGE_ITEM_HARD_LIMIT]

                if len(items) == 0:
                    continue

                # 构建检索数据
                items_kv = {}
                force_retrieval_keys = []
                if ki_type == "kv_dict":
                    force_retrieval_keys = [item["key"] for item in items if item.get("comment", "").startswith("FR")]
                    items_kv = {item["item_id"]: f"{item['key']}: {item['value']}" for item in items}
                else:
                    key_names = [key.get("name") for key in knowledge_item.get("dimension", {}).get("keys", [])]
                    
                    for item in items:
                        item_key = "-".join(str(item.get(k, "")) for k in key_names if k in item).rstrip("-")
                        item_value = "<|>".join(f"{k}: {v}" for k, v in item.items() if k not in key_names + ["comment"]).rstrip(";")
                        items_kv[item_key] = item_value

                        if item.get("comment", "").startswith("FR"):
                            force_retrieval_keys.append(item_key)

                # 使用 BM25 + 向量的 RRF 算法来获取排序
                retiever = HybridRetriever(
                    emb_service=embedding,
                    corpus_kv=items_kv,
                    force_retrieval_keys=force_retrieval_keys
                )

                retiever.build()
                retrieval_results = retiever.search(input, topk=self.return_record_limit)
                logger.info(f"Retrieval Results: {retrieval_results}")

                new_items = []
                if  ki_type == "kv_dict":
                    for rr in retrieval_results:
                        content = items_kv.get(rr[0], "")
                        new_items.append(content)
                        if self.return_data_limit > 0 and len(content) > self.return_data_limit:
                            break
                else:
                    new_items = []
                    for rr in retrieval_results:
                        content = items_kv.get(rr[0], "")
                        new_items.append(content.split("<|>"))
                        if self.return_data_limit > 0 and len(content) > self.return_data_limit:
                            break

                summary = {
                    "name": knowledge_item["name"],
                    "items": new_items,
                    "comment": knowledge_item.get("comment", ""),
                    "data_summary": {
                        "return_data_num": len(new_items),
                        "real_data_num": len(items)
                    },
                    "title": input if input else knowledge_item["name"]
                }
            
                if message:
                    summary["message"] = message
                result.append(summary)
            
            return result
        except Exception as e:
            print(traceback.format_exc())
            raise KnowledgeItemError(reason=f"获取知识条目信息失败", detail=e)

    @classmethod
    @api_tool_decorator
    async def as_async_api_cls(
            cls,
            params: dict = Body(...),
            stream: bool = False,
            mode: str = "http"
    ):
        # return {'text2sql': '测试接口'}
        # data_source Params
        data_source_dict = params.get('data_source', {})
        data_item_ids = data_source_dict.get('data_item_ids', [])

        if data_item_ids:
            if isinstance(data_item_ids, str):
                data_item_ids = data_item_ids.split(",")
            elif isinstance(data_item_ids, list):
                if isinstance(data_item_ids[0], str):
                    # 预期的正确结构
                    pass
                elif isinstance(data_item_ids[0], dict):
                    # Data Agent 的结构
                    data_item_ids = [item.get("kn_entry_id", "") for item in data_item_ids]
                else:
                    logger.error(f"知识条目ID列表格式不正确: {data_item_ids}")
                    raise KnowledgeItemError(detail="知识条目ID列表格式不正确", reason="知识条目ID列表格式不正确")
            else:
                logger.error(f"知识条目ID列表格式不正确: {data_item_ids}")
                raise KnowledgeItemError(detail="知识条目ID列表格式不正确", reason="知识条目ID列表格式不正确")
        
        input = params.get('input', '')
        data_model = DataModelService(
            base_url=data_source_dict.get('base_url', ''),
            headers={
                "x-user": data_source_dict.get('user_id', ''),
                "x-account-id": data_source_dict.get('user_id', ''),
                "x-account-type": data_source_dict.get('account_type', 'user'),
                "Authorization": data_source_dict.get('token', '')
            }
        )
        tool = KnowledgeItemTool.from_data_model_service(
            data_model=data_model,
            knowledge_item_ids=data_item_ids,
            **params.get('config', {})
        )
        result = await tool.ainvoke(input=input)
        return result

    @staticmethod
    async def get_api_schema():
        inputs = {
            'data_source': {
                'data_item_ids': ['data_item_id'],
                'base_url': 'https://xxxxx',
                'token': '',
                'user_id': '',
                'account_type': 'user'
            },
            'input': '用户需要查询的文本'
        }

        outputs = {
            "output": [
                {
                    "name": "知识条目名称",
                    "comment": "知识条目描述",
                    "type": "kv_dict",
                    "items": {
                        "key1": "value1",
                        "key2": "value2"
                    },
                    "data_summary": {
                        "return_data_num": 2,
                        "real_data_num": 10
                    }
                },
                {
                    "name": "列表类型知识条目",
                    "comment": "知识条目描述",
                    "type": "list",
                    "items": [
                        {
                            "key": "知识条目名称",
                            "value": "知识条目值",
                            "comment": "知识条目描述"
                        }
                    ],
                    "data_summary": {
                        "return_data_num": 1,
                        "real_data_num": 5
                    }
                }
            ],
            "tokens": "100",
            "time": "14.328890085220337"
        }

        return {
            "post": {
                "summary": "knowledge_item",
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
                                            "data_item_ids": {
                                                "type": "array",
                                                "description": "知识条目ID列表",
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
                                                "description": "用户类型",
                                                "default": "user",
                                                "enum": ["user", "app", "anonymous"]
                                            }
                                        },
                                        "required": ["data_item_ids"]
                                    },
                                    "input": {
                                        "type": "string",
                                        "description": "用户需要查询的文本"
                                    },
                                    "timeout": {
                                        "type": "number",
                                        "description": "超时时间",
                                        "default": 30
                                    },
                                    "config": {
                                        "type": "object",
                                        "description": "工具配置参数",
                                        "properties": {
                                            "return_record_limit": {
                                                "type": "integer",
                                                "description": "每个知识条目返回数据条数限制，-1 代表不限制",
                                                "default": 30
                                            },
                                            "return_data_limit": {
                                                "type": "integer",
                                                "description": "每个知识条目返回数据总量限制，-1 代表不限制",
                                                "default": -1
                                            },
                                            "knowledge_item_limit": {
                                                "type": "integer",
                                                "description": "知识条目个数限制，-1 代表不限制，默认 5",
                                                "default": 5
                                            }
                                        }
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
                                        "output": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "name": {
                                                        "type": "string",
                                                        "description": "知识条目名称"
                                                    },
                                                    "comment": {
                                                        "type": "string",
                                                        "description": "知识条目描述"
                                                    },
                                                    "type": {
                                                        "type": "string",
                                                        "description": "知识条目类型"
                                                    },
                                                    "items": {
                                                        "oneOf": [
                                                            {
                                                                "type": "object",
                                                                "description": "键值对类型知识条目",
                                                                "additionalProperties": {
                                                                    "type": "string"
                                                                }
                                                            },
                                                            {
                                                                "type": "array",
                                                                "description": "列表类型知识条目",
                                                                "items": {
                                                                    "type": "object",
                                                                    "properties": {
                                                                        "key": {
                                                                            "type": "string",
                                                                            "description": "知识条目键"
                                                                        },
                                                                        "value": {
                                                                            "type": "string",
                                                                            "description": "知识条目值"
                                                                        },
                                                                        "comment": {
                                                                            "type": "string",
                                                                            "description": "知识条目描述"
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    "data_summary": {
                                                        "type": "object",
                                                        "properties": {
                                                            "return_data_num": {
                                                                "type": "integer",
                                                                "description": "返回数据条数"
                                                            },
                                                            "real_data_num": {
                                                                "type": "integer",
                                                                "description": "实际数据条数"
                                                            }
                                                        }
                                                    }
                                                }
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
    from langchain_openai import ChatOpenAI
    from af_agent.api.auth import get_authorization
    from af_agent.api.data_model import DataModelService

    data_model = DataModelService(base_url="https://localhost:13020", headers={"x-user": "any", "x-account-id": "any", "x-account-type": "user"})

    tool = KnowledgeItemTool.from_data_model_service(
        data_model=data_model
    )

    # 测试获取元数据
    print("测试获取元数据:")
    print(tool.invoke({"command": "get_metadata"}))

    # 测试执行 SQL
    print("\n测试执行 SQL:")
    print(tool.invoke({"command": "execute_sql", "sql": "SELECT * FROM table LIMIT 5"}))
