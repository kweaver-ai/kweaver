# -*- coding: utf-8 -*-
# calling any api
#
# @Time: 2023/12/25
# @Author: Xavier.chen
# @File: error.py
from urllib.parse import urljoin
from data_retrieval.utils.dip_services.base import Service, API, HTTPMethod
from data_retrieval.utils.dip_services.sdk_error import CommonError, DIPServiceError


class Common(Service):
    """ Any Service
    """
    # builder_url: str = "/api/builder/v1"
    # alive_url: str = builder_url + "/task/health/alive"
    # kgids_url: str = builder_url + "/knw/get_graph_by_knw"
    # kgidname_url: str = builder_url + "/graph/info/basic"
    # knwid_url: str = builder_url + "/open/knw/get_all"
    # onto_url: str = builder_url + "/graph/info/onto"
    # kg_info_url: str = builder_url + "/graph/{kg_id}"

    # download_lexicon_url: str = builder_url + "/lexicon/download"

    def test_connet(self) -> bool:
        return True

    def call_api(
        self, method: str,
        url: str,
        params: dict = None,
        headers: dict = None,
        payload: dict = None,
        timeout: int = 30,
        verify: bool = False,
        raw_content: bool = False
    ):
        """call method

        Args:
            method (str): method
            url (str): url

        Raises:
            BuilderError: builder error

        Returns:
            dict: result
        """
        url = urljoin(self.conn.addr, url)

        default_headers = self.conn.headers

        api = API(
            url=url,
            headers={**default_headers, **headers},  # 需要合并两个headers
            params=params,
            payload=payload,
            method=method
        )

        try:
            res = api.call(
                timeout=timeout,
                verify=verify,
                raw_content=raw_content
            )

            return res
        except DIPServiceError as e:
            raise CommonError(e) from e

    async def call_api_async(  
        self, method: str,
        url: str,
        params: dict = None,
        headers: dict = None,
        payload: dict = None,
        timeout: int = 30,
        verify: bool = False,
        raw_content: bool = False
    ):
        """call method async

        Args:
            method (str): method
            url (str): url

        Raises:
            DIPServiceError: error

        Returns:
            dict: result
        """
        default_headers = self.conn.headers

        if headers is None:
            headers = {}

        url = urljoin(self.conn.addr, url)
        api = API(
            url=url,
            headers={**default_headers, **headers},  # 需要合并两个headers
            params=params,
            payload=payload,
            method=method
        )

        try:
            res = await api.call_async(
                timeout=timeout,
                verify=verify,
                raw_content=raw_content
            )

            return res
        except DIPServiceError as e:
            raise CommonError(e) from e


if __name__ == "__main__":
    import asyncio
    import json
    # connData = ConnectionData(
    #     addr="https://124.70.219.13:8444/",
    #     access_key="NPPbNqNKbiNasSuCO2t"
    # )
    any_service = Common()

    async def main():
        try:
            res = any_service.test_connet()
            print(res)

            # "http://10.4.133.194:6475/api/builder/v1/graph/info/onto"
            res = await any_service.call_api_async(
                method=HTTPMethod.GET,
                url="/api/builder/v1/graph/info/onto",
                params={
                    "graph_id": 75
                }
            )

            print(json.dumps(res, indent=4, ensure_ascii=False))
        except DIPServiceError as e:
            print(e.json())

    asyncio.run(main())
