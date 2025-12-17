async def calculate_expression(
    inputs, props, resource, data_source_config, context=None
):
    """计算数学表达式的接口"""
    try:
        result = eval(inputs["expression"], {"__builtins__": {}}, {})
        return {"expression": inputs["expression"], "result": result}
    except Exception as e:
        raise Exception(f"计算表达式时出错: {str(e)}")
