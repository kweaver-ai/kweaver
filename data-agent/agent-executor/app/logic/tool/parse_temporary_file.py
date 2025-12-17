"""
解析临时区文件
1. 召回
2. 全文
3. 智能
4. 获取文件下载URL
"""

import asyncio
import re
import traceback
from typing import List

from app.common.stand_log import StandLogger
from app.driven.anyshare.docset_service import docset_service
from app.driven.dip.model_api_service import model_api_service
from app.driven.dip.model_manager_service import model_manager_service
from app.logic.file_service import file_service
from app.logic.tool.doc_qa_tool import doc_qa_tool
from app.domain.enum.common.user_account_header_key import get_user_account_id


async def search_file_snippets(
    query, file_infos, headers, retrieval_max_length=None
) -> str:
    """
    从文件中搜索与查询相关的片段
    """
    fields = []
    for file_info in file_infos:
        fields.append(
            {
                "name": file_info.get("name"),
                "source": file_info["id"],
            }
        )

    props = {
        "data_source": {
            "doc": [
                {
                    "ds_id": "0",
                    "fields": fields,
                }
            ]
        },
        "headers": headers,
    }
    if retrieval_max_length:
        props["retrieval_max_length"] = retrieval_max_length
    res = await doc_qa_tool(query, props)
    return res["text"]


async def split_text_into_chunks(text: str, chunk_size: int) -> List[str]:
    """
    将文本分割成指定大小的块

    Args:
        text: 要分割的文本
        chunk_size: 每个块的最大字符数

    Returns:
        分割后的文本块列表
    """
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    # 按句子分割，避免在句子中间截断
    sentences = re.split(r"[。！？\n]", text)
    current_chunk = ""

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        # 如果当前块加上新句子不超过限制，则添加
        if len(current_chunk) + len(sentence) <= chunk_size:
            current_chunk += sentence + "。"
        else:
            # 如果当前块不为空，保存它
            if current_chunk:
                chunks.append(current_chunk.strip())
            # 开始新的块
            current_chunk = sentence + "。"

    # 添加最后一个块
    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks


async def summarize_chunk_with_llm(chunk: str, llm: dict, headers: dict) -> str:
    """
    使用大模型对文本块进行总结

    Args:
        chunk: 要总结的文本块
        llm: 大模型配置
        headers: 请求头

    Returns:
        总结后的文本
    """
    try:
        # 构建总结提示词
        prompt = f"""请对以下文本进行总结，保留重要信息，使总结简洁明了：

{chunk}

请提供总结："""

        messages = [{"role": "user", "content": prompt}]

        # 调用大模型进行总结
        # 总结任务需要调整参数：
        # - temperature: 降低到0.1，确保总结的一致性和准确性
        # - max_tokens: 根据输入长度动态调整，通常为输入的1/3到1/2
        # - top_p: 降低到0.8，减少随机性，提高总结质量
        # - presence_penalty: 轻微增加，避免重复内容
        summary = await model_api_service.call(
            model=llm["name"],
            messages=messages,
            temperature=0.1,  # 总结任务需要更确定性的输出
            max_tokens=min(len(chunk) // 2, 2000),  # 动态调整，但不超过2000
            userid=get_user_account_id(headers) or "",
            top_k=llm.get("top_k", 50),  # 降低top_k，提高总结质量
            top_p=0.8,  # 降低top_p，减少随机性
            presence_penalty=0.1,  # 轻微惩罚重复内容
        )

        return summary.strip()

    except Exception as e:
        StandLogger.error(f"总结文本块时出错: {e}")
        # 如果总结失败，返回原文本的前半部分
        return chunk[: len(chunk) // 2] if len(chunk) > 100 else chunk


async def summarize_file_content(
    file_content: str, llm: dict, headers: dict, max_chunk_size: int
) -> str:
    """
    对单个文件内容进行分块总结

    Args:
        file_content: 文件内容
        llm: 大模型配置
        headers: 请求头
        max_chunk_size: 每个块的最大大小

    Returns:
        总结后的文件内容
    """
    # 将文件内容分割成块
    chunks = await split_text_into_chunks(file_content, max_chunk_size)

    if len(chunks) == 1:
        # 如果只有一个块，直接返回
        return file_content

    # 对每个块进行总结
    StandLogger.info(f"开始并行总结 {len(chunks)} 个文本块...")

    # 创建所有总结任务的协程
    summary_tasks = []
    for i, chunk in enumerate(chunks):
        task = summarize_chunk_with_llm(chunk, llm, headers)
        summary_tasks.append(task)

    # 并行执行所有总结任务
    summaries = await asyncio.gather(*summary_tasks)

    StandLogger.info(f"并行总结完成，共处理 {len(summaries)} 个文本块")

    # 合并所有总结
    combined_summary = "\n\n".join(summaries)

    # 如果合并后的总结仍然太长，进行二次总结
    if len(combined_summary) > max_chunk_size * 2:
        StandLogger.info("合并后的总结仍然过长，进行二次总结...")
        final_summary = await summarize_chunk_with_llm(combined_summary, llm, headers)
        return final_summary

    return combined_summary


async def process_single_file(
    file_name: str,
    content: str,
    llm: dict,
    headers: dict,
    single_file_len: int,
    max_chunk_size: int,
) -> str:
    """
    处理单个文件的总结

    Args:
        file_name: 文件名
        content: 文件内容
        llm: 大模型配置
        headers: 请求头
        single_file_len: 单个文件的最大长度限制
        max_chunk_size: 每个块的最大大小

    Returns:
        处理后的文件内容
    """
    StandLogger.info(f"正在处理文件: {file_name}")

    # 如果文件内容超过单个文件限制，进行总结
    if len(content) > single_file_len:
        summarized_content = await summarize_file_content(
            content, llm, headers, max_chunk_size
        )
    else:
        summarized_content = content

    # 确保总结后的内容不超过限制
    if len(summarized_content) > single_file_len:
        summarized_content = summarized_content[:single_file_len]

    return f"《{file_name}》总结：\n{summarized_content}"


async def get_file_full_content(file_infos, headers, llm, strategy: str = "chunk"):
    """
    获取文件的完整内容
    strategy: 当文件内容超长时,选择什么策略来进行处理
        - truncate: 截断
        - chunk: 分块总结
    """
    new_file_infos = []
    for file_info in file_infos:
        new_file_infos.append(
            {
                "file_source": "as",
                "fields": [{"name": file_info.get("name"), "source": file_info["id"]}],
            }
        )
    headers["as-user-id"] = get_user_account_id(headers)
    headers["as-token"] = headers.get("token", "")
    max_model_len = await model_manager_service.get_llm_config(llm["id"])
    max_model_len = max_model_len["max_model_len"] * 1024
    max_file_len = int(max_model_len / 4 * 1.5)
    full_text = await file_service.get_file_content_text_with_name(
        new_file_infos, headers
    )
    if len(full_text) <= max_file_len:
        return full_text
    if strategy == "truncate":
        full_text = full_text[:max_file_len]
        return full_text
    elif strategy == "chunk":
        # 目标:总长度不超过max_file_len
        # 方法:对每个文件进行总结, 然后合并
        # 每个文件的长度不超过max_file_len / file_num -> single_file_len
        # 单个文件的处理: 对文件进行分块,送入大模型总结, 合并总结结果.分块大小根据max_model_len决定

        file_num = len(new_file_infos[0]["fields"])
        single_file_len = max_file_len // file_num if file_num > 0 else max_file_len

        # 计算每个块的最大大小（基于模型的最大长度）
        # 动态计算max_chunk_size的逻辑：
        # 1. 模型总长度：max_model_len
        # 2. 固定提示词大约占用200个token
        # 3. 总结输出通常为原文的1/3到1/2长度，即输出约为输入的0.4倍
        # 4. 为了安全起见，我们预留20%作为缓冲
        # 5. 计算公式：(max_model_len - 200) * 0.6 * 0.8
        #    - 减去200个token的提示词
        #    - 乘以0.6（输入占60%，输出占40%）
        #    - 乘以0.8（20%安全缓冲）
        prompt_tokens = 200  # 固定提示词的预估token数
        input_ratio = 0.6  # 输入占用的比例（输入占60%，输出占40%）
        safety_buffer = 0.8  # 安全缓冲系数

        available_tokens = max_model_len - prompt_tokens
        max_chunk_size = int(available_tokens * input_ratio * safety_buffer)

        # 设置最小和最大限制
        min_chunk_size = 1000  # 最小块大小
        max_chunk_size = max(min_chunk_size, max_chunk_size)  # 确保不小于最小块大小

        StandLogger.info(
            f"块大小计算：总长度={max_model_len}, 可用长度={available_tokens}, 输入比例={input_ratio}, 块大小={max_chunk_size}"
        )

        StandLogger.info(
            f"开始分块总结处理，文件数量: {file_num}, 单个文件最大长度: {single_file_len}, 块大小: {max_chunk_size}"
        )

        # 分离每个文件的内容
        # new_file_infos已经在get_file_content_text_with_name中获取了文件内容, 这里直接获取文件名和内容
        file_contents = []
        for single_file in new_file_infos[0]["fields"]:
            file_contents.append((single_file["name"], single_file["content"].strip()))

        # 对每个文件进行总结
        StandLogger.info(f"开始并行处理 {len(file_contents)} 个文件...")

        # 创建所有文件处理任务的协程
        file_tasks = []
        for file_name, content in file_contents:
            task = process_single_file(
                file_name, content, llm, headers, single_file_len, max_chunk_size
            )
            file_tasks.append(task)

        # 并行执行所有文件处理任务
        summarized_contents = await asyncio.gather(*file_tasks)

        StandLogger.info(f"并行文件处理完成，共处理 {len(summarized_contents)} 个文件")

        # 合并所有总结结果
        final_result = "\n\n".join(summarized_contents)

        # 确保最终结果不超过总限制
        if len(final_result) > max_file_len:
            final_result = final_result[:max_file_len]

        StandLogger.info(f"分块总结完成，最终长度: {len(final_result)}")
        return final_result
    else:
        raise ValueError("unsupported strategy")


async def process_file_with_intelligent_strategy(query, file_infos, headers, llm):
    """
    智能文件处理策略
    1. 大模型意图识别,判断选择召回还是获取全文
    2. 如果选择召回,则调用召回接口, 如果没有召回结果,则调用获取全文
    3. 如果选择获取全文,则调用获取全文接口
    """
    try:
        if not file_infos:
            return ""
        # 1. 大模型意图识别，判断选择召回还是获取全文
        intent_prompt = f"""请分析以下用户查询，判断应该使用哪种策略来处理文件：

用户查询：{query}

可选策略：
1. 召回策略：从文件中召回与查询相关的切片片段。适用于问答场景，当用户提出具体问题时，从文档中找到相关的信息片段来回答问题。例如："如何预定会议室"、"项目的预算是多少"、"申请流程有哪些步骤"等。
2. 全文策略：获取文件的完整内容进行整体处理。适用于需要全面了解或分析文件内容的任务，如"总结这份报告的主要内容"、"对比两个文档的差异"、"分析这份合同的关键条款"等。

请只回答"召回"或"全文"："""

        messages = [{"role": "user", "content": intent_prompt}]

        intent_response = await model_api_service.call(
            model=llm["name"],
            messages=messages,
            temperature=0.1,
            max_tokens=50,
            userid=get_user_account_id(headers) or "",
            top_p=0.8,
            presence_penalty=0,
        )

        strategy = intent_response.strip()
        StandLogger.info(f"意图识别结果：{strategy}")

        # 2. 根据意图选择策略
        if "召回" in strategy:
            # 使用召回策略
            StandLogger.info("使用召回策略处理文件")
            result = await search_file_snippets(query, file_infos, headers)

            # 如果没有召回结果，则使用全文策略
            if not result or len(result.strip()) < 50:
                StandLogger.info("召回结果为空或过短，切换到全文策略")
                result = await get_file_full_content(
                    file_infos, headers, llm, strategy="chunk"
                )
        else:
            # 使用全文策略
            StandLogger.info("使用全文策略处理文件")
            result = await get_file_full_content(
                file_infos, headers, llm, strategy="chunk"
            )

        return result

    except Exception as e:
        traceback.print_exc()
        StandLogger.error(f"综合方案处理出错: {e}")
        # 如果出错，默认使用全文策略
        StandLogger.info("出错，默认使用全文策略")
        return await get_file_full_content(file_infos, headers, llm, strategy="chunk")


async def get_file_download_url(file_infos, headers):
    """
    获取文件的下载URL链接

    Args:
        file_infos: 文件信息列表
        headers: 请求头

    Returns:
        包含文件URL信息的字典列表
    """

    # 提取所有文件ID
    doc_ids = [file_info["id"] for file_info in file_infos]

    # 批量获取文件URL
    StandLogger.info(f"开始批量获取 {len(doc_ids)} 个文件的下载URL...")
    url_results = await docset_service.get_multiple_file_urls(doc_ids)

    # 构建返回结果
    file_urls = []
    for i, file_info in enumerate(file_infos):
        url_result = url_results[i]

        file_urls.append(
            {
                "name": file_info.get("name"),
                "id": file_info["id"],
                "url": url_result["url"],
                "error": url_result["error"],
            }
        )

        if url_result["status"] == "success":
            StandLogger.info(f"成功获取文件 {file_info.get('name')} 的下载URL")
        else:
            StandLogger.error(
                f"获取文件 {file_info.get('name')} URL失败: {url_result['error']}"
            )

    return file_urls
