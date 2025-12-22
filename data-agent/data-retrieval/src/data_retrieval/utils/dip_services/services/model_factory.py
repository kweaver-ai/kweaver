# -*- coding: utf-8 -*-
# calling builder service
#
# @Time: 2023/12/25
# @Author: Xavier.chen
# @File: error.py
from urllib.parse import urljoin
from data_retrieval.utils.dip_services.base import Service, API, VER_3_0_0_1, ServiceType, ConnectionData
from data_retrieval.utils.dip_services.sdk_error import ModelFactoryError, DIPServiceError, handle_sdk_error, handle_sdk_error_async
from traceback import print_exc
from data_retrieval.utils.dip_services.base import HTTPMethod
from functools import wraps

from data_retrieval.settings import get_settings

settings = get_settings()


def handle_model_factory_error(error_message):
    def decorator(func):
        @wraps(func)
        async def async_wrapper(self, *args, **kwargs):
            try:
                return await func(self, *args, **kwargs)
            except Exception as e:
                raise ModelFactoryError(e, error_message)
        
        @wraps(func)
        def sync_wrapper(self, *args, **kwargs):
            try:
                return func(self, *args, **kwargs)
            except Exception as e:
                raise ModelFactoryError(e, error_message)
        
        return async_wrapper if func.__name__.startswith('async_') else sync_wrapper
    return decorator



class ModelFactory(Service):
    m_factory_url: str = "/api/model-factory/v1"
    alive_url: str = ""

    # get_service_id
    get_service_id_url: str = "/get-id"

    # prompt_llm
    llm_model_url: str = "/prompt-llm-source"

    # prompt_item
    prompt_item_url: str = "/prompt-item-source"
    prompt_item_add_url: str = "/prompt-item/add"
    prompt_item_edit_url: str = "/prompt-item/edit"

    # prompt_item_type
    prompt_item_type_add_url: str = "/prompt-item-type/add"
    prompt_item_type_url: str = "/prompt-item-type-source"
    prompt_item_type_edit_url: str = "/prompt-item-type/edit"

    # prompt-source
    prompt_url: str = "/prompt-source"
    prompt_add_url: str = "/prompt-source/add"
    prompt_detail_url: str = "/prompt-source/{prompt_id}"
    prompt_edit_url: str = "/prompt-source/edit"
    
    def __init__(self, addr="", headers={}, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self._set_model_factory_url()
        self._setup_connection(addr, headers)
        self._gen_api_url()

    def _set_model_factory_url(self):
        """根据服务类型设置 model factory URL"""
        url_mapping = {
            ServiceType.AD.value: "/api/model-factory/v1",
            ServiceType.OUTTER_DIP.value: "/api/kn-model-factory/v1",
            ServiceType.DIP.value: "/api/kn-model-factory/v1"
        }
        self.m_factory_url = url_mapping.get(self.type, "/api/kn-model-factory/v1")

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
                addr = settings.DIP_MODEL_API_URL
        
        self.conn = ConnectionData(addr=addr, headers=headers)

    def _gen_api_url(self):
        self.m_factory_url = urljoin(self.conn.addr, self.m_factory_url)
        self.alive_url = self.m_factory_url + self.get_service_id_url

        self.get_service_id_url = self.m_factory_url + self.get_service_id_url

        self.llm_model_url = self.m_factory_url + self.llm_model_url

        self.prompt_item_url = self.m_factory_url + self.prompt_item_url
        self.prompt_item_add_url = self.m_factory_url + self.prompt_item_add_url
        self.prompt_item_edit_url = self.m_factory_url + self.prompt_item_edit_url

        self.prompt_item_type_add_url = self.m_factory_url + self.prompt_item_type_add_url
        self.prompt_item_type_url = self.m_factory_url + self.prompt_item_type_url
        self.prompt_item_type_edit_url = self.m_factory_url + self.prompt_item_type_edit_url

        self.prompt_url = self.m_factory_url + self.prompt_url
        self.prompt_add_url = self.m_factory_url + self.prompt_add_url
        self.prompt_detail_url = self.m_factory_url + self.prompt_detail_url
        self.prompt_edit_url = self.m_factory_url + self.prompt_edit_url
    
    def test_connet(self) -> bool:
        api = API(url=self.alive_url, timeout=5, headers=self.conn.headers)
        try:
            api.call()
            return True
        except DIPServiceError:
            return False
    
    def _get_service_id_api(self):
        api = API(url=self.get_service_id_url, timeout=5, headers=self.conn.headers)
        return api
    
    @handle_sdk_error("get service id failed", ModelFactoryError)
    def get_service_id(self):
        api = self._get_service_id_api()
        return api.call()

    @handle_sdk_error_async("get service id failed", ModelFactoryError)
    async def async_get_service_id(self):
        api = self._get_service_id_api()
        return await api.call()
    
    
    # query prompt item by name
    def _query_prompt_item_api(self, prompt_name: str):
        api = API(url=self.prompt_item_url, timeout=5, headers=self.conn.headers, params={"prompt_name": prompt_name})
        return api

    @handle_sdk_error("query prompt item by name failed", ModelFactoryError)
    def query_prompt_item_by_name(self, prompt_item_name: str):
        api = self._query_prompt_item_api(prompt_item_name)
        return api.call()

    @handle_sdk_error_async("query prompt item by name failed", ModelFactoryError)
    async def async_query_prompt_item_by_name(self, prompt_item_name: str):
        api = self._query_prompt_item_api(prompt_item_name)
        return await api.call()

    # query prompt by name
    def _query_prompt_by_name_api(self, prompt_name: str):
        api = API(url=self.prompt_url, timeout=5, headers=self.conn.headers, params={"prompt_name": prompt_name})
        return api
    
    @handle_sdk_error("query prompt by name failed", ModelFactoryError)
    def query_prompt_by_name(self, prompt_name: str):
        api = self._query_prompt_by_name_api(prompt_name)
        return api.call()
    
    @handle_sdk_error_async("query prompt by name failed", ModelFactoryError)
    async def async_query_prompt_by_name(self, prompt_name: str):
        api = self._query_prompt_by_name_api(prompt_name)
        return await api.call()

    # add prompt item
    def _add_prompt_item_api(self, prompt_item_name: str):
        payload={
            "prompt_item_name": prompt_item_name
        }

        api = API(
            url=self.prompt_item_add_url,
            timeout=5,
            headers=self.conn.headers,
            method=HTTPMethod.POST,
            payload=payload
        )
        return api
    
    def add_prompt_item(self, prompt_item_name: str):
        try:
            api = self._add_prompt_item_api(prompt_item_name)
            return api.call()
        except Exception as e:
            raise ModelFactoryError(
                reason=f"add prompt item failed: {e}",
                url=self.prompt_item_add_url,
                detail=e
            )
    
    @handle_sdk_error_async("add prompt item failed", ModelFactoryError)
    async def async_add_prompt_item(self, prompt_item_name: str):
        api = self._add_prompt_item_api(prompt_item_name)
        return await api.call()
    
    # add prompt item type
    def _add_prompt_item_type_api(self, prompt_item_id: str, prompt_item_type_name: str):
        payload={
            "prompt_item_id": prompt_item_id,
            "prompt_item_type_name": prompt_item_type_name
        }

        api = API(
            url=self.prompt_item_type_add_url,
            timeout=5,
            headers=self.conn.headers,
            method=HTTPMethod.POST,
            payload=payload
        )
        return api

    def add_prompt_item_type(self, prompt_item_id: str, prompt_item_type_name: str):
        api = self._add_prompt_item_type_api(prompt_item_id, prompt_item_type_name)
        return api.call()
    
    @handle_sdk_error_async("add prompt item type failed", ModelFactoryError)
    async def async_add_prompt_item_type(self, prompt_item_id: str, prompt_item_type_name: str):
        api = self._add_prompt_item_type_api(prompt_item_id, prompt_item_type_name)
        return await api.call()

    # get llm model
    def _get_llms_api(self, page: int=1, size: int=1):
        api = API(
            url=self.llm_model_url, 
            timeout=5, 
            headers=self.conn.headers, 
            params={"page": page, "size": size}
        )
        return api

    @handle_sdk_error("get llm model failed", ModelFactoryError)
    def get_llms(self, page: int=1, size: int=1):
        api = self._get_llms_api(page, size)
        return api.call()

    @handle_sdk_error_async("get llm model failed", ModelFactoryError)
    async def async_get_llms(self, page: int=1, size: int=1):
        api = self._get_llms_api(page, size)
        return await api.call()

    # add prompt
    def _add_prompt_api(self, prompt_params: dict):
        resp = self.get_service_id()
        service_id = resp["res"]

        payload = prompt_params
        payload["prompt_service_id"] = service_id

        required_params = [
            "icon",
            "messages", 
            "prompt_item_id", 
            "prompt_item_type_id",
            "prompt_name",
            "prompt_service_id",
            "prompt_type"
        ]

        for param in required_params:
            if param not in payload:
                raise DIPServiceError(
                    reason=f"param {param} is required",
                    url=self.prompt_add_url
                )

        api = API(
            url=self.prompt_add_url,
            timeout=5,
            headers=self.conn.headers,
            method=HTTPMethod.POST,
            payload=payload
        )
        return api
    
    @handle_sdk_error("add prompt failed", ModelFactoryError)   
    def add_prompt(self, prompt_params: dict):
        api = self._add_prompt_api(prompt_params)
        return api.call()    
    
    @handle_sdk_error_async("add prompt failed", ModelFactoryError)
    async def async_add_prompt(self, prompt_params: dict):
        api = self._add_prompt_api(prompt_params)
        return await api.call()


if __name__ == "__main__":
    import asyncio
    import json
    # connData = ConnectionData(
    #     addr="https://124.70.219.13:8444/",
    #     access_key="NPPbNqNKbiNasSuCO2t"
    # )

    # builder_service = Builder(conn=connData)
    # builder_service = Builder.from_conn_data(
    #     addr=connData.addr,
    #     acc_key=connData.access_key
    # )

    # 通过环境变量读取
    model_factory_service = ModelFactory()

    async def main():
        try:
            res = model_factory_service.test_connet()
            print(res)

        except DIPServiceError as e:
            print(e.json())

    asyncio.run(main())