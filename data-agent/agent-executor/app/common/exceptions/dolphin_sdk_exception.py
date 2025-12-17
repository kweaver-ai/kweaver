"""
Dolphin SDK 异常
"""

from typing import Optional

from app.common.exceptions.base_exception import BaseException
from app.common.errors.custom_errors_pkg import (
    DolphinSDKModelError,
    DolphinSDKSkillError,
    DolphinSDKBaseError,
)
from DolphinLanguageSDK.exceptions import (
    ModelException,
    SkillException,
    DolphinException,
)


class DolphinSDKException(BaseException):
    """
    Dolphin SDK 异常

    将 Dolphin SDK 的原生异常包装为项目的异常格式
    """

    exception_to_error_map = {
        ModelException: DolphinSDKModelError,
        SkillException: DolphinSDKSkillError,
        DolphinException: DolphinSDKBaseError,
    }

    def __init__(
        self,
        raw_exception: Exception,
        agent_id: Optional[str],
        session_id: Optional[str],
        user_id: Optional[str] = None,
    ):
        """
        初始化 Dolphin SDK 异常

        Args:
            raw_exception: 原始异常对象
            agent_id: Agent ID
            session_id: 会话 ID
            user_id: 用户 ID
        """
        # 根据原始异常类型选择错误定义
        error_func = DolphinSDKBaseError  # 默认值
        for exception_class, error_func_mapped in self.exception_to_error_map.items():
            if isinstance(raw_exception, exception_class):
                error_func = error_func_mapped
                break

        # error_func() 会自动从 Config 获取 debug 模式
        super().__init__(
            error=error_func(),
            error_details=f"dolphinsdk exception, details: [{str(raw_exception)}], context info: [agent_id: {agent_id}, session_id: {session_id}, user_id: {user_id}]",
            error_link="",
        )
