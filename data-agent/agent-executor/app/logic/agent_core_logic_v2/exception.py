from typing import Any, Dict

from app.common.struct_logger import struct_logger
import app.common.stand_log as log_oper
import sys
import traceback

from app.utils.common import (
    get_format_error_info,
)


class ExceptionHandler:
    @classmethod
    async def handle_exception(
        cls, exc: Exception, res: Dict[str, Any], headers: Dict[str, str]
    ) -> None:
        """处理异常

        Args:
            exc: 异常对象
            res: 结果字典
            headers: HTTP请求头
        """

        message = "agent run failed: {}".format(repr(exc))

        # 打印到控制台
        error_log = log_oper.get_error_log(
            repr(exc), sys._getframe(), traceback.format_exc()
        )
        struct_logger.console_logger.error(error_log)

        if not isinstance(res, dict):
            res = {}

        res["error"] = await get_format_error_info(headers, exc)
        res["status"] = "Error"
