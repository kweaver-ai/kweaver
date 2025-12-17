# -*- coding: utf-8 -*-
# calling alg server
#
# @Time: 2024/11/20
# @Author: Xavier.chen
# @File: alg_server.py
from urllib.parse import urljoin
from af_agent.utils.dip_services.base import Service, API, VER_3_0_0_1, ConnectionData, ServiceType
from af_agent.utils.dip_services.sdk_error import DIPServiceError, AlgServerError
from typing import List
from traceback import print_exc

from af_agent.settings import get_settings

settings = get_settings()


class AlgServer(Service):

    alg_server_url: str = "/api/alg-server/v1"
    alive_url: str = ""
    graph_search_url: str = ""

    def __init__(self, addr="", headers={}, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        self._set_alg_server_url()
        self._setup_connection(addr, headers)
        self._gen_api_url()
        
    def _set_alg_server_url(self):
        """设置 alg server URL"""
        self.alg_server_url = "/api/alg-server/v1"

    def _setup_connection(self, addr, headers):
        """设置连接配置"""
        if self.conn is not None:
            return  # 如果已经设置了连接，直接返回
        
        if not addr:
            if self.type == ServiceType.AD.value:
                addr = settings.AD_GATEWAY_URL
            else:
                addr = settings.DIP_ALG_SERVER_URL
        
        self.conn = ConnectionData(addr=addr, headers=headers)
    
    def _gen_api_url(self):
        # 3.0.0.1 版本需要加 Open
        if self.version == VER_3_0_0_1:
            self.alg_server_url = self.alg_server_url + "/open"
            
        self.alive_url: str = self.alg_server_url + "/health/ready"

        # 获取自定义认知服务的配置
        self.graph_search_url: str = self.alg_server_url + "/graph-search/kgs/{kg_id}/quick-search"
    

    def test_connet(self) -> bool:
        url = urljoin(self.conn.addr, self.alive_url)

        api = API(url=url, timeout=5, headers=self.conn.headers)
        try:
            api.call(raw_content=True)
            return True
        except AlgServerError:
            print_exc()
            return False
        
    def _gen_graph_search_url(
            self,
            kg_id: int,
            query: str,
            matching_num: int = 5,
            entity_classes: List[str] = [],
            size: int = 10,
            page: int = 0
    ):
        url = urljoin(self.conn.addr, self.graph_search_url.format(kg_id=kg_id))

        api = API(
            url=url,
            headers=self.conn.headers,
            params={
                "query": query,
                "matching_num": matching_num,
                "entity_classes": entity_classes,
                "size": size,
                "page": page
            }
        )
        return api

    async def agraph_search(
            self, 
            kg_id: int, 
            query: str, 
            matching_num: int = 5, 
            entity_classes: List[str] = [],
            size: int = 10,
            page: int = 0
        ) -> dict:
        # 可指定实体进行快速搜索

        # get https://{{IP}}:{{AlgPort}}/api/alg-server/v1/graph-search/kgs/:{kg_id}/quick-search?query=了&matching_num=5&entity_classes=chapter&entity_classes=text
        
        api = self._gen_graph_search_url(kg_id, query, matching_num, entity_classes, size, page)

        try:
            res = await api.call_async()
            return res
        except DIPServiceError as e:
            print_exc()
            raise AlgServerError(e) from e
        
    def graph_search(
            self, 
            kg_id: int, 
            query: str, 
            matching_num: int = 5, 
            entity_classes: List[str] = [],
            size: int = 10,
            page: int = 1
    ):
        api = self._gen_graph_search_url(kg_id, query, matching_num, entity_classes, size, page)

        try:
            res = api.call(raw_content=True)
            return res
        except DIPServiceError as e:
            print_exc()
            raise AlgServerError(e) from e
        

if __name__ == "__main__":
    import json
    alg_server = AlgServer()
    res = alg_server.graph_search(1668, "小白白销量", entity_classes=["salesdata"])
    print(json.loads(res))
    

