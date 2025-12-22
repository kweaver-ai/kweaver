from data_retrieval.api.error import (
    AfDataSourceError, DataModelDetailError, DataModelQueryError
)
from data_retrieval.api.base import API, HTTPMethod
from typing import Any

import urllib3
import os
import traceback

from data_retrieval.settings import get_settings

urllib3.disable_warnings()

settings = get_settings()


class DataModelService:
    """数据模型服务类，用于获取指标/视图详情和查询指标数据"""
    
    def __init__(self, base_url: str = "", headers: dict = {}):
        self.data_model_url: str = settings.DIP_DATA_MODEL_URL
        self.model_query_url: str = settings.DIP_MODEL_QUERY_URL
        self.outer_dip: bool = False
        
        if base_url:
            self.data_model_url: str = base_url
            self.model_query_url: str = base_url
            self.outer_dip = True

        self.headers: dict = headers
            
        self._gen_api_url()
    
    def _gen_api_url(self):
        """生成API URL"""
        if self.outer_dip:
            # 指标
            self.metric_models_detail_url = self.data_model_url + \
                "/api/mdl-data-model/v1/metric-models/{ids}"
            self.metric_models_query_url = self.model_query_url + \
                "/api/mdl-uniquery/v1/metric-models/{ids}"
            # 视图
            self.data_view_models_detail_url = self.data_model_url + \
                "/api/mdl-data-model/v1/data-views/{ids}"
            self.data_view_models_query_url = self.model_query_url + \
                "/api/mdl-uniquery/v1/data-views/{ids}"
            # 知识条目
            self.knowledge_items_detail_url = self.data_model_url + \
                "/api/mdl-data-model/v1/data-dicts/{ids}"
        else:
            # 指标
            self.metric_models_detail_url = self.data_model_url + \
                "/api/mdl-data-model/in/v1/metric-models/{ids}"
            self.metric_models_query_url = self.model_query_url + \
                "/api/mdl-uniquery/in/v1/metric-models/{ids}"
            # 视图
            self.data_view_models_detail_url = self.data_model_url + \
                "/api/mdl-data-model/in/v1/data-views/{ids}"
            self.data_view_models_query_url = self.model_query_url + \
                "/api/mdl-uniquery/in/v1/data-views/{ids}"
            # 知识条目
            self.knowledge_items_detail_url = self.data_model_url + \
                "/api/mdl-data-model/in/v1/data-dicts/{ids}"

    def get_metric_models_detail(self, ids: str|list[str], headers: dict = {}) -> dict:
        """获取指标详情
        
        Args:
            ids (str): 指标ID，多个ID用逗号分隔
            headers (dict): 请求头
            
        Returns:
            dict: 指标详情数据
        """
        ids_str = ",".join(ids) if isinstance(ids, list) else ids
        url = self.metric_models_detail_url.format(ids=ids_str)

        headers.update(self.headers)

        # new http://192.168.167.13/api/mdl-data-model/v1/metric-models/liby_sales_std
        # old 'http://192.168.167.13/api/data-model/v1/metric-models/liby_sales_std'
        api = API(url=url, headers=headers, method=HTTPMethod.GET)
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise DataModelDetailError(e) from e
    
    async def get_metric_models_detail_async(self, ids: str, headers: dict = {}) -> dict:
        """异步获取指标详情
        
        Args:
            ids (str): 指标ID，多个ID用逗号分隔
            headers (dict): 请求头
            
        Returns:
            dict: 指标详情数据
        """
        url = self.metric_models_detail_url.format(ids=ids)

        headers.update(self.headers)

        api = API(url=url, headers=headers)
        try:
            res = await api.call_async()
            return res
        except AfDataSourceError as e:
            raise DataModelDetailError(e) from e
    
    def query_metric_models_data(self, ids: str, headers: dict = {}, params: dict = {}) -> dict:
        """查询指标数据
        
        Args:
            ids (str): 指标ID，多个ID用逗号分隔
            headers (dict): 请求头
            data (dict): 查询参数
            
        Returns:
            dict: 指标数据
        """
        url = self.metric_models_query_url.format(ids=ids)
        headers["X-HTTP-Method-Override"] = "GET"

        headers.update(self.headers)

        api = API(
            method=HTTPMethod.POST,
            url=url,
            headers=headers,
            payload=params
        )
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise DataModelQueryError(e) from e
    
    async def query_metric_models_data_async(self, ids: str, headers: dict = {}, params: dict = {}) -> dict:
        """异步查询指标数据
        
        Args:
            ids (str): 指标ID，多个ID用逗号分隔
            headers (dict): 请求头
            data (dict): 查询参数
            
        Returns:
            dict: 指标数据
        """
        url = self.metric_models_query_url.format(ids=ids)

        headers.update(self.headers)
        headers["x-http-method-override"] = "GET"

        api = API(
            method=HTTPMethod.POST,
            url=url,
            headers=self.headers,
            payload=params
        )
        try:
            res = await api.call_async()
            return res
        except AfDataSourceError as e:
            raise DataModelQueryError(e) from e

    def get_view_data_preview(self, view_id: str, headers: dict = {}, fields: list[str] = [], limit: int = 1, offset: int = 0) -> dict:
        url = self.data_view_models_query_url.format(ids=view_id)

        headers.update(self.headers)
        headers["x-http-method-override"] = "GET"

        payload = {
            "limit": limit,
            "offset": offset
        }

        if fields:
            payload["fields"] = fields

        api = API(
            method=HTTPMethod.POST,
            url=url,
            headers=headers,
            payload=payload
        )
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise DataModelQueryError(e) from e

    async def get_view_data_preview_async(self, view_id: str, headers: dict = {}, fields: list[str] = [], limit: int = 1, offset: int = 0) -> dict:
        url = self.data_view_models_query_url.format(ids=view_id)

        headers.update(self.headers)
        headers["x-http-method-override"] = "GET"

        payload = {
            "limit": limit,
            "offset": offset
        }

        if fields:
            payload["fields"] = fields

        api = API(
            method=HTTPMethod.POST,
            url=url,
            headers=headers,
            payload=payload
        )
        try:
            res = await api.call_async()
            return res
        except AfDataSourceError as e:
            raise DataModelDetailError(e) from e

    def get_view_details_by_id(self, view_id, headers: dict = {}) -> dict:
        url = self.data_view_models_detail_url.format(ids=view_id)
        headers.update(self.headers)

        api = API(
            url=url,
            headers=headers,
        )
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise DataModelDetailError(e) from e

    async def get_view_details_by_id_async(self, view_id, headers: dict = {}) -> dict:
        url = self.data_view_models_detail_url.format(ids=view_id)
        headers.update(self.headers)

        api = API(
            url=url,
            headers=headers,
        )
        try:
            res = await api.call_async()
            return res
        except AfDataSourceError as e:
            traceback.print_exc()
            raise DataModelDetailError(e) from e
        except Exception as e:
            traceback.print_exc()
            raise e

    
    def get_knowledge_items_by_ids(self, ids: list[str], headers: dict = {}) -> dict:
        url = self.knowledge_items_detail_url.format(ids=ids)
        headers.update(self.headers)
        
        api = API(
            url=url,
            headers=headers,
        )
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise DataModelDetailError(e) from e
        
    async def get_knowledge_items_by_ids_async(self, ids: list[str], headers: dict = {}) -> dict:
        url = self.knowledge_items_detail_url.format(ids=ids)
        headers.update(self.headers)
        
        api = API(
            url=url,
            headers=headers,
        )
        try:
            res = await api.call_async()
            return res
        except AfDataSourceError as e:
            raise DataModelDetailError(e) from e


if __name__ == '__main__':
    def main():
        from auth import get_authorization
        # 示例用法
        service = DataModelService()
        # 这里需要根据实际情况获取认证信息
        # token = get_authorization("https://localhost:13020", "user", "password")
        # headers = {"Authorization": f"Bearer {token}"}
        # res = service.get_metric_models_detail("metric_id_1,metric_id_2", headers)
        # print(res)
    
    main()
