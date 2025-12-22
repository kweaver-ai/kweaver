# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-8-26

from typing import Any, Dict

from datetime import datetime
from data_retrieval.datasource.api_base import APIDataSource
from data_retrieval.api.af_api import Services
from data_retrieval.api.error import AfDataSourceError, IndicatorDescError, IndicatorDetailError, IndicatorQueryError
from data_retrieval.logs.logger import logger
from data_retrieval.datasource.vega_datasource import get_view_en2type, view_source_reshape
from data_retrieval.datasource.vega_datasource import FrontendColumnError
from data_retrieval.datasource.dimension_reduce import DimensionReduce


_OPERATOR = {
    # 指标过滤条件
    "<": ["str"],
    "<=": ["str"],
    ">": ["str"],
    ">=": ["str"],
    "=": ["str"],
    "<>": ["str"],
    "null": [],
    "not null": [],
    "include": ["str"],
    "not include": ["str"],
    "prefix": ["str"],
    "not prefix": ["str"],
    "in list": ["str","str","str"],
    "belong": ["str","str","str"],
    "true": [],
    "false": [],
    "between": ["datetime","datetime"],
}

_DATE_FORMAT = [
    "year",
    "quarter",
    "month",
    "week",
    "day",
]

_DATE_TYPE_FORMAT = {
    "timestamp": "%Y-%m-%d %H:%M:%S",
    "datetime": "%Y-%m-%d %H:%M:%S",
    "date": "%Y-%m-%d",
}

_METRIC_TYPE = [
    "value",
    "sameperiod",
    "proportion"
]

_METRIC_METHOD = [
    "growth_value",
    "growth_rate"
]

_TIME_GRANULARITY = [
    "day",
    "month",
    "quarter",
    "year"
]


def _convert_str_2_date_time(time_str):
    splitted = time_str.split(" ")

    if len(splitted) == 2:
        date = datetime.strptime(time_str, _DATE_TYPE_FORMAT["datetime"])
    else:
        date = datetime.strptime(time_str, _DATE_TYPE_FORMAT["date"])
    return date


class AFIndicator(APIDataSource):
    """AF Indicator
    """
    indicator_list: list[str] = []
    token: str
    
    headers: Any
    
    service: Services = None
    dimension_reduce: Any = None
    cache_data: Dict[str, Any] = {}

    class Config:
        arbitrary_types_allowed = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        logger.debug(self.token)
        self.headers = {"Authorization": self.token}
        logger.debug(self.headers)
        self.indicator_list = self.indicator_list
        logger.debug(self.indicator_list)
        self.service = Services()
        self.dimension_reduce = DimensionReduce()
        self.cache_data = dict()   # 缓存指标数据

    @classmethod
    def create_from_api(cls, api_url: str, id: str, *args, **kwargs):
        """Create AFIndicator from API
        """
        return cls(
            base_url=api_url,
            id=id,
            *args,
            **kwargs
        )

    def test_connection(self) -> bool:
        return True
    
    def set_data_list(self, data_list: list[str]):
        """Set data list
        """
        self.indicator_list = data_list
    
    def get_data_list(self) -> list[str]:
        return self.indicator_list

    def params_correction(self, params: Dict[str, Any], indicator_id: str) -> dict:
        """
        Make sure the params is valid for indicator calling

        params:
            params: dict, the params to be corrected
        return:
            corrected_params: dict, the corrected params
        """
        # typical params:
        # {
        #     "dimensions": [
        #         {
        #             "field_id": "3cee42d3-2959-4d2f-a2a0-82b7143beb0b",
        #             "format": "quarter"  // only valid for original_data_type is date or timestamp
        #         },
        #         {
        #             "field_id": "dbc7a6cd-8d1a-4342-9fb9-215284cb5d70"
        #         }
        #     ],
        #     "filters": [
        #         {
        #             "field_id": "b47ebeb1-025a-4992-a999-198ce92e8ad4",
        #             "operator": "=",
        #             "value": ["鲁西化工"]
        #         }
        #     ],
        #     "time_constraint": {
        #         "start_time": "2022-01-01",
        #         "end_time": "2023-01-31"
        #     },
        #     "metrics": {
        #         "type": "sameperiod", // 计算方式枚举值：value指标值、sameperiod同环比、proportion占比
        #         "sameperiod_config": {
        #             "method": ["growth_value","growth_rate"], // 计算方式枚举值：growth_value增长值、growth_rate增长率 列表至少有一项
        #             "offset": 2, //偏移量
        #             "time_granularity": "day", // 时间粒度： day日、month月、quarter季度、year年
        #         }   // 当type==sameperiod时，sameperiod_config必须存在以及method、offset、time_granularity
        #     }
        # }
        
        # check time_constraint
        # if time_constraint is not set, set it from 01.01 to now

        indicator_description = self.get_description_by_id(indicator_id)
        date_mark = indicator_description.get("date_mark", {})

        # default date format is date
        date_format = _DATE_TYPE_FORMAT.get(date_mark.get("original_data_type"), _DATE_TYPE_FORMAT["date"])

        current_time = datetime.now().strftime(date_format)
        default_start_time = datetime(datetime.now().year, 1, 1).strftime(date_format)
        if not params.get("time_constraint"):
            params["time_constraint"] = {
                "start_time": default_start_time,
                "end_time": current_time
            }
        else:
            start_time_str = params["time_constraint"].get("start_time")
            end_time_str = params["time_constraint"].get("end_time")

            # convert to datetime to date format
            if not start_time_str:
                start_time_str = default_start_time
            else:
                # try to convert to datetime format
                start_time = _convert_str_2_date_time(start_time_str)
                start_time_str = start_time.strftime(date_format)
            
            params["time_constraint"]["start_time"] = start_time_str


            if not end_time_str:
                end_time_str = current_time
            else:
                end_time = _convert_str_2_date_time(end_time_str)
                end_time_str = end_time.strftime(date_format)
            
            params["time_constraint"]["end_time"] = end_time_str

        # check dimensions
        # make sure dimensions is a list and format is corretly set
        if not params.get("dimensions"):
            params["dimensions"] = []
        else:
            for dimension in params["dimensions"]:
                # if indicator_id is set, chech the field

                dimension["field_id"] = self._field_num_to_id(dimension["field_id"])                       
                if "format" in dimension:
                    if dimension.get("original_data_type") not in ["date", "timestamp", "datetime"]:
                        del dimension["format"]
                    else:
                        # if format is not in valid, set field_id to empty
                        if dimension["format"] not in _DATE_FORMAT:
                            dimension["field_id"] = ""

            # Remove items where key is an empty string
            params["dimensions"] = [dim for dim in params["dimensions"] if dim.get("field_id") != ""]

        # check filters
        if not params.get("filters"):
            params["filters"] = []
        else:
            for filter in params["filters"]:
                # if operator is not in _OPERATOR, set field_id to empty
                if filter.get("operator") not in _OPERATOR:
                    filter["field_id"] = ""
                if filter.get("field_id"):
                    # filter["field_id"] = self._get_field_mapping(indicator_id, filter["field_id"])
                    filter["field_id"] = self._field_num_to_id(filter["field_id"])
            
            # remove items where key is empty
            params["filters"] = [filter for filter in params["filters"] if filter.get("field_id")]
        
        # check metrics
        if not params.get("metrics", {}):
            pass
        else:
            metrics = params["metrics"]
            metric_type = metrics.get("type", "value")
            if metric_type not in _METRIC_TYPE:
                del params["metrics"]
            
            if metric_type == "sameperiod":
                metric_config = metrics.get("sameperiod_config", {})
                if not metric_config:
                    del params["metrics"]
                else:
                    metric_method = metric_config.get("method", ["growth_value"])
                    for method in metric_method:
                        if method not in _METRIC_METHOD:
                            # if method is not in valid, set method to growth_value
                            metric_config["method"] = ["growth_value"]
                            break

                    metric_offset = metric_config.get("offset", 1)
                    if not isinstance(metric_offset, int):
                        metric_config["offset"] = 1
                    
                    metric_time_granularity = metric_config.get("time_granularity", "year")
                    if isinstance(metric_time_granularity, str):
                        metric_time_granularity = metric_time_granularity.lower()
                    else:
                        metric_time_granularity = "year"
                    if metric_time_granularity not in _TIME_GRANULARITY:
                        metric_config["time_granularity"] = "year"
        return params
    
    def get_description_by_id(self, indicator_id: str) -> Dict[str, Any]:
        # get value and set cache
        if self.cache_data.get("indicators", {}).get(indicator_id):
            res = self.cache_data["indicators"][indicator_id]
        else:
            res = self.service.get_indicator_description(indicator_id=indicator_id, headers=self.headers)
            if self.cache_data.get("indicators"):
                self.cache_data["indicators"][indicator_id] = res.copy()
            else:
                self.cache_data["indicators"] = {indicator_id: res.copy()}

        return res

    def get_description(self) -> Dict[str, Any]:
        indicators_desc = {}
        indicators_desc_value = []
        try:
            for indicator_id in self.indicator_list:
                # set cache
                res = self.get_description_by_id(indicator_id)

                description = {}
                description.update({"id": res.get("id", "")})
                description.update({"name": res.get("name", "")})
                description.update({"description": res.get("description", "")})
                description.update({"indicator_unit": res.get("indicator_unit", "")})

                indicators_desc_value.append(description)
            indicators_desc["description"] = indicators_desc_value
        except AfDataSourceError as e:
            raise IndicatorDescError(e) from e
        return indicators_desc

    def _field_id_to_num(self, field_id: str) -> int:
        # mapping field_id to field_num, to save tokens, field id is uuid, too long
        # field_id is uuid, cannot be replicatied

        field_num = 1 # if start from 0, logic if self.cache_data.get("field_ids") will be false
        if self.cache_data.get("field_ids"):
            if self.cache_data["field_ids"].get(field_id):
                field_num = self.cache_data["field_ids"][field_id]
            else:
                # self added number
                field_num = len(self.cache_data["field_ids"]) + 1
                self.cache_data["field_ids"][field_id] = field_num
        else:
            # init num
            self.cache_data["field_ids"] = {field_id: field_num}

        # save to num - field mapping
        if self.cache_data.get("fields_nums"):
            self.cache_data["fields_nums"][field_num] = field_id
        else:
            self.cache_data["fields_nums"] = {field_num: field_id}

        return field_num
    
    def _field_num_to_id(self, num: int) -> str:
        if isinstance(num, str):
            num = int(num)
        return self.cache_data.get("fields_nums", {}).get(num, "")
        
    def get_field_info_by_mapping(self, indicator_id: str, field_num: str) -> Dict[str, Any]:
        # field_id = self._get_field_mapping(indicator_id, field_num)
        field_id = self._field_num_to_id(field_num)

        dimensions = self.get_description_by_id(indicator_id).get("analysis_dimensions", [])

        for dim in dimensions:
            if dim.get("field_id") == field_id:
                return dim
        
        return {}
    
    def get_field_info_by_id(self, indicator_id: str, field_id: str) -> Dict[str, Any]:
        dimensions = self.get_description_by_id(indicator_id).get("analysis_dimensions", [])

        for dim in dimensions:
            if dim.get("field_id") == field_id:
                return dim
        
        return {}

    def get_details(self, input_query: str="", indicator_num_limit: int=5, input_dimension_num_limit: int=30) -> Dict[str, Any]:
        indicators_details = {}
        indicators_details_value = []
        try:
            indicator_infos = {}
            for indicator_id in self.indicator_list:
                res = self.get_description_by_id(indicator_id)

                indicator_infos[indicator_id] = res
            
            reduced_indicators = self.dimension_reduce.datasource_reduce(
                input_query,
                indicator_infos,
                indicator_num_limit,
                datasource_type="indicator"
            )

            for indicator_id, indicator_info in reduced_indicators.items():
                indicator_detail = {}
                indicator_detail["id"] = indicator_info.get("id", "")
                indicator_detail["name"] = indicator_info.get("name", "")
                indicator_detail["description"] = indicator_info.get("description", "")
                indicator_detail["indicator_unit"] = indicator_info.get("indicator_unit", "")
                indicator_detail["refer_view_name"] = indicator_info.get("refer_view_name", "")
                indicator_detail["refer_view_id"] = indicator_info.get("refer_view_id", "")

                dimensions = []
                date_mark = indicator_info.get("date_mark", {})
                analysis_dimensions = indicator_info.get("analysis_dimensions", [])
                analysis_dimensions = self.dimension_reduce.indicator_reduce(
                    input_query,
                    analysis_dimensions,
                    input_dimension_num_limit,
                    date_mark.get("field_id", "")
                )
        
                for item in analysis_dimensions:
                    dimension_detail = {}

                    # mapping field_id to field_num, to save tokens
                    field_id = item.get("field_id", "")
                    field_num = self._field_id_to_num(field_id)
                    dimension_detail["field_id"] = field_num

                    dimension_detail["business_name"] = item.get("business_name", "")
                    dimension_detail["technical_name"] = item.get("technical_name", "")
                    dimension_detail["original_data_type"] = item.get("original_data_type", "")
                    dimensions.append(dimension_detail)

                indicator_detail["dimensions"] = dimensions
                indicators_details_value.append(indicator_detail)
            indicators_details["details"] = indicators_details_value
        except AfDataSourceError as e:
            raise IndicatorDetailError(e) from e
        return indicators_details


    def call(self, indicator_id: str, data: dict) -> Any:
        # mapping field_num to field_id
        # {
        #     "dimensions": [
        #         {
        #             "field_id": ...procduct_uuid..., // 产品维度
        #         },
        #         {
        #             "field_id": ...time_uuid..., // 时间维度
        #             "format": "day"
        #         }
        #     ],
        #     "filters": [
        #         {
        #             "field_id": "...product_uuid...",
        #             "operator": "=",
        #             "value": ["产品名称"]
        #         }
        #     ],
        # }
        return self.service.get_indicator_query(indicator_id, self.headers, data)

    async def acall(self, indicator_id: str, data: dict) -> Any:
        res = self.call(indicator_id, data)
        return res
    
    def get_sample_from_data_view(self, view_id: str, includes: list) -> list:
        if self.cache_data.get("samples", {}).get(view_id, {}):
            return self.cache_data["samples"][view_id]
        try:
            column = self.service.get_view_column_by_id(view_id, headers=self.headers)
            totype, column_name, table, zh_table = get_view_en2type(column)
            asset: dict = {"index": view_id, "title": table.split(".")[2],
                            "view_source_catalog": table.split(".")[0]}
            source = view_source_reshape(asset)
            sample = self.service.get_view_sample_by_source(source, headers=self.headers)
            # res_sample = {
            #     columns["name"]: data
            #     for data, columns in zip(sample["data"][0], sample["columns"])
            # }

            res_sample = {}
            for data, columns in zip(sample["data"][0], sample["columns"]):
                if columns["name"] in includes:
                    res_sample[columns["name"]] = data
            # save sample to cache
            if self.cache_data.get("samples"):
                self.cache_data["samples"][view_id] = res_sample
            else:
                self.cache_data["samples"] = {view_id: res_sample}

        except AfDataSourceError as e:
            raise FrontendColumnError(e) from e

        return res_sample


class MockAFIndicator(APIDataSource):
    """Mock AF Indicator
    """

    def test_connection(self) -> bool:
        return True

    def params_correction(self, params: Dict[str, Any]) -> bool:
        return params

    def get_description(self) -> Dict[str, Any]:
        return {
            "id": "528138869825120136",
            "name": "电脑外设销售额",
            "description": "电脑外设总销售额",
        }

    def get_details(self) -> Dict[str, Any]:
        data = {
            "id": "528138869825120136",
            "name": "电脑外设销售额",
            "description": "电脑外设总销售额",
            "dimensions": [
                {
                    "field_id": "77988979-9207-4022-bf00-6a3933638e9b",
                    "business_name": "订单渠道",
                    "technical_name": "order_channel",
                    "original_data_type": "char"
                },
                {
                    "field_id": "7d1818b0-588c-441b-ba43-90efa866f749",
                    "business_name": "订单区域",
                    "technical_name": "order_area",
                    "original_data_type": "char"
                },
                {
                    "field_id": "db1f83cd-d11c-48df-8547-81949974fa49",
                    "business_name": "产品名称",
                    "technical_name": "product_name",
                    "original_data_type": "char"
                },
                {
                    "field_id": "3fe7824e-c431-42e4-9878-637e0075d7f2",
                    "business_name": "标准化订单时间",
                    "technical_name": "order_time",
                    "original_data_type": "timestamp"
                },
                {
                    "field_id": "e1af55cc-8369-4ff0-8ead-253af38b64af",
                    "business_name": "主键ID",
                    "technical_name": "id",
                    "original_data_type": "number"
                },
                {
                    "field_id": "10d93644-43a3-4e8c-be09-3e282d23e190",
                    "business_name": "标准化订单金额",
                    "technical_name": "order_amount",
                    "original_data_type": "number"
                }
            ]
        }
        return {
            "details": [data]
        }

    def call(self, params: Dict[str, Any]) -> Any:
        return {"res": "ok"}

    async def acall(self, params: Dict[str, Any]) -> Any:
        return {"res": "ok"}


if __name__ == '__main__':
    def main():
        from data_retrieval.api.auth import get_authorization

        # indicator_list = ["528959949091430802", ]
        # af_indicator

        indicator_list = ["536341918896915159", "536341918896915159"]
        token = get_authorization("http://10.4.109.201", "liberly", "111111")

        text2metric = AFIndicator(
            indicator_list=indicator_list,
            token=token,
        )

        headers = {"Authorization": token}
        print(headers)

        res = text2metric.get_details()
        print(res)


    main()
