from data_retrieval.api.error import (
    Text2SQLError, VirEngineError, FrontendColumnError, AfDataSourceError, FrontendSampleError,
    IndicatorDescError, IndicatorDetailError, IndicatorQueryError
)
from data_retrieval.api.base import API, HTTPMethod
from typing import Any

import urllib3
import os

from data_retrieval.settings import get_settings

urllib3.disable_warnings()


settings = get_settings()

class Services(object):
    vir_engine_url: str = settings.VIR_ENGINE_URL
    data_view_url: str = settings.DATA_VIEW_URL

    def __init__(self, base_url: str = ""):
        if settings.AF_DEBUG_IP or base_url:
            ip = settings.AF_DEBUG_IP or base_url
            self.vir_engine_url: str = ip
            self.data_view_url: str = ip
            self.indicator_management_url: str = ip

        self._gen_api_url()

    def _gen_api_url(self):
        self.vir_engine_fetch_url = self.vir_engine_url + \
            "/api/virtual_engine_service/v1/fetch"
        self.vir_engine_preview_url = self.vir_engine_url + \
            "/api/virtual_engine_service/v1/preview/{catalog}/{schema}/{table}"
        self.view_fields_url = self.data_view_url + \
            "/api/data-view/v1/form-view/{view_id}"
        self.view_details_url = self.data_view_url + \
            "/api/data-view/v1/form-view/{view_id}/details"
        self.view_data_preview_url = self.data_view_url + \
            "/api/data-view/v1/form-view/data-preview"
        self.view_white_policy_sql = self.data_view_url + \
             "/api/data-view/v1/white-list-policy/{view_id}/where-sql"
        self.view_field_info = self.data_view_url + \
             "/api/data-view/v1/desensitization/{view_id}/filed-info"
        self.indicator_details_url = self.indicator_management_url + \
            "/api/indicator-management/v1/indicator/{indicator_id}"
        self.indicator_query_url = self.indicator_management_url + \
            "/api/indicator-management/v1/indicator/query"

    def get_indicator_description(self, indicator_id, headers: dict) -> dict:
        url = self.indicator_details_url.format(indicator_id=indicator_id)
        api = API(url=url, headers=headers)
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise IndicatorDescError(e) from e

    async def get_indicator_description_async(self, indicator_id, headers: dict) -> dict:
        url = self.indicator_details_url.format(indicator_id=indicator_id)
        api = API(url=url, headers=headers)
        try:
            res = await api.call_async()
            return res
        except AfDataSourceError as e:
            raise IndicatorDescError(e) from e

    def get_indicator_details(self, indicator_id: str, headers: dict) -> dict:
        url = self.indicator_details_url.format(indicator_id=indicator_id)
        api = API(url=url, headers=headers)
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise IndicatorDetailError(e) from e

    async def get_indicator_details_async(self, indicator_id: str, headers: dict) -> dict:
        url = self.indicator_details_url.format(indicator_id=indicator_id)
        api = API(url=url, headers=headers)
        try:
            res = await api.call_async()
            return res
        except AfDataSourceError as e:
            raise IndicatorDetailError(e) from e

    def get_indicator_query(self, indicator_id: str, headers: dict, data: dict) -> dict:
        url = self.indicator_query_url
        headers["Content-Type"] = "application/json"
        api = API(
            method=HTTPMethod.POST,
            url=url,
            headers=headers,
            params={"id": indicator_id},
            payload=data
        )
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise IndicatorQueryError(e) from e

    async def get_indicator_query_async(self, indicator_id: str, headers: dict, data: dict) -> dict:
        url = self.indicator_query_url
        headers["Content-Type"] = "application/json"
        api = API(
            method=HTTPMethod.POST,
            url=url,
            headers=headers,
            params={"id": indicator_id},
            payload=data
        )

        try:
            res = await api.call_async()
            return res
        except AfDataSourceError as e:
            raise IndicatorQueryError(e) from e

    def exec_vir_engine_by_sql(self, user: str, user_id: str, sql: str, headers: dict = {}) -> Any | None:
        """Execute virtual engine by SQL query

        Args:
            user (str): username
            sql (str): SQL
            user_id (str): user id
        Returns:
            dict: VIR engine
        """
        # https://10.4.109.234/api/virtual_engine_service/v1/fetch
        # user_id=''
        url = self.vir_engine_fetch_url

        if not headers:
            headers = {
                "X-Presto-User": user,
                'Content-Type': 'text/plain'
            }
        api = API(
            url=url,
            headers=headers,
            method=HTTPMethod.POST,
            data=sql.encode(),
            params={"user_id": user_id}
        )

        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise VirEngineError(e) from e

    async def exec_vir_engine_by_sql_async(self, user: str, user_id: str, sql: str, headers: dict = {}) -> Any | None:
        """异步: Execute virtual engine by SQL query"""
        url = self.vir_engine_fetch_url
        if not headers:
            headers = {
                "X-Presto-User": user,
                'Content-Type': 'text/plain'
            }
        api = API(
            url=url,
            headers=headers,
            method=HTTPMethod.POST,
            data=sql.encode(),
            params={"user_id": user_id}
        )
        try:
            res = await api.call_async()
            return res
        except AfDataSourceError as e:
            raise VirEngineError(e) from e

    def get_view_sample_by_source(self, source: dict, headers: dict) -> dict:
        url = self.vir_engine_preview_url.format(
            catalog=source["source"],
            schema=source["schema"],
            table=source["title"],
        )
        headers["X-Presto-User"] = "af"
        api = API(
            url=url,
            headers=headers,
            payload={
                "limit": 1,
                "type": 0
            }
        )
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise VirEngineError(e) from e

    async def get_view_sample_by_source_async(self, source: dict, headers: dict) -> dict:
        url = self.vir_engine_preview_url.format(
            catalog=source["source"],
            schema=source["schema"],
            table=source["title"],
        )
        headers["X-Presto-User"] = "af"
        api = API(
            url=url,
            headers=headers,
            payload={
                "limit": 1,
                "type": 0
            }
        )
        try:
            res = await api.call_async()
            return res
        except AfDataSourceError as e:
            raise VirEngineError(e) from e
        
    def get_view_data_preview(self, view_id: str, headers: dict, fields: list[str]) -> dict:
        url = self.view_data_preview_url
        api = API(
            method=HTTPMethod.POST,
            url=url,
            headers=headers,
            payload={
                "filters": [],
                "fields": fields,
                "limit": 1,
                "form_view_id": view_id,
                "offset": 1,
            }
        )
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise FrontendSampleError(e) from e

    async def get_view_data_preview_async(self, view_id: str, headers: dict, fields: list[str]) -> dict:
        url = self.view_data_preview_url
        api = API(
            method=HTTPMethod.POST,
            url=url,
            headers=headers,
            payload={
                "filters": [],
                "fields": fields,
                "limit": 1,
                "form_view_id": view_id,
                "offset": 1,
            }
        )
        try:
            res = await api.call_async()
            return res
        except AfDataSourceError as e:
            raise FrontendSampleError(e) from e

    def get_view_column_by_id(self, view_id, headers: dict) -> dict:
        """Get columns for a view by id"""
        url = self.view_fields_url.format(view_id=view_id)
        api = API(
            url=url,
            headers=headers,
        )
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise FrontendColumnError(e) from e

    async def get_view_column_by_id_async(self, view_id, headers: dict) -> dict:
        """异步: Get columns for a view by id"""
        url = self.view_fields_url.format(view_id=view_id)
        api = API(
            url=url,
            headers=headers,
        )
        try:
            res = await api.call_async()
            return res
        except AfDataSourceError as e:
            raise FrontendColumnError(e) from e

    def get_view_details_by_id(self, view_id, headers: dict) -> dict:
        url = self.view_details_url.format(view_id=view_id)
        api = API(
            url=url,
            headers=headers,
        )
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise FrontendSampleError(e) from e

    async def get_view_details_by_id_async(self, view_id, headers: dict) -> dict:
        url = self.view_details_url.format(view_id=view_id)
        api = API(
            url=url,
            headers=headers,
        )
        try:
            res = await api.call_async()
            return res
        except AfDataSourceError as e:
            raise FrontendSampleError(e) from e

    # 获取白名单策略筛选sql
    def get_view_white_policy_sql(self, view_id, headers: dict) -> dict:
        url = self.view_white_policy_sql.format(view_id=view_id)
        api = API(
            url=url,
            headers=headers,
        )
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise FrontendSampleError(e) from e

    # 获取脱敏、数据分级字段
    def get_view_field_info(self, view_id, headers: dict) -> dict:
        url = self.view_field_info.format(view_id=view_id)
        api = API(
            url=url,
            headers=headers,
        )
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise FrontendSampleError(e) from e


if __name__ == '__main__':
    def main():
        from auth import get_authorization
        token = get_authorization("https://10.4.109.234", "liberly", "111111")
        service = Services()
        res = service.exec_vir_engine_by_sql(
            user="admin",
            sql="SELECT DISTINCT area_1_region FROM vdm_maria_et0hnz6q.default.t_sales_0821 LIMIT 100",
            user_id="bc1e5d48-cfbf-11ee-ac16-f26894970da0"

        )
        print(res)

    main()
