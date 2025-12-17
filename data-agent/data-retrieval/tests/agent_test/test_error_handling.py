#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试沙箱工具的异常处理功能
"""

import asyncio
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from af_agent.tools.sandbox_tools.shared_all_in_one import SandboxTool, SandboxActionType
from af_agent.tools.sandbox_tools.toolkit import (
    ExecuteCodeTool,
    ExecuteCommandTool
)
from af_agent.errors import SandboxError


async def test_error_handling():
    """测试异常处理功能"""
    
    print("=== 测试沙箱工具异常处理 ===")
    
    # 测试拆分后的工具
    print("\n1. 测试拆分后的工具异常处理")
    
    # 测试执行代码工具 - 语法错误
    print("\n1.1 测试执行代码工具 - 语法错误")
    execute_tool = ExecuteCodeTool(session_id="error_test_session")
    try:
        result = await execute_tool.ainvoke({
            "content": "print('Hello World')\ninvalid syntax here\nx = 10",
            "filename": "syntax_error.py"
        })
        print(f"语法错误代码执行结果: {result}")
    except SandboxError as e:
        print(f"捕获到预期的语法错误: {e}")
    except Exception as e:
        print(f"捕获到其他错误: {e}")
    
    # 测试执行命令工具 - 不存在的命令
    print("\n1.2 测试执行命令工具 - 不存在的命令")
    command_tool = ExecuteCommandTool(session_id="error_test_session")
    try:
        result = await command_tool.ainvoke({
            "command": "nonexistent_command",
            "args": []
        })
        print(f"不存在命令执行结果: {result}")
    except SandboxError as e:
        print(f"捕获到预期的命令错误: {e}")
    except Exception as e:
        print(f"捕获到其他错误: {e}")
    
    # 测试原始工具
    print("\n2. 测试原始工具异常处理")
    
    sandbox_tool = SandboxTool(server_url="http://localhost:9101")
    
    # 测试执行代码 - 语法错误
    print("\n2.1 测试执行代码 - 语法错误")
    try:
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.EXECUTE_CODE.value,
            "content": "print('Hello World')\ninvalid syntax here\nx = 10",
            "filename": "syntax_error.py"
        })
        print(f"语法错误代码执行结果: {result}")
    except SandboxError as e:
        print(f"捕获到预期的语法错误: {e}")
    except Exception as e:
        print(f"捕获到其他错误: {e}")
    
    # 测试执行命令 - 不存在的命令
    print("\n2.2 测试执行命令 - 不存在的命令")
    try:
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.EXECUTE_COMMAND.value,
            "command": "nonexistent_command",
            "args": []
        })
        print(f"不存在命令执行结果: {result}")
    except SandboxError as e:
        print(f"捕获到预期的命令错误: {e}")
    except Exception as e:
        print(f"捕获到其他错误: {e}")
    
    # 测试正常执行
    print("\n3. 测试正常执行")
    
    # 测试正常代码执行
    print("\n3.1 测试正常代码执行")
    try:
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.EXECUTE_CODE.value,
            "content": "print('Hello World')\nx = 10\ny = 20\nresult = x + y\nprint(f'{x} + {y} = {result}')",
            "filename": "normal_code.py",
            "output_params": ["result"]
        })
        print(f"正常代码执行结果: {result}")
    except Exception as e:
        print(f"正常代码执行出错: {e}")
    
    # 测试正常命令执行
    print("\n3.2 测试正常命令执行")
    try:
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.EXECUTE_COMMAND.value,
            "command": "echo",
            "args": ["Hello World"]
        })
        print(f"正常命令执行结果: {result}")
    except Exception as e:
        print(f"正常命令执行出错: {e}")
    
    # 清理
    print("\n4. 清理测试环境")
    try:
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.CLOSE_SANDBOX.value
        })
        print(f"清理结果: {result}")
    except Exception as e:
        print(f"清理出错: {e}")
    
    print("\n=== 异常处理测试完成 ===")


def test_error_handling_sync():
    """测试同步异常处理功能"""
    
    print("\n=== 测试同步异常处理 ===")
    
    sandbox_tool = SandboxTool(server_url="http://localhost:9101")
    
    # 测试同步执行代码 - 语法错误
    print("\n1. 测试同步执行代码 - 语法错误")
    try:
        result = sandbox_tool.invoke({
            "action": SandboxActionType.EXECUTE_CODE.value,
            "content": "print('Hello World')\ninvalid syntax here\nx = 10",
            "filename": "sync_syntax_error.py"
        })
        print(f"同步语法错误代码执行结果: {result}")
    except SandboxError as e:
        print(f"捕获到预期的同步语法错误: {e}")
    except Exception as e:
        print(f"捕获到其他同步错误: {e}")
    
    # 测试同步执行命令 - 不存在的命令
    print("\n2. 测试同步执行命令 - 不存在的命令")
    try:
        result = sandbox_tool.invoke({
            "action": SandboxActionType.EXECUTE_COMMAND.value,
            "command": "nonexistent_command",
            "args": []
        })
        print(f"同步不存在命令执行结果: {result}")
    except SandboxError as e:
        print(f"捕获到预期的同步命令错误: {e}")
    except Exception as e:
        print(f"捕获到其他同步错误: {e}")
    
    # 清理
    print("\n3. 清理同步测试环境")
    try:
        result = sandbox_tool.invoke({
            "action": SandboxActionType.CLOSE_SANDBOX.value
        })
        print(f"同步清理结果: {result}")
    except Exception as e:
        print(f"同步清理出错: {e}")
    
    print("\n=== 同步异常处理测试完成 ===")


if __name__ == "__main__":
    # 运行异步测试
    asyncio.run(test_error_handling())
    
    # 运行同步测试
    test_error_handling_sync() 