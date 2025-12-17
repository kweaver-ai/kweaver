from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SearchResult(BaseModel):
    """搜索结果项"""

    title: str = Field(..., description="搜索结果标题")
    url: str = Field(..., description="搜索结果链接")
    description: str = Field(..., description="搜索结果描述")


class BaiduSearchResponse(BaseModel):
    """百度搜索响应"""

    query: str = Field(..., description="搜索查询词")
    results: List[SearchResult] = Field(..., description="搜索结果列表")


class CalculateExpressionResponse(BaseModel):
    """计算表达式响应"""

    expression: str = Field(..., description="计算的表达式")
    result: float = Field(..., description="计算结果")


class ZhipuSearchResponse(BaseModel):
    """智谱搜索响应"""

    """样例
{'choices': [{...}], 'created': 1749713107, 'id': '20250612152507b7e80ee738244e30', 'model': 'web-search-pro', 'request_id': 'a983a178-7f9a-4ef2-a4d0-6cb5e17570bf', 'usage': {'completion_tokens': 3000, 'prompt_tokens': 0, 'total_tokens': 3000}}
    """

    choices: List[Dict[str, Any]] = Field(..., description="搜索结果列表")
    created: int = Field(..., description="创建时间")
    id: str = Field(..., description="搜索ID")
    model: str = Field(..., description="模型")
    request_id: str = Field(..., description="请求ID")
    usage: Dict[str, Any] = Field(..., description="使用情况统计")


class ReferenceResult(BaseModel):
    """引用内容"""

    title: str = Field(..., description="引用标题")
    content: str = Field(..., description="引用内容")
    index: int = Field(..., description="引用索引")
    link: str = Field(..., description="引用链接")


class OnlineSearchCiteResponse(BaseModel):
    """联网搜索添加引用响应"""

    references: List[ReferenceResult] = Field(..., description="引用内容列表")
    answer: str = Field(..., description="添加引用标记的回答")


class GenerateImageResponse(BaseModel):
    """生成图片响应"""

    data: List[Dict[str, Any]] = Field(..., description="生成的图片数据")
    usage: Optional[Dict[str, Any]] = Field(None, description="使用情况统计")


class StockInfo(BaseModel):
    """股票信息"""

    code: str = Field(..., description="股票代码")
    name: str = Field(..., description="股票名称")
    price: float = Field(..., description="当前价格")
    change: float = Field(..., description="涨跌幅")


class CheckStockResponse(BaseModel):
    """股票查询响应"""

    stocks: List[StockInfo] = Field(..., description="股票信息列表")


class SendEmailResponse(BaseModel):
    """发送邮件响应"""

    success: bool = Field(..., description="发送是否成功")
    message: str = Field(..., description="响应消息")


class PaperInfo(BaseModel):
    """论文信息"""

    title: str = Field(..., description="论文标题")
    url: str = Field(..., description="论文链接")
    authors: List[str] = Field(..., description="作者列表")

    abstract: str = Field(..., description="论文摘要")
    stars: int = Field(..., description="星标数量")
    paper_content: Optional[str] = Field(None, description="论文内容")


class PaperSearchResponse(BaseModel):
    """论文搜索响应"""

    papers: List[PaperInfo] = Field(..., description="论文列表")


class GetDateResponse(BaseModel):
    """获取日期响应"""

    current_date: str = Field(..., description="当前日期")
    current_time: str = Field(..., description="当前时间")


class CompanyProfile(BaseModel):
    """公司信息"""

    stock_code: str = Field(..., description="股票代码")
    company_name: str = Field(..., description="公司名称")
    industry: str = Field(..., description="所属行业")
    market_cap: Optional[str] = Field(None, description="市值")


class CompanyProfileResponse(BaseModel):
    """公司信息查询响应"""

    companies: List[CompanyProfile] = Field(..., description="公司信息列表")


class NL2NGQLResponse(BaseModel):
    """NL2NGQL响应"""

    outputs: List[Dict[str, Any]] = Field(..., description="输出结果列表")


class SchemaInfo(BaseModel):
    """图数据库模式信息"""

    schema_data: Dict[str, Any] = Field(..., description="数据库模式", alias="schema")


class PassResponse(BaseModel):
    """通过工具响应"""

    message: str = Field(..., description="通过消息")


class FileUrlInfo(BaseModel):
    """文件URL信息"""

    name: str = Field(..., description="文件名")
    id: str = Field(..., description="文件ID")
    url: Optional[str] = Field(None, description="下载URL")
    error: Optional[str] = Field(None, description="错误信息")


class GetFileDownloadUrlResponse(BaseModel):
    """获取文件下载URL响应"""

    file_urls: List[FileUrlInfo] = Field(..., description="文件URL信息列表")

    total_count: int = Field(..., description="总文件数量")
    success_count: int = Field(..., description="成功获取URL的文件数量")
