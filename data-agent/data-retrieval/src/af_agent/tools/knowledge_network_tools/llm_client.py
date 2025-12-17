# -*- coding: utf-8 -*-
"""
LLM客户端模块
处理所有与LLM相关的交互，包括调用、重试逻辑和结果处理
"""

import json
import os
from typing import List, Dict, Any, Optional, Tuple

# 导入LLM工具
from af_agent.tools.graph_tools.utils.llm import llm_chat, llm_chat_stream
# 导入日志模块
from af_agent.logs.logger import logger
# 导入配置
from .config import config

# 默认LLM模型（从配置文件读取）
KN_RETRIEVAL_LLM_MODEL = config.KN_RETRIEVAL_LLM_MODEL


class LLMClient:
    """LLM客户端类，处理所有与LLM相关的交互"""
    
    @classmethod
    async def call_llm_with_retry(cls, prompt: str, system_message: str, query: str, error_context: str = "", account_id: str = None, account_type: str = None) -> str:
        """
        通用的LLM调用方法，包含重试机制
        
        Args:
            prompt: 提示词
            system_message: 系统消息
            query: 用户查询
            error_context: 错误上下文信息（用于重试时提示模型）
            account_id: 账户ID，如果提供则传递给LLM
            account_type: 账户类型，如果提供则传递给LLM
            
        Returns:
            LLM返回的内容
        """
        logger.debug("开始调用LLM并进行重试机制处理")
        # LLM参数
        llm_params = {
            "name": KN_RETRIEVAL_LLM_MODEL,
            "temperature": 0,
            "max_tokens": 1000
        }
        
        # 将 account_id 和 account_type 添加到 llm_params 中
        if account_id:
            llm_params["account_id"] = account_id
        if account_type:
            llm_params["account_type"] = account_type
        
        # 重试机制
        max_retries = 3
        retry_count = 0
        content = ""
        
        while retry_count < max_retries:
            # 构建消息
            messages = [
                {
                    "role": "system",
                    "content": system_message
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            # 如果是重试，添加错误信息到提示中
            if retry_count > 0 and error_context:
                error_prompt = f"\n注意：你已经回答错误了{retry_count}次，不要再犯同样的错误，{error_context}问题: {query}"
                messages.append({"role": "user", "content": error_prompt})
                
            try:
                # 统一使用llm_chat_stream方法
                content = ""
                async for chunk in llm_chat_stream(llm_params, messages):
                    # 收集流式响应的内容
                    if isinstance(chunk, dict) and "content" in chunk:
                        content += chunk["content"]
                    elif isinstance(chunk, str):
                        content += chunk
                
                # 检查内容是否非空且不是空列表
                content_str = content.strip()
                if content_str and content_str != "[]":
                    logger.debug(f"LLM调用成功，尝试次数: {retry_count + 1}/{max_retries}")
                    break
                    
                # 将模型的回复添加到消息历史中，用于下一次重试
                messages.append({"role": "assistant", "content": content})
            except Exception as e:
                logger.error(f"LLM调用失败 (尝试 {retry_count + 1}/{max_retries}): {str(e)}", exc_info=True)
            
            # 增加重试次数
            retry_count += 1
            logger.debug(f"第{retry_count}次尝试失败")
            
        # 如果重试次数用完但仍然没有有效内容，记录警告
        if retry_count >= max_retries and (not content.strip() or content.strip() == "[]"):
            logger.warning(f"LLM调用重试{max_retries}次后仍未获得有效结果，最终返回内容: {content}")
            
        logger.debug("完成LLM调用和重试机制处理")
        return content

