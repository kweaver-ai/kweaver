import ast
import json
from json import JSONDecodeError
from typing import Any, List

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.common.config import Config
from app.common.stand_log import StandLogger
from app.logic.function_service import function_service


router = APIRouter(prefix=Config.app.host_prefix + "/function", tags=["agent-executor"])


class ParseCodeParam(BaseModel):
    code: str = Field(
        ...,
        title="代码内容",
        description="代码内容",
        example="def main(a, b):\n    return a+b",
    )


class ParseCodeResponse_1(BaseModel):
    name: str = Field(
        ...,
        title="参数名称",
        description="不包含*args（变长参数）和**kwargs（关键字参数字段）",
    )
    type: str = Field(
        ...,
        title="参数类型",
        description="""1. 根据类型注解返回。没有转为json基本类型，有可能返回自定义类型
2. 根据默认值推断数据类型
3. 以上都没有则不返回""",
    )
    default: str = Field(
        ...,
        title="参数默认值",
        description="""1. 若无默认值则不返回
2. 默认值已处理为json格式。
3. 如果不能转为json，则不返回""",
    )


class ParseCodeResponse(BaseModel):
    res: List[ParseCodeResponse_1] = Field(
        ...,
        title="返回结果",
        description="返回结果",
        example=[
            {"name": "a", "type": "str", "default": '"a"'},
            {"name": "b", "type": "int", "default": "1"},
        ],
    )


@router.post("/parse", summary="解析代码", response_model=ParseCodeResponse)
async def parse_code(param: ParseCodeParam):
    """解析代码，返回main函数参数"""
    StandLogger.debug(f"parse_code parameters: {param.model_dump_json()}")
    res = await function_service.get_main_func_params(param.code)

    return JSONResponse(status_code=200, content={"res": res})


class RunCodeInputParam(BaseModel):
    name: str = Field(..., alias="key", title="参数名", description="参数名")
    value: str = Field(
        ...,
        title="参数值",
        description="需要以json格式的字符串输入，如果json解析失败，则当作字符串进行处理",
    )


class RunCodeParam(BaseModel):
    code: str = Field(
        ...,
        title="代码内容",
        description="代码内容",
        example="def main(a, b):\n    return a+b",
    )
    inputs: List[RunCodeInputParam] = Field(
        ...,
        title="输入参数",
        description="输入参数",
        example=[{"key": "a", "value": "1"}, {"key": "b", "value": "2"}],
    )


class RunCodeResponse(BaseModel):
    res: Any = Field(
        ...,
        title="函数执行结果",
        description="函数执行结果。没有转为字符串，按照原格式输出",
        example=3,
    )
    stdout: str = Field(
        ...,
        title="print标准输出内容",
        description="print标准输出内容",
        example="这里是print的内容\n",
    )


@router.post("/run", summary="运行代码", response_model=RunCodeResponse)
async def run_code(param: RunCodeParam):
    """运行代码"""
    StandLogger.debug(f"run_code parameters: {param.model_dump_json()}")

    code = param.code
    inputs = param.inputs

    # 将 inputs 转为字典
    input_values = {}
    for i in inputs:
        try:
            value = json.loads(i.value)
        except (JSONDecodeError, TypeError):
            try:
                value = ast.literal_eval(i.value)
            except:
                value = str(i.value)
        input_values[i.name] = value

    res_list = []
    stdout = ""
    async for item, print_output in function_service.run_code(code, input_values):
        if isinstance(item, Exception):
            raise item
        res_list.append(item)
        stdout += print_output

    res = None
    if len(res_list) == 1:
        res = res_list[0]
    elif len(res_list) > 1:
        res = "\n\n".join([f"data: {i}" for i in res_list])

    return JSONResponse(status_code=200, content={"res": res, "stdout": stdout})
