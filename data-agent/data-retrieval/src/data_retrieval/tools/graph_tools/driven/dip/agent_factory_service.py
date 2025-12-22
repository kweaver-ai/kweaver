import sys
from http import HTTPStatus

import aiohttp
from circuitbreaker import circuit

import data_retrieval.tools.graph_tools.common.stand_log as log_oper
from data_retrieval.tools.graph_tools.common import errors
from data_retrieval.tools.graph_tools.common.config import Config
from data_retrieval.tools.graph_tools.common.errors import CodeException
from data_retrieval.tools.graph_tools.common.stand_log import StandLogger
from data_retrieval.tools.graph_tools.utils.common import GetFailureThreshold, GetRecoveryTimeout


class AgentFactoryService:
    def __init__(self):
        self._host = Config.HOST_AGENT_FACTORY
        self._port = Config.PORT_AGENT_FACTORY
        self._basic_url = "http://{}:{}".format(self._host, self._port)
        self.headers = {}

    def set_headers(self, headers):
        self.headers = headers

    @circuit(
        failure_threshold=GetFailureThreshold(), recovery_timeout=GetRecoveryTimeout()
    )
    async def get_tool_box_info(self, box_id) -> dict:
        """
        @deprecated: 已迁移至agent-operator-integration
        """
        # from myTest.tools.tools import tool_box_info  # TODO: debug
        # for box in tool_box_info:
        #     if box["box_id"] == box_id:
        #         return box
        # return {}
        url = "{}/api/agent-factory/v1/tool-boxes/{}".format(self._basic_url, box_id)
        async with aiohttp.ClientSession(headers=self.headers) as session:
            async with session.get(url, ssl=False) as response:
                if response.status != HTTPStatus.OK:
                    err = self._host + " get_tool_box_info error: {}".format(
                        await response.text()
                    )
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise CodeException(errors.AgentExecutor_ExternalServiceError, err)
                res = await response.json()
                res = res["res"]
        """
        res = {
            "box_id": "1",
            "box_name": "ad_search",
            "box_desc": "认知搜索应用",
            "box_svc_url": "https://pre.anydata.aishu.cn:8444",
            "box_icon": "",
            "tools": [
                {
                    "tool_id": "1",
                    "tool_name": "fulltext_search",
                    "tool_path": "https://pre.anydata.aishu.cn:8444/api/search-engine/v1/open/services/b3264bda37114355ab8211af5463354a",
                    "tool_desc": "在图谱中搜索相关实体",
                    "tool_method": "POST",
                    "tool_input": [{
                        "input_name": "query_text",
                        "input_type": "string",
                        "input_desc": "搜索关键词",
                        "in": 3,
                        "required": True
                    }]
                }
            ],
            "global_headers": {
                "appid": "Ns7-FjcWuecW9-s_PZl"
            },
            "create_user": "创建者",
            "create_time": "创建时间",
            "update_user": "编辑者",
            "update_time": "编辑时间"
        }
        """
        return res

    @circuit(
        failure_threshold=GetFailureThreshold(), recovery_timeout=GetRecoveryTimeout()
    )
    async def get_agent_config(self, agent_id) -> dict:
        """
        获取agent配置
        """
        url = self._basic_url + "/api/agent-factory/internal/v3/agent/{}".format(
            agent_id
        )
        async with aiohttp.ClientSession(headers=self.headers) as session:
            async with session.get(url) as response:
                if response.status != 200:
                    err = self._host + " get_agent_config error: {}".format(
                        await response.text()
                    )
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise CodeException(errors.AgentExecutor_ExternalServiceError, err)
                res = await response.json()
        """
        res = {
    "id": "01JS4Z1DGERV8HBY140PS1PH8N",
    "key": "01JS4Z1DGERV8HBY140N8TQK9T",
    "is_built_in": 0,
    "name": "简单问答Agent",
    "profile": "支持与大模型进行对话问答，不支持数据源召回，不支持临时区，不支持调用工具",
    "avatar_type": 1,
    "avatar": "1",
    "product_id": 1,
    "product_name": "AnyShare",
    "config": {
        "input": {
            "fields": [
                {
                    "name": "query",
                    "type": "string"
                }
            ],
            "rewrite": null,
            "augment": null,
            "is_temp_zone_enabled": 0,
            "temp_zone_config": null
        },
        "system_prompt": "/prompt/$query -> answer",
        "dolphin": "string",
        "is_dolphin_mode": 1,
        "data_source": null,
        "tools": [],
        "llms": [
            {
                "is_default": true,
                "llm_config": {
                    "id": "1916319990936637440",
                    "name": "Tome-pro",
                    "temperature": 0,
                    "top_p": 0.95,
                    "top_k": 1,
                    "frequency_penalty": 0,
                    "presence_penalty": 0,
                    "max_tokens": 500
                }
            }
        ],
        "is_data_flow_set_enabled": 0,
        "opening_remark_config": null,
        "preset_questions": null,
        "output": {
            "answer_variables": [
                "answer"
            ]
        }
    },
    "status": "published"
}
        """

        return res

    @circuit(
        failure_threshold=GetFailureThreshold(), recovery_timeout=GetRecoveryTimeout()
    )
    async def get_agent_config_by_key(self, agent_key) -> dict:
        """
        获取agent配置
        """
        url = self._basic_url + "/api/agent-factory/internal/v3/agent/by-key/{}".format(
            agent_key
        )
        async with aiohttp.ClientSession(headers=self.headers) as session:
            async with session.get(url) as response:
                if response.status != 200:
                    err = self._host + " get_agent_config_by_key error: {}".format(
                        await response.text()
                    )
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise CodeException(errors.AgentExecutor_ExternalServiceError, err)
                res = await response.json()
                return res


agent_factory_service = AgentFactoryService()
