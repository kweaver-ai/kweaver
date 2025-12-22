from data_retrieval.api.error import (
    VirEngineError, FrontendColumnError, AfDataSourceError, FrontendSampleError,
    IndicatorDescError, IndicatorDetailError, IndicatorQueryError
)
from data_retrieval.api.base import API, HTTPMethod
import traceback
from typing import Any

import urllib3
import os

from data_retrieval.settings import get_settings

urllib3.disable_warnings()


CREATE_SCHEMA_TEMPLATE = """CREATE TABLE {source}.{schema}.{title}
(
{middle}
);
"""

RESP_TEMPLATE = """根据<strong>"{table}"</strong><i slice_idx=0>{index}</i>，检索到如下数据："""

settings = get_settings()

class VegaServices(object):
    vir_engine_url: str = settings.VIR_ENGINE_URL

    def __init__(self, base_url: str = ""):

        internal_vega = True
        if settings.OUTTER_VEGA_URL or base_url:
            ip = settings.OUTTER_VEGA_URL or base_url
            self.vir_engine_url: str = ip
            internal_vega = False

        self._gen_api_url(internal_vega)

    def _gen_api_url(self, internal: bool = True):
        if internal:
            self.vir_engine_fetch_url = self.vir_engine_url + \
                "/api/internal/virtual_engine_service/v1/fetch"
            self.vir_engine_preview_url = self.vir_engine_url + \
                "/api/internal/virtual_engine_service/v1/preview/{catalog}/{schema}/{table}"
        else:
            self.vir_engine_fetch_url = self.vir_engine_url + \
                "/api/virtual_engine_service/v1/fetch"
            self.vir_engine_preview_url = self.vir_engine_url + \
                "/api/virtual_engine_service/v1/preview/{catalog}/{schema}/{table}"

    def exec_vir_engine_by_sql(self, user: str, user_id: str, sql: str, account_type: str = "user", headers: dict = {}) -> Any | None:
        """Execute virtual engine by SQL query

        Args:
            user (str): username
            sql (str): SQL
            user_id (str): user id
        Returns:
            dict: VIR engine
        """
        url = self.vir_engine_fetch_url
        default_headers = {
            "X-Presto-User": user,
            'Content-Type': 'text/plain',
            "x-user": user_id,
            "x-account-id": user_id,
            "x-account-type": account_type
        }
        if headers:
            headers.update(default_headers)
        else:
            headers = default_headers
        api = API(
            url=url,
            headers=headers,
            method=HTTPMethod.POST,
            data=sql.encode()
        )
        try:
            res = api.call()
            return res
        except AfDataSourceError as e:
            raise VirEngineError(e) from e

    async def exec_vir_engine_by_sql_async(self, user: str, user_id: str, sql: str, account_type: str = "user", headers: dict = {}) -> Any | None:
        """异步: Execute virtual engine by SQL query"""
        url = self.vir_engine_fetch_url
        default_headers = {
            "X-Presto-User": user,
            'Content-Type': 'text/plain',
            "x-user": user_id,
            "x-account-id": user_id,
            "x-account-type": account_type
        }
        if headers:
            headers.update(default_headers)
        else:
            headers = default_headers
        api = API(
            url=url,
            headers=headers,
            method=HTTPMethod.POST,
            data=sql.encode()
        )
        try:
            res = await api.call_async()
            return res
        except AfDataSourceError as e:
            traceback.print_exc()
            raise VirEngineError(e) from e

    def get_view_sample_by_source(self, source: dict, account_type: str = "user", headers: dict = {}) -> dict:
        """Get a sample row from a view source"""
        url = self.vir_engine_preview_url.format(
            catalog=source["source"],
            schema=source["schema"],
            table=source["title"],
        )
        headers["X-Presto-User"] = "admin"
        headers["x-account-type"] = account_type
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

    async def get_view_sample_by_source_async(self, source: dict, account_type: str = "user", headers: dict = {}) -> dict:
        """异步: Get a sample row from a view source"""
        url = self.vir_engine_preview_url.format(
            catalog=source["source"],
            schema=source["schema"],
            table=source["title"],
        )
        headers["X-Presto-User"] = "admin"
        headers["x-account-type"] = account_type
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


if __name__ == '__main__':
    def main():
        from auth import get_authorization
        token = get_authorization("https://10.4.109.234", "liberly", "111111")
        service = VegaServices()
        res = service.exec_vir_engine_by_sql(
            user="admin",
            sql="SELECT DISTINCT area_1_region FROM vdm_maria_et0hnz6q.default.t_sales_0821 LIMIT 100",
            user_id="bc1e5d48-cfbf-11ee-ac16-f26894970da0"

        )
        print(res)

    main()
