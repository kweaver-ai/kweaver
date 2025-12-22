# -*- coding: utf-8 -*-
# calling builder service
#
# @Time: 2023/12/25
# @Author: Xavier.chen
# @File: error.py
from urllib.parse import urljoin
from data_retrieval.utils.dip_services.base import Service, API, VER_3_0_0_1, ConnectionData, ServiceType
from data_retrieval.utils.dip_services.sdk_error import BuilderError, DIPServiceError

from data_retrieval.settings import get_settings

settings = get_settings()


class Builder(Service):
    """ Builder Service
    """
    builder_url: str = ""
    
    alive_url: str = ""
    kgids_url: str = ""
    kgidname_url: str = ""
    knwid_url: str = ""
    onto_url: str = ""
    kg_info_url: str = ""
    download_lexicon_url: str = ""

    def __init__(self, addr="", headers={}, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        self._setup_connection(addr, headers)
        self._gen_api_url()



    def _setup_connection(self, addr, headers):
        """设置连接配置"""
        if self.conn is not None:
            return  # 如果已经设置了连接，直接返回
        
        if not addr:
            if self.type.lower() == ServiceType.AD.value:
                addr = settings.AD_GATEWAY_URL
            elif self.type.lower() == ServiceType.OUTTER_DIP.value:
                addr = settings.OUTTER_DIP_URL
            else:
                addr = settings.DIP_BUILDER_URL
        else:
            # 设置地址默认调整为外部 DIP
            if self.type.lower() == ServiceType.DIP.value:
                self.type = ServiceType.OUTTER_DIP.value

        """根据服务类型设置 builder URL"""
        url_mapping = {
            ServiceType.AD.value: "/api/builder/v1",
            ServiceType.OUTTER_DIP.value: "/api/kn-knowledge-data/v1",
            ServiceType.DIP.value: "/api/kn-knowledge-data/v0"
        }
        self.builder_url = url_mapping.get(self.type, "/api/kn-knowledge-data/v0")
        
        self.conn = ConnectionData(addr=addr, headers=headers)

    def _gen_api_url(self):
        # 3.0.0.1 版本需要加 Open
        if self.version == VER_3_0_0_1:
            self.builder_url = self.builder_url + "/open"
        
        self.alive_url = self.builder_url + "/health/ready"
        self.kgids_url: str = self.builder_url + "/knw/get_graph_by_knw"
        self.kgidname_url: str = self.builder_url + "/graph/info/basic"
        self.knwid_url: str = self.builder_url + "/open/knw/get_all"
        self.onto_url: str = self.builder_url + "/graph/info/onto"

        # https://192.168.167.13/api/kn-knowledge-data/v1/graph/9
        self.kg_info_url: str = self.builder_url + "/graph/{kg_id}"

        self.download_lexicon_url: str = self.builder_url + "/lexicon/download"
            

    def test_connet(self) -> bool:
        """test connection for builder service
        """
        url = urljoin(self.conn.addr, self.alive_url)

        api = API(url=url, timeout=5, headers=self.conn.headers)
        try:
            api.call(raw_content=True)
            return True
        except DIPServiceError as e:
            print(e)
            return False

    async def get_kgs_by_kn(self, knw_id: str) -> dict:
        """get knowledge graph ID by knowledge network ID

        Args:
            knw_id (str): knowledge network ID

        Returns:
            dict: return knowledge graph ID and name
        """
        # url = "http://10.4.133.194:6475/api/builder/v1/knw/get_graph_by_knw"
        url = urljoin(self.conn.addr, self.kgids_url)

        # get result from builder
        api = API(
            url=url,
            headers=self.conn.headers,
            params={
                "knw_id": knw_id,
                "page": 1,
                "size": 50,
                "order": "desc",
                "rule": "update",
                "name": ""
            }
        )

        try:
            res = await api.call_async()
            # get result from builder async

            kgs = [
                {
                    "id": str(df["id"]),
                    "name": df["name"]
                }
                for df in res["res"]["df"]
            ]

            return kgs
        except DIPServiceError as e:
            raise BuilderError(e) from e

    async def get_kg_dbname_by_id(self, kg_id: str) -> dict:
        """Get knowledge graph info by knowledge graph ID

        Args:
            kg_id (str): Knowledge graph ID

        Returns:
            dict: Knowledge graph info
        """
        # url = "http://10.4.133.194:6475/api/builder/v1/graph/info/basic"

        # get result from builder
        url = urljoin(self.conn.addr, self.kgidname_url)
        api = API(
            url=url,
            headers=self.conn.headers,
            params={
                "graph_id": int(kg_id),
                "key": '["graphdb_dbname"]'
            }
        )

        try:
            res = await api.call_async()
            return res["res"]["graphdb_dbname"]
        except DIPServiceError as e:
            raise BuilderError(e) from e

    async def get_knowledge_networks(self, size=50) -> list:
        """get all knowledge network ID

        Raises:
            BuilderError: builder error

        Returns:
            list: network ID list
        """
        # url = "http://10.4.133.194:6475/api/builder/v1/open/knw/get_all"
        url = urljoin(self.conn.addr, self.knwid_url)

        api = API(
            url=url,
            headers=self.conn.headers,
            params={
                "page": 1,
                "size": size,
                "order": "desc",
                "rule": "update"
            }
        )

        try:
            res = await api.call_async()
            return [df["id"] for df in res["res"]["df"]]
        except DIPServiceError as e:
            raise BuilderError(e) from e

    async def get_graph_ontology_by_id(self, kg_id: str) -> dict:
        """get ontology of knowledge graph by knowledge graph ID

        Args:
            kg_id (str): kg_id

        Raises:
            BuilderError: builder error

        Returns:
            dict: ontology
        """
        # url = "http://10.4.133.194:6475/api/builder/v1/graph/info/onto"
        url = urljoin(self.conn.addr, self.onto_url)

        api = API(
            url=url,
            headers=self.conn.headers,
            params={
                "graph_id": int(kg_id)
            }
        )

        try:
            res = await api.call_async()
            return res
        except DIPServiceError as e:
            raise BuilderError(e) from e

    async def get_kg_info(self, kg_id: str) -> dict:
        """get knowledge graph info by knowledge graph ID

        Args:
            kg_id (str): Knowledge graph ID

        Raises:
            BuilderError: builder error

        Returns:
            dict: Knowledge graph info
        """
        url = urljoin(self.conn.addr, self.kg_info_url.format(kg_id=kg_id))

        api = API(
            url=url,
            headers=self.conn.headers,
        )

        try:
            # res = api.call()
            res = await api.call_async()
            return res
        except DIPServiceError as e:
            raise BuilderError(e) from e
    def get_kg_info_na(self, kg_id: str) -> dict:
        """get knowledge graph info by knowledge graph ID

        Args:
            kg_id (str): Knowledge graph ID

        Raises:
            BuilderError: builder error

        Returns:
            dict: Knowledge graph info
        """
        url = urljoin(self.conn.addr, self.kg_info_url.format(kg_id=kg_id))

        api = API(
            url=url,
            headers=self.conn.headers,
        )

        try:
            res = api.call()
            # res = await api.call_async()
            return res
        except DIPServiceError as e:
            raise BuilderError(e) from e
    def download_lexicon(self, lexicon_id: int, timeout=30) -> dict:
        """download lexicon by lexicon ID

        Args:
            lexicon_id (int): lexicon ID

        Raises:
            BuilderError: builder error

        Returns:
            dict: lexicon content
        """
        url = urljoin(self.conn.addr, self.download_lexicon_url)

        api = API(
            url=url,
            headers=self.conn.headers,
            params={
                "lexicon_id": lexicon_id
            }
        )

        try:
            res = api.call(raw_content=True, timeout=timeout)
            return res.decode('utf8')
        except DIPServiceError as e:
            raise BuilderError(e) from e

    async def download_lexicon_async(self, lexicon_id, timeout=30):
        """download lexicon by lexicon ID async

        Args:
            lexicon_id (int): lexicon ID

        Raises:
            BuilderError: builder error

        Returns:
            dict: lexicon content
        """
        url = urljoin(self.conn.addr, self.download_lexicon_url)

        api = API(
            url=url,
            headers=self.conn.headers,
            params={
                "lexicon_id": lexicon_id
            }
        )

        try:
            res = await api.call_async(raw_content=True, timeout=timeout)
            return res.decode('utf8')
        except DIPServiceError as e:
            raise BuilderError(e) from e


if __name__ == "__main__":
    import asyncio
    import json
    import os
    import sys
    import time

    # 设置无缓冲输出
    os.environ['PYTHONUNBUFFERED'] = '1'
    sys.stdout.reconfigure(line_buffering=True)

    conn_data_outter_dip = ConnectionData(
        addr="http://192.168.167.13:6475/",
        headers={"Authorization": "Bearer ory_at_GE0Na075hzuAbg79aBxMEwHz4EdkenVjHxvgJ6u3j-Y.O9aLmLSm_Wes3u5Mcyqq3UGVVRYL9oRQpW_ncKx2Fdo"}
        # headers={"userId": "test"}
    )

    conn_data_dip = ConnectionData(
        addr="http://192.168.167.13:6475/",
        headers={"userid": ""}
    )

    builder_service_outter_dip = Builder(conn=conn_data_outter_dip, type=ServiceType.OUTTER_DIP.value)
    builder_service_dip = Builder(conn=conn_data_dip)

    builder_default = Builder(headers={"userid": "test"})
    # builder_service = Builder.from_conn_data(
    #     addr=connData.addr,
    #     headers=connData.headers
    # )

    # 通过环境变量读取
    # builder_service = Builder()

    def test_sync():
        """同步测试函数"""
        print("=== 同步测试开始 ===")
        try:
            print("测试 get_kg_info_na...")
            res = builder_default.get_kg_info_na("9")
            print("✅ get_kg_info_na 成功")
            print("完整响应:")
            print(json.dumps(res, indent=4, ensure_ascii=False))
            
            mapping_info = res.get("res", {}).get("graph_KMap", {})
            print("\nmapping_info 内容:")
            print(json.dumps(mapping_info, indent=4, ensure_ascii=False))
            
            print("=== 同步测试完成 ===")
            return True
        except Exception as e:
            print(f"❌ 同步测试失败: {e}")
            import traceback
            traceback.print_exc()
            return False

    async def main():
        try:
            print("=== 异步测试开始 ===")
            
            # res = builder_service.test_connet()
            # print(res)

            # res = await builder_service.get_kgs_by_kn("3")
            # print(json.dumps(res, indent=4, ensure_ascii=False))

            # res = await builder_service.get_kg_dbname_by_id("9")
            # print(res)

            # res = await builder_service.get_knowledge_networks()
            # print(res)

            # res = await builder_service_dip.get_graph_ontology_by_id("9")
            # print(json.dumps(res, indent=4, ensure_ascii=False))

            print("\n1. 测试 get_graph_ontology_by_id...")
            res = await builder_default.get_graph_ontology_by_id("9")
            print("✅ get_graph_ontology_by_id 成功")
            print("完整响应:")
            print(json.dumps(res, indent=4, ensure_ascii=False))
            
            # 强制刷新并等待
            sys.stdout.flush()
            await asyncio.sleep(0.1)

            print("\n2. 测试 get_kg_info...")
            res = await builder_default.get_kg_info("9")
            print("✅ get_kg_info 成功")
            print("完整响应:")
            print(json.dumps(res, indent=4, ensure_ascii=False))
            
            mapping_info = res.get("res", {}).get("graph_KMap", {})
            print("\nmapping_info 内容:")
            print(json.dumps(mapping_info, indent=4, ensure_ascii=False))
            
            # 强制刷新并等待
            sys.stdout.flush()
            await asyncio.sleep(0.1)

            # res = builder_service.download_lexicon(5)
            # print(res)
            # res = await builder_service.download_lexicon_async(112)
            # print(res)
            
            print("\n=== 异步测试完成 ===")

        except DIPServiceError as e:
            print(f"❌ DIPServiceError: {e}")
            print(e.json())
        except Exception as e:
            print(f"❌ 其他异常: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # 确保输出完整
            sys.stdout.flush()
            await asyncio.sleep(0.1)

    # 先运行同步测试
    print("开始同步测试...")
    sync_success = test_sync()
    
    # 等待一下确保输出完成
    time.sleep(1)
    
    # 再运行异步测试
    print("\n开始异步测试...")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n程序被用户中断")
    except Exception as e:
        print(f"异步程序运行异常: {e}")
        import traceback
        traceback.print_exc()
    
    # 最后等待确保所有输出都完成
    print("\n程序结束，等待输出完成...")
    time.sleep(2)
