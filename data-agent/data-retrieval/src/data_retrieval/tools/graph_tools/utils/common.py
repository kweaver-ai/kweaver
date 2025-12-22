# -*- coding:utf-8 -*-
import asyncio
import gettext
import inspect
import os
from concurrent.futures import ThreadPoolExecutor
from enum import Enum
from gettext import gettext as _l
from typing import Callable
from typing import Tuple
from urllib.parse import urlparse

import pandas as pd
from fastapi import Request
from pandas import DataFrame
from pydantic import BaseModel

cur_pwd = os.getcwd()


def GetCallerInfo() -> Tuple[str, int]:
    """ 获取调用者文件项目相对位置以及行号 """
    caller_frame = inspect.stack()[2]
    caller_filename = caller_frame.filename.split(cur_pwd)[-1][1:]
    caller_lineno = caller_frame.lineno
    return caller_filename, caller_lineno


def IsInPod() -> bool:
    return 'KUBERNETES_SERVICE_HOST' in os.environ and 'KUBERNETES_SERVICE_PORT' in os.environ


# 触发熔断的失败次数
failureThreshold = 10


def GetFailureThreshold() -> int:
    return failureThreshold


def SetFailureThreshold(time: int):
    global failureThreshold
    failureThreshold = time


# 熔断触发后的再次重试间隔，单位：秒
recoveryTimeout = 5


def GetRecoveryTimeout() -> int:
    return recoveryTimeout


def SetRecoveryTimeout(time: int):
    global recoveryTimeout
    recoveryTimeout = time


_l = gettext.gettext


def set_lang(lang):
    global _l
    _l = lang


def get_lang():
    return _l


def GetRequestLangFunc(request: Request) -> Callable[..., str]:
    lang = request.headers.get("accept-language", "en")
    if lang.startswith("zh"):
        return gettext.translation('messages', localedir='app/common/international', languages=['zh']).gettext
    return gettext.gettext


def GetUnknowError(fileName: str, funcName: str, details: str, _l: Callable[..., str]) -> dict:
    errorRes = {
        "Description": _l("Unknown error occurred!"),
        "Solution": _l("Please check the service."),
        "ErrorCode": "ADTask.{}.{}.UnknownError".format(ConvertToCamelCase(fileName), ConvertToCamelCase(funcName)),
        "ErrorDetails": details,
        "ErrorLink": ""
    }
    return errorRes


def ConvertToCamelCase(string: str):
    """ 字符串的下划线格式，小驼峰格式转为大驼峰模式，不支持非下划线全小写(helloworld)转大驼峰"""
    if not isinstance(string, str):
        return None

    words = string.split('_')
    capitalized_words = []
    for word in words:
        if len(word) == 1:
            capitalized_words.append(word.upper())
        elif len(word) > 1:
            capitalized_words.append(word[0].upper() + word[1:])
    return ''.join(capitalized_words)


def GetUserIDByRequest(request: Request) -> str:
    return request.headers.get("userId", "")


def convert_to_valid_class_name(name: str) -> str:
    """ 将字符串转换为合法的类名 """
    if not name:
        return ""
    # 将特殊字符替换为下划线
    name = ''.join(c if c.isalnum() else '_' for c in name)
    if name[0].isdigit():
        name = "_" + name
    return name


def truncate_by_byte_len(text: str, length: int = 65535) -> str:
    '''
    将文本按照指定字节长度进行截断
    Args:
        text: str, 待截断的文本
        length: int, 截断的字节长度，默认值65535是数据库text类型的长度
    '''
    char_length = min(len(text), length)
    # 计算截断的位置
    while len(text[:char_length].encode('utf-8')) > length:
        char_length -= 1
    return text[:char_length]


def create_subclass(base_class, class_name, class_attributes):
    """ 使用type动态创建子类 """
    return type(
        class_name,  # 新子类的名称
        (base_class,),  # 继承的父类元组
        class_attributes  # 子类属性和方法
    )


def is_valid_url(url):
    """ 判断是否为有效的URL地址 """
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False


def func_judgment(func: object):
    """
    Determine whether a function is streamed back and whether it is asynchronous.
    Args:
        func: object, Function object.
    Returns:
        asynchronous: Bool
        stream: Bool
    """
    asynchronous = False
    stream = False
    if inspect.iscoroutinefunction(func):
        asynchronous = True
        if inspect.isasyncgenfunction(func):
            stream = True
    else:
        if inspect.isgeneratorfunction(func):
            stream = True
    if inspect.isasyncgenfunction(func):
        asynchronous = True
        stream = True
    return asynchronous, stream


def sync_wrapper(async_func, *args, **kwargs):
    """ 在同步函数中调用异步函数 """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(async_func(*args, **kwargs))
    loop.close()
    return result


def run_async_in_thread(async_func, *args, **kwargs):
    """ 在单独的线程中运行异步函数 """
    with ThreadPoolExecutor() as executor:
        future = executor.submit(sync_wrapper, async_func, *args, **kwargs)
        return future.result()


def make_json_serializable(o):
    """ 将不可json序列化的对象转为可json序列化的对象 """
    if isinstance(o, list):
        for i, item in enumerate(o):
            o[i] = make_json_serializable(item)
    elif isinstance(o, tuple):
        o = make_json_serializable(list(o))
    elif isinstance(o, dict):
        for k, v in o.items():
            if k == 'embedding' and isinstance(v, list):
                o[k] = None
                continue
            o[k] = make_json_serializable(v)
    elif isinstance(o, BaseModel):
        o = o.model_dump()
        o = make_json_serializable(o)
    elif isinstance(o, Enum):
        o = o.value
        o = make_json_serializable(o)
    elif isinstance(o, DataFrame):
        o = o.to_dict(orient='records')
        o = make_json_serializable(o)
    elif isinstance(o, float):
        if pd.isna(o):
            o = None
    return o
