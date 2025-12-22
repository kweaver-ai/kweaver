import json
import traceback
from io import StringIO
import asyncio
from textwrap import dedent
from typing import Optional, Type, Any, List, Dict
from enum import Enum
import re
from collections import OrderedDict

import pandas as pd
from langchain.tools import BaseTool
from langchain_core.callbacks import CallbackManagerForToolRun, AsyncCallbackManagerForToolRun
from langchain_core.pydantic_v1 import BaseModel, Field, PrivateAttr
from pandas import Timestamp
from data_retrieval.logs.logger import logger
from data_retrieval.sessions import BaseChatHistorySession, CreateSession
from data_retrieval.tools.base import ToolName
from data_retrieval.tools.base import ToolResult, ToolMultipleResult, AFTool
from data_retrieval.tools.base import construct_final_answer, async_construct_final_answer
from data_retrieval.errors import Json2PlotError, ToolFatalError
from data_retrieval.tools.base import api_tool_decorator

from fastapi import FastAPI, HTTPException, Body

class ChartType(str, Enum):
    PIE = "Pie"
    LINE = "Line"
    COLUMN = "Column"

_CHART_TYPE_DICT ={
    "Pie": ChartType.PIE,
    "pie": ChartType.PIE,
    "饼图": ChartType.PIE,
    "Line": ChartType.LINE,
    "line": ChartType.LINE,
    "折线图": ChartType.LINE,
    "Column": ChartType.COLUMN,
    "column": ChartType.COLUMN,
    "柱状图": ChartType.COLUMN,
}


_DATE_PATTERNS = {
    "YYYY-MM-DD": r'^\d{4}-(?:0?[1-9]|1[0-2])-(?:0?[1-9]|[12]\d|3[01])$',
    "YYYY-MM": r'^\d{4}-(?:0?[1-9]|1[0-2])$',
    "YYYY": r'^\d{4}$',
    "YYYY-W": r'^\d{4}-W\d{2}$',
    "YYYY-Q": r'^\d{4}-Q\d$',
    "HH:MM:SS": r'^\d{4}-(?:0?[1-9]|1[0-2])-(?:0?[1-9]|[12]\d|3[01]) (?:[01]?\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d)$',
    "HH:MM": r'^\d{4}-(?:0?[1-9]|1[0-2]) (?:[01]?\d|2[0-3]):(?:[0-5]\d)$'
}

_DATE_COLUMN_PATTERNS = r"(日期|时间|年|月份|月|季度|周|星期|日|工作日|Date|Time|Year|Month|Quarter|Week|Weekday|Day|Workday)"


class LineChartSchema(BaseModel):
    xField: str = Field(..., description="x 轴的列名")
    yField: str = Field(..., description="y 轴的列名")
    seriesField: str = Field(default="", description="候选字段列表")
    chart_type: str = ChartType.LINE

    @classmethod
    def from_df(cls, metric_col: str, group_by: List[str]):
        if len(group_by) == 0:
            raise Json2PlotError(f"{ChartType.LINE} 分组字段为空")
        
        series_field = ""
        if len(group_by) >= 2:
            series_field = group_by[1]

        return cls(xField=group_by[0], yField=metric_col, seriesField=series_field)


class ColumnChatrSchema(LineChartSchema):
    groupField: str = Field(default="", description="分组字段")
    chart_type: str = ChartType.COLUMN
    isStack: bool = Field(default=False, description="是否堆叠")
    isGroup: bool = Field(default=True, description="是否分组")

    @classmethod
    def from_df(cls, metric_col: str, group_by: List[str]):
        if len(group_by) == 0:
            raise Json2PlotError(f"{ChartType.COLUMN} 分组字段为空")
        isStack, isGroup = False, True
        series_field, group_field = "", ""
        if len(group_by) >= 2:
            series_field = group_by[1]
        if len(group_by) >= 3:
            group_field = group_by[2]
            isStack = True

        return cls(xField=group_by[0], yField=metric_col, seriesField=series_field, groupField=group_field, isStack=isStack, isGroup=isGroup)


class PieChartSchema(BaseModel):
    colorField: str = Field(..., description="颜色字段")
    angleField: str = Field(..., description="角度字段")
    chart_type: str = ChartType.PIE

    @classmethod
    def from_df(cls, metric_col: str, group_by: List[str]):
        if len(group_by) == 0:
            raise Json2PlotError(f"{ChartType.PIE} 分组字段为空")
        return cls(colorField=group_by[0], angleField=metric_col)


class ArgsModel(BaseModel):
    title: str = Field(..., description="和数据的 title 保持一致, 是一个字符串, **不是dict**")
    chart_type: str = Field(..., description="图表的类型, 输出仅支持三种: Pie, Line, Column, 环形图也属于 Pie")
    group_by: List[str] = Field(default=[], description=dedent("""
分组字段列表，支持多个字段，如果有时间字段，请放在第一位。另外:
- 对于折线图, group_by 可能有1~2个值, 第一个是 x 轴, 第二个字段是 分组, data_field 是 y 轴
- 对于柱状图, group_by 可能有1~3个值, 第一个是 x 轴, 第二个字段是 堆叠, 第三个字段是 分组, data_field 是 y 轴
- 对于饼图, group_by 只有一个值, 即 colorField, data_field 是 angleField
"""))
    data: List[Dict[str, Any]] = Field(default=[], description="用于作图的 JSON 数据，与 tool_result_cache_key 参数不能同时设置, 如果 tool_result_cache_key 为空, 才是用")
    data_field: str = Field(default="", description="数据字段，注意设置的 group_by 和 data_field 必须和数据匹配，不要自己生成，如果数据中没有，可以询问用户")
    tool_result_cache_key: str = Field(default="", description=f"{ToolName.from_text2metric.value} 或 {ToolName.from_text2sql.value}工具缓存 key, 其他工具的结果没有意义，key 是一个字符串, 与 data 不能同时设置")


_SCHEMA = {
    ChartType.LINE: LineChartSchema,
    ChartType.COLUMN: ColumnChatrSchema,
    ChartType.PIE: PieChartSchema
}

_TOOL_DESCS = dedent(f"""根据绘图参数生成用于前端展示的 JSON 对象。如果包含此工具，则优先使用此工具绘图

调用方法是 `{ToolName.from_json2plot.value}(title, chart_type, group_by, data_field, tool_result_cache_key)`

**注意：**
- 你拿到结果后, 不需要给用户展示这个 JSON 对象, 前端会自动画图""")

class Json2Plot(AFTool):
    name: str = ToolName.from_json2plot.value
    description: str = _TOOL_DESCS
    args_schema: Type[BaseModel] = ArgsModel
    session_id: Optional[Any] = None
    session_type: Optional[str] = "redis"
    session: Optional[BaseChatHistorySession] = None
    # handle_tool_error: bool = True

    _data: List = PrivateAttr(default=[])

    def __init__(self, *args, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        if self.session is None:
            self.session = CreateSession(self.session_type)
        self._data = kwargs.get("data", [])

    def _get_data(
        self,
        tool_result_cache_key: str = "",
        **kwargs
    ) -> Any:
        
        plot_json = {}
        if self.session:
            tool_res = self.session.get_agent_logs(
                tool_result_cache_key
            )
            if tool_res:
                plot_json = tool_res.get("data", {})

        if kwargs.get("data") is not None:
            plot_json = kwargs["data"]

        if not plot_json:
            raise Json2PlotError("数据不存在，请先获取数据")

        # if isinstance(plot_json, list):
        #     plot_json = json.dumps(plot_json, ensure_ascii=False)

        return plot_json
    
    def _get_config(self, chart_type: ChartType, group_by: List[str], metric_col: str, df: pd.DataFrame)->tuple[dict, str]:
        text = ""
        for dim in group_by + [metric_col]:
            if dim not in df.columns:
                raise Json2PlotError(f"配置字段与实际数据不匹配: {dim}，请告诉用户绘图失败")
            
        for col in df.columns:
            if col not in group_by + [metric_col]:
                text += f"数据中存在未使用的字段: {col}，可能出现绘图异常"

        if len(group_by) == 0:
            group_by.append(df.columns[0])

        if chart_type not in _CHART_TYPE_DICT:
            raise Json2PlotError(f"不支持的图表类型: {chart_type}，请重新生成配置")
        
        chart_schema = _SCHEMA[chart_type]

        return chart_schema.from_df(metric_col, group_by), text
    
    def _choose_date_col(self, df: pd.DataFrame) -> str:
        pass

    def _draw(
        self,
        **kwargs: Any
    ):
        plot_json = self._get_data(**kwargs)
        # df = pd.read_json(StringIO(plot_json), orient="records")
        df = pd.DataFrame(plot_json)
        
        # Rules:
        # 1. last column is always metric
        # 2. if there is only one column, we need to add a new column self increasing
        # 3. we need to choose the best column as x-axis, like date, name, etc.
        # date_col = pd.to_datetime(df.iloc[:, 1])
        # print(date_col)
        metric_col = kwargs.get("data_field", df.columns[-1])
        if len(df.columns) == 1:
            df["index"] = range(len(df))
            df = df.reindex(columns=["index", metric_col])

        if kwargs["chart_type"] not in _CHART_TYPE_DICT:
            chart_type = ChartType.LINE
            raise Json2PlotError(
                reason=f"不支持的图表类型: {kwargs['chart_type']}",
                detail=f"不支持的图表类型: {kwargs['chart_type']}，请重新生成配置，或重新传入参数，支持的图表类型为: {ChartType.LINE.value}, {ChartType.COLUMN.value}, {ChartType.PIE.value}"
            )
        else:
            chart_type = _CHART_TYPE_DICT[kwargs["chart_type"]]

        # 将 metric_col 转换为数值,如果不是的话
        if not pd.api.types.is_numeric_dtype(df[metric_col]):
            df[metric_col] = pd.to_numeric(df[metric_col], errors="coerce")
            df = df.dropna(subset=[metric_col])
        
        config, text = self._get_config(chart_type, kwargs["group_by"], metric_col, df)

        config = config.dict()
        if chart_type == ChartType.PIE:
            df = df[df[metric_col] >= 0]

        # for v in df.columns:
        #     if v not in config.values():
        #         df = df.drop(columns=[v])

        full_output = {
            "data": df.to_dict(orient="records"),
            "chart_config": config,
            "title": kwargs.get("title", ""),
            "text": text,
            "result_cache_key": self._result_cache_key
        }

        if self.session:
            self.session.add_agent_logs(
                self._result_cache_key,
                logs=full_output
            )

        # 返第一条数据
        output = full_output.copy()
        output["data_sample"] = output["data"][:1]
        output["result_cache_key"] = self._result_cache_key

        # if self.session_type != "in_memory":
        del output["data"]

        if self.api_mode:
            return {
                "output": output,
                "full_output": full_output
            }
        else:
            return output

    def _run(
        self,
        run_manager: Optional[CallbackManagerForToolRun] = None,
        *args,
        **kwargs: Any
    ):
        asyncio.run(self._arun(run_manager=run_manager, *args, **kwargs))

    @async_construct_final_answer
    async def _arun(
        self,
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None,
        *args,
        **kwargs: Any
    ):
        try:
            result = self._draw(**kwargs)
            return result
        except Exception as e:
            logger.error(f"Json2Plot工具执行错误，实际错误为:{e}")
            traceback.print_exc()
            raise

    def handle_result(
        self,
        log: Dict[str, Any],
        ans_multiple: ToolMultipleResult
    ) -> None:
        if self.session:
            tool_res = self.session.get_agent_logs(
                self._result_cache_key
            )
            if tool_res:
                log["result"] = tool_res
                chart_data = tool_res["data"]
                if len(chart_data) > 0 and len(chart_data[0]) > 1:
                    ans_multiple.chart.append(tool_res)
                    ans_multiple.new_chart.append({
                        "title": tool_res["title"],
                        "data": {
                            "data": tool_res["data"],
                            "config": tool_res["config"],
                            "chart_config": tool_res["chart_config"]
                        }
                    })
                
                ans_multiple.cache_keys[self._result_cache_key] = {
                    "title": tool_res.get("title", "json2plot"),
                    "tool_name": "json2plot",
                    "chart_config": tool_res.get("chart_config", {}),
                }
    @classmethod
    @api_tool_decorator
    async def as_async_api_cls(
        cls,
        params: dict = Body(...),
        stream: bool = False,
        mode: str = "http"
    ):
        tool = cls(
            session_id=params.get("session_id", ""), 
            session_type=params.get("session_type", "redis"),
            api_mode=True
        )
        
        res = await tool.ainvoke(input=params)
        return res

    @staticmethod
    async def get_api_schema():
        inputs = {
            "title": "2024年1月1日到2024年1月3日，每天的销售额", 
            "chart_type": "Line",
            "group_by": ["报告时间(按年)"],
            "data_field": "营收收入指标",
            "tool_result_cache_key": "",
            "session_id": "123",
            "session_type": "in_memory",
            "data": []
        }

        outputs = {
            "output": {
                "config": {
                    "chart_type": "Column",
                    "xField": "报告时间(按年)",
                    "yField": "营收收入指标",
                    "colorField": "",
                    "angleField": ""
                },
                "chart_config": {
                    "xField": "报告时间(按年)",
                    "yField": "营收收入指标",
                    "seriesField": "报告类型",
                    "chart_type": "Column",
                    "groupField": ""
                },
                "title": "2024年1月1日到2024年1月3日，每天的销售额",
                "result_cache_key": "CACHE_KEY",
                "data_sample": [
                    {
                        "报告类型": "一季报",
                        "报告时间(按年)": "2015",
                        "营收收入指标": 12312312
                    }
                ]
            }
        }

        args = ArgsModel.schema()["properties"]

        return {
            "post": {
                "summary": ToolName.from_json2plot.value,
                "description": _TOOL_DESCS,
                "parameters": [
                    {
                        "name": "stream",
                        "in": "query",
                        "description": "是否流式返回",
                        "schema": {
                            "type": "boolean",
                            "default": False
                        },
                    },
                    {
                        "name": "mode",
                        "in": "query",
                        "description": "请求模式",
                        "schema": {
                            "type": "string",
                            "enum": ["http", "sse"],
                            "default": "http"
                        },
                    }
                ],
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "title": {
                                        "type": "string",
                                        "description": args["title"]["description"]
                                    },
                                    "chart_type": {
                                        "type": "string",
                                        "enum": ["Pie", "Line", "Column"],
                                        "description": args["chart_type"]["description"]
                                    },
                                    "group_by": {
                                        "type": "array",
                                        "description": args["group_by"]["description"],
                                        "items": {
                                            "type": "string"
                                        }
                                    },
                                    "data_field": {
                                        "type": "string",
                                        "description": args["data_field"]["description"]
                                    },
                                    "tool_result_cache_key": {
                                        "type": "string",
                                        "description": args["tool_result_cache_key"]["description"]
                                    },
                                    "session_id": {
                                        "type": "string",
                                        "description": "会话ID，用于标识和管理会话状态，同一会话ID可以共享历史数据和缓存"
                                    },
                                    "session_type": {
                                        "type": "string",
                                        "enum": ["in_memory", "redis"],
                                        "description": "会话类型，in_memory 表示内存存储（临时），redis 表示 Redis 存储（持久化）",
                                        "default": "redis"
                                    },
                                    "data": {
                                        "type": "array",
                                        "description": "用于作图的 JSON 数据，与 tool_result_cache_key 参数不能同时设置。如果 tool_result_cache_key 为空，则使用此参数。数据格式为对象数组，每个对象表示一条数据记录",
                                        "items": {
                                            "type": "object",
                                            "additionalProperties": {
                                                "type": ["string", "number"]
                                            }
                                        }
                                    },
                                    "timeout": {
                                        "type": "number",
                                        "description": "请求超时时间（秒），超过此时间未完成则返回超时错误，默认30秒",
                                        "default": 30
                                    }
                                },
                                "required": ["title", "chart_type", "group_by", "data_field"],
                                "example": inputs
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful operation",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "config": {
                                            "type": "object",
                                            "description": "基础图表配置，包含图表类型、坐标轴字段等基础信息",
                                        },
                                        "chart_config": {
                                            "type": "object",
                                            "description": "详细图表配置，包含完整的图表渲染参数，如 xField（X轴字段）、yField（Y轴字段）、seriesField（系列字段）、groupField（分组字段）等"
                                        },
                                        "title": {
                                            "type": "string",
                                            "description": "图表标题，用于前端展示"
                                        },
                                        "result_cache_key": {
                                            "type": "string",
                                            "description": "结果缓存键，用于从缓存中获取完整数据，前端可通过此键获取完整图表数据"
                                        },
                                        "data_sample": {
                                            "type": "array",
                                            "description": "数据样例，仅返回第一条数据用于预览，完整数据需通过 result_cache_key 从缓存获取",
                                            "items": {
                                                "type": "object"
                                            }
                                        }
                                    }
                                },
                                "example": outputs
                            }
                        }
                    }
                }
            }
        }


if __name__ == "__main__":
    from asyncio import run

    async def main():
        tool = Json2Plot(session_id="123", session_type="in_memory")
        
        # 原有的测试用例
        result1 = await tool.ainvoke({
            "title": "2024年1月1日到2024年1月3日，每天的销售额", 
            "last_tool_name": "text2metric",
            "group_by": ["报告时间(按年)"],
            "chart_type": "Line",
            "data_field": "营收收入指标",
            "data": [
                {
                    "报告类型": "一季报",
                    "报告时间(按年)": "2015",
                    "营收收入指标": 3426350080
                },
                {
                    "报告类型": "一季报",
                    "报告时间(按年)": "2016",
                    "营收收入指标": 2356389888
                },
                {
                    "报告类型": "一季报",
                    "报告时间(按年)": "2017",
                    "营收收入指标": 3707719936
                },
                {
                    "报告类型": "一季报",
                    "报告时间(按年)": "2018",
                    "营收收入指标": 4893289984
                },
                {
                    "报告类型": "一季报",
                    "报告时间(按年)": "2019",
                    "营收收入指标": 4968699904
                },
                {
                    "报告类型": "一季报",
                    "报告时间(按年)": "2020",
                    "营收收入指标": 3354010112
                },
                {
                    "报告类型": "一季报",
                    "报告时间(按年)": "2021",
                    "营收收入指标": 6216309760
                },
                {
                    "报告类型": "一季报",
                    "报告时间(按年)": "2022",
                    "营收收入指标": 7651369984
                },
                {
                    "报告类型": "一季报",
                    "报告时间(按年)": "2023",
                    "营收收入指标": 6580539904
                }
            ]
        })

        result2 = await tool._arun(
            title="2024年1月1日到2024年1月3日，每天的销售额", 
            chart_type="Line",
            group_by=["报告时间(按年)"],
            data_field="营收收入指标",
            data=[
                {"报告类型": "一季报", "报告时间(按年)": "2015", "营收收入指标": 3426350080},
            ],
            last_tool_name=""
        )
        
        # 新增只有一列数据的测试用例
        result3 = await tool.ainvoke({
            "title": "测试单列数据", 
            "chart_type": "Pie",
            "group_by": [],
            "last_tool_name": "",
            "data": [
                {"销售额": 100},
                {"销售额": 200},
                {"销售额": 150},
                {"销售额": 300},
                {"销售额": 250}
            ]
        })
        
        print("测试用例1结果:", json.loads(result1))
        print("\n测试用例2结果:", json.loads(result2))
        print("\n测试用例3结果:", json.loads(result3))

    run(main())

    app = FastAPI()

    class ChartRequest(BaseModel):
        title: str
        chart_type: str
        group_by: List[str] = []
        data_field: str = ""
        data: List[Dict[str, Any]] = []
        last_tool_name: str = ""

    @app.post("/generate-chart")
    async def generate_chart(request: ChartRequest):
        try:
            # 调用异步类方法
            result = await Json2Plot.as_async_api_cls(request.dict())
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

