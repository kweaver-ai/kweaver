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


class AgentOperatorIntegrationService:
    def __init__(self):
        self._host = Config.HOST_AGENT_OPERATOR_INTEGRATION
        self._port = Config.PORT_AGENT_OPERATOR_INTEGRATION
        self._basic_url = "http://{}:{}".format(self._host, self._port)
        self.headers = {}

    def set_headers(self, headers):
        self.headers = headers

    @circuit(
        failure_threshold=GetFailureThreshold(), recovery_timeout=GetRecoveryTimeout()
    )
    async def get_tool_info(self, box_id, tool_id) -> dict:
        # from myTest.tools.tools import tool_box_info  # TODO: debug
        # for box in tool_box_info:
        #     if box["box_id"] == box_id:
        #         return box
        # return {}
        url = "{basic_url}/api/agent-operator-integration/internal-v1/tool-box/{box_id}/tool/{tool_id}".format(
            basic_url=self._basic_url, box_id=box_id, tool_id=tool_id
        )
        async with aiohttp.ClientSession(headers=self.headers) as session:
            async with session.get(url, ssl=False) as response:
                if response.status != HTTPStatus.OK:
                    err = self._host + " get_tool_info error: {}".format(
                        await response.text()
                    )
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise CodeException(errors.AgentExecutor_ExternalServiceError, err)
                res = await response.json()
        return res

    @circuit(
        failure_threshold=GetFailureThreshold(), recovery_timeout=GetRecoveryTimeout()
    )
    async def get_mcp_tools(self, mcp_server_id) -> dict:
        url = "{basic_url}/api/agent-operator-integration/internal-v1/mcp/proxy/{mcp_server_id}/tools".format(
            self._basic_url, mcp_server_id
        )
        async with aiohttp.ClientSession(headers=self.headers) as session:
            async with session.get(url, ssl=False) as response:
                if response.status != HTTPStatus.OK:
                    err = self._host + " get_mcp_tools error: {}".format(
                        await response.text()
                    )
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise CodeException(errors.AgentExecutor_ExternalServiceError, err)
                res = await response.json()
        return res


agent_operator_integration_service = AgentOperatorIntegrationService()
