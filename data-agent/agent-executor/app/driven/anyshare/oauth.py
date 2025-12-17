import sys
from http import HTTPStatus

import aiohttp
from circuitbreaker import circuit

import app.common.stand_log as log_oper
from app.common import errors
from app.common.errors import CodeException
from app.common.stand_log import StandLogger
from app.utils.common import GetFailureThreshold, GetRecoveryTimeout


class OAuthService:
    def __init__(self, host, port):
        self._host = host
        self._port = port
        self._basic_url = "https://{}:{}".format(self._host, self._port)
        self.headers = {}

    def set_headers(self, headers):
        self.headers = headers

    @circuit(
        failure_threshold=GetFailureThreshold(), recovery_timeout=GetRecoveryTimeout()
    )
    async def get_token(self, username, password) -> dict:
        StandLogger.debug(f"start get oauth token for user: {username}")
        url = "{}/oauth2/token".format(self._basic_url)
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        data = {"grant_type": "client_credentials", "scope": "all"}
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                headers=headers,
                data=data,
                auth=aiohttp.BasicAuth(username, password, encoding="utf-8"),
                ssl=False,
            ) as response:
                if response.status != HTTPStatus.OK:
                    err = self._host + " get_token error: {}".format(
                        await response.text()
                    )
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise CodeException(errors.ExternalServiceError(), err)
                json_response = await response.json()
                StandLogger.debug(f"get oauth token for user: {username} 结束")
                return json_response["access_token"]
