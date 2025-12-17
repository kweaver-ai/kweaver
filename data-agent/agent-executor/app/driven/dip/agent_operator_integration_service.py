import json
import sys
from http import HTTPStatus

import aiohttp
from circuitbreaker import circuit

import app.common.stand_log as log_oper
from app.common import errors
from app.common.config import Config
from app.common.errors import CodeException
from app.common.stand_log import StandLogger
from app.common.struct_logger.error_log_class import get_error_log_json
from app.utils.common import GetFailureThreshold, GetRecoveryTimeout


class AgentOperatorIntegrationService:
    def __init__(self):
        self._host = Config.services.agent_operator_integration.host
        self._port = Config.services.agent_operator_integration.port
        self._basic_url = "http://{}:{}".format(self._host, self._port)

        self.headers = {}

    def set_headers(self, headers):
        self.headers = headers

    @circuit(
        failure_threshold=GetFailureThreshold(), recovery_timeout=GetRecoveryTimeout()
    )
    async def get_tool_box_list(self) -> dict:
        url = "{basic_url}/api/agent-operator-integration/internal-v1/tool-box/list".format(
            basic_url=self._basic_url
        )

        params = {
            "page": 1,
            "page_size": 100,
        }

        async with aiohttp.ClientSession(headers=self.headers) as session:
            async with session.get(url, params=params, ssl=False) as response:
                if response.status != HTTPStatus.OK:
                    err = self._host + " get_tool_box_list error: {}".format(
                        await response.text()
                    )
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise CodeException(errors.ExternalServiceError(), err)

                res = await response.json()

        return res

    @circuit(
        failure_threshold=GetFailureThreshold(), recovery_timeout=GetRecoveryTimeout()
    )
    async def get_tool_list(self, box_id) -> dict:
        url = "{basic_url}/api/agent-operator-integration/internal-v1/tool-box/{box_id}/tools/list".format(
            basic_url=self._basic_url, box_id=box_id
        )

        params = {
            "page": 1,
            "page_size": 100,
        }

        async with aiohttp.ClientSession(headers=self.headers) as session:
            async with session.get(url, params=params, ssl=False) as response:
                if response.status != HTTPStatus.OK:
                    err = self._host + " get_tool_list error: {}".format(
                        await response.text()
                    )
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise CodeException(errors.ExternalServiceError(), err)

                res = await response.json()

        return res

    def get_mock_tool_info(self):
        with open(".local/tool_info.json", "r") as f:
            return json.load(f)

    @circuit(
        failure_threshold=GetFailureThreshold(), recovery_timeout=GetRecoveryTimeout()
    )
    async def get_tool_info(self, box_id, tool_id) -> dict:
        # from myTest.tools.tools import tool_box_info  # TODO: debug
        # for box in tool_box_info:
        #     if box["box_id"] == box_id:
        #         return box
        # return {}

        # if Config.LOCAL_DEV_AARON:
        #     return self.get_mock_tool_info()

        url = "{basic_url}/api/agent-operator-integration/internal-v1/tool-box/{box_id}/tool/{tool_id}".format(
            basic_url=self._basic_url, box_id=box_id, tool_id=tool_id
        )

        async with aiohttp.ClientSession(headers=self.headers) as session:
            async with session.get(url, ssl=False) as response:
                if response.status != HTTPStatus.OK:
                    err = (
                        "req_url: "
                        + url
                        + "\nget_tool_info error: {}".format(await response.text())
                        + "\nresponse_code: {}".format(response.status)
                    )

                    error_log = get_error_log_json(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)

                    raise CodeException(errors.ExternalServiceError(), err)

                res = await response.json()

        return res

    @circuit(
        failure_threshold=GetFailureThreshold(), recovery_timeout=GetRecoveryTimeout()
    )
    async def get_mcp_tools(self, mcp_server_id) -> dict:
        # if Config.is_local_dev():
        #     return {"tools": [{"name": "test"}]}

        url = "{basic_url}/api/agent-operator-integration/internal-v1/mcp/proxy/{mcp_server_id}/tools".format(
            basic_url=self._basic_url, mcp_server_id=mcp_server_id
        )

        async with aiohttp.ClientSession(headers=self.headers) as session:
            async with session.get(url, ssl=False) as response:
                if response.status != HTTPStatus.OK:
                    err = self._host + " get_mcp_tools error: {}".format(
                        await response.text()
                    )
                    error_log = get_error_log_json(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise CodeException(errors.ExternalServiceError(), err)

                res = await response.json()

        return res


agent_operator_integration_service = AgentOperatorIntegrationService()
