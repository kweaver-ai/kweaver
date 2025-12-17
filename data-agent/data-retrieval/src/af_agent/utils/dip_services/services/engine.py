# -*- coding: utf-8 -*-
# calling engine api
#
# @Time: 2023/12/25
# @Author: Xavier.chen
# @File: services/engine.py
from urllib.parse import urljoin
from af_agent.utils.dip_services.base import Service, API, HTTPMethod, VER_3_0_0_1, ServiceType, ConnectionData
from af_agent.utils.dip_services.sdk_error import CogEngineError, DIPServiceError
from typing import List
import json

from af_agent.settings import get_settings

settings = get_settings()


class CogEngine(Service):
    """ Cognitive Service
    """
    engine_url: str = "/api/engine/v1"
    cognitive_service_url: str = "/api/cognitive-service/v1/services/{service_id}"
        
    alive_url: str = ""

    # 获取自定义认知服务的配置，先设置为空，后利用 _gen_api_url 初始化
    search_kg_url: str = ""
    custom_search_service_url: str = ""
    opensearch_custom_search_url: str = ""

    def __init__(self, addr="", headers={}, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self._set_engine_url()
        self._setup_connection(kwargs)
        self._gen_api_url()
        
    def _set_engine_url(self):
        """根据服务类型设置 engine URL"""
        url_mapping = {
            ServiceType.AD.value: "/api/engine/v1",
            ServiceType.OUTTER_DIP.value: "/api/kn-data-query/v1",
            ServiceType.DIP.value: "/api/kn-data-query/v0"
        }
        self.engine_url = url_mapping.get(self.type, "/api/kn-data-query/v0")

    def _setup_connection(self, addr, headers):
        """设置连接配置"""
        if self.conn is not None:
            return  # 如果已经设置了连接，直接返回
        
        if not addr:
            if self.type == ServiceType.AD.value:
                addr = settings.AD_GATEWAY_URL
            elif self.type == ServiceType.OUTTER_DIP.value:
                addr = settings.OUTTER_DIP_URL
            else:
                addr = settings.DIP_ENGINE_URL
        
        self.conn = ConnectionData(addr=addr, headers=headers)

    def _gen_api_url(self):
        # 3.0.0.1 版本需要加 Open
        if self.version == VER_3_0_0_1:
            self.engine_url = self.engine_url + "/open"
            
        self.alive_url: str = self.engine_url + "/health/ready"

        # 获取自定义认知服务的配置
        self.search_kg_url: str = self.engine_url + "/custom-search/kgs/{kg_id}"
        self.custom_search_service_url: str = self.engine_url + \
            "/custom-search/services/{service_id}"
        
        self.opensearch_custom_search_url: str = self.engine_url + \
            "/opensearch/custom/"

    def test_connet(self) -> bool:
        url = urljoin(self.conn.addr, self.alive_url)

        api = API(url=url, timeout=5, headers=self.conn.headers)
        try:
            api.call(raw_content=True)
            return True
        except DIPServiceError:
            return False

    async def ngql_search(
        self,
        kg_id: int,
        statements: List[str]
    ) -> dict:
        """custom search kg

        Args:
            statement (str): statement

        Returns:
            dict: return result
        """
        url = urljoin(self.conn.addr, self.search_kg_url.format(kg_id=kg_id))

        # get result from builder
        api = API(
            url=url,
            method=HTTPMethod.POST,
            headers=self.conn.headers,
            payload={
                "statements": statements
            }
        )

        try:
            res = await api.call_async()
            return res
        except DIPServiceError as e:
            raise CogEngineError(e) from e

    async def cognitive_service_config_call(
        self,
        service_id: str
    ):
        """get cognitive service config

        Args:
            service_id (str): service id

        Raises:
            CogEngineError: CogEngineError

        Returns:
            dict: return result in dict
        """
        url = urljoin(
            self.conn.addr,
            self.cognitive_service_url.format(service_id=service_id)
        )

        # get result from builder
        api = API(
            url=url,
            method=HTTPMethod.GET,
            headers=self.conn.headers,
        )

        try:
            res = await api.call_async()
            return res
        except DIPServiceError as e:
            raise CogEngineError(e) from e

    async def custom_search_service_call(
        self,
        service_id: str,
        params: dict,
        timeout: int = 600
    ) -> dict:
        """_summary_

        Args:
            service_id (str): ID of custom service
            params (dict): params of custom service

        Raises:
            CogEngineError: CogEngineError

        Returns:
            dict: return result in dict
        """
        url = urljoin(
            self.conn.addr,
            self.custom_search_service_url.format(service_id=service_id)
        )

        # get result from builder
        api = API(
            url=url,
            method=HTTPMethod.POST,
            headers=self.conn.headers,
            payload=params
        )

        try:
            res = await api.call_async(timeout=timeout)
            return res
        except DIPServiceError as e:
            raise CogEngineError(e) from e
    
    
    async def a_opensearch_custom_search(
        self,
        params: List[dict],
        timeout: int = 600
    ) -> dict:
        """opensearch custom search async

        Args:
            params (List[dict]): params
            timeout (int, optional): timeout. Defaults to 600.

        Returns:
            dict: return result
        
        Example:
            params = [
                {
                    "kg_id": "1668",
                    "query": "{\"query\": {\"terms\": {\"name.keyword\": [\"小白白\", \"销量\", \"小白白品牌\"]}}}",
                    "tags":["*"]
                }
            ]
        """
        # params
        # {
        #     "req":[{
        #         "kg_id": "1668",
        #         "query": "{\"query\": {\"terms\": {\"name.keyword\": [\"小白白\", \"销量\", \"小白白品牌\"]}}}",
        #         "tags":["*"]
        #     }]
        # }

        url = urljoin(
            self.conn.addr,
            self.opensearch_custom_search_url,
        )

        api = API(
            url=url,
            method=HTTPMethod.POST,
            headers=self.conn.headers,
            payload={
                "req": params
            }
        )

        try:
            res = await api.call_async(timeout=timeout)
            return res
        except DIPServiceError as e:
            raise CogEngineError(e) from e
    
    async def a_opensearch_custom_search_by_kg_id(
        self,
        kg_id: str,
        query_params: dict,
        entity_classes: List[str] = ["*"],
        timeout: int = 600
    ) -> dict:
        try:
            if isinstance(query_params, dict):
                query_params = json.dumps(query_params)
            params_for_ad = {
                "kg_id": kg_id,
                "query": query_params,
                "tags": entity_classes
            }
        except Exception as e:
            raise CogEngineError(e) from e

        res =  await self.a_opensearch_custom_search([params_for_ad], timeout=timeout)

        response = res.get("responses",[])

        if len(response) != 0:
            return response[0]
        else:
            return {}

    def opensearch_custom_search(
        self,
        params: List[dict],
        timeout: int = 600
    ) -> dict:
        """opensearch custom search async

        Args:
            params (List[dict]): params
            timeout (int, optional): timeout. Defaults to 600.

        Returns:
            dict: return result
        
        Example:
            params = [
                {
                    "kg_id": "1668",
                    "query": "{\"query\": {\"terms\": {\"name.keyword\": [\"小白白\", \"销量\", \"小白白品牌\"]}}}",
                    "tags":["*"]
                }
            ]
        """
        # params
        # {
        #     "req":[{
        #         "kg_id": "1668",
        #         "query": "{\"query\": {\"terms\": {\"name.keyword\": [\"小白白\", \"销量\", \"小白白品牌\"]}}}",
        #         "tags":["*"]
        #     }]
        # }

        url = urljoin(
            self.conn.addr,
            self.opensearch_custom_search_url,
        )

        api = API(
            url=url,
            method=HTTPMethod.POST,
            headers=self.conn.headers,
            payload={
                "req": params
            }
        )

        try:
            res = api.call(timeout=timeout)
            return res
        except DIPServiceError as e:
            raise CogEngineError(e) from e
    
    def opensearch_custom_search_by_kg_id(
        self,
        kg_id: str,
        query_params: dict,
        entity_classes: List[str] = ["*"],
        timeout: int = 600
    ) -> dict:
        try:
            params_for_ad = {
                "kg_id": kg_id,
                "query": json.dumps(query_params),
                "tags": entity_classes
            }
        except Exception as e:
            raise CogEngineError(e) from e

        res =  self.opensearch_custom_search([params_for_ad], timeout=timeout)

        response = res.get("responses",[])

        if len(response) != 0:
            return response[0]
        else:
            return {}


if __name__ == "__main__":
    import asyncio
    import json

    from af_agent.utils.dip_services.base import ConnectionData
    connData = ConnectionData(
        addr="https://10.4.109.199:8444/",
        access_key="O4ydIe0EcxLLZHVdK0O"
    )
    engine = CogEngine(conn=connData)
    engine.test_connet()

    async def main():
        try:
            # res = await engine.ngql_search(
            #     kg_id=55,
            #     statements=[
            #         """MATCH p=(v:enterprise)-[e1:has_relation]->(v1:enterprise_relation) WHERE id(v)=='f278cc52de63871495105dbc77146772' WITH v1,p MATCH p1=(v1)-[e2:has{choice:"0"}]->(v2) OPTIONAL MATCH p2=(v2)-[e3:enterprise_2_activity|product_2_activity*0..1]->(v3:activity) WITH v1, collect(p1)[0..6] AS p11, collect(p2)[0..4] AS p22, p RETURN p, p11, p22;"""
            #     ]
            # )
            # print(json.dumps(res, indent=4, ensure_ascii=False))

            # res = await engine.custom_search_service_call(
            #     service_id="1e3b7a8cd27043d69f16aa82df9ed2e6",
            #     params={
            #         "vid": "8cd233c158915cdbf13022a676188ab9"
            #     }
            # )
            # res = await engine.custom_search_service_call(
            #     service_id="9915f0f7a8534d01acf5a9fc6cd34829",
            #     params={
            #         "start_vids": "[\"2b40de4ac9e49096c85e8d55683401a0\",\"81ce6389a5949d79b4d5de14f2220b51\"]",
            #         "data_kind": "0",
            #         "update_cycle": "[0,1,2,5]",
            #         "shared_type": "[1,2,3]",
            #         "start_time": "1600122122",
            #         "end_time": "1800122122",
            #         "asset_type": "[-1]"
            #     }
            # )
            res = await engine.a_opensearch_custom_search_by_kg_id(
                kg_id="1668",
                query_params={
                    "query": {
                        "terms": {
                            "name.keyword": ["小白白", "销量", "小白白品牌"]
                        }
                    }
                },
                entity_classes=["*"]
            )

            print(json.dumps(res, indent=4, ensure_ascii=False))

            res = await engine.a_opensearch_custom_search(
                params=[
                    {
                        "kg_id": "1668",
                        "query": "{\"query\": {\"terms\": {\"name.keyword\": [\"小白白\", \"销量\", \"小白白品牌\"]}}}",
                        "tags":["salesdata"]
                    }
                ]
            )

            print(json.dumps(res, indent=4, ensure_ascii=False))

            # res = await engine.cognitive_service_config_call(
            #     service_id="d2b16da50fb44d1eaac4798d8423936e",
            # )
            # print(json.dumps(res, indent=4, ensure_ascii=False))
        except DIPServiceError as e:
            print(e.json())

    # asyncio.run(main())
    res = engine.opensearch_custom_search_by_kg_id(
        kg_id="1668",
        query_params={
            "query": {
                "terms": {
                    "name.keyword": ["小白白", "销量", "小白白品牌"]
                }
            }
        }
    )

    print("Opensearch Custom Search By KG ID====================")
    print(json.dumps(res, indent=4, ensure_ascii=False))

    res = engine.opensearch_custom_search(
        params=[
            {
                "kg_id": "1668",
                "query": "{\"query\": {\"terms\": {\"name.keyword\": [\"小白白\", \"销量\", \"小白白品牌\"]}}}",
                "tags":["salesdata"]
            }
        ]
    )

    print("Opensearch Custom Search====================")
    print(json.dumps(res, indent=4, ensure_ascii=False))
