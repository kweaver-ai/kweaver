import json
from typing import Optional

from fastapi import APIRouter, Header, Depends

from app.common.config import Config
from app.common.stand_log import StandLogger
from app.domain.enum.common.user_account_header_key import set_user_account_id
from app.router.agent_controller_pkg.dependencies import (
    get_account_id,
    get_biz_domain_id,
)
from app.models.tool_requests import (
    ArxivSearchRequest,
    BaiduSearchRequest,
    CalculateExpressionRequest,
    CheckRequest,
    CheckStockRequest,
    CompanyProfileRequest,
    DocQARequest,
    GenerateImageRequest,
    GetFileDownloadUrlRequest,
    GetFileFullContentRequest,
    GraphQARequest,
    PaperSearchRequest,
    ProcessFileIntelligentRequest,
    SearchFileSnippetsRequest,
    SendEmailRequest,
    ZhipuSearchRequest,
    OnlineSearchCiteRequest,
)
from app.models.tool_responses import (
    BaiduSearchResponse,
    CalculateExpressionResponse,
    CheckStockResponse,
    CompanyProfileResponse,
    FileUrlInfo,
    GenerateImageResponse,
    GetDateResponse,
    GetFileDownloadUrlResponse,
    PaperSearchResponse,
    PassResponse,
    SendEmailResponse,
    ZhipuSearchResponse,
    OnlineSearchCiteResponse,
)


router = APIRouter(prefix=Config.app.host_prefix + "/tools", tags=["internal-tools"])


# ==================== 搜索工具 ====================


@router.post(
    "/baidu_search",
    response_model=BaiduSearchResponse,
    summary="百度搜索",
    include_in_schema=False,
)
async def baidu_search(
    request: BaiduSearchRequest,
) -> BaiduSearchResponse:
    """
    执行百度搜索

    - **query**: 搜索查询词
    - **num_results**: 返回结果数量（默认10）

    返回搜索结果列表，包含标题、链接和描述
    """
    from app.logic.tool.baidu_search import baidu_search

    param = request.model_dump()
    res = await baidu_search(param, {}, None, None, None)

    return BaiduSearchResponse(**res)


@router.post(
    "/paper_with_code_full",
    response_model=PaperSearchResponse,
    summary="Papers with Code搜索",
    include_in_schema=False,
)
async def paper_with_code_search(
    request: PaperSearchRequest,
) -> PaperSearchResponse:
    """
    搜索Papers with Code网站的最新论文

    - **nums**: 返回论文数量（默认10，最大30）
    - **params_format**: 是否返回参数格式

    返回论文信息列表，包含标题、作者、摘要、星标数等
    """
    from app.logic.tool.paper_with_code_full import paper_with_code_search_full

    param = request.model_dump()
    papers = await paper_with_code_search_full(param["nums"], param["params_format"])

    return PaperSearchResponse(papers=papers)


@router.post(
    "/arxiv_search",
    response_model=PaperSearchResponse,
    summary="Arxiv论文搜索",
    include_in_schema=False,
)
async def arxiv_search(
    request: ArxivSearchRequest,
) -> PaperSearchResponse:
    """
    搜索Arxiv论文

    - **keyword**: 搜索关键词
    - **nums**: 返回论文数量（默认10）
    - **params_format**: 是否返回参数格式

    返回论文信息列表
    """
    from app.logic.tool.arxiv_search import arxiv_search

    param = request.model_dump()
    papers = await arxiv_search(param["keyword"], param["nums"], param["params_format"])

    return PaperSearchResponse(papers=papers)


# ==================== 工具类 ====================


@router.post(
    "/calculate_expression",
    response_model=CalculateExpressionResponse,
    summary="计算表达式",
    include_in_schema=False,
)
async def calculate_expression(
    request: CalculateExpressionRequest,
) -> CalculateExpressionResponse:
    """
    计算数学表达式

    - **expression**: 要计算的数学表达式（支持基本运算）

    返回计算结果
    """
    from app.logic.tool.calculate_expression import calculate_expression

    param = request.model_dump()
    res = await calculate_expression(param, {}, None, None, None)

    return CalculateExpressionResponse(**res)


@router.post(
    "/generate_image",
    response_model=GenerateImageResponse,
    summary="生成图片",
    include_in_schema=False,
)
async def generate_image(
    request: GenerateImageRequest,
    api_key: str = Header(..., description="图片生成API密钥"),
) -> GenerateImageResponse:
    """
    生成图片

    - **model**: 模型名称
    - **prompt**: 图片生成提示词
    - **size**: 图片尺寸（默认1024x1024）
    - **user_id**: 用户ID（可选）

    返回生成的图片数据
    """
    from app.logic.tool.generate_image import generate_image

    param = request.model_dump()
    res = await generate_image(param, {"api_key": api_key}, None, None, None)

    return GenerateImageResponse(**res)


@router.post(
    "/get_date",
    response_model=GetDateResponse,
    summary="获取当前日期时间",
    include_in_schema=False,
)
async def get_date() -> GetDateResponse:
    """
    获取当前日期和时间

    返回当前日期和时间信息
    """
    from app.logic.tool.get_date import get_date

    res = await get_date({}, {}, None, None, None)

    return GetDateResponse(**res)


# ==================== 金融工具 ====================


@router.post(
    "/check_stock",
    response_model=CheckStockResponse,
    summary="股票查询",
    include_in_schema=False,
)
async def check_stock(
    request: CheckStockRequest,
    tushare_token: str = Header(..., description="Tushare API令牌"),
) -> CheckStockResponse:
    """
    查询股票信息

    - **stock_codes**: 股票代码列表

    返回股票信息，包含代码、名称、价格、涨跌幅等
    """
    from app.logic.tool.check_stock import check_stock

    param = request.model_dump()
    res = await check_stock(param, {"tushare_token": tushare_token}, None, None, None)

    return CheckStockResponse(**res)


@router.post(
    "/get_company_profile",
    response_model=CompanyProfileResponse,
    summary="公司信息查询",
    include_in_schema=False,
)
async def get_company_profile(
    request: CompanyProfileRequest,
) -> CompanyProfileResponse:
    """
    查询公司基本信息

    - **token**: API令牌
    - **stock_codes**: 股票代码列表

    返回公司信息，包含股票代码、公司名称、所属行业、市值等
    """
    from app.logic.tool.stock_new import get_company_profile

    param = request.model_dump()
    res = await get_company_profile(param["token"], param["stock_codes"])

    return CompanyProfileResponse(**res)


@router.post(
    "/send_email",
    response_model=SendEmailResponse,
    summary="发送邮件",
    include_in_schema=False,
)
async def send_email(
    request: SendEmailRequest,
    smtp_server: str = Header(..., description="SMTP服务器地址"),
    smtp_port: int = Header(..., description="SMTP端口"),
    smtp_user: str = Header(..., description="SMTP用户名"),
    smtp_password: str = Header(..., description="SMTP密码"),
) -> SendEmailResponse:
    """
    发送邮件

    - **to**: 收件人邮箱
    - **subject**: 邮件主题
    - **content**: 邮件内容
    - **from_email**: 发件人邮箱（可选）

    返回发送结果
    """
    from app.logic.tool.send_email import send_email_tool

    param = request.model_dump()
    res = await send_email_tool(
        param,
        {
            "smtp_server": smtp_server,
            "smtp_port": smtp_port,
            "smtp_user": smtp_user,
            "smtp_password": smtp_password,
        },
        None,
        None,
        None,
    )

    return SendEmailResponse(**res)


@router.post("/graph_qa", summary="图数据库问答")
async def graph_qa(request: GraphQARequest):
    """
    基于图数据库的问答

    - **query**: 查询问题
    - **props**: 额外属性（可选）

    返回问答结果
    """
    from app.logic.tool.graph_qa_tool import graph_qa_tool

    param = request.model_dump()
    res = await graph_qa_tool(param["query"], param.get("props", {}))

    return {
        "result": res.get("text", ""),
        "full_result": res,
    }


@router.post("/doc_qa", summary="文档问答")
async def doc_qa(request: DocQARequest):
    """
    基于文档的问答

    - **query**: 查询问题
    - **props**: 额外属性（可选）

    返回问答结果
    """
    from app.logic.tool.doc_qa_tool import doc_qa_tool

    param = request.model_dump()
    props = param.get("props", {})
    data_source = props.get("data_source", {})
    res = await doc_qa_tool(param["query"], props)

    # 文档元信息也返回，用于前端展示用（关联bug：777725）
    res["data_source"] = data_source

    return {
        "result": res.get("text", ""),
        "full_result": res,
    }


@router.post("/pass", response_model=PassResponse, summary="通过工具")
async def pass_tool() -> PassResponse:
    """
    通过工具，用于测试或占位

    返回通过消息
    """
    return PassResponse(message="通过")


@router.post(
    "/zhipu_search_tool", response_model=ZhipuSearchResponse, summary="智谱搜索"
)
async def zhipu_search(
    request: ZhipuSearchRequest,
    api_key: str = Header(..., description="智谱API密钥", alias="api_key"),
) -> ZhipuSearchResponse:
    """
    执行智谱搜索

    - **query**: 搜索查询词

    返回搜索结果内容
    """
    from app.logic.tool.zhipu_search_tool import zhipu_search_tool

    param = request.model_dump()
    res = await zhipu_search_tool(param, {"api_key": api_key}, None, None, None)

    return ZhipuSearchResponse(**res)


@router.post("/check", summary="检查")
async def check(request: CheckRequest):
    """
    检查工具

    - **value**: 检查值
    - **field**: 检查字段

    返回检查结果
    """
    from app.logic.tool.check import check

    param = request.model_dump()
    res = await check(param)

    return res


# ==================== 文件处理工具 ====================


@router.post("/search_file_snippets", summary="搜索文件片段")
async def search_file_snippets(
    request: SearchFileSnippetsRequest,
    account_id: Optional[str] = Depends(get_account_id),
    biz_domain_id: Optional[str] = Depends(get_biz_domain_id),
    token: Optional[str] = Header(None, description="用户令牌"),
) -> str:
    """
    从文件中搜索与查询相关的片段

    - **query**: 搜索查询（如"如何预定会议室"）
    - **file_infos**: 文件信息列表
    - **llm**: 大模型配置（可选）

    返回与查询相关的文件片段内容
    """
    import time

    from app.logic.tool.parse_temporary_file import search_file_snippets

    start_time = time.time()

    # 构建headers
    headers = {}
    if account_id:
        set_user_account_id(headers, account_id)
    if token:
        headers["token"] = token

    # 调用搜索函数
    content = await search_file_snippets(
        request.query, [file.model_dump() for file in request.file_infos], headers
    )

    processing_time = time.time() - start_time
    StandLogger.info(f"搜索文件片段耗时: {processing_time}秒")

    return content


@router.post(
    "/get_file_full_content",
    summary="获取文件完整内容",
)
async def get_file_full_content(
    request: GetFileFullContentRequest,
    account_id: Optional[str] = Depends(get_account_id),
    biz_domain_id: Optional[str] = Depends(get_biz_domain_id),
    token: Optional[str] = Header(None, description="用户令牌"),
) -> str:
    """
    获取文件的完整内容，支持长文本处理策略

    - **file_infos**: 文件信息列表
    - **strategy**: 处理策略（"truncate"截断 或 "chunk"分块总结）
    - **llm**: 大模型配置（用于分块总结）

    返回文件的完整内容或总结内容
    """
    import time

    from app.logic.tool.parse_temporary_file import get_file_full_content

    start_time = time.time()

    # 构建headers
    headers = {}
    if account_id:
        set_user_account_id(headers, account_id)
    if token:
        headers["token"] = token

    # 调用获取完整内容函数
    content = await get_file_full_content(
        [file.model_dump() for file in request.file_infos],
        headers,
        request.llm,
        request.strategy,
    )

    processing_time = time.time() - start_time
    StandLogger.info(f"获取文件完整内容耗时: {processing_time}秒")

    return content


@router.post(
    "/process_file_intelligent",
    summary="智能文件处理",
)
async def process_file_intelligent(
    request: ProcessFileIntelligentRequest,
    account_id: Optional[str] = Depends(get_account_id),
    biz_domain_id: Optional[str] = Depends(get_biz_domain_id),
    token: Optional[str] = Header(None, description="用户令牌"),
) -> str:
    """
    智能文件处理策略，自动选择召回或全文策略

    - **query**: 用户查询（如"总结这份报告的主要内容"）
    - **file_infos**: 文件信息列表
    - **llm**: 大模型配置（用于意图识别和分块总结）

    根据查询意图自动选择处理策略，返回处理结果
    """
    import time

    from app.logic.tool.parse_temporary_file import (
        process_file_with_intelligent_strategy,
    )

    start_time = time.time()

    # 构建headers
    headers = {}
    if account_id:
        set_user_account_id(headers, account_id)
    if token:
        headers["token"] = token

    # 调用智能处理函数
    content = await process_file_with_intelligent_strategy(
        request.query,
        [file.model_dump() for file in request.file_infos],
        headers,
        request.llm,
    )

    processing_time = time.time() - start_time
    StandLogger.info(f"智能文件处理耗时: {processing_time}秒")

    return content


@router.post(
    "/get_file_download_url",
    response_model=GetFileDownloadUrlResponse,
    summary="获取文件下载URL",
)
async def get_file_download_url(
    request: GetFileDownloadUrlRequest,
    account_id: Optional[str] = Depends(get_account_id),
    biz_domain_id: Optional[str] = Depends(get_biz_domain_id),
    token: Optional[str] = Header(None, description="用户令牌"),
) -> GetFileDownloadUrlResponse:
    """
    获取文件的下载URL链接

    - **file_infos**: 文件信息列表

    返回每个文件的下载URL，其他人可以通过这些URL获取文件内容
    """
    import time

    from app.common.stand_log import StandLogger
    from app.logic.tool.parse_temporary_file import get_file_download_url

    start_time = time.time()

    # 构建headers
    headers = {}
    if account_id:
        set_user_account_id(headers, account_id)
    if token:
        headers["token"] = token

    # 调用获取文件URL函数
    file_urls_data = await get_file_download_url(
        [file.model_dump() for file in request.file_infos], headers
    )

    processing_time = time.time() - start_time
    StandLogger.info(f"获取文件下载URL耗时: {processing_time}秒")

    # 统计成功数量
    success_count = sum(1 for item in file_urls_data if item["error"] is None)

    # 转换为响应模型
    file_urls = [
        FileUrlInfo(
            name=item["name"], id=item["id"], url=item["url"], error=item["error"]
        )
        for item in file_urls_data
    ]

    return GetFileDownloadUrlResponse(
        file_urls=file_urls,
        total_count=len(request.file_infos),
        success_count=success_count,
    )


from sse_starlette import EventSourceResponse


@router.post(
    "/online_search_cite_tool",
    response_model=OnlineSearchCiteResponse,
    summary="联网搜索添加引用工具",
)
async def online_search_cite_tool(
    request: OnlineSearchCiteRequest,
) -> OnlineSearchCiteResponse:
    """
    执行联网搜索并添加引用

    - **query**: 搜索查询词
    - **model_name**: 模型名称
    - **search_tool**: 搜索工具
    - **api_key**: 搜索工具API密钥
    - **user_id**: 用户id
    返回搜索结果内容
    """
    headers = {"x-account-id": request.user_id}
    if request.stream == False:
        from app.logic.tool.online_search_cite_tool import online_search_cite_tool

        param = request.model_dump()
        res = await online_search_cite_tool(request=param, headers=headers)

        return OnlineSearchCiteResponse(**res)
    else:
        param = request.model_dump()

        async def generate_stream():
            from app.logic.tool.online_search_cite_tool import (
                get_answer,
                get_completion_stream,
                get_search_results,
            )

            # 获取完整搜索结果用于后续处理
            # from app.logic.tool.online_search_cite_tool import get_search_results_stream
            search_results = await get_search_results(param, headers)
            final_references = []
            ref_list = search_results["choices"][0]["message"]["tool_calls"][1][
                "search_result"
            ]
            count = 0
            for ref in ref_list:
                # 修改为创建新 dict，并为缺失字段提供默认值，以匹配 ReferenceResult 模型
                ref_item = {
                    "title": ref.get("title", "未知标题"),
                    "content": ref.get("content", ""),
                    "link": ref.get("link", ""),
                    "index": count,
                }
                count = count + 1
                final_references.append(ref_item)

            # 第三阶段：流式返回最终答案，answer字段逐渐积累
            full_answer = ""
            current_response = OnlineSearchCiteResponse(
                answer=full_answer,
                references=final_references,  # references保持不变
            )
            yield f"{json.dumps(current_response.model_dump(), ensure_ascii=False)}"

            answer, _ = await get_answer(param, headers, search_results)

            async for chunk in get_completion_stream(
                param, headers, answer, final_references
            ):
                full_answer += chunk
                # 返回当前状态的OnlineSearchCiteResponse
                current_response = OnlineSearchCiteResponse(
                    answer=full_answer,
                    references=final_references,  # references保持不变
                )
                yield f"{json.dumps(current_response.model_dump(), ensure_ascii=False)}"

        return EventSourceResponse(generate_stream(), ping=3600)
