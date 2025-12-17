"""
错误和异常模块

提供统一的错误定义和异常类体系

- 错误定义（errors）：定义各类错误的错误码、描述和解决方案
- 异常类（exceptions）：用于抛出和捕获的异常对象

向后兼容：
    为了保持向后兼容性，这里同时导出了旧的异常类和新的异常类
    新代码应该使用 app.common.exceptions 中的异常类
"""

# 导入错误定义
from app.common.errors.api_error_class import APIError
from app.common.errors.custom_errors_pkg import (
    ParamError,
    AgentPermissionError,
    DolphinSDKModelError,
    DolphinSDKSkillError,
    DolphinSDKBaseError,
    ConversationRunningError,
)
from app.common.errors.external_errors import ExternalServiceError
from app.common.errors.file_errors import AgentExecutor_File_ParseError
from app.common.errors.function_errors import (
    AgentExecutor_Function_CodeError,
    AgentExecutor_Function_InputError,
    AgentExecutor_Function_RunError,
    AgentExecutor_Function_OutputError,
)

# 导入新的异常类（推荐使用）
from app.common.exceptions import (
    BaseException,
    CodeException,
    ParamException,
    AgentPermissionException,
    DolphinSDKException,
    ConversationRunningException,
)

__all__ = [
    # 错误定义
    "APIError",
    "ParamError",
    "AgentPermissionError",
    "DolphinSDKModelError",
    "DolphinSDKSkillError",
    "DolphinSDKBaseError",
    "ConversationRunningError",
    "ExternalServiceError",
    "AgentExecutor_File_ParseError",
    "AgentExecutor_Function_CodeError",
    "AgentExecutor_Function_InputError",
    "AgentExecutor_Function_RunError",
    "AgentExecutor_Function_OutputError",
    # 异常类
    "BaseException",
    "CodeException",
    "ParamException",
    "AgentPermissionException",
    "DolphinSDKException",
    "ConversationRunningException",
]
