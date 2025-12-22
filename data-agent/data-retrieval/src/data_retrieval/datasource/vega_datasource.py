# -*- coding: utf-8 -*-
# @Author:  Lareina.guo@aishu.cn
# @Date: 2024-6-7
from typing import Any, List, Optional, Union

from data_retrieval.api.af_api import Services
from data_retrieval.api.vega import VegaServices
from data_retrieval.api.error import AfDataSourceError, VirEngineError, FrontendColumnError, FrontendSampleError
from data_retrieval.datasource.db_base import DataSource
from data_retrieval.logs.logger import logger
from data_retrieval.parsers.text2sql_parser import RuleBaseSource
from data_retrieval.datasource.dimension_reduce import DimensionReduce
from data_retrieval.api import VegaType
from data_retrieval.api.vega import VegaServices
from data_retrieval.api.af_api import Services
from pydantic import PrivateAttr
from typing import Dict, List
from data_retrieval.utils.dip_services import Builder
from data_retrieval.utils.dip_services.base import ServiceType


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
        en2type[field["technical_name"]] = field["data_type"]
        column_name.append(f'"{field["technical_name"]}"')
    table = resp_column["view_source_catalog_name"] + "." + resp_column["technical_name"]
    zh_table = resp_column["business_name"]
    return en2type, column_name, table, zh_table


def view_source_reshape(asset: dict) -> dict:
    data_source = {
        "index": asset["index"],
        "title": asset["title"],
        "schema": "default",  # 逻辑全是默认： default
        "source": asset["view_source_catalog"],
    }
    return data_source


def get_view_schema_of_table(source: dict, column: dict, zh_table, description) -> dict:
    res = {}
    en2cn: dict = {}
    middle: str = ""
    for entry in column["fields"]:
        en2cn[entry["technical_name"]] = entry["business_name"]
        middle += "{column_en} {column_type} comment '{column_cn}'\n"
        middle = middle.format(
            column_en=entry["technical_name"],
            column_cn=entry["business_name"],
            column_type=entry["original_data_type"],
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
    res["description"] = description
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


class VegaDataSource(DataSource):
    """Vega data source
    Connect vega database with read-only mode
    """
    view_list: list = []
    user_id: str = ""
    account_type: str = "user"
    user: str = "admin"
    token: str = ""
    headers: Any = {}
    vega_type: str = VegaType.DIP.value
    base_url: str = ""
    model_data_view_fields: dict = None  # 主题模型、专题模型字段，筛选专用
    special_data_view_fields: dict = None  # 指定字段必须保留
    service: Union[VegaServices, Services] = None
    dimension_reduce: Optional[DimensionReduce] = None

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
                "X-Presto-User": self.user,
                "x-user": self.user_id,
                "x-account-id": self.user_id,
                "x-account-type": self.account_type
            }

        self.view_list = self.view_list

        if self.vega_type.lower() == VegaType.AF.value:
            self.service = Services(base_url=self.base_url)
        elif self.vega_type.lower() == VegaType.DIP.value:
            self.service = VegaServices(base_url=self.base_url)
        else:
            raise VirEngineError(f"Invalid vega type: {self.vega_type}")
        
        self.dimension_reduce = DimensionReduce(
            embedding_url=self.base_url,
            token=self.token,
            user_id=self.user_id,
        )
        self.model_data_view_fields = self.model_data_view_fields
        self.special_data_view_fields = self.special_data_view_fields

    def get_rule_base_params(self):
        tables = []
        en2types = {}
        try:
            for view_id in self.view_list:
                column = self.service.get_view_column_by_id(view_id, headers=self.headers)
                totype, column_name, table, zh_table = get_view_en2type(column)
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
            table = self.service.exec_vir_engine_by_sql(self.user, self.user_id, query, account_type=self.account_type, headers=self.headers)
        except AfDataSourceError as e:
            raise VirEngineError(e) from e
        return table
    
    async def query_async(self, query: str, as_gen=True, as_dict=True) -> dict:
        try:
            table = await self.service.exec_vir_engine_by_sql_async(self.user, self.user_id, query, account_type=self.account_type, headers=self.headers)
        except AfDataSourceError as e:
            raise VirEngineError(e) from e
        return table


    def get_metadata(self, identities=None) -> list:
        details = []
        try:
            for view_id in self.view_list:
                column = self.service.get_view_column_by_id(view_id, headers=self.headers)
                totype, column_name, table, zh_table = get_view_en2type(column)
                asset: dict = {"index": view_id, "title": table.split(".")[2],
                               "view_source_catalog": table.split(".")[0]}
                source = view_source_reshape(asset)
                description = self.service.get_view_details_by_id(view_id, headers=self.headers)
                detail = get_view_schema_of_table(source, column, zh_table, description["description"])
                details.append(detail)
        except AfDataSourceError as e:
            raise FrontendColumnError(e) from e
        return details
    
    async def get_metadata_async(self, identities=None) -> list:
        details = []
        try:
            for view_id in self.view_list:
                column = await self.service.get_view_column_by_id_async(view_id, headers=self.headers)
                totype, column_name, table, zh_table = get_view_en2type(column)
                asset: dict = {"index": view_id, "title": table.split(".")[2],
                               "view_source_catalog": table.split(".")[0]}
                source = view_source_reshape(asset)
                description = await self.service.get_view_details_by_id_async(view_id, headers=self.headers)
                detail = get_view_schema_of_table(source, column, zh_table, description["description"])
                details.append(detail)
        except AfDataSourceError as e:
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

                column = self.service.get_view_column_by_id(view_id, headers=self.headers)
                totype, column_name, table, zh_table = get_view_en2type(column)
                asset: dict = {"index": view_id, "title": table.split(".")[2],
                               "view_source_catalog": table.split(".")[0]}
                source = view_source_reshape(asset)
                sample = self.service.get_view_sample_by_source(source, headers=self.headers)

                id_sample = {
                    columns["name"]: data
                    for data, columns in zip(sample["data"][0], sample["columns"])
                }
                samples[view_id] = id_sample
        except AfDataSourceError as e:
            raise FrontendColumnError(e) from e
        return samples

    def get_meta_sample_data(self, input_query="", view_limit=5, dimension_num_limit=30, with_sample=True)->dict:
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
                view_infos[view_id] = self.service.get_view_details_by_id(view_id, headers=self.headers)
                try:
                    # AF 才需要获取白名单、字段脱敏、分类分级
                    if self.vega_type == VegaType.AF.value:
                        view_white_list_sql_infos[view_id] = self.service.get_view_white_policy_sql(view_id, headers=self.headers)
                        view_filed_infos = self.service.get_view_field_info(view_id, headers=self.headers)
                        view_valid_list = []
                        if "field_list" in view_filed_infos and len(view_filed_infos["field_list"]):
                            view_valid_list = [item["field_id"] for item in view_filed_infos["field_list"]]

                        view_classifier_field_list[view_id] = view_valid_list

                except AfDataSourceError as e:
                    logger.error(f"get view white list sql info error: {e}")

            reduced_view = self.dimension_reduce.datasource_reduce(input_query, view_infos, view_limit)

            # 降维
            column_infos = {}
            common_filed = []
            
            first = True
            for view_id in reduced_view.keys():
                column = self.service.get_view_column_by_id(view_id, headers=self.headers)
                column_infos[view_id] = column

                if first:
                    common_filed = [field["technical_name"] for field in column["fields"]]
                    first = False
                else:
                    n_common_field = []
                    for filed in column["fields"]:
                        if filed["technical_name"] in common_filed:
                            n_common_field.append(filed["technical_name"])
                    common_filed = n_common_field
            
            if len(reduced_view) < 2:
                common_filed = []

            for view_id, column in column_infos.items():
                # column = self.service.get_view_column_by_id(view_id, headers=self.headers)
                special_fields = []
                # 指定字段必须保留
                if self.special_data_view_fields is not  None and view_id in self.special_data_view_fields:
                    special_fields = [field["technical_name"] for field in self.special_data_view_fields[view_id]]
                    logger.info("保留字段有{}".format(special_fields))

                column["fields"] = self.dimension_reduce.data_view_reduce_v3(input_query, column["fields"], dimension_num_limit, common_filed+special_fields)


                # 分类分级过滤
                if view_id in view_classifier_field_list and len(view_classifier_field_list[view_id]):
                    n_column_fields = []
                    num_fields = len(column["fields"])
                    for n_field in column["fields"]:
                        if n_field["id"] in view_classifier_field_list[view_id]:
                            n_column_fields.append(n_field)
                    column["fields"] = n_column_fields
                    logger.info("view_id {} 字段数量 {} 分类分级过滤后字段数量 {}".format(view_id, num_fields, len(n_column_fields)))

                # 主题模型 专题模型筛选
                if self.model_data_view_fields is not None and view_id in self.model_data_view_fields:
                    n_column_fields = []
                    num_fields = len(column["fields"])
                    model_field_ids = {_field["field_id"] for _field in self.model_data_view_fields[view_id]}
                    for n_field in column["fields"]:
                        if n_field["id"] in model_field_ids:
                            n_column_fields.append(n_field)
                    column["fields"] = n_column_fields
                    logger.info("view_id {} 字段数量 {} 模型字段过滤后字段数量 {}".format(view_id, num_fields, len(n_column_fields)))
                logger.info("view_id {} 字段最后保留字段为 {}".format(view_id, [_filed["technical_name"] for _filed in column["fields"]]))

                totype, column_name, table, zh_table = get_view_en2type(column)
                asset: dict = {"index": view_id, "title": table.split(".")[2],
                               "view_source_catalog": table.split(".")[0]}
                source = view_source_reshape(asset)
                description = view_infos[view_id]
                detail = get_view_schema_of_table(source, column, zh_table, description["description"])
                details.append(detail)
                view_schema_infos[view_id] = asset["view_source_catalog"]

                if with_sample:
                    dict_sample = {}

                    sample = self.service.get_view_sample_by_source(source, headers=self.headers)
                    # sample = self.service.get_view_data_preview(view_id, headers=self.headers, fields=[field["id"] for field in column["fields"]])
                    if "data" in sample and len(sample["data"]) > 0:
                        for data, columns in zip(sample["data"][0], sample["columns"]):
                            for field in column["fields"]:
                                if field["technical_name"] == columns["name"]:
                                    dict_sample[field["business_name"]] = data
                                    break

                    samples[view_id] = dict_sample

                    logger.info("get sample data num {}".format(len(dict_sample)))


        except AfDataSourceError as e:
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
                view_infos[view_id] = await self.service.get_view_details_by_id_async(view_id, headers=self.headers)
                try:
                    # AF 才需要获取白名单、字段脱敏、分类分级
                    if self.vega_type == VegaType.AF.value:
                        view_white_list_sql_infos[view_id] = self.service.get_view_white_policy_sql(view_id, headers=self.headers)
                        view_filed_infos = self.service.get_view_field_info(view_id, headers=self.headers)
                        view_valid_list = []
                        if "field_list" in view_filed_infos and len(view_filed_infos["field_list"]):
                            view_valid_list = [item["field_id"] for item in view_filed_infos["field_list"]]

                        view_classifier_field_list[view_id] = view_valid_list

                except AfDataSourceError as e:
                    logger.error(f"get view white list sql info error: {e}")

            reduced_view = self.dimension_reduce.datasource_reduce(input_query, view_infos, view_limit)

            # 降维
            column_infos = {}
            common_filed = []
            
            first = True
            for view_id in reduced_view.keys():
                column = await self.service.get_view_column_by_id_async(view_id, headers=self.headers)
                column_infos[view_id] = column

                if first:
                    common_filed = [field["technical_name"] for field in column["fields"]]
                    first = False
                else:
                    n_common_field = []
                    for filed in column["fields"]:
                        if filed["technical_name"] in common_filed:
                            n_common_field.append(filed["technical_name"])
                    common_filed = n_common_field
            
            if len(reduced_view) < 2:
                common_filed = []

            for view_id, column in column_infos.items():
                # column = self.service.get_view_column_by_id(view_id, headers=self.headers)
                special_fields = []
                # 指定字段必须保留
                if self.special_data_view_fields is not  None and view_id in self.special_data_view_fields:
                    special_fields = [field["technical_name"] for field in self.special_data_view_fields[view_id]]
                    logger.info("保留字段有{}".format(special_fields))

                # column["fields"] = self.dimension_reduce.data_view_reduce_v3(input_query, column["fields"], dimension_num_limit, common_filed+special_fields)
                column["fields"] = await self.dimension_reduce.adata_view_reduce_v3(input_query, column["fields"], dimension_num_limit, common_filed+special_fields)

                # 分类分级过滤
                if view_id in view_classifier_field_list and len(view_classifier_field_list[view_id]):
                    n_column_fields = []
                    num_fields = len(column["fields"])
                    for n_field in column["fields"]:
                        if n_field["id"] in view_classifier_field_list[view_id]:
                            n_column_fields.append(n_field)
                    column["fields"] = n_column_fields
                    logger.info("view_id {} 字段数量 {} 分类分级过滤后字段数量 {}".format(view_id, num_fields, len(n_column_fields)))

                # 主题模型 专题模型筛选
                if self.model_data_view_fields is not None and view_id in self.model_data_view_fields:
                    n_column_fields = []
                    num_fields = len(column["fields"])
                    model_field_ids = {_field["field_id"] for _field in self.model_data_view_fields[view_id]}
                    for n_field in column["fields"]:
                        if n_field["id"] in model_field_ids:
                            n_column_fields.append(n_field)
                    column["fields"] = n_column_fields
                    logger.info("view_id {} 字段数量 {} 模型字段过滤后字段数量 {}".format(view_id, num_fields, len(n_column_fields)))
                logger.info("view_id {} 字段最后保留字段为 {}".format(view_id, [_filed["technical_name"] for _filed in column["fields"]]))

                totype, column_name, table, zh_table = get_view_en2type(column)
                asset: dict = {"index": view_id, "title": table.split(".")[2],
                               "view_source_catalog": table.split(".")[0]}
                source = view_source_reshape(asset)
                description = view_infos[view_id]
                detail = get_view_schema_of_table(source, column, zh_table, description["description"])
                details.append(detail)
                view_schema_infos[view_id] = asset["view_source_catalog"]

                if with_sample:
                    dict_sample = {}

                    sample = await self.service.get_view_sample_by_source_async(source, headers=self.headers)
                    # sample = self.service.get_view_data_preview(view_id, headers=self.headers, fields=[field["id"] for field in column["fields"]])
                    if "data" in sample and len(sample["data"]) > 0:
                        for data, columns in zip(sample["data"][0], sample["columns"]):
                            for field in column["fields"]:
                                if field["technical_name"] == columns["name"]:
                                    dict_sample[field["business_name"]] = data
                                    break

                    samples[view_id] = dict_sample

                    logger.info("get sample data num {}".format(len(dict_sample)))


        except AfDataSourceError as e:
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
                detail = self.service.get_view_details_by_id(view_id, headers=self.headers)
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
                column = text2sql.get_view_column_by_id(view_id, headers=self.headers)
                totype, column_name, table, zh_table = get_view_en2type(column)
                catelogs.append(table)
        except FrontendColumnError as e:
            logger.error(e)
        return catelogs