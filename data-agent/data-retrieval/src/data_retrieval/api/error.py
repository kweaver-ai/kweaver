from enum import Enum
from typing import Optional


class DataSourceErrno(Enum):
    """Error code."""
    BASE_ERROR = 0
    VIR_ENGINE_ERROR = 1
    CONFIG_CENTER_ERROR = 2
    COGNITIVE_SEARCH_ERROR = 3
    FRONTEND_COLUMN_ERROR = 4
    FRONTEND_COMMON_ERROR = 5
    FRONTEND_SAMPLE_ERROR = 6
    LLM_EXEC_ERROR = 7
    INVALID_PARAM_ERROR = 8
    INDICATOR_DESC_ERROR = 9
    INDICATOR_DETAIL_ERROR = 10
    INDICATOR_QUERY_ERROR = 11
    DATA_MODEL_DETAIL_ERROR = 12
    DATA_MODEL_QUERY_ERROR = 13
    AGENT_RETRIEVAL_ERROR = 14

Errors = {
    DataSourceErrno.BASE_ERROR: "RequestsError",
    DataSourceErrno.VIR_ENGINE_ERROR: "VirEngineError",
    DataSourceErrno.CONFIG_CENTER_ERROR: "ConfigCenterError",
    DataSourceErrno.COGNITIVE_SEARCH_ERROR: "CognitiveSearchError",
    DataSourceErrno.FRONTEND_COLUMN_ERROR: "FrontendColumnError",
    DataSourceErrno.FRONTEND_COMMON_ERROR: "FrontendCommonError",
    DataSourceErrno.FRONTEND_SAMPLE_ERROR: "FrontendSampleError",
    DataSourceErrno.LLM_EXEC_ERROR: "LLMExecError",
    DataSourceErrno.INDICATOR_DESC_ERROR: "IndicatorDescError",
    DataSourceErrno.INDICATOR_DETAIL_ERROR: "IndicatorDetailError",
    DataSourceErrno.INDICATOR_QUERY_ERROR: "IndicatorQueryError",
    DataSourceErrno.DATA_MODEL_DETAIL_ERROR: "DataModelDetailError",
    DataSourceErrno.DATA_MODEL_QUERY_ERROR: "DataModelQueryError",
    DataSourceErrno.AGENT_RETRIEVAL_ERROR: "AgentRetrievalError"
}

class AfDataSourceError(Exception):
    code: Enum
    status: int
    reason: Optional[str]
    url: Optional[str]
    detail: Optional[dict]

    def __init__(
            self,
            status=500,
            code: Enum = 0,
            reason="",
            url="",
            detail: dict = None
    ):
        super().__init__()
        self.code = code
        self.status = status
        self.reason = reason
        self.url = url
        self.detail = detail

    def __str__(self):
        return f"\n" \
               f"- Code: {self.code}\n" \
               f"- Status: {self.status}\n" \
               f"- Reason: {self.reason}\n" \
               f"- URL: {self.url} \n" \
               f"- Detail: {self.detail}\n"

    def json(self):
        """Return json format of error."""
        return {
            "code": self.code,
            "status": self.status,
            "reason": self.reason,
            "url": self.url,
            "detail": self.detail
        }



class Text2SQLError(Exception):
    code: Enum
    status: int
    reason: Optional[str]
    url: Optional[str]
    detail: Optional[dict]

    def __init__(
            self,
            status=0,
            code: Enum = 0,
            reason="",
            url="",
            detail: dict = None
    ):
        super().__init__()
        self.code = code
        self.status = status
        self.reason = reason
        self.url = url
        self.detail = detail

    def __str__(self):
        return f"\n" \
               f"- Code: {self.code}\n" \
               f"- Status: {self.status}\n" \
               f"- Reason: {self.reason}\n" \
               f"- URL: {self.url} \n" \
               f"- Detail: {self.detail}\n"

    def json(self):
        """Return json format of error."""
        return {
            "code": self.code,
            "status": self.status,
            "reason": self.reason,
            "url": self.url,
            "detail": self.detail
        }


class VirEngineError(AfDataSourceError):
    def __init__(self, e: AfDataSourceError):
        super().__init__(
            code=DataSourceErrno.VIR_ENGINE_ERROR,
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )


class CognitiveSearchError(AfDataSourceError):
    def __init__(self, e: AfDataSourceError):
        super().__init__(
            code=DataSourceErrno.COGNITIVE_SEARCH_ERROR,
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )


class FrontendColumnError(AfDataSourceError):
    def __init__(self, e: AfDataSourceError):
        super().__init__(
            code=DataSourceErrno.FRONTEND_COLUMN_ERROR,
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )


class FrontendSampleError(AfDataSourceError):
    def __init__(self, e: AfDataSourceError):
        super().__init__(
            code=DataSourceErrno.FRONTEND_SAMPLE_ERROR,
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )


class FrontendCommonError(AfDataSourceError):
    def __init__(self, e: AfDataSourceError):
        super().__init__(
            code=DataSourceErrno.FRONTEND_COMMON_ERROR,
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )


class ConfigCenterError(AfDataSourceError):
    def __init__(self, e: AfDataSourceError):
        super().__init__(
            code=DataSourceErrno.CONFIG_CENTER_ERROR,
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )


class LLMExecError(AfDataSourceError):
    def __init__(self, e: AfDataSourceError):
        super().__init__(
            code=DataSourceErrno.LLM_EXEC_ERROR,
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )


class IndicatorDescError(AfDataSourceError):
    def __init__(self, e: AfDataSourceError):
        super().__init__(
            code=DataSourceErrno.INDICATOR_DESC_ERROR,
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )


class IndicatorDetailError(AfDataSourceError):
    def __init__(self, e: AfDataSourceError):
        super().__init__(
            code=DataSourceErrno.INDICATOR_DETAIL_ERROR,
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )


class IndicatorQueryError(AfDataSourceError):
    def __init__(self, e: AfDataSourceError):
        super().__init__(
            code=DataSourceErrno.INDICATOR_QUERY_ERROR,
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )


class DataModelDetailError(AfDataSourceError):
    def __init__(self, e: AfDataSourceError):
        super().__init__(
            code=DataSourceErrno.DATA_MODEL_DETAIL_ERROR,
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )


class DataModelQueryError(AfDataSourceError):
    def __init__(self, e: AfDataSourceError):
        super().__init__(
            code=DataSourceErrno.DATA_MODEL_QUERY_ERROR,
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )

class AgentRetrievalError(AfDataSourceError):
    def __init__(self, e: AfDataSourceError):
        super().__init__(
            code=DataSourceErrno.AGENT_RETRIEVAL_ERROR,
            status=e.status,
            reason=e.reason,
            url=e.url,
            detail=e.detail
        )