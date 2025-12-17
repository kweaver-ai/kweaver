"""
工具箱创建功能模块
"""
import requests

from data_migrations.init.tools.tool_box_configs import API_BASE_URL


def add_tool_box(tool_box_config: dict) -> dict:
    """
    添加工具箱
    
    Args:
        tool_box_config: 工具箱配置，包含box_name、box_desc等字段
        
    Returns:
        dict: 添加结果，包含工具箱信息
        
    Raises:
        Exception: 当API调用失败时抛出异常，包含错误信息
        
    Examples:
        >>> config = {
        ...     "box_name": "测试工具箱",
        ...     "box_desc": "用于测试的工具箱",
        ...     "files": [...]
        ... }
        >>> result = add_tool_box(config)
        >>> if result:
        ...     print(f"工具箱创建成功: {result.get('box_id')}")
        >>> else:
        ...     print("工具箱创建失败")
    """
    url = f"{API_BASE_URL}/tool-box/intcomp"
    # 复制配置以避免修改原始数据
    config_copy = tool_box_config.copy()
    files = config_copy.pop("files")

    response = requests.request("POST", url, data=config_copy, files=files)

    if response.status_code // 100 == 2:
        print(f"Add built-in tool-box {config_copy['box_name']} success")
        return response.json()
    else:
        error_msg = f"Error adding built-in tool-box {config_copy['box_name']}: {response.status_code} {response.text}"
        raise Exception(error_msg)
