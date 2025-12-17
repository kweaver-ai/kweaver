import sys
import traceback
from typing import Any, Dict

import app.common.stand_log as log_oper
from app.common.stand_log import StandLogger
from app.utils.common import (
    get_format_error_info,
)


class ExceptionHandler:
    @classmethod
    async def handle_exception(
        cls, e: Exception, res: Dict[str, Any], headers: Dict[str, str]
    ) -> None:
        """处理异常

        Args:
            e: 异常对象
            res: 结果字典
            headers: HTTP请求头
        """

        message = "agent run failed: {}".format(repr(e))

        error_log = log_oper.get_error_log(
            message, sys._getframe(), traceback.format_exc()
        )

        StandLogger.error(error_log, log_oper.SYSTEM_LOG)

        if not isinstance(res, dict):
            res = {}

        res["error"] = await get_format_error_info(headers, e)
        res["status"] = "Error"
