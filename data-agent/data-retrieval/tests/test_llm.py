#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LLM 测试文件
"""

import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/src")
from af_agent.tools.graph_tools.utils.llm import llm_chat, llm_chat_stream


async def test_llm_chat_non_streaming():
    """测试非流式调用"""
    print("\n=== 测试非流式调用 ===")
    
    # 模拟 inner_llm 参数
    inner_llm = {
        "name": "tome-max",
        "temperature": 0.7,
        "max_tokens": 1000,
        "userid": "test_user",
        "top_k": 50,
        "top_p": 0.9
    }
    
    # 测试消息
    messages = [
        {"role": "user", "content": "你好"}
    ]
    
    try:
        # 调用 llm_chat 函数
        response = await llm_chat(inner_llm, messages)
        print(f"非流式调用结果: {response}")
        print("非流式调用测试完成！")
    except Exception as e:
        print(f"非流式调用测试异常: {e}")


async def test_llm_chat_streaming():
    """测试流式调用"""
    print("\n=== 测试流式调用 ===")
    
    # 模拟 inner_llm 参数
    inner_llm = {
        "name": "tome-max",
        "temperature": 0.7,
        "max_tokens": 1000,
        "userid": "test_user",
        "top_k": 50,
        "top_p": 0.9
    }
    
    # 测试消息
    messages = [
        {"role": "user", "content": "你好"}
    ]
    
    try:
        # 使用新的流式调用函数
        print("流式调用结果:")
        async for chunk in llm_chat_stream(inner_llm, messages):
            print(chunk, end='', flush=True)
        print("\n流式调用测试完成！")
    except Exception as e:
        print(f"流式调用测试异常: {e}")


async def run_all_tests():
    """运行所有测试"""
    print("开始运行 LLM 测试...")
    
    # 运行非流式测试
    await test_llm_chat_non_streaming()
    
    # 运行流式测试
    await test_llm_chat_streaming()
    
    print("\n所有测试完成！")


if __name__ == "__main__":
    # 运行测试
    asyncio.run(run_all_tests())
