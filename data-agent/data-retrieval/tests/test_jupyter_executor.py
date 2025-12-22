# -*- coding: utf-8 -*-
# @Author:  AI Assistant
# @Date: 2025-04-05

"""
测试Jupyter代码执行工具
"""
import sys
import os
# 获取当前文件的绝对路径
current_file_path = os.path.abspath(__file__)
grandparent_dir = os.path.abspath(os.path.join(current_file_path, '../../src'))
# 将上上级目录添加到sys.path中
sys.path.append(grandparent_dir)
print(grandparent_dir)

import asyncio
from data_retrieval.tools.experiment_tools.jupyter_code_executor import JupyterCodeExecutorTool


async def test_jupyter_executor():
    """测试Jupyter代码执行工具"""
    print("Testing Jupyter Code Executor Tool")
    
    # 创建工具实例
    tool = JupyterCodeExecutorTool()
    
    # 测试会话ID
    session_id = "test_session_123"
    
    # 测试1: 执行简单代码
    print("\n--- Test 1: Simple code execution ---")
    result1 = await tool.ainvoke({
        "code": "x = 5\ny = 10\nresult = x + y\nresult",
        "session_id": session_id
    })
    print(f"Result 1: {result1}")
    
    # 测试2: 使用之前定义的变量
    print("\n--- Test 2: Using previously defined variables ---")
    result2 = await tool.ainvoke({
        "code": "print(f'x = {x}, y = {y}, result = {result}')",
        "session_id": session_id
    })
    print(f"Result 2: {result2}")
    
    # 测试3: 定义函数
    print("\n--- Test 3: Define and use function ---")
    result3 = await tool.ainvoke({
        "code": "def multiply(a, b):\n    return a * b\n\nmultiply(3, 4)",
        "session_id": session_id
    })
    print(f"Result 3: {result3}")
    
    # 测试4: 使用函数
    print("\n--- Test 4: Using defined function ---")
    result4 = await tool.ainvoke({
        "code": "multiply(6, 7)",
        "session_id": session_id
    })
    print(f"Result 4: {result4}")
    
    # 清理会话
    print("\n--- Cleaning up session ---")
    JupyterCodeExecutorTool.cleanup_session(session_id)
    
    print("\nAll tests completed!")


if __name__ == "__main__":
    asyncio.run(test_jupyter_executor())