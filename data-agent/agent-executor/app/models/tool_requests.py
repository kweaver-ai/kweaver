from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class BaiduSearchRequest(BaseModel):
    """百度搜索请求"""

    query: str = Field(..., description="搜索查询词", example="人工智能")
    num_results: int = Field(default=10, description="返回结果数量", example=10)


class CalculateExpressionRequest(BaseModel):
    """计算表达式请求"""

    expression: str = Field(..., description="要计算的数学表达式", example="2 + 3 * 4")


class ZhipuSearchRequest(BaseModel):
    """智谱搜索请求"""

    query: str = Field(..., description="搜索查询词", example="机器学习")


class GenerateImageRequest(BaseModel):
    """生成图片请求"""

    model: str = Field(..., description="模型名称", example="cogview-3")
    prompt: str = Field(..., description="图片生成提示词", example="一只可爱的小猫")
    size: str = Field(default="1024x1024", description="图片尺寸", example="1024x1024")
    user_id: Optional[str] = Field(None, description="用户ID")


class CheckStockRequest(BaseModel):
    """股票查询请求"""

    stock_codes: List[str] = Field(
        ..., description="股票代码列表", example=["000001", "600000"]
    )


class SendEmailRequest(BaseModel):
    """发送邮件请求"""

    to: str = Field(..., description="收件人邮箱", example="user@example.com")
    subject: str = Field(..., description="邮件主题", example="测试邮件")
    content: str = Field(..., description="邮件内容", example="这是一封测试邮件")
    from_email: Optional[str] = Field(None, description="发件人邮箱")


class PaperSearchRequest(BaseModel):
    """论文搜索请求"""

    nums: int = Field(default=10, description="返回论文数量", example=10)
    params_format: bool = Field(default=False, description="是否返回参数格式")


class ArxivSearchRequest(BaseModel):
    """Arxiv搜索请求"""

    keyword: str = Field(..., description="搜索关键词", example="machine learning")
    nums: int = Field(default=10, description="返回论文数量", example=10)
    params_format: bool = Field(default=False, description="是否返回参数格式")


class CompanyProfileRequest(BaseModel):
    """公司信息查询请求"""

    token: str = Field(..., description="API令牌")
    stock_codes: List[str] = Field(
        ..., description="股票代码列表", example=["000001", "600000"]
    )


class GetSchemaRequest(BaseModel):
    """获取模式请求"""

    database: str = Field(..., description="数据库名称", example="test_db")


class CheckRequest(BaseModel):
    """检查工具请求"""

    value: Any = Field(..., description="检查值", example="test_value")
    field: str = Field(..., description="检查字段", example="test_field")


class DocQARequest(BaseModel):
    """文档问答请求"""

    query: str = Field(..., description="查询问题", example="什么是机器学习？")
    props: Optional[Dict[str, Any]] = Field(default={}, description="额外属性")


class GraphQARequest(BaseModel):
    """图数据库问答请求"""

    query: str = Field(..., description="查询问题", example="查询所有用户")
    props: Optional[Dict[str, Any]] = Field(default={}, description="额外属性")


class FileInfo(BaseModel):
    """文件信息"""

    name: str = Field(..., description="文件名", example="document.pdf")
    id: str = Field(..., description="文件ID", example="file_123")

    class Config:
        # 允许额外的字段，不会报错
        extra = "allow"


class SearchFileSnippetsRequest(BaseModel):
    """搜索文件片段请求"""

    query: str = Field(..., description="搜索查询", example="如何预定会议室")
    file_infos: List[FileInfo] = Field(..., description="文件信息列表")
    llm: Optional[Dict[str, Any]] = Field(default={}, description="大模型配置")


class GetFileFullContentRequest(BaseModel):
    """获取文件完整内容请求"""

    file_infos: List[FileInfo] = Field(..., description="文件信息列表")
    strategy: str = Field(default="chunk", description="处理策略", example="chunk")
    llm: Optional[Dict[str, Any]] = Field(default={}, description="大模型配置")


class ProcessFileIntelligentRequest(BaseModel):
    """智能文件处理请求"""

    query: str = Field(..., description="用户查询", example="总结这份报告的主要内容")
    file_infos: List[FileInfo] = Field(..., description="文件信息列表")
    llm: Optional[Dict[str, Any]] = Field(default={}, description="大模型配置")


class GetFileDownloadUrlRequest(BaseModel):
    """获取文件下载URL请求"""

    file_infos: List[FileInfo] = Field(..., description="文件信息列表")


class OnlineSearchCiteRequest(BaseModel):
    """联网搜索添加引用请求"""

    query: str = Field(..., description="搜索查询词", example="机器学习")
    model_name: str = Field(..., description="模型名称", example="deepseek-v3")
    search_tool: str = Field(..., description="搜索工具", example="zhipu_search_tool")
    api_key: str = Field(
        ...,
        description="搜索工具的API KEY",
        example="1828616286d4c94b26071585e1f93009.negnhMi3D5KVuc7h",
    )
    user_id: str = Field(
        ..., description="userid", example="bdb78b62-6c48-11f0-af96-fa8dcc0a06b2"
    )
    stream: bool = Field(default=False, description="是否流式返回", example=False)
