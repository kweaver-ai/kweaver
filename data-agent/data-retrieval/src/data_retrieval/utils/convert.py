# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2025-4-10
from typing import Any, Dict, Optional, Union, List
import json
import pandas as pd
import numpy as np
from datetime import datetime, date, time
from decimal import Decimal
from enum import Enum


def _handle_pandas(obj: Any) -> Dict:
    """处理 pandas 对象"""
    if isinstance(obj, pd.DataFrame):
        return obj.to_dict(orient='records')
    if isinstance(obj, pd.Series):
        return obj.to_dict()
    if isinstance(obj, pd.Timestamp):
        return obj.strftime("%Y-%m-%d %H:%M:%S")
    return None


def _handle_numpy(obj: Any) -> Any:
    """处理 numpy 对象"""
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
                      np.int16, np.int32, np.int64, np.uint8,
                      np.uint16, np.uint32, np.uint64)):
        return int(obj)
    if isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
        return float(obj)
    if isinstance(obj, np.bool_):
        return bool(obj)
    return None


def _handle_datetime(obj: Any) -> str:
    """处理日期时间对象"""
    if isinstance(obj, (datetime, date)):
        return obj.strftime("%Y-%m-%d")
    if isinstance(obj, time):
        return obj.strftime("%H:%M:%S")
    return None


def to_dict(obj: Any) -> Dict:
    """
    将任何对象转换为字典格式
    
    Args:
        obj: 需要转换的对象
        
    Returns:
        Dict: 转换后的字典
        
    Examples:
        >>> data = {
        ...     'str': '字符串',
        ...     'int': 123,
        ...     'float': 3.14,
        ...     'list': [1, 2, 3],
        ...     'dict': {'a': 1, 'b': 2},
        ...     'set': {1, 2, 3},
        ...     'tuple': (1, 2, 3),
        ...     'none': None,
        ...     'pandas_df': pd.DataFrame({'A': [1, 2], 'B': [3, 4]}),
        ...     'numpy_array': np.array([1, 2, 3]),
        ...     'datetime': datetime.now(),
        ...     'timestamp': pd.Timestamp('2024-01-01')
        ... }
        >>> result = to_dict(data)
        >>> print(json.dumps(result, indent=2, ensure_ascii=False))
    """
    if obj is None or obj is np.nan:
        return None
        
    # 基本类型直接返回
    if isinstance(obj, (str, int, float, bool)):
        return obj
        
    # 处理特殊类型
    result = _handle_pandas(obj)
    if result is not None:
        return result
        
    result = _handle_numpy(obj)
    if result is not None:
        return result
        
    result = _handle_datetime(obj)
    if result is not None:
        return result
        
    # 处理 Decimal
    if isinstance(obj, Decimal):
        return float(obj)
        
    # 处理 Enum
    if isinstance(obj, Enum):
        return obj.value
        
    # 处理字典
    if isinstance(obj, dict):
        return {k: to_dict(v) for k, v in obj.items()}
        
    # 处理序列
    if isinstance(obj, (list, tuple, set)):
        return [to_dict(item) for item in obj]

    # 处理自定义对象
    if hasattr(obj, 'to_json'):
        return json.loads(obj.to_json())
    if hasattr(obj, 'to_dict'):
        return obj.to_dict()
    if hasattr(obj, '__dict__'):
        return {k: to_dict(v) for k, v in obj.__dict__.items()}
        
    # 其他情况转为字符串
    return str(obj)


def to_json(obj: Any, indent: Optional[int] = None, ensure_ascii: bool = False) -> str:
    """
    将对象转换为 JSON 字符串
    
    Args:
        obj: 需要转换的对象
        indent: JSON 缩进，默认为 None
        ensure_ascii: 是否确保 ASCII 编码，默认为 False
        
    Returns:
        str: JSON 字符串
        
    Examples:
        >>> data = {'key': '值'}
        >>> json_str = to_json(data, indent=2)
        >>> print(json_str)
    """
    try:
        return json.dumps(to_dict(obj), indent=indent, ensure_ascii=ensure_ascii)
    except Exception as e:
        # 处理 DataFrame 特殊情况
        if isinstance(obj, pd.DataFrame):
            df_copy = obj.copy()
            for col in df_copy.columns:
                if pd.api.types.is_datetime64_any_dtype(df_copy[col]):
                    df_copy[col] = df_copy[col].dt.strftime("%Y-%m-%d %H:%M:%S")
                elif df_copy[col].dtype == 'object':
                    df_copy[col] = df_copy[col].astype(str)
            return json.dumps(df_copy.to_dict(orient='records'), indent=indent, ensure_ascii=ensure_ascii)
        return json.dumps(str(obj), indent=indent, ensure_ascii=ensure_ascii)
    

def to_str(obj: Any) -> str:
    """
    将对象转换为字符串
    """
    return str(obj)

