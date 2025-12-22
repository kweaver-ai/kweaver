import base64
import json
from typing import List
from urllib.parse import urljoin
from data_retrieval.utils.dip_services import Builder, OpenSearch, CogEngine
from data_retrieval.utils.dip_services.sdk_error import DIPServiceError, BuilderError
from pydantic_settings import BaseSettings

from data_retrieval.api.base import API, HTTPMethod
from data_retrieval.logs.logger import logger
from data_retrieval.errors import SDKRequestError, OpenSearchRequestError
from data_retrieval.settings import get_settings

from Crypto.Cipher import PKCS1_v1_5
from Crypto.PublicKey import RSA

pub_key_ad = b"""
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4E+eiWRwffhRIPQYvlXU
jf0b3HqCmosiCxbFCYI/gdfDBhrTUzbt3fL3o/gRQQBEPf69vhJMFH2ZMtaJM6oh
E3yQef331liPVM0YvqMOgvoID+zDa1NIZFObSsjOKhvZtv9esO0REeiVEPKNc+Dp
6il3x7TV9VKGEv0+iriNjqv7TGAexo2jVtLm50iVKTju2qmCDG83SnVHzsiNj70M
iviqiLpgz72IxjF+xN4bRw8I5dD0GwwO8kDoJUGWgTds+VckCwdtZA65oui9Osk5
t1a4pg6Xu9+HFcEuqwJTDxATvGAz1/YW0oUisjM0ObKTRDVSfnTYeaBsN6L+M+8g
CwIDAQAB
"""


settings = get_settings()

async def ad_builder_get_kg_info_async(graph_id, appid="", token=""):
    if settings.AD_GATEWAY_URL:
        base_url = settings.AD_GATEWAY_URL
        headers = {"APPID": appid}
    else:
        base_url = settings.DIP_BUILDER_URL
        headers = {"Authorization": token}
    
    try:
        builder_engine = Builder.from_conn_data(
            addr=base_url,
            headers=headers
        )
        kg_otl = await builder_engine.get_kg_info(str(graph_id))
        return kg_otl
    except (DIPServiceError, BuilderError) as e:
        logger.info('AF-AD-SDK 知识网络引擎获取图谱信息接口错误！')
        print("====================")
        print(e)
        raise SDKRequestError(e)


def ad_builder_get_kg_info(graph_id, appid="", token=""):
    if settings.AD_GATEWAY_URL:
        base_url = settings.AD_GATEWAY_URL
        headers = {"APPID": appid}
    else:
        base_url = settings.DIP_BUILDER_URL
        headers = {"Authorization": token}
    try:
        builder_engine = Builder.from_conn_data(
            addr=base_url,
            headers=headers
        )
        kg_otl = builder_engine.get_kg_info_na(str(graph_id))
        return kg_otl
    except (DIPServiceError, BuilderError) as e:
        logger.info('AF-AD-SDK 知识网络引擎获取图谱信息接口错误！')
        raise SDKRequestError(e)


def ad_builder_download_lexicon(synonym_id, appid="", token=""):
    if settings.AD_GATEWAY_URL:
        base_url = settings.AD_GATEWAY_URL
        headers = {"APPID": appid}
    else:
        base_url = settings.DIP_BUILDER_URL
        headers = {"Authorization": token}
    try:
        builder_engine = Builder.from_conn_data(
            addr=base_url,
            headers=headers
        )
        logger.info("download lexicon ad url {}".format(settings.AD_GATEWAY_URL))
        synonym_content = builder_engine.download_lexicon(str(synonym_id))
        return synonym_content
    except (DIPServiceError, BuilderError) as e:
        logger.info('AF-AD-SDK 知识网络引擎下载词库接口错误！')
        raise SDKRequestError(e)


async def v(url, body):
    opensearch_engine = OpenSearch(
        ips=[settings.AD_OPENSEARCH_HOST],
        ports=[int(settings.AD_OPENSEARCH_PORT)],
        user=settings.AD_OPENSEARCH_USER,
        password=settings.AD_OPENSEARCH_PASS
    )
    try:
        res = await opensearch_engine.execute(url=url, body=body)
        return res
    except  Exception as e:
        logger.info(f'AF-AD-SDK Opensearch 错误！,{opensearch_engine.pre_url}\n{url} no index or server error')
        raise OpenSearchRequestError(e)

async def ad_opensearch_with_kgid_connector_async(kg_id, appid="", token="", params=None, entity_classes=["*"]):
    if settings.AD_GATEWAY_URL:
        base_url = settings.AD_GATEWAY_URL
        headers = {"APPID": appid}
    else:
        base_url = settings.DIP_ENGINE_URL
        headers = {"Authorization": token}
    try:
        engine = CogEngine.from_conn_data(
            addr=base_url,
            headers=headers
        )
        res = await engine.a_opensearch_custom_search_by_kg_id(kg_id, params, entity_classes)
        return res
    except Exception as e:
        logger.info(f'AF-AD-SDK 知识网络引擎下载词库接口错, 图谱 ID: {kg_id}, 实体类型: {entity_classes}')
        raise OpenSearchRequestError(e)

def ad_opensearch_with_kgid_connector(kg_id, appid="", token="", params=None, entity_classes=["*"]):
    if settings.AD_GATEWAY_URL:
        base_url = settings.AD_GATEWAY_URL
        headers = {"APPID": appid}
    else:
        base_url = settings.DIP_ENGINE_URL
        headers = {"Authorization": token}
    try:
        engine = CogEngine.from_conn_data(
            addr=base_url,
            headers=headers
        )
        res = engine.opensearch_custom_search_by_kg_id(kg_id, params, entity_classes)
        return res
    except Exception as e:
        logger.info(f'AF-AD-SDK 知识网络引擎下载词库接口错误, 图谱 ID: {kg_id}, 实体类型: {entity_classes}')
        raise OpenSearchRequestError(e)



def ad_opensearch_connector(url, body):
    opensearch_engine = OpenSearch(
        ips=[settings.AD_OPENSEARCH_HOST],
        ports=[int(settings.AD_OPENSEARCH_PORT)],
        user=settings.AD_OPENSEARCH_USER,
        password=settings.AD_OPENSEARCH_PASS
    )
    try:
        res = opensearch_engine.naexecute(url=url, body=body)
        return res
    except  Exception as e:
        logger.info('AF-AD-SDK Opensearch 错误！',f'{opensearch_engine.pre_url}\n{url} no index or server error')
        raise OpenSearchRequestError(e)


class AD_CONNECT:

    def __init__(self):
        self.ad_graph_search = "/api/engine/v1/custom-search/kgs/{kg_id}"
        self.get_appid_url = "/api/rbac/v1/user/login/appId"
        self.run_agent_url = '/api/agent-factory/v2/agent/{agent_id}'

    def encrypt(self):
        password = f"{settings.AD_GATEWAY_PASSWORD}"
        pub_key = RSA.importKey(base64.b64decode(pub_key_ad))
        rsa = PKCS1_v1_5.new(pub_key)
        password = rsa.encrypt(password.encode("utf-8"))
        password_base64 = base64.b64encode(password).decode()
        return password_base64

    def get_appid(self):
        try:
            url = urljoin(settings.AD_GATEWAY_URL, self.get_appid_url)
            api = API(
                url=url,
                payload={
                    "username": settings.AD_GATEWAY_USER,
                    "password": self.encrypt(),
                    "isRefresh": 0,
                },
                method="POST"
            )
            res = api.call()
            return res["res"]
        except Exception as e:
            print(e)
            print(f"获取appid错误, 账号：{settings.AD_GATEWAY_USER}， 密码：{settings.AD_GATEWAY_PASSWORD}")

    def custom_search_graph_call(
            self,
            kg_id: str,
            appid: dict,
            params: str,
            timeout: int = 600
    ) -> dict:
        url = urljoin(
            settings.AD_GATEWAY_URL,
            self.ad_graph_search.format(kg_id=kg_id)
        )
        params_l = {'kg_id': str(kg_id), "statements": [params]}
        api = API(
            url=url,
            method=HTTPMethod.POST,
            headers={
                "appid": appid,
            },
            payload=params_l
        )
        try:
            res = api.call(timeout=timeout)
            return res
        except Exception as e:
            logger.info('AF-AD-SDK 认知引擎自定义图语言查询接口错误！')
            print(e)

    def run_agent(
        self,
        agent_id: str,
        query: str,
        debug_mode: bool = False,
        view_list: List[str] = None,
        indicator_list: List[str] = None,
        background: str = "",
        timeout: int = 600
    ):
        url = urljoin(settings.AD_GATEWAY_URL, self.run_agent_url.format(agent_id=agent_id))
        appid = self.get_appid()
        payload = {
            'query': query,
            "view_list": view_list if view_list else [],
            "indicator_list": indicator_list if indicator_list else [],
            "background": background,
            '_options': {
                'debug': debug_mode
            }
        }
        api = API(
            url=url,
            method=HTTPMethod.POST,
            headers={
                'appid': appid,
            },
            payload=payload
        )
        try:
            res = api.call(timeout=timeout, raw_content=True)
            res = res.decode()
            for chunk in res.split('\n'):
                chunk = chunk.strip()
                if chunk == 'event:data' or not chunk:
                    continue
                chunk = chunk.strip('data: ')
                # yield json.dumps(chunk, ensure_ascii=False)
                yield chunk
        except Exception as e:
            logger.info(f'调用 AD Agent 接口报错: {e}')