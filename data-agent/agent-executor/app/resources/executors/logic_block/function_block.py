import copy

from app.common.stand_log import StandLogger
from app.logic.file_service import file_service
from app.logic.function_service import function_service
from app.utils.text_parser import get_real_value


async def run_func(inputs, props, resource, data_source_config=None, context=None):
    """
    核心逻辑函数
    Args:
        inputs: Dict, 输入
        props：Dict, Executor属性，计算过程中的某些参数，由Executor的props传入
        resource: Dict, 该函数所需要的资源，无需资源时，为None或{}
    Return:
        outputs: Dict, 执行结果
        key_process: 关键执行过程（解释说明）
    """
    StandLogger.info_log("进入函数逻辑块")
    code = props.get("code", "")
    StandLogger.info_log(f"code = {code}")
    inputs = props.get("inputs", [])
    StandLogger.info_log(f"inputs = {inputs}")
    """ inputs 示例
    [
        {
            "key": "main_arg1",
            "value": {
                "from": "input",
                "name": "query",
                "type": "string"
            }
        },
        {
            "key": "main_arg2",
            "value": {
                "from": "input",
                "name": "query",
                "type": "string"
            }
        }
    ]
    """
    output_name = props["output"]
    headers = props.get("headers", {})
    debug = context.get("debug", False)

    # 已经有逻辑块得到最终答案
    if context.get("answer_found"):
        output = {output_name: ""}
        context["variables"][output_name] = output[output_name]
        executor_output = {
            "stream_fields": [],
            "outputs": output,
            "key_process": "之前的逻辑块已得出最终结果，跳过本逻辑块",
        }
        yield executor_output
        return

    # 处理函数输入
    input_values = {}
    for input_item in inputs:
        value_name = input_item["value"]["name"]
        if input_item["value"]["type"] == "file":
            file_infos = context.get("variables", {}).get(value_name)
            # 获取文件内容
            await file_service.get_file_content(file_infos, headers)
            # 更新至context
            context["variables"][value_name] = file_infos
        input_values[input_item["key"]], _ = await get_real_value(
            value_name, copy.deepcopy(context)
        )

    # 运行函数
    context["variables"][output_name] = ""
    StandLogger.info_log(f"input_values = {input_values}")
    if not debug:
        async for item, print_output in function_service.run_code(code, input_values):
            StandLogger.debug(f"函数运行结果: {item}")
            if isinstance(item, Exception):
                raise item
            context["variables"][output_name] = item
            executor_output = {
                "stream_fields": [],
                "outputs": {output_name: item},
                "key_process": "函数块的输出",
            }
            yield executor_output
    else:
        debug_info = {"stdout": ""}
        async for item, print_output in function_service.run_code(code, input_values):
            StandLogger.debug(f"函数运行结果: {item}")
            if isinstance(item, Exception):
                raise item
            context["variables"][output_name] = item
            debug_info["stdout"] += print_output
            executor_output = {
                "stream_fields": [],
                "outputs": {output_name: item, "debug_info": debug_info},
                "key_process": "函数块的输出",
            }
            yield executor_output


class FunctionBlock(object):
    cls_type = "Executor"
    INPUT_TYPE = {}
    OUTPUT_TYPE = {}
    DEFAULT_PROPS = {}
    INIT_FUNC = None
    BEFORE_DESTROY = None
    RUN_FUNC = run_func
