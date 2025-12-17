# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-8-26

from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
import pandas as pd
import asyncio
from typing import Tuple
import traceback

from af_agent.datasource.api_base import APIDataSource
from af_agent.api.data_model import DataModelService
from af_agent.api.error import AfDataSourceError, DataModelDetailError, DataModelQueryError
from af_agent.logs.logger import logger
from af_agent.datasource.dimension_reduce import DimensionReduce
from af_agent.api.vega import VegaServices
from af_agent.utils._common import run_blocking


from pydantic import PrivateAttr
from copy import deepcopy


_OPERATOR = {
    # 指标过滤条件
    "<": ["str"],
    "<=": ["str"],
    ">": ["str"],
    ">=": ["str"],
    "=": ["str"],
    "!=": ["str"],
    "in": ["str", "str", "str"],
    "not in": ["str"],
    "range": ["number", "number"],
    "out_range": ["number", "number"],
}

# _DATE_FORMAT = [
#     "year",
#     "quarter",
#     "month",
#     "week",
#     "day",
#     "hour",
#     "minute",
# ]

_DATE_TYPE_FORMAT = {
    "timestamp": "%Y-%m-%d %H:%M:%S",
    "datetime": "%Y-%m-%d %H:%M:%S",
    "date": "%Y-%m-%d",
    "epoch_millis": "timestamp",
}

_METRIC_TYPE = [
    "atomic",
    "composite",
    "derived"
]

_QUERY_TYPE = [
    "dsl",
    "promql",
    "sql"
]


# 步长设置，根据错误获得
# {
#     "error_code": "Uniquery.MetricModel.InvalidParameter.Step",
#     "description": "指定的步长无效",
#     "solution": "请检查参数是否正确。",
#     "error_link": "暂无",
#     "error_details": "expect steps is one of {[15s 30s 1m 2m 5m 10m 15m 20m 30m 1h 2h 3h 6h 12h 1d 1y minute hour day week month quarter year]}, actaul is 1w"
# }
_TIME_GRANULARITY_PROMSQL = "15s 30s 1m 2m 5m 10m 15m 20m 30m 1h 2h 3h 6h 12h 1d 1y".split(" ")
_TIME_GRANULARITY_PROMSQL_DEFAULT = "1h"
_TIME_GRANULARITY_SQL = ["minute", "hour", "day", "week", "month", "quarter", "year"]
_TIME_GRANULARITY_SQL_DEFAULT = "month"
_TIME_GRANULARITY_SAMEPERIOD = ["month", "quarter", "year", "day"]
_DEFAULT_LOOK_BACK_DELTA = "30d"

def _convert_str_2_date_time(time_str):
    """转换字符串为日期时间"""
    splitted = time_str.split(" ")

    if len(splitted) == 2:
        date = datetime.strptime(time_str, _DATE_TYPE_FORMAT["datetime"])
    else:
        date = datetime.strptime(time_str, _DATE_TYPE_FORMAT["date"])
    return date


class DIPMetric(APIDataSource):
    """DIP Metric 数据源类
    """
    metric_list: List[str] = []
    token: str = ""
    user_id: str = ""
    account_type: str = "user"
    headers: Any
    base_url: str = ""
    
    service: DataModelService = None
    dimension_reduce: Any = None
    cache_data: Dict[str, Any] = {}

    class Config:
        arbitrary_types_allowed = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.token and not self.token.startswith("Bearer "):
            self.token = f"Bearer {self.token}"
        if not self.headers:
            self.headers = {
                "Authorization": self.token,
                "x-user": self.user_id,
                "x-account-id": self.user_id,
                "x-account-type": self.account_type
            }
        else:
            if self.token:
                self.headers["Authorization"] = self.token
            if self.user_id:
                self.headers["x-user"] = self.user_id
                self.headers["x-account-id"] = self.user_id
                self.headers["x-account-type"] = self.account_type

        logger.debug(self.headers)
        self.service = DataModelService(base_url=self.base_url, headers=self.headers)
        self.dimension_reduce = DimensionReduce(
            embedding_url=self.base_url,
            token=self.token,
            user_id=self.user_id,
        )

        cache = self.__dict__.get("cache_data")
        if not isinstance(cache, dict):
            object.__setattr__(self, "cache_data", {})

    @classmethod
    def create_from_api(cls, api_url: str, id: str, *args, **kwargs):
        """从API创建实例"""
        return cls(api_url=api_url, id=id, *args, **kwargs)

    def test_connection(self) -> bool:
        """测试连接"""
        try:
            # 尝试获取一个指标的详情来测试连接
            test_metric_id = "test"
            self.service.get_metric_models_detail(test_metric_id, self.headers)
            return True
        except Exception as e:
            logger.error(f"连接测试失败: {e}")
            return False

    def set_data_list(self, data_list: List[str]):
        """设置指标列表"""
        self.metric_list = data_list

    def get_data_list(self) -> List[str]:
        """获取指标列表"""
        return self.metric_list

    def params_correction(self, params: Dict[str, Any], metric_id: str = None) -> dict:
        """参数校验和修正
        
        Args:
            params: 查询参数
            metric_id: 指标ID
            
        Returns:
            修正后的参数
        """
        query_type = self.get_metric_query_type(metric_id)
        # if not query_type:
        #     logger.warning(f"指标 {metric_id} 的查询类型无法获取, 参数: {params}")
        #     return params

        if query_type == "promsql":
            time_granularity = _TIME_GRANULARITY_PROMSQL
            time_granularity_default = _TIME_GRANULARITY_PROMSQL_DEFAULT
        else:
            time_granularity = _TIME_GRANULARITY_SQL
            time_granularity_default = _TIME_GRANULARITY_SQL_DEFAULT
        
        corrected_params = params.copy()
        
        # 验证即时查询参数
        if "instant" not in corrected_params:
            corrected_params["instant"] = False
        
        def change_time_to_local_time(time_str):
            """将时间字符串转换为当地时间的时间戳"""
            server_tz = datetime.now().astimezone().tzinfo
            local_time = datetime.strptime(
                time_str, "%Y-%m-%d %H:%M:%S"
            ).replace(tzinfo=server_tz)
            return int(local_time.timestamp() * 1000)

        # 所有条件下都去获取范围查询参数
        # 要转为当地时间的时间戳
        if "start" in corrected_params:
            if isinstance(corrected_params["start"], str):
                # 解析字符串为naive datetime，然后加上服务器当地时区
                corrected_params["start"] = change_time_to_local_time(corrected_params["start"])
        
            if "end" in corrected_params:
                if isinstance(corrected_params["end"], str):
                    # 解析字符串为naive datetime，然后加上服务器当地时区
                    corrected_params["end"] = change_time_to_local_time(corrected_params["end"])
            else:
                corrected_params["end"] = int(datetime.now().timestamp() * 1000)
        
        if corrected_params["instant"] == False:
            # 验证步长参数
            if "step" in corrected_params:
                if query_type == "promsql":
                    pass
                else:
                    if corrected_params["step"] not in time_granularity:
                        corrected_params["step"] = time_granularity_default
            else:
                corrected_params["step"] = time_granularity_default
        else:
            # 即时查询参数
            if "time" in corrected_params:
                if isinstance(corrected_params["time"], str):
                    corrected_params["time"] = change_time_to_local_time(corrected_params["time"])
            
                if "look_back_delta" not in corrected_params:
                    corrected_params["look_back_delta"] = _DEFAULT_LOOK_BACK_DELTA
            else:
                # 如果按时间段查询汇总值, 需要进行转换
                if "start" in corrected_params and "end" in corrected_params:
                    look_back_delta = (corrected_params["end"] - corrected_params["start"]) # 前面已经转换为毫秒
                    corrected_params["look_back_delta"] = f"{look_back_delta}ms"

                    corrected_params["time"] = corrected_params["end"]
                    corrected_params.pop("start")
                    corrected_params.pop("end")
                        
        # 验证过滤器参数
        if "filters" in corrected_params:
            for filter_item in corrected_params["filters"]:
                if "operation" in filter_item:
                    if filter_item["operation"] not in _OPERATOR:
                        filter_item["operation"] = "="
        
        # 验证分析维度
        if "analysis_dimensions" in corrected_params:
            # 分析维度不能超出配置的维度
            # 删除日期维度
            if metric_id:
                metric_detail = self.get_description_by_ids(metric_id)
                if metric_detail:
                    if "analysis_dimensions" in metric_detail[0]:
                        detail_analysis_dimensions = metric_detail[0]["analysis_dimensions"]
                        date_field = metric_detail[0]["date_field"]
                        corrected_dims, analysis_dims = [], []
                        for dim in detail_analysis_dimensions:
                            if dim["name"] != date_field:
                                analysis_dims.append(dim["name"])
                            else:
                                logger.warning(f"指标 {metric_id} 的分析维度中包含日期维度 {date_field}，已移除")
                        for dim in corrected_params["analysis_dimensions"]:
                            if dim in analysis_dims:
                                corrected_dims.append(dim)
                        corrected_params["analysis_dimensions"] = corrected_dims

        # 验证同环比参数
        if "metrics" in corrected_params:
            # "metrics": { // 同环比占比分析
                # "type": "sameperiod", // 同环比：sameperiod，需配置sameperiod_config； 占比： proportion，占比时不需要配置sameperiod_config
                # "sameperiod_config": {
                #     "method": ["growth_value","growth_rate"],
                #     "offset": 1,
                #     "time_granularity": "month"
                # }
            # }
            metric_params = corrected_params["metrics"]
            if metric_params == {} or metric_params is None:
                corrected_params.pop("metrics")
                logger.warning(f"指标 {metric_id} 的同环比参数为空，已移除")
            else:
                if "type" in metric_params:
                    if metric_params["type"] not in ["sameperiod", "proportion"]:
                        logger.warning(f"指标 {metric_id} 的同环比类型不正确，已移除, 默认设置为 sameperiod, 原参数: {metric_params['type']}")
                        metric_params["type"] = "sameperiod"
                if "sameperiod_config" in metric_params:
                    if "method" in metric_params["sameperiod_config"]:
                        method_params = metric_params["sameperiod_config"]["method"]

                        for param in method_params:
                            if param not in ["growth_value", "growth_rate"]:
                                logger.warning(f"指标 {metric_id} 的同环比参数为空，已移除, 默认设置为 sameperiod, 原参数: {method_params}")
                            else:
                                metric_params["sameperiod_config"]["method"] = ["growth_value", "growth_rate"]
                                break
                    else:
                        method_params = ["growth_value", "growth_rate"]

                    if "time_granularity" in metric_params["sameperiod_config"]:
                        if metric_params["sameperiod_config"]["time_granularity"] not in _TIME_GRANULARITY_SAMEPERIOD:
                            logger.warning(f"指标 {metric_id} 的同环比参数为空，已移除, 默认设置为 sameperiod, 原参数: {metric_params['sameperiod_config']['time_granularity']}")
                            metric_params["sameperiod_config"]["time_granularity"] = "month"
                    else:
                        metric_params["sameperiod_config"]["time_granularity"] = "month"
            
        return corrected_params

    def get_description_by_ids(self, metric_ids: str|list[str]) -> List[Dict[str, Any]]:
        return run_blocking(self.aget_description_by_ids(metric_ids))

    async def aget_description_by_ids(self, metric_ids: str|list[str]) -> List[Dict[str, Any]]:
        """异步根据ID获取指标描述"""
        result = []
        not_cached_ids = []
        try:
            ids = metric_ids if isinstance(metric_ids, list) else metric_ids.split(",")
            
            # 从缓存获取
            for id in ids:
                cache_key = f"description_{id}"
                if cache_key in self.cache_data.keys():
                    result.append(self.cache_data[cache_key])
                else:
                    not_cached_ids.append(id)
            
            if not_cached_ids:
                
                data_view_ids = []
                metric_infos = []

                query_result = self.service.get_metric_models_detail(not_cached_ids)

                for metric in query_result:
                    # 精简结果
                    metric = {
                        "id": metric.get("id"),
                        "name": metric.get("name"),
                        "comment": metric.get("comment"),
                        "metric_type": metric.get("metric_type"),
                        "query_type": metric.get("query_type"),
                        "unit": metric.get("unit"),
                        "unit_type": metric.get("unit_type"),
                        "analysis_dimensions": metric.get("analysis_dimensions", []),
                        "date_field": metric.get("date_field"),
                        "measure_field": metric.get("measure_field"),
                        "data_source": metric.get("data_source", {})
                    }
                    metric_infos.append(metric)

                    data_source = metric.get("data_source", {})
                    if data_source:
                        if not data_source.get("type", "").lower() == "sql":
                            logger.warning(f"指标 {metric.get('id')} 的数据源类型不是 sql，请检查, metric_info: {metric}")
                            # continue

                        data_view_ids.append(data_source.get("id", ""))

                for id, detail in zip(not_cached_ids, metric_infos):
                    self.cache_data[f"description_{id}"] = deepcopy(detail)
                
                result.extend(metric_infos)

            return result
        except DataModelDetailError as e:
            logger.error(f"异步获取指标描述失败: {e}")
            print(traceback.format_exc())
            raise e
        
    def get_metric_query_type(self, metric_id: str) -> str:
        """获取指标查询类型"""
        metric_detail = self.get_description_by_ids(metric_id)
        if metric_detail:
            return metric_detail[0].get("query_type")
        return ""

    def get_description(self) -> Dict[str, Any]:
        """获取描述信息"""
        description = {}
        if self.metric_list:
            description = self.get_description_by_ids(self.metric_list)
            
        return description

    async def aget_description(self) -> Dict[str, Any]:
        """异步获取描述信息"""
        description = {}
        if self.metric_list:
            description = await self.aget_description_by_ids(self.metric_list)
            
        return description

    def get_details(self, input_query: str = "", metric_num_limit: int = 5, input_dimension_num_limit: int = 30) -> Dict[str, Any]:
        """获取详细信息"""
        # 同步版本直接调用异步版本
        return run_blocking(self.aget_details(input_query, metric_num_limit, input_dimension_num_limit))

    async def aget_details(self, input_query: str = "", metric_num_limit: int = 5, input_dimension_num_limit: int = 30) -> Dict[str, Any]:
        """异步获取详细信息"""
        details = []
        # 如果有指标列表，获取详细信息

        raw_details = []
        if self.metric_list:
            raw_details = await self.aget_description_by_ids(self.metric_list)
            
            # 分离 sql 和非 sql 类型的指标
            sql_metrics = []
            non_sql_metrics = []
            for item in raw_details:
                if item.get("query_type") != "sql":
                    logger.warning(f"指标 {item.get('id')} 的查询类型不是 sql，请检查, item: {item}")
                    non_sql_metrics.append(item)
                else:
                    sql_metrics.append(item)
            
            # 将 sql 指标列表转换为字典格式，用于降维
            sql_metrics_dict = {}
            for metric in sql_metrics:
                metric_id = metric.get("id") or metric.get("name")
                sql_metrics_dict[metric_id] = metric
            
            # 第一步：对 sql 类型的指标进行降维处理（减少数据源数量）
            if sql_metrics_dict and input_query and len(sql_metrics_dict) > metric_num_limit and metric_num_limit > 0:
                try:
                    reduced_metrics_dict = await self.dimension_reduce.adatasource_reduce_v2(
                        input_query=input_query,
                        input_data_source=sql_metrics_dict,
                        num=metric_num_limit,
                        datasource_type="metric"
                    )
                    # 将降维后的字典转换回列表
                    reduced_metrics = list(reduced_metrics_dict.values())
                except Exception as e:
                    logger.error(f"指标降维失败: {e}")
                    traceback.print_exc()
                    # 降维失败时，返回前 metric_num_limit 个指标
                    reduced_metrics = sql_metrics[:metric_num_limit]
            else:
                # 如果不需要降维或降维条件不满足，直接使用所有 sql 指标
                if sql_metrics:
                    if len(sql_metrics) > metric_num_limit:
                        reduced_metrics = sql_metrics[:metric_num_limit]
                    else:
                        reduced_metrics = sql_metrics
                else:
                    reduced_metrics = []
            
            # 第二步：对每个指标的 analysis_dimensions 进行降维处理（减少维度数量）
            for metric in reduced_metrics:
                if metric.get("analysis_dimensions") and input_query and input_dimension_num_limit > 0:
                    analysis_dimensions = metric.get("analysis_dimensions", [])
                    if len(analysis_dimensions) > input_dimension_num_limit:
                        try:
                            # 使用 indicator_reduce 对分析维度进行降维
                            reduced_dimensions = await self.dimension_reduce.a_metric_reduce_v3(
                                input_query=input_query,
                                input_analysis_dimensions=analysis_dimensions,
                                num=input_dimension_num_limit,
                                date_mark_field_id=metric.get("date_field", "")
                            )
                            metric["analysis_dimensions"] = reduced_dimensions
                        except Exception as e:
                            logger.error(f"指标 {metric.get('id')} 的维度降维失败: {e}")
                            traceback.print_exc()
                            # 降维失败时，保留原始维度或截取前 N 个
                            metric["analysis_dimensions"] = analysis_dimensions[:input_dimension_num_limit]
                
                details.append(metric)
            
            # 添加非 sql 类型的指标（这些指标不参与降维，但需要返回）
            details.extend(non_sql_metrics)
        
        return details

    def call(self, metric_id: str, data: dict) -> Any:
        """调用指标查询API
        
        Args:
            metric_id: 指标ID，支持单个或多个指标ID（逗号分隔）
            data: 查询参数，即使多个指标也只有一个查询参数：
            
            单个指标范围查询：
            {
                "instant": false,
                "start": 1646360670123,
                "end": 1646471470123,
                "step": "1m",
                "filters": [
                    {
                        "name": "labels.host",
                        "value": ["10.2.12.23", "10.21.2.3"],
                        "operation": "in"
                    }
                ]
            }
            
            单个指标即时查询：
            {
                "instant": true,
                "time": 1669789900123,
                "look_back_delta": "10m",
                "filters": [...]
            }

            
        Returns:
            查询结果
        """
        try:
            # 单个指标查询
            corrected_data = self.params_correction(data, metric_id)
            
            # 调用查询API
            result = self.service.query_metric_models_data(metric_id, self.headers, corrected_data)
            data_frame, dim_mapping = self.convert_result_to_dataframe(metric_id, result.get("datas", []))

            data_json = []
            if data_frame is not None:
                data_json = data_frame.to_dict(orient="records")

            # 获取指标信息
            metric_detail = self.get_description_by_ids(metric_id)
            if metric_detail:
                for item in metric_detail:
                    if item["id"] == metric_id:
                        result.update({
                            "unit": item["unit"],
                            "unit_type": item["unit_type"],
                            # "dim_mapping": dim_mapping
                        })

                    break

            result.pop("datas")
            result["data"] = data_json

            return result
        except DataModelQueryError as e:
            logger.error(f"指标查询失败: {e}")
            raise e

    async def acall(self, metric_id: str, data: dict) -> Any:
        """异步调用指标查询API"""
        try:
            corrected_data = self.params_correction(data, metric_id)

            logger.debug(f"异步调用指标查询参数: {corrected_data}")
            
            # 异步调用查询API
            result = await self.service.query_metric_models_data_async(metric_id, self.headers, corrected_data)
            logger.debug(f"异步调用指标查询结果: {result}")

            datas = result.get("datas", [])
            data_frame, dim_mapping = self.convert_result_to_dataframe(metric_id, datas)

            data_json = []
            if data_frame is not None:
                data_json = data_frame.to_dict(orient="records")

            # 获取指标信息
            metric_detail = self.get_description_by_ids(metric_id)
            if metric_detail:
                for item in metric_detail:
                    if item["id"] == metric_id:
                        result.update({
                            "unit": item["unit"],
                            "unit_type": item["unit_type"],
                            # "dim_mapping": dim_mapping
                        })

                        break

            result.pop("datas")
            result["data"] = data_json
            
            return result
        except DataModelQueryError as e:
            logger.error(f"异步指标查询失败: {e}")
            raise e

    def get_metric_info(self, metric_id: str) -> Dict[str, Any]:
        """获取指标信息
        
        Args:
            metric_id: 指标ID
            
        Returns:
            指标信息，包含字段、维度等
        """
        try:
            metric_detail = self.get_description_by_ids(metric_id)
            if not metric_detail:
                return {}
            
            # 提取字段信息
            fields = {}
            if "data_view" in metric_detail and "fields" in metric_detail["data_view"]:
                fields = metric_detail["data_view"]["fields"]
            
            return {
                "id": metric_detail.get("id"),
                "name": metric_detail.get("name"),
                "measure_name": metric_detail.get("measure_name"),
                "metric_type": metric_detail.get("metric_type"),
                "query_type": metric_detail.get("query_type"),
                "formula": metric_detail.get("formula"),
                "date_field": metric_detail.get("date_field"),
                "date_format": metric_detail.get("date_format"),
                "measure_field": metric_detail.get("measure_field"),
                "unit_type": metric_detail.get("unit_type"),
                "unit": metric_detail.get("unit"),
                "fields": fields,
                "tags": metric_detail.get("tags", []),
                "comment": metric_detail.get("comment"),
                "task": metric_detail.get("task", {})
            }
        except Exception as e:
            logger.error(f"获取指标信息失败: {e}")
            return {}

    def convert_result_to_dataframe(self, metric_id: str, result: list) -> Tuple[pd.DataFrame, dict]:
        """将 DIP Metric 查询结果转换为 DataFrame
        
        Args:
            result (dict): DIP Metric 查询结果
            
        Returns:
            Tuple[pd.DataFrame, dict]: 转换后的 DataFrame 和列名映射
        """
        try:
            rows = []
            labels_mapping = {}

            if not result:
                return None, {}

            details = self.get_description_by_ids(metric_id)
            if details:
                detail = details[0]
                fields = detail.get("analysis_dimensions", [])
                for field in fields:
                    labels_mapping[field["name"]] = field["display_name"] if field.get("display_name") else field["name"]

            # TODO: 全球化
            labels_mapping["timestamp"] = "时间戳"
            labels_mapping["time_str"] = "时间"
            labels_mapping["value"] = "值"
            labels_mapping["growth_value"] = "增长值"
            labels_mapping["growth_rate"] = "增长率"

            for data in result:
                labels = data.get("labels", {})
                times = data.get("times", [])
                time_strs = data.get("time_strs", [])
                values = data.get("values", [])
                growth_values = data.get("growth_values", [])
                growth_rates = data.get("growth_rates", [])
                
                # 确保所有数组长度一致
                max_len = max(len(times), len(time_strs), len(values), len(growth_values), len(growth_rates))
                
                # 为每个时间点创建一行数据
                for i in range(max_len):
                    if labels:
                        row_data = {
                            # 标签信息
                            **labels,
                            # 时间信息
                            "timestamp": times[i] if i < len(times) else None,
                            "time_str": time_strs[i] if i < len(time_strs) else None,
                            # 数值信息
                            "value": values[i] if i < len(values) else None,
                        }
                    else:
                        row_data = {
                            # 时间信息
                            "timestamp": times[i] if i < len(times) else None,
                            "time_str": time_strs[i] if i < len(time_strs) else None,
                            "value": values[i] if i < len(values) else None,
                        }

                    if growth_values:
                        row_data["growth_value"] = growth_values[i] if i < len(growth_values) else None
                    if growth_rates:
                        row_data["growth_rate"] = growth_rates[i] if i < len(growth_rates) else None
                    
                    rows.append(row_data)
        
            # 创建 DataFrame
            df = pd.DataFrame(rows)
    
            # 删除除了日期\label字段全为空的行
            df = df.dropna(subset=df.columns.difference(["timestamp", "time_str"] + list(labels.keys())), how="all")

            # 将 nan 转化为 --
            df = df.fillna("--")
            # 按时间升序排序
            if "timestamp" in df.columns:
                df = df.sort_values(by="timestamp", ascending=True)

            # 将列名转化为中文
            df = df.rename(columns=labels_mapping)

            return df, labels_mapping
            
        except ImportError:
            logger.error("pandas 未安装，无法转换为 DataFrame")
            return None
        except Exception as e:
            logger.error(f"转换结果到 DataFrame 失败: {e}")
            return None

    def get_result_statistics(self, metric_id: str, result: dict) -> dict:
        """获取查询结果的统计信息
        
        Args:
            result (dict): DIP Metric 查询结果
            
        Returns:
            dict: 统计信息
        """
        try:
            df, _ = self.convert_result_to_dataframe(metric_id, result)
            if df is None or df.empty:
                return {}
            
            stats = {
                "total_rows": len(df),
                "total_columns": len(df.columns),
                "time_range": None,
                "brand_stats": None,
                "area_stats": None,
                "value_stats": None
            }
            
            # 时间范围统计
            if "datetime" in df.columns:
                stats["time_range"] = {
                    "start": df["datetime"].min().isoformat(),
                    "end": df["datetime"].max().isoformat(),
                    "duration_days": (df["datetime"].max() - df["datetime"].min()).days
                }
            
            # 品牌统计
            if "brand" in df.columns:
                brand_stats = df.groupby("brand")["value"].agg(['count', 'sum', 'mean', 'std']).round(2)
                stats["brand_stats"] = brand_stats.to_dict()
            
            # 地区统计
            if "area_2_province" in df.columns:
                area_stats = df.groupby("area_2_province")["value"].agg(['count', 'sum', 'mean', 'std']).round(2)
                stats["area_stats"] = area_stats.to_dict()
            
            # 数值统计
            if "value" in df.columns:
                stats["value_stats"] = {
                    "total": df["value"].sum(),
                    "mean": df["value"].mean(),
                    "std": df["value"].std(),
                    "min": df["value"].min(),
                    "max": df["value"].max(),
                    "null_count": df["value"].isnull().sum()
                }
            
            return stats
            
        except Exception as e:
            logger.error(f"获取统计信息失败: {e}")
            return {}




class MockDIPMetric(DIPMetric):
    """Mock DIP Metric 用于测试"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.headers = {"Authorization": "mock_token"}
        self._mock_metrics = {
            "mock_metric_1": {
                "id": "mock_metric_1",
                "name": "CPU使用率",
                "measure_name": "__m.cpu_usage",
                "metric_type": "atomic",
                "query_type": "dsl",
                "unit": "%",
                "tags": ["mock", "cpu", "performance"],
                "comment": "CPU使用率指标，用于监控系统性能",
                "data_view": {
                    "fields": {
                        "cpu_usage": {"type": "float", "description": "CPU使用率百分比"},
                        "timestamp": {"type": "timestamp", "description": "时间戳"},
                        "host": {"type": "string", "description": "主机名"},
                        "instance": {"type": "string", "description": "实例标识"}
                    }
                }
            },
            "mock_metric_2": {
                "id": "mock_metric_2",
                "name": "内存使用率",
                "measure_name": "__m.memory_usage",
                "metric_type": "atomic",
                "query_type": "promql",
                "unit": "%",
                "tags": ["mock", "memory", "performance"],
                "comment": "内存使用率指标，用于监控系统内存状态",
                "data_view": {
                    "fields": {
                        "memory_usage": {"type": "float", "description": "内存使用率百分比"},
                        "timestamp": {"type": "timestamp", "description": "时间戳"},
                        "host": {"type": "string", "description": "主机名"},
                        "instance": {"type": "string", "description": "实例标识"}
                    }
                }
            },
            "mock_metric_3": {
                "id": "mock_metric_3",
                "name": "网络流量",
                "measure_name": "__m.network_traffic",
                "metric_type": "atomic",
                "query_type": "sql",
                "unit": "bytes/s",
                "tags": ["mock", "network", "traffic"],
                "comment": "网络流量指标，用于监控网络性能",
                "data_view": {
                    "fields": {
                        "bytes_in": {"type": "float", "description": "入站字节数"},
                        "bytes_out": {"type": "float", "description": "出站字节数"},
                        "timestamp": {"type": "timestamp", "description": "时间戳"},
                        "interface": {"type": "string", "description": "网络接口"},
                        "host": {"type": "string", "description": "主机名"}
                    }
                }
            }
        }

    def test_connection(self) -> bool:
        """测试连接"""
        return True

    def params_correction(self, params: Dict[str, Any], metric_id: str = None) -> dict:
        """参数校验和修正"""
        return params

    def get_description(self) -> Dict[str, Any]:
        """获取描述"""
        return {
            "name": "Mock DIP Metric",
            "type": "metric",
            "description": "Mock DIP 指标数据源，用于测试和开发",
            "operators": _OPERATOR,
            "date_formats": "yyyy-MM-dd HH:mm:ss",
            "metric_types": _METRIC_TYPE,
            "query_types": _QUERY_TYPE,
            "time_granularity": "month",
            "supported_operations": list(_OPERATOR.keys()),
        }

    def get_details(self, input_query: str = "", metric_num_limit: int = 5, input_dimension_num_limit: int = 30) -> Dict[str, Any]:
        """获取详细信息"""
        details = {
            "name": "Mock DIP Metric",
            "type": "metric",
            "description": "Mock DIP 指标数据源，支持指标详情查询和数据查询",
            "metrics": [],
            "operators": _OPERATOR,
            "date_formats": "yyyy-MM-dd HH:mm:ss",
            "metric_types": _METRIC_TYPE,
            "query_types": _QUERY_TYPE,
            "time_granularity": "month",
        }
        
        # 根据输入查询过滤指标
        filtered_metrics = []
        if input_query:
            # 简单的关键词匹配
            query_lower = input_query.lower()
            for metric_id, metric_info in self._mock_metrics.items():
                if (query_lower in metric_info["name"].lower() or 
                    query_lower in metric_info["comment"].lower() or
                    any(query_lower in tag.lower() for tag in metric_info["tags"])):
                    filtered_metrics.append(metric_info)
        else:
            # 返回所有指标
            filtered_metrics = list(self._mock_metrics.values())
        
        # 限制返回数量
        details["metrics"] = filtered_metrics[:metric_num_limit]
        
        return details



    def get_metric_info(self, metric_id: str) -> Dict[str, Any]:
        """获取指标信息"""
        if metric_id in self._mock_metrics:
            return self._mock_metrics[metric_id]
        else:
            # 返回默认指标信息
            return self._mock_metrics["mock_metric_1"]

    def get_description_by_id(self, metric_id: str) -> Dict[str, Any]:
        """根据ID获取指标描述"""
        return self.get_metric_info(metric_id)

    def _generate_mock_data(self, metric_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """生成模拟数据"""
        metric_info = self.get_metric_info(metric_id)
        
        # 检查是否为即时查询
        is_instant = isinstance(data, dict) and data.get("instant", False)
        
        if is_instant:
            # 即时查询数据
            times = [data.get("time", 1669789900123)]
            step = ""
        else:
            # 范围查询数据
            start = data.get("start", 1646360670123)
            end = data.get("end", 1646471470123)
            step = data.get("step", "1m")
            
            # 生成时间序列数据
            step_ms = 60000  # 1分钟 = 60000毫秒
            if step == "5m":
                step_ms = 300000
            elif step == "15m":
                step_ms = 900000
            elif step == "30m":
                step_ms = 1800000
            elif step == "1h":
                step_ms = 3600000
            
            times = list(range(start, end, step_ms))
            if not times:
                times = [start]
        
        # 生成模拟数值
        import random
        base_value = 50 + random.randint(0, 50)  # 基础值50-100
        values = []
        for i, t in enumerate(times):
            # 添加一些随机波动
            noise = random.uniform(-10, 10)
            value = max(0, min(100, base_value + noise + i * 0.1))
            values.append(round(value, 2))
        
        # 生成标签
        labels = {"instance": "mock-instance", "host": "mock-host"}
        
        # 处理过滤器
        if isinstance(data, dict) and "filters" in data:
            for filter_item in data["filters"]:
                if filter_item.get("name") == "labels.host":
                    if isinstance(filter_item.get("value"), list):
                        labels["host"] = filter_item["value"][0] if filter_item["value"] else "mock-host"
                    else:
                        labels["host"] = filter_item.get("value", "mock-host")
        
        return {
            "model": {
                "id": metric_info["id"],
                "name": metric_info["name"],
                "measure_name": metric_info["measure_name"],
                "metric_type": metric_info["metric_type"],
                "query_type": metric_info["query_type"],
                "unit": metric_info["unit"]
            },
            "datas": [
                {
                    "labels": labels,
                    "times": times,
                    "values": values
                }
            ],
            "step": step,
            "is_variable": False,
            "is_calendar": False,
            "status_code": 200
        }

    def call(self, metric_id: str, data: Dict[str, Any]) -> Any:
        """Mock 调用"""
        try:
            # 参数校验
            corrected_data = self.params_correction(data, metric_id)
            
            # 生成模拟数据
            result = self._generate_mock_data(metric_id, corrected_data)
            
            return result
        except Exception as e:
            logger.error(f"Mock 调用失败: {e}")
            # 返回错误结果
            return {
                "model": {
                    "id": metric_id,
                    "name": "Error Metric",
                    "measure_name": "__m.error",
                    "metric_type": "atomic",
                    "query_type": "dsl",
                    "unit": "error"
                },
                "datas": [],
                "step": "",
                "is_variable": False,
                "is_calendar": False,
                "status_code": 500,
                "error": str(e)
            }

    async def acall(self, metric_id: str, data: Dict[str, Any]) -> Any:
        """异步 Mock 调用"""
        return self.call(metric_id, data)


if __name__ == '__main__':
    def main():
        # 测试示例
        metric = DIPMetric(token="your_token_here")
        metric.set_data_list(["metric_1", "metric_2"])
        
        # 测试连接
        print("连接测试:", metric.test_connection())
        
        # 获取描述
        print("描述:", metric.get_description())
        
        # 获取详细信息
        print("详细信息:", metric.get_details())
        
        # 测试查询
        query_data = {
            "instant": False,
            "start": 1646360670123,
            "end": 1646471470123,
            "step": "1m",
            "filters": []
        }
        
        try:
            result = metric.call("metric_1", query_data)
            print("查询结果:", result)
        except Exception as e:
            print("查询失败:", e)

    main()
