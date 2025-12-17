import json
import traceback
from textwrap import dedent
from typing import Optional, Type, Any, Dict
from collections import OrderedDict
from langchain.pydantic_v1 import BaseModel, Field
from langchain.tools import BaseTool
from langchain_core.callbacks import CallbackManagerForToolRun, AsyncCallbackManagerForToolRun

from af_agent.api.base import API, HTTPMethod
from af_agent.logs.logger import logger
from af_agent.sessions import BaseChatHistorySession, CreateSession
from af_agent.sessions.redis_session import RedisHistorySession
from af_agent.tools.base import ToolName
from af_agent.tools.base import ToolResult, ToolMultipleResult, AFTool
from af_agent.tools.base import construct_final_answer, async_construct_final_answer
from af_agent.settings import get_settings
from af_agent.api.auth import get_authorization
from af_agent.errors import ToolFatalError
from af_agent.tools.base import api_tool_decorator


settings = get_settings()


class AfSailorToolModel(BaseModel):
    question: str = Field(..., description="自然语言问题或者自然语言表述。")
    extraneous_information: str = Field(
        default="",
        description="用户在多轮对话中重复强调的信息"
    )


class AfSailorTool(AFTool):
    name: str = ToolName.from_sailor.value
    description: str = dedent("""
这是一个数据搜索工具：工具可以对问题进行数据资源搜索，并返回搜索结果，调用方式是：search(question, extraneous_information)
特别注意: 
- 如果对话上下文中包含了引用的数据资源缓存，在用其他工具获取数据前，你需要根据数据资源的名称和描述判断当前的 Question 是否能用 `缓存的数据资源` 来回答，不满足或不确定时需要重新搜索数据
- 本工具在结果输出时，可能会用类似 "<i slice_idx=0>1</i> 这样的格式来表示数据资源的编号，请保持这样的格式
""")
    
    args_schema: Type[BaseModel] = AfSailorToolModel
    # session: RedisHistorySession = RedisHistorySession()
    parameter: dict ={}
    session: BaseChatHistorySession = None
    session_type: Optional[str] = "redis"


    def __init__(
        self,
        parameter: dict,
        *args,
        **kwargs: Any
    ):
        super().__init__(*args, **kwargs)
        self.parameter = parameter
        if kwargs.get("session") is None:
            self.session = CreateSession(self.session_type)
        if not self.parameter.get("direct_qa", ""):
            self.description = "这是一个数据搜索工具：工具可以对问题进行数据资源搜索，并返回搜索结果"

    def _service(
        self,
        url: str = "",
        **kwargs: Any
    ):
        if not url:
            url = settings.SAILOR_URL + "/api/af-sailor/v1/assistant/qa"
        if settings.AF_DEBUG_IP:
            url = settings.AF_DEBUG_IP + "/api/af-sailor/v1/assistant/qa"
        self.parameter["query"] = kwargs.get("question")
        if kwargs.get("extraneous_information") is not None:
            self.parameter["query"] += kwargs["extraneous_information"]
        api = API(
            url=url,
            method=HTTPMethod.POST,
            headers={"Authorization": self.parameter["token"]},
            payload=self.parameter
        )
        return api

    def _parser(
        self,
        result: ToolResult
    ):
        # 把 result.cites 转成 ordered_dict
        result.cites = [OrderedDict(cite) for cite in result.cites]
        res_json = {
            "text": result.text,
            "cites": result.cites,
            "result_cache_key": self._result_cache_key
        }
        # 将执行结果保存，暂时支持 redis
        self.session.add_agent_logs(
            self._result_cache_key,
            logs=res_json
        )

        # 删除 cites 中的子图信息，防止大模型看到
        for cite in res_json.get("cites", []):
            if "connected_subgraph" in cite:
                del cite["connected_subgraph"]

        return res_json
                        
    @construct_final_answer
    def _run(
        self,
        run_manager: Optional[CallbackManagerForToolRun] = None,
        *args,
        **kwargs: Any
    ):
        try:
            api = self._service(**kwargs)
            result = api.call()
            if isinstance(result, str):
                result = json.loads(result)
            logger.debug(f"Search API Response: {result}")
            # result = result["result"]["res"]
            result = ToolResult(**result["result"]["res"])
            result = self._parser(result)
        except Exception as e:
            tb_str = traceback.format_exc()
            logger.info(f"Sailor工具执行错误，实际错误为{tb_str}")
            result = ToolResult(
                text=["抱歉，可能由于网络延迟或当前服务器繁忙，当前回答尚未完成。"]
            ).to_json()
        # result = json.dumps(result, ensure_ascii=False)
        return result

    @async_construct_final_answer
    async def _arun(
        self,
        run_manager: Optional[AsyncCallbackManagerForToolRun],
        *args,
        **kwargs: Any
    ):
        try:
            api = self._service(**kwargs)
            result = await api.call_async()
            if not result:
                return {
                    "text": ["没有找到对应的数据资源"],
                }
            if isinstance(result, str):
                result = json.loads(result)
            logger.debug(f"Search API Response: {result}")
            # result = result["result"]["res"]
            result = ToolResult(**result.get("result", {}).get("res", {}))
            result = self._parser(result)
        except Exception as e:
            tb_str = traceback.format_exc()
            logger.info(f"Sailor工具执行错误，实际错误为{tb_str}")
            result = ToolResult(
                text=["工具执行错误，请重新提问。"]
            ).to_json()
        # result = json.dumps(result, ensure_ascii=False)
        return result
    
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

                cites_cache = []
                for cite in tool_res.get("cites", []):
                    cc = {
                        "id": cite.get("id", ""),
                        "type": cite.get("type", ""),
                        "title": cite.get("title", ""),
                        "description": cite.get("description", ""),
                    }
                    cites_cache.append(cc)

                ans_multiple.sailor_search_result = cites_cache

                ans_multiple.text = tool_res.get("text", [])

            # ans_multiple.cache_keys[self._result_cache_key] = {
            #     "name": self.name,
            #     "tool_name": self.name
            # }

    @classmethod
    @api_tool_decorator
    async def as_async_api_cls(
            cls,
            params: dict
    ):
        # return {'text2sql': '测试接口'}
        # data_source Params
        resources = params.get('resources', {})
        parameters = resources.get('parameters', {})
        token = resources.get('token', '')
        if not token or token == "''":
            user = resources.get("user", "")
            password = resources.get("password", "")
            auth_url = resources.get("auth_url", settings.AF_DEBUG_IP)
            parameters['user'] =user
            parameters['password'] = password
            parameters['auth_url'] = auth_url

            try:
                parameters["token"] = get_authorization(auth_url,
                                                        user,
                                                        password)
            except Exception as e:
                logger.error(f"Error: {e}")
                raise ToolFatalError(reason="获取 token 失败", detail=e) from e

        config_dict = params.get("config", {})
        parameters.update(config_dict)
        tool = cls(parameter=parameters)

        # Input Params
        input = params.get("input", {})

        # invoke tool
        res = await tool.ainvoke(input=input)
        return res

    @staticmethod
    async def get_api_schema():
        inputs = {
            'resources': {
                'parameters': {
                    "ad_appid": "OIZ6_KHCKIk-ASpNLg5",
                    "af_editions": "resource",
                    "entity2service": {},
                    "filter": {
                        "asset_type": [
                            -1
                        ],
                        "data_kind": "0",
                        "department_id": [
                            -1
                        ],
                        "end_time": "1800122122",
                        "info_system_id": [
                            -1
                        ],
                        "owner_id": [
                            -1
                        ],
                        "publish_status_category": [
                            -1
                        ],
                        "shared_type": [
                            -1
                        ],
                        "start_time": "1600122122",
                        "stop_entity_infos": [],
                        "subject_id": [
                            -1
                        ],
                        "update_cycle": [
                            -1
                        ]
                    },
                    "kg_id": 1693,
                    "limit": 100,
                    "required_resource": {
                        "lexicon_actrie": {
                            "lexicon_id": "196"
                        },
                        "stopwords": {
                            "lexicon_id": "197"
                        }
                    },
                    "roles": [
                        "normal",
                        "data-owner",
                        "data-butler",
                        "data-development-engineer",
                        "tc-system-mgm"
                    ],
                    "stop_entities": [],
                    "stopwords": [],
                    "stream": False,
                    "subject_id": "1a5df062-e2e9-11ee-bc25-de01d9e8c5c1",
                    "subject_type": "user",
                },
                'auth_url': 'https://10.4.134.26',
                'user': 'liberly',
                'password': 'eisoo.com123',
                'token': ''
            },
            'config': {
                'direct_qa': '',
                'session_type': 'in_memory',  # session
                'session_id': '123',
            },
            'input': {
                'question': '6月份的运量',
                'extraneous_information': ''
            }
        }

        return {
            "type": "object",
            "properties": {
                "resources": {
                    "type": "object",
                    "description": "资源配置信息",
                    "properties": {
                        "parameters": {
                            "type": "object",
                            "description": "资源配置信息"
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
                        }
                    },
                    "required": ["parameters"]
                },
                "config": {
                    "type": "object",
                    "description": "工具配置参数",
                    "properties": {
                        "direct_qa": {
                            "type": "string",
                            "description": "背景信息"
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
                    }
                },
                "input": {
                    "type": "object",
                    "description": "输入参数",
                    "properties": {
                        "input": {
                            "type": "string",
                            "description": "用户输入的自然语言查询"
                        },
                        "knowledge_enhanced_information": {
                            "type": "object",
                            "description": "知识增强信息"
                        },
                        "extra_info": {
                            "type": "string",
                            "description": "额外信息"
                        }
                    },
                    "required": ["input"]
                }
            },
            "required": ["resources", "input"]
        }
    

if __name__ == "__main__":
    # asset_type 资产分类，2 接口服务 3 逻辑视图 4 指标
    from_af_sailor_service_params = {
        "ad_appid": "OIZ6_KHCKIk-ASpNLg5",
        "af_editions": "resource",
        "entity2service": {},
        "direct_qa": True,
        "filter": {
            "asset_type": [
                3
            ],
            "data_kind": "0",
            "department_id": [
                -1
            ],
            "end_time": "1800122122",
            "info_system_id": [
                -1
            ],
            "owner_id": [
                -1
            ],
            "publish_status_category": [
                -1
            ],
            "shared_type": [
                -1
            ],
            "start_time": "1600122122",
            "stop_entity_infos": [],
            "subject_id": [
                -1
            ],
            "update_cycle": [
                -1
            ]
        },
        "kg_id": 19430,
        "limit": 100,
        "query": "3月小白白品牌的月销量",
        "required_resource": {
            "lexicon_actrie": {
                "lexicon_id": "44"
            },
            "stopwords": {
                "lexicon_id": "45"
            }
        },
        # "resources": [
        #     {
        #         "id": "5c0c818d-bcf0-49fa-adf8-44c16ddbfb76",
        #         "type": "3"
        #     },
        #     {
        #         "id": "f28d9390-e3a6-4f9a-8b72-edba1aece703",
        #         "type": "3"
        #     },

        # ],
        "roles": [
            "normal",
            "data-owner",
            "data-butler",
            "data-development-engineer",
            "tc-system-mgm"
        ],
        "session_id": "---999---",
        "stop_entities": [],
        "stopwords": [],
        "stream": False,
        "subject_id": "ada5427e-e8ee-11ef-b48e-721bec4b5bed",
        "subject_type": "user",
        "token": get_authorization("https://10.4.134.26", "liberly", "111111"),
    }
    af_sailor_tool = AfSailorTool(parameter=from_af_sailor_service_params)
    
    import asyncio
    result = asyncio.run(af_sailor_tool.ainvoke(input={"question": "3月小白白品牌的月销量"}))
    print("Search result", result)

