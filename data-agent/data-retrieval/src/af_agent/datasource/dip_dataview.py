# -*- coding: utf-8 -*-
# @Author:  Lareina.guo@aishu.cn
# @Date: 2024-6-7
from typing import Any, List, Optional, Union
import re
import asyncio
import traceback

from af_agent.api.af_api import Services
from af_agent.api.vega import VegaServices
from af_agent.api.error import AfDataSourceError, VirEngineError, FrontendColumnError, FrontendSampleError
from af_agent.datasource.db_base import DataSource
from af_agent.logs.logger import logger
from af_agent.parsers.text2sql_parser import RuleBaseSource
from af_agent.datasource.dimension_reduce import DimensionReduce
from af_agent.api import VegaType
from af_agent.api.vega import VegaServices
from af_agent.api.af_api import Services
from pydantic import PrivateAttr
from typing import Dict, List
from af_agent.utils.dip_services import Builder
from af_agent.utils.dip_services.base import ServiceType
from af_agent.api.data_model import DataModelService
from af_agent.api.agent_retrieval import AgentRetrievalService

from copy import deepcopy
from af_agent.utils._common import run_blocking

CREATE_SCHEMA_TEMPLATE = """CREATE TABLE {source}.{schema}.{title}
(
{middle}
);
"""

RESP_TEMPLATE = """根据<strong>"{table}"</strong><i slice_idx=0>{index}</i>，检索到如下数据："""


async def get_datasource_from_kg_params(kg_params: Union[Dict, List], addr="", headers={}, dip_type=ServiceType.DIP.value):
    """
    解析 KG 参数
    """
    # example:
    # {
    #     "kg": [
    #         {
    #             "kg_id": "129",
    #             "fields": [
    #                 "regions",
    #                 "comments"
    #             ],
    #             "output_fields": [
    #                 "comments"
    #             ],
    #             "field_properties": {
    #                 "regions": [
    #                     "@vid",
    #                     "regions"
    #                 ],
    #                 "comments": [
    #                     "@vid",
    #                     "CONTENT",
    #                     "VOTES",
    #                     "COMMENT_TIME"
    #                 ]
    #             }
    #         }
    #     ]
    # }
    if isinstance(kg_params, Dict):
        kg_params = kg_params.get("kg", [])
    
    builder_service = Builder(addr=addr, headers=headers, type=dip_type)
    
    for kg in kg_params:
        kg_id = kg.get("kg_id", "")

        # 用户选中的实体，用于过滤数据源
        fields = kg.get("fields", [])

        kg_info = await builder_service.get_kg_info(kg_id)

        KMap = kg_info.get("res", {}).get("graph_KMap", {})
        datasources_in_kmap = KMap.get("files", [])
        entities_in_kmap = KMap.get("entity", [])

        res = []
        for ds in datasources_in_kmap:
            # 数据样例参考
            # '{
            #     'ds_id': 5,
            #     'data_source': 'DataPlatform',
            #     'ds_path': None,
            #     'extract_type': 'standardExtraction',
            #     'extract_rules': [{
            #             'entity_type': '订单商品信息宽表主键FINAL_SUB_ORDER_IDITEM_IDBA_CODESTAFF_ID_2',
            #             'property': [{
            #                     'column_name': 'aftersale_apply_time',
            #                     'property_field': 'aftersale_apply_time'
            #                 }
            #             ]
            #         }
            #     ],
            #     'files': [{
            #             'file_name': '订单商品信息宽表(主键:FINAL_SUB_ORDER_ID+ITEM_ID+BA_CODE+STAFF_ID+IS_POS)',
            #             'file_path': '',
            #             'file_source': '4d94ab8c-e545-444e-9143-94636d11a240',
            #             'start_time': None,
            #             'end_time': None
            #         }
            #     ],
            #     'ds_name': 'DataPlatform'
            # }
            if ds.get("data_source") != "DataPlatform":
                logger.warning(f"不应该出现这种情况: {ds.get('data_source')}")
                continue

            # 过滤不在列表中的实体
            # 例子:
            # {
            #     "entity":  [{
            #         'name': 'DWS_ORDER_ITEM_STAFF_ORDER_BY_DAY',
            #         'entity_type': '订单商品信息宽表主键FINAL_SUB_ORDER_IDITEM_IDBA_CODESTAFF_ID_2',
            #         ...
            #     }]
            # }

            # 规则比较负责
            # 1. 用户的选择在 Fields 中， Fields 是 Entity Name
            # 2. KMap 知识映射中，Entity 保存了 Entity Type 和 Entity Name
            #    而 Files 中保存了 Entity Type 和 数据源的对应关系
            # 3. 所以需要先根据 Entity Type 在 KMap 中找到对应的 Entity Name，
            #    然后根据 Entity Name 在 Fields 中找到对应的 Entity Type，
            #    如果 Entity Name 在 Fields 中，则认为该数据源是选中的，否则过滤掉
            selected_ds = False
            entity_types = [rule.get("entity_type", "") for rule in ds.get("extract_rules", [])]
            for entity in entities_in_kmap:
                if entity.get("name") in fields and entity.get("entity_type") in entity_types:
                    selected_ds = True
                    break

            if not selected_ds:
                continue

            source = ds.get("files", [])
            for s in source:
                view_name = s.get("file_name", "")
                view_id = s.get("file_source", "")
            

                res.append({
                    "name": view_name,
                    "id": view_id
                })
    
    return res


def get_view_en2type(resp_column):
    en2type = {}
    column_name = []
    for field in resp_column["fields"]:
        en2type[field["original_name"]] = field["type"]
        column_name.append(f'"{field["original_name"]}"')

    table = resp_column.get("meta_table_name", "")

    if not table:
        if resp_column.get("type") == "custom":
            logger.warning(f"custom view, use name as table: {resp_column['name']}")
        # else:
        #     logger.warning(f"unknown view type: {resp_column.get('type')}")
        # table = f"custom_view_source.\"default\".\"{resp_column['view_id']}\""
        raise AfDataSourceError(
            detail=f"View Name: {resp_column['name']}, View ID: {resp_column['id']}, Reason: Can't be used as a table, maybe it's a custom view",
            reason=f"View {resp_column['name']} can't be used as a table"
        )

    zh_table = resp_column["name"]
    return en2type, column_name, table, zh_table


def view_source_reshape(asset: dict) -> dict:
    data_source = {
        "index": asset["index"],
        "title": asset["title"],
        "schema": asset["schema"],
        "source": asset["view_source_catalog"],
    }
    return data_source


def get_view_schema_of_table(source: dict, column: dict, zh_table, comment) -> dict:
    res = {}
    en2cn: dict = {}
    middle: str = ""
    for entry in column["fields"]:
        en2cn[entry["original_name"]] = entry["display_name"]
        middle += "{column_en} {column_type} comment '{column_cn}'\n"
        middle = middle.format(
            column_en=entry["original_name"],
            column_cn=entry["display_name"],
            column_type=entry["type"],
        )
    schema = CREATE_SCHEMA_TEMPLATE.format(
        title=source["title"],
        schema=source["schema"],
        source=source["source"],
        middle=middle[: -2]
    )
    table = "{source}.{schema}.{title}".format(
        title=source["title"],
        schema=source["schema"],
        source=source["source"]
    )

    res["id"] = source["index"]
    res["name"] = zh_table
    res["en_name"] = source["title"]
    res["comment"] = comment
    res["ddl"] = schema
    res["en2cn"] = en2cn
    res["path"] = table
    return res


def _query_generator(cur, query: str, as_dict):
    res = cur.execute(query)
    headers = [desc[0] for desc in res.description]

    def result_gen():
        for row in res:
            if as_dict:
                yield dict(zip(headers, row))
            yield row

    return headers, result_gen()


def _query(cur, query: str, as_dict):
    res = cur.execute(query)
    headers = [desc[0] for desc in res.description]

    data = res.fetchall()
    if as_dict:
        return headers, [dict(zip(headers, row)) for row in data]

    return headers, data


class DataView(DataSource):
    """Vega data source
    Connect vega database with read-only mode
    """
    view_list: list = []
    views_in_concept: list = []
    user_id: str = ""
    user: str = "admin"
    token: str = ""
    headers: Any = {}
    account_type: str = "user"
    # vega_type: str = VegaType.DIP.value
    base_url: str = ""
    model_data_view_fields: dict = None  # 主题模型、专题模型字段，筛选专用
    special_data_view_fields: dict = None  # 指定字段必须保留
    service: Union[DataModelService, Services] = None
    dimension_reduce: Optional[DimensionReduce] = None

    _view_details_cache: dict[str, Any] = {}
    _sample_cache: dict[str, Any] = {}

    class Config:
        arbitrary_types_allowed = True


    def __init__(
        self,
        **kwargs
    ):
        super().__init__(**kwargs)

        # self.token = get_authorization(self.af_ip, self.user, self.password)
        if self.token:
            if not self.token.startswith("Bearer "):
                self.token = f"Bearer {self.token}"
            self.headers = {"Authorization": self.token}
        else:
            self.headers = {
                "x-user": self.user_id,
                "x-account-id": self.user_id,
                "x-account-type": self.account_type,
            }

        self.view_list = self.view_list
        self.views_in_concept = self.views_in_concept

        self.service = DataModelService(base_url=self.base_url)
        
        self.dimension_reduce = DimensionReduce(
            embedding_url=self.base_url,
            token=self.token,
            user_id=self.user_id,
        )
        self.model_data_view_fields = self.model_data_view_fields
        self.special_data_view_fields = self.special_data_view_fields

        view_details_cache = self.__dict__.get("_view_details_cache")
        if not isinstance(view_details_cache, dict):
            object.__setattr__(self, "_view_details_cache", {})

        sample_cache = self.__dict__.get("_sample_cache")
        if not isinstance(sample_cache, dict):
            object.__setattr__(self, "_sample_cache", {})

    def _get_view_details(self, view_id: str) -> dict:
        if view_id in self._view_details_cache.keys():
            return self._view_details_cache[view_id]
        details = self.service.get_view_details_by_id(view_id, headers=self.headers)
        self._view_details_cache[view_id] = deepcopy(details)
        return details
    
    async def _get_view_details_async(self, view_id: str) -> dict:
        if view_id in self._view_details_cache.keys():
            return self._view_details_cache[view_id]
        details = await self.service.get_view_details_by_id_async(view_id, headers=self.headers)
        self._view_details_cache[view_id] = deepcopy(details)
        return details

    def _get_sample(self, view_id: str, fields: list[str], limit: int = 1, offset: int = 0) -> dict:
        if view_id in self._sample_cache.keys():
            return self._sample_cache[view_id]

        sample = self.service.get_view_data_preview(view_id, headers=self.headers, fields=fields, limit=1, offset=0)
        self._sample_cache[view_id] = deepcopy(sample)
        return sample
    
    async def _get_sample_async(self, view_id: str, fields: list[str], limit: int = 1, offset: int = 0) -> dict:
        if view_id in self._sample_cache.keys():
            return self._sample_cache[view_id]
        
        sample = await self.service.get_view_data_preview_async(view_id, headers=self.headers, fields=fields, limit=limit, offset=offset)
        self._sample_cache[view_id] = deepcopy(sample)
        return sample

    def get_rule_base_params(self):
        tables = []
        en2types = {}
        try:
            for view_id in self.view_list:
                details = self._get_view_details(view_id)
                for detail in details:
                    totype, column_name, table, zh_table = get_view_en2type(detail)
                    tables.append(table)
                    en2types[table] = totype
        except AfDataSourceError as e:
            raise FrontendColumnError(e) from e
        rule_base = RuleBaseSource(tables=tables, en2types=en2types)
        return rule_base

    def test_connection(self):
        return True
    
    def set_tables(self, tables: List[str]):
        self.view_list = tables

    def get_tables(self) -> List[str]:
        return self.view_list

    def query(self, query: str, as_gen=True, as_dict=True) -> dict:
        try:
            vega_service = VegaServices(base_url=self.base_url)
            table = vega_service.exec_vir_engine_by_sql(self.user, self.user_id, query, account_type=self.account_type, headers=self.headers)
        except AfDataSourceError as e:
            raise VirEngineError(e) from e
        return table
    
    async def query_async(self, query: str, as_gen=True, as_dict=True) -> dict:
        try:
            vega_service = VegaServices(base_url=self.base_url)
            table = await vega_service.exec_vir_engine_by_sql_async(self.user, self.user_id, query, account_type=self.account_type, headers=self.headers)
        except AfDataSourceError as e:
            raise VirEngineError(e) from e
        return table


    def get_metadata(self, identities=None) -> list:
        details = []
        try:
            for view_id in self.view_list:
                view_details = self._get_view_details(view_id)
                for view_detail in view_details:
                    totype, column_name, table, zh_table = get_view_en2type(view_detail)

                    # 表名: 数据库.模式.表名
                    parts = table.split(".")
                    asset: dict = {"index": view_id, "title": parts[2],
                                "view_source_catalog": parts[0],
                                "schema": parts[1]}
                    source = view_source_reshape(asset)
                    detail = get_view_schema_of_table(source, view_detail, zh_table, view_detail.get("comment", ""))
                    details.append(detail)
        except AfDataSourceError as e:
            traceback.print_exc()
            raise FrontendColumnError(e) from e
        return details
    
    async def get_metadata_async(self, identities=None) -> list:
        details = []
        try:
            for view_id in self.view_list:
                view_details = await self._get_view_details_async(view_id)
                for view_detail in view_details:
                    totype, column_name, table, zh_table = get_view_en2type(view_detail)

                    # 表名: 数据库.模式.表名
                    parts = table.split(".")
                    asset: dict = {"index": view_id, "title": parts[2],
                                "view_source_catalog": parts[0],
                                "schema": parts[1]}
                    source = view_source_reshape(asset)
                    detail = get_view_schema_of_table(source, view_detail, zh_table, view_detail.get("comment", ""))
                    details.append(detail)
        except AfDataSourceError as e:
            traceback.print_exc()
            raise FrontendColumnError(e) from e
        return details

    def get_sample(
        self,
        identities=None,
        num: int = 5,
        as_dict: bool = False
    ) -> list:
        samples = {}
        try:
            for view in self.view_list:
                if isinstance(view, str):
                    view_id = view
                else:
                    view_id = view["id"]

                view_details = self._get_view_details(view_id)

                for view_detail in view_details:
                    sample = self._get_sample(view_id, [field["name"] for field in view_detail["fields"]], limit=num, offset=0)

                    samples[view_id] = sample
        except AfDataSourceError as e:
            traceback.print_exc()
            raise FrontendColumnError(e) from e
        return samples

    def get_meta_sample_data(self, input_query="", view_limit=5, dimension_num_limit=30, with_sample=True)->dict:
        coroutine = self.get_meta_sample_data_async(input_query, view_limit, dimension_num_limit, with_sample)
        return run_blocking(coroutine)
    
    async def get_meta_sample_data_async(self, input_query="", view_limit=5, dimension_num_limit=30, with_sample=True)->dict:
        details = []
        samples = {}
        logger.info("get meta sample data query {}, view_limit {}, dimension_num_limit {}".format(input_query, view_limit, dimension_num_limit))
        try:
            view_infos = {}
            view_white_list_sql_infos = {}  # 白名单筛选sql
            view_desensitization_field_infos = {}  # 字段脱敏
            view_classifier_field_list = {} # 分类分级
            view_schema_infos = {}    # 表头名字
            for view_id in self.view_list:
                view_details = await self._get_view_details_async(view_id)
                for detail in view_details:
                    view_infos[view_id] = detail

            # reduced_view = self.dimension_reduce.datasource_reduce(input_query, view_infos, view_limit)
            # 用混合索引降维
            # reduced_view = self.dimension_reduce.datasource_reduce_v2(input_query, view_infos, view_limit)
            reduced_view = await self.dimension_reduce.adatasource_reduce_v2(input_query, view_infos, view_limit)

            # 降维
            # column_infos = {}
            common_filed = []
            
            first = True
            for k, v in reduced_view.items():
                if first:
                    common_filed = [field["name"] for field in v["fields"]]
                    first = False
                else:
                    n_common_field = []
                    for filed in v["fields"]:
                        if filed["name"] in common_filed:
                            n_common_field.append(filed["name"])
                    common_filed = n_common_field
            
            if len(reduced_view) < 2:
                common_filed = []

            for view_id, detail in reduced_view.items():
                special_fields = []
                # 指定字段必须保留
                if self.special_data_view_fields is not  None and view_id in self.special_data_view_fields:
                    special_fields = [field["name"] for field in self.special_data_view_fields[view_id]]
                    logger.info("保留字段有{}".format(special_fields))

                # test_fields = self.dimension_reduce.data_view_reduce(input_query, detail["fields"], dimension_num_limit, common_filed+special_fields)
                # 用混合索引降维
                # detail["fields"] = self.dimension_reduce.data_view_reduce_v3(input_query, detail["fields"], dimension_num_limit, common_filed+special_fields)
                detail["fields"] = await self.dimension_reduce.adata_view_reduce_v3(input_query, detail["fields"], dimension_num_limit, common_filed+special_fields)

                # 分类分级过滤
                if view_id in view_classifier_field_list and len(view_classifier_field_list[view_id]):
                    n_column_fields = []
                    num_fields = len(detail["fields"])
                    for n_field in detail["fields"]:
                        if n_field["id"] in view_classifier_field_list[view_id]:
                            n_column_fields.append(n_field)
                    detail["fields"] = n_column_fields
                    logger.info("view_id {} 字段数量 {} 分类分级过滤后字段数量 {}".format(view_id, num_fields, len(n_column_fields)))

                # 主题模型 专题模型筛选
                if self.model_data_view_fields is not None and view_id in self.model_data_view_fields:
                    n_column_fields = []
                    num_fields = len(detail["fields"])
                    model_field_ids = {_field["field_id"] for _field in self.model_data_view_fields[view_id]}
                    for n_field in detail["fields"]:
                        if n_field["id"] in model_field_ids:
                            n_column_fields.append(n_field)
                    detail["fields"] = n_column_fields
                    logger.info("view_id {} 字段数量 {} 模型字段过滤后字段数量 {}".format(view_id, num_fields, len(n_column_fields)))
                logger.info("view_id {} 字段最后保留字段为 {}".format(view_id, [_filed["name"] for _filed in detail["fields"]]))

                totype, column_name, table, zh_table = get_view_en2type(detail)
                # 表名: 数据库.模式.表名
                parts = table.split(".")
                asset: dict = {"index": view_id, "title": parts[2],
                               "view_source_catalog": parts[0],
                               "schema": parts[1]}
                source = view_source_reshape(asset)
                description = view_infos[view_id]
                table_detail = get_view_schema_of_table(source, detail, zh_table, description.get("comment", ""))
                details.append(table_detail)
                view_schema_infos[view_id] = asset["view_source_catalog"]

                if with_sample:
                    sample = await self._get_sample_async(
                        view_id,
                        [
                            {
                                "name": field["name"],
                                "original_name": field["original_name"],
                                "display_name": field["display_name"],
                                "type": field["type"],
                                "comment": field["comment"]
                            } for field in detail["fields"]
                        ],
                        limit=1,
                        offset=0
                    )

                    # 直保留需要的样例
                    if "entries" in sample and len(sample["entries"]) > 0:
                        reduced_fields = [field["name"] for field in detail["fields"]]
                        sample_reduced = {}
                        
                        for k, v in sample["entries"][0].items():
                            if k in reduced_fields:
                                sample_reduced[k] = v

                        samples[view_id] = sample_reduced
                    else:
                        samples[view_id] = {}

                    logger.info("get sample data num {}".format(len(samples)))

        except AfDataSourceError as e:
            traceback.print_exc()
            raise FrontendColumnError(e) from e

        result =  {
            "detail": details,
            "view_schema_infos": view_schema_infos
        }

        if view_white_list_sql_infos:
            result["view_white_list_sql_infos"] = view_white_list_sql_infos 

        if with_sample:
            result["sample"] = samples
        return result

    def query_correction(self, query: str) -> str:
        return query

    def close(self):
        # self.connection.close()
        pass

    def get_description(self) -> list[dict[str, str]]:
        descriptions = []
        try:
            for view_id in self.view_list:
                details = self._get_view_details(view_id)
                for detail in details:
                    description = {}
                    description.update({"name": detail.get("business_name", "")})
                    description.update({"description": detail.get("description", "")})
                    descriptions.append(description)
        except FrontendColumnError as e:
            logger.error(e)
        except FrontendSampleError as e:
            logger.error(e)
        return descriptions


    def get_catelog(self) -> list[str]:
        text2sql = Services()
        catelogs = []
        try:
            for view_id in self.view_list:
                view_details = self._get_view_details(view_id)
                for view_detail in view_details:
                    totype, column_name, table, zh_table = get_view_en2type(view_detail)
                    catelogs.append(table)
        except FrontendColumnError as e:
            logger.error(e)
        return catelogs