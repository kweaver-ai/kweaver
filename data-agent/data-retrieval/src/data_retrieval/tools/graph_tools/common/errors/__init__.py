import gettext
import json
from typing import Callable

from data_retrieval.tools.graph_tools.common.errors.common_errors import *
from data_retrieval.tools.graph_tools.common.errors.external_errors import *
from data_retrieval.tools.graph_tools.common.errors.file_errors import *
from data_retrieval.tools.graph_tools.common.errors.function_errors import *


class CodeException(Exception):
    error: dict = None
    errorDetails: str = None
    errorLink: str = None
    description: str = None

    def __init__(
        self,
        error: dict,
        errorDetails: str = "",
        errorLink: str = "",
        description: str = "",
    ):
        """Description, Solution 与 ErrorCode 强相关，创建时无需赋值"""
        super().__init__(str(error))
        self.error = error
        self.errorDetails = errorDetails
        self.errorLink = errorLink
        self.description = description

    def FormatHttpError(self, tr: Callable[..., str] = gettext.gettext) -> dict:
        # 获取code对应的http错误
        errorCode = self.error.get("ErrorCode", "ADTask.Common.Common.UnknownError")

        if self.description:
            description = tr(self.description)
        elif self.error.get("Description", "") != "":
            description = tr(self.error.get("Description"))
        elif self.errorDetails != "":
            description = tr(self.errorDetails)
        else:
            description = errorCode

        if self.errorDetails != "":
            error_details = self.errorDetails
        else:
            error_details = self.error.get("Description", errorCode)
        if isinstance(error_details, str):
            error_details = tr(error_details)
        return {
            "description": description,
            "error_code": errorCode,
            "error_details": error_details,
            "error_link": self.errorLink,
            "solution": tr(self.error.get("Solution", "Please check the service.")),
        }

    def __repr__(self):
        return json.dumps(self.FormatHttpError(), ensure_ascii=False)

    def __str__(self):
        return json.dumps(self.FormatHttpError(), ensure_ascii=False)


class ParamException(Exception):
    error: dict = None
    errorDetails: str = None
    errorLink: str = None

    def __init__(self, errorDetails: str = "", errorLink: str = ""):
        """Description, Solution 与 ErrorCode 强相关，创建时无需赋值"""
        super().__init__(str(ADTask_ParamError))
        self.error = ADTask_ParamError
        self.errorDetails = errorDetails
        self.errorLink = errorLink

    def FormatHttpError(self, tr: Callable[..., str] = gettext.gettext) -> dict:
        # 获取code对应的http错误
        errorCode = self.error.get("ErrorCode", "ADTask.Common.Common.UnknownError")
        return {
            "description": tr(self.error.get("Description", errorCode)),
            "error_code": errorCode,
            "error_details": (
                tr(self.errorDetails)
                if self.errorDetails != ""
                else tr(self.error.get("Description", errorCode))
            ),
            "error_link": self.errorLink,
            "solution": tr(self.error.get("Solution", "Please check the service.")),
        }

    def __repr__(self):
        return json.dumps(self.FormatHttpError(), ensure_ascii=False)

    def __str__(self):
        return json.dumps(self.FormatHttpError(), ensure_ascii=False)
