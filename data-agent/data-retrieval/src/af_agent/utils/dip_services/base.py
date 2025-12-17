# -*- coding: utf-8 -*-
# Base classes of SDK
#
# @Time: 2023/12/25
# @Author: Xavier.chen
# @File: base.py

from abc import ABC, abstractmethod
from enum import Enum
from typing import Optional

import json
from pydantic import BaseModel
import requests
import aiohttp

from af_agent.utils.dip_services.sdk_error import DIPServiceError
from af_agent.settings import get_settings

settings = get_settings()


# Different version have some different in URLs or params.
VER_3_0_0_1 = "3.0.0.1"
VER_3_0_0_2 = "3.0.0.2"
VER_3_0_0_3 = "3.0.0.3"
VER_3_0_0_4 = "3.0.0.4"
VER_3_0_0_7 = "3.0.0.7"


class ServiceType(Enum):
    """Service Type
    """
    AD = "ad"
    DIP = "dip"
    OUTTER_DIP = "outter_dip"

class HTTPMethod:
    """HTTP Method
    """
    POST = "POST"
    GET = "GET"


class ConnectionData(BaseModel):
    """ Connection data to the services
    """
    addr: str
    headers: Optional[dict] = {}


class Service(ABC, BaseModel):
    """ abstract class of Services

    """
    conn: Optional[ConnectionData] = None
    version: str = VER_3_0_0_2
    type: str = ServiceType.DIP.value

    def __init__(
        self,
        conn: ConnectionData = None,
        addr: str = "",
        headers: dict = {},
        version="",
        type: str = "",
        *args,
        **kwargs
    ):
        # 这里必须要调用父类的构造函数，否则会报错
        # https://stackoverflow.com/questions/73664830/pydantic-object-has-no-attribute-fields-set-error
        super().__init__(*args, **kwargs)

        if conn is not None:
            self.conn = conn
        else:
            if addr != "":
                self.conn = ConnectionData(addr=addr, headers=headers)
        if version != "":
            self.version = version
        else:
            self.version = settings.AD_VERSION

        if type:
            self.type = type
        else:
            self._set_service_type()

    def _set_service_type(self):
        """设置服务类型"""
        if settings.OUTTER_DIP_URL:
            self.type = ServiceType.OUTTER_DIP.value
        elif settings.AD_GATEWAY_URL:
            self.type = ServiceType.AD.value
        else:
            self.type = ServiceType.DIP.value
    @abstractmethod
    def test_connet(self) -> bool:
        """ test connection
        """

    @classmethod
    def from_conn_data(cls, addr, headers):
        """create builder service
        """
        conn = ConnectionData(addr=addr, headers=headers)
        return cls(conn=conn)


class API(BaseModel):
    """ abstract class of API Call
    """
    url: str
    params: Optional[dict] = {}
    payload: Optional[dict] = {}
    headers: Optional[dict] = {}
    method: str = HTTPMethod.GET

    def call(
        self,
        timeout: int = 30,
        verify: bool = False,
        raw_content: bool = False
    ):
        """http request
        """
        if self.method == HTTPMethod.GET:
            resp = requests.get(
                url=self.url,
                params=self.params,
                headers=self.headers,
                timeout=timeout,
                verify=verify
            )
        elif self.method == HTTPMethod.POST:
            resp = requests.post(
                self.url,
                params=self.params,
                json=self.payload,
                headers=self.headers,
                timeout=timeout,
                verify=verify
            )
        else:
            raise DIPServiceError(
                reason="method not support",
                url=self.url
            )

        if int(resp.status_code / 100) == 2:
            if raw_content:
                return resp.content

            return resp.json()

        try:
            detail = resp.json()
        except json.decoder.JSONDecodeError:
            detail = {"detail": resp.text}

        raise DIPServiceError(
            url=self.url,
            status=resp.status_code,
            reason=resp.reason,
            detail=detail
        )

    async def call_async(
        self,
        timeout: int = 5,
        verify: bool = False,
        raw_content: bool = False
    ):
        """async http request
        """

        async with aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(ssl=verify),
            headers=self.headers
        ) as session:

            timeout = aiohttp.ClientTimeout(total=timeout)

            if self.method == HTTPMethod.GET:
                async with session.get(
                        self.url,
                        params=self.params,
                        timeout=timeout) as resp:

                    if int(resp.status / 100) == 2:
                        if raw_content:
                            return await resp.read()

                        res = await resp.json(content_type=None)
                        return res

                    try:
                        detail = await resp.json(content_type=None)
                    except json.decoder.JSONDecodeError:
                        detail = {"detail": await resp.text()}

                    raise DIPServiceError(
                        url=self.url,
                        status=resp.status,
                        reason=resp.reason,
                        detail=detail
                    )

            elif self.method == HTTPMethod.POST:
                async with session.post(
                        self.url,
                        params=self.params,
                        json=self.payload,
                        timeout=timeout) as resp:

                    if int(resp.status / 100) == 2:
                        if raw_content:
                            return await resp.read()

                        res = await resp.json(content_type=None)
                        return res

                    try:
                        detail = await resp.json(content_type=None)
                    except json.decoder.JSONDecodeError:
                        detail = {"detail": await resp.text()}

                    raise DIPServiceError(
                        url=self.url,
                        status=resp.status,
                        reason=resp.reason,
                        detail=detail
                    )

            else:
                raise DIPServiceError("method not support")
