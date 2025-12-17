# -*- coding: utf-8 -*-
# errors
#
# @Time: 2023/12/25
# @Author: Xavier.chen
# @File: error.py

from enum import Enum
from typing import Optional


from functools import wraps
def handle_sdk_error(error_message, error_type):
    """同步方法的错误处理装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            try:
                return func(self, *args, **kwargs)
            except DIPServiceError as e:
                raise error_type(e, error_message)
        return wrapper
    return decorator

def handle_sdk_error_async(error_message, error_type):
    """异步方法的错误处理装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(self, *args, **kwargs):
            try:
                return await func(self, *args, **kwargs)
            except Exception as e:
                raise error_type(e, error_message)
        return wrapper
    return decorator

class Errno(Enum):
    """Error code."""
    BASE_ERR = 0
    CONN_ERR = 1
    BUILDER_ERROR = 2
    COG_ENGINE_ERROR = 3
    OPEN_SEARCH_ERROR = 10
    ALG_SERVER_ERROR = 11
    MODEL_FACTORY_ERROR = 12


Errors = {
    Errno.BASE_ERR.value: "BaseError",
    Errno.CONN_ERR.value: "TestConnetionError",
    Errno.BUILDER_ERROR.value: "BuilderAPIError",
    Errno.COG_ENGINE_ERROR.value: "CognitiveEgnineError",
    Errno.OPEN_SEARCH_ERROR.value: "OpenSearchError",
    Errno.ALG_SERVER_ERROR.value: "AlgServerError",
    Errno.MODEL_FACTORY_ERROR.value: "ModelFactoryError"
}


class DIPServiceError(Exception):
    """SDK error."""
    code: Enum
    status: int
    reason: Optional[str]
    url: Optional[str]
    detail: Optional[dict]

    def __init__(
        self,
        status=0,
        code=Errno.BASE_ERR.value,
        reason="",
        url="",
        detail={},
        message=""
    ):
        super().__init__()
        self.code = code
        self.status = status
        self.reason = reason
        self.url = url
        self.detail = detail
        self.message = message

    def __str__(self):
        return f"""{Errors[self.code]}:
- Code: {self.code}
- Status: {self.status}
- Reason: {self.reason}
- URL: {self.url}
- Detail: {self.detail}
- Message: {self.message}
        """

    def json(self):
        """Return json format of error."""
        return {
            "code": self.code,
            "status": self.status,
            "reason": self.reason,
            "url": self.url,
            "detail": self.detail,
            "message": self.message
        }        


class BuilderError(DIPServiceError):
    """Error from builder."""

    def __init__(self, e: DIPServiceError, message: str=""):
        super().__init__(
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )

        self.message = message
        e.code = Errno.BUILDER_ERROR


class CommonError(DIPServiceError):
    """Error from common calls."""
    def __init__(self, e: DIPServiceError, message: str=""):
        super().__init__(
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )

        self.message = message
        e.code = Errno.BASE_ERR


class CogEngineError(DIPServiceError):
    """Error from Cognitive Engine calls."""
    def __init__(self, e: DIPServiceError, message: str=""):
        super().__init__(
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )

        self.message = message
        e.code = Errno.COG_ENGINE_ERROR


class AlgServerError(DIPServiceError):
    """Error from AlgServer calls."""
    def __init__(self, e: DIPServiceError, message: str=""):
        super().__init__(
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )

        self.message = message
        e.code = Errno.ALG_SERVER_ERROR


class ModelFactoryError(DIPServiceError):
    """Error from ModelFactory calls."""
    def __init__(self, e: DIPServiceError, message: str=""):
        super().__init__(
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )

        self.message = message
        e.code = Errno.MODEL_FACTORY_ERROR
