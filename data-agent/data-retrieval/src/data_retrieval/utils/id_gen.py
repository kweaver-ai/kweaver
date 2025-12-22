import uuid
import base64
import re
from decimal import Decimal, getcontext


def generate_task_id():
    """生成任务ID并转义特殊字符
    
    Returns:
        str: 转义后的任务ID
    """
    # 生成基础ID，使用bytes确保是二进制格式
    raw_id = base64.b64encode(uuid.uuid4().bytes).decode("utf-8")
    
    # 转义特殊字符: +, /, =
    escaped_id = raw_id.replace("+", "-").replace("/", "_").replace("=", "")
    
    return escaped_id


def format_number(number):
    """格式化数值，避免使用科学计数法
    
    Args:
        number: 需要格式化的数值
        
    Returns:
        str: 格式化后的数值字符串
    """
    if isinstance(number, (int, float)):
        # 设置decimal的上下文，禁用科学计数法
        getcontext().prec = 28  # 设置精度
        return str(Decimal(str(number)))
    return str(number)


