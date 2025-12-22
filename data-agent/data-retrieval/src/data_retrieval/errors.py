from typing import Optional, Any, Dict
from langchain_core.tools import ToolException

class ErrorCode:
    DataSourceError = "DataSourceError"
    ExecuteSqlError = "ExecuteSqlError"
    Text2MetricError = "Text2MetricError"
    Text2DIPMetricError = "Text2DIPMetricError"
    Json2PlotError = "Json2PlotError"
    ResultParseError = "ResultParseError"
    SDKRequestError="SDKRequestError"
    OpenSearchRequestError='OpenSearchRequestError'
    KnowledgeEnhancedError='KnowledgeEnhancedError'
    PythonCodeError='PythonCodeError'
    ToolFatalError='ToolFatalError'
    SandboxError='SandboxError'
    SQLHelperError='SQLHelperError'
    KnowledgeItemError='KnowledgeItemError'
    # nl2ngql 相关错误代码
    Text2NGQLError = "Text2NGQLError"
    NGQLSchemaError = "NGQLSchemaError"
    NGQLQueryError = "NGQLQueryError"
    NGQLExecutionError = "NGQLExecutionError"
    NGQLConnectionError = "NGQLConnectionError"
    # knowledge_network_tools 相关错误代码
    KnowledgeNetworkRetrievalError = "KnowledgeNetworkRetrievalError"
    KnowledgeNetworkRerankError = "KnowledgeNetworkRerankError"
    KnowledgeNetworkLLMError = "KnowledgeNetworkLLMError"
    KnowledgeNetworkParamError = "KnowledgeNetworkParamError" 


class AgentBaseError(Exception):
    code: str
    status: int
    reason: Optional[str]
    detail: Optional[dict]

    def __init__(
            self,
            status=0,
            code: str = "",
            reason="",
            detail: Any = None
    ):
        super().__init__()
        self.code = code
        self.status = status
        self.reason = reason
        self.detail = detail

    def __str__(self):
        return f"\n" \
               f"- Code: {self.code}\n" \
               f"- Status: {self.status}\n" \
               f"- Reason: {self.reason}\n" \
               f"- Detail: {self.detail}\n"

    def json(self):
        """Return json format of error."""
        return {
            "code": self.code,
            "status": self.status,
            "reason": self.reason,
            "detail": self.detail
        }


class DataSourceError(AgentBaseError):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.DataSourceError,
            status=status,
            reason=reason,
            detail=detail
        )


class ExecuteSqlError(AgentBaseError):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.ExecuteSqlError,
            status=status,
            reason=reason,
            detail=detail
        )

class Text2SQLException(AgentBaseError):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.ExecuteSqlError,
            status=status,
            reason=reason,
            detail=detail
        )


class SQLHelperException(AgentBaseError):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.SQLHelperError,
            status=status,
            reason=reason,
            detail=detail
        )


class Text2MetricError(AgentBaseError):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.Text2MetricError,
            status=status,
            reason=reason,
            detail=detail
        )


class Text2DIPMetricError(AgentBaseError):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.Text2DIPMetricError,
            status=status,
            reason=reason,
            detail=detail
        )

class KnowledgeItemError(AgentBaseError):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.KnowledgeItemError,
            status=status,
            reason=reason,
            detail=detail
        )

class AgentInitError(Exception):
    def __init__(self, message, status: int = 500):
        self.message = message
        self.status = status

    def __str__(self):
        return self.message

class ResultParseError(AgentBaseError):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.ResultParseError,
            status=status,
            reason=reason,
            detail=detail
        )
class SDKRequestError(AgentBaseError):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.SDKRequestError,
            status=status,
            reason=reason,
            detail=detail
        )

class OpenSearchRequestError(AgentBaseError):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.OpenSearchRequestError,
            status=status,
            reason=reason,
            detail=detail
        )


class KnowledgeEnhancedError(AgentBaseError):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.KnowledgeEnhancedError,
            status=status,
            reason=reason,
            detail=detail
        )

# To comply with the ToolException of LangChain
# inherit from both AgentBaseError and ToolException
class ToolFatalError(AgentBaseError, ToolException):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.ToolFatalError,
            status=status,
            reason=reason,
            detail=detail
        )


class Json2PlotError(AgentBaseError):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.Json2PlotError,
            status=status,
            reason=reason,
            detail=detail
        )

class PythonCodeError(AgentBaseError):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.PythonCodeError,
            status=status,
            reason=reason,
            detail=detail
        )


class SandboxError(AgentBaseError):
    def __init__(self, detail: Any, status: int = 500, reason: str = ""):
        super().__init__(
            code=ErrorCode.SandboxError,
            status=status,
            reason=reason,
            detail=detail
        )


class ErrorResponse(Exception):
    """
    后端要求的标准化错误响应类，同时作为异常基类
    """
    # 子类可以定义的默认值
    _default_code: str = ""
    _default_description: str = ""
    _default_solution: str = "请稍后重试或联系技术支持"
    
    def __init__(
        self,
        code: str = None,
        description: str = None,
        detail: Any = None,
        solution: str = None,
        link: str = ""
    ):
        # 处理 detail 转换
        detail_dict = detail if isinstance(detail, dict) else {"error": str(detail) if detail else ""}
        
        # 使用类默认值或传入值
        self.code = code if code is not None else self._default_code
        self.description = description or self._default_description
        self.detail = detail_dict
        self.solution = solution or self._default_solution
        self.link = link
        
        # Exception 的 message 使用 description
        super().__init__(self.description)
    
    def json(self):
        """返回错误响应的JSON格式"""
        return {
            "code": self.code,
            "description": self.description,
            "detail": self.detail,
            "solution": self.solution,
            "link": self.link
        }
    
    def to_error_response(self) -> 'ErrorResponse':
        """转换为 ErrorResponse 对象（返回自身）"""
        return self


class Text2NGQLError(ErrorResponse):
    """nl2ngql 工具通用错误"""
    _default_code = ErrorCode.Text2NGQLError
    _default_description = "nl2ngql 工具执行失败"
    _default_solution = "请稍后重试或联系技术支持"


class NGQLSchemaError(ErrorResponse):
    """Schema 相关错误"""
    _default_code = ErrorCode.NGQLSchemaError
    _default_description = "Schema 处理失败"
    _default_solution = "请检查图谱 schema 配置或稍后重试"


class NGQLQueryError(ErrorResponse):
    """nGQL 查询生成错误"""
    _default_code = ErrorCode.NGQLQueryError
    _default_description = "nGQL 查询生成失败"
    _default_solution = "请检查查询语句或稍后重试"


class NGQLExecutionError(ErrorResponse):
    """nGQL 执行错误"""
    _default_code = ErrorCode.NGQLExecutionError
    _default_description = "nGQL 查询执行失败"
    _default_solution = "请检查查询语句或联系技术支持"


class NGQLConnectionError(ErrorResponse):
    """Nebula 连接错误"""
    _default_code = ErrorCode.NGQLConnectionError
    _default_description = "Nebula 数据库连接失败"
    _default_solution = "请检查数据库连接配置或联系技术支持"


class KnowledgeNetworkRetrievalError(ErrorResponse):
    """知识网络检索错误"""
    _default_code = ErrorCode.KnowledgeNetworkRetrievalError
    _default_description = "知识网络检索执行失败"
    _default_solution = "请稍后重试或联系技术支持"


class KnowledgeNetworkRerankError(ErrorResponse):
    """知识网络重排序错误"""
    _default_code = ErrorCode.KnowledgeNetworkRerankError
    _default_description = "重排序执行失败"
    _default_solution = "请稍后重试或联系技术支持"


class KnowledgeNetworkLLMError(ErrorResponse):
    """知识网络 LLM 调用错误"""
    _default_code = ErrorCode.KnowledgeNetworkLLMError
    _default_description = "大模型调用失败"
    _default_solution = "请稍后重试或联系技术支持"


class KnowledgeNetworkParamError(ErrorResponse):
    """知识网络参数验证错误"""
    _default_code = ErrorCode.KnowledgeNetworkParamError
    _default_description = "参数验证失败"
    _default_solution = "请检查输入参数是否符合API要求"