#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试 SandboxTool 的功能
"""

import asyncio
import sys
import os
from pathlib import Path

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from data_retrieval.tools.sandbox_tools.shared_all_in_one import SandboxTool, SandboxActionType


async def test_sandbox_tool():
    """测试 SandboxTool 的各种功能"""
    
    # 创建 sandbox 工具实例
    sandbox_tool = SandboxTool(server_url="http://localhost:9101")
    
    try:
        print("=== 测试 SandboxTool ===")
        
        # 1. 测试获取状态
        print("\n1. 测试获取沙箱状态")
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.GET_STATUS.value
        })
        print(f"状态结果: {result}")
        
        # 2. 测试创建文件
        print("\n2. 测试创建文件")
        file_content = """
def hello_world():
    print("Hello from sandbox!")
    return "Hello World"

result = hello_world()
print(f"Result: {result}")
"""
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.CREATE_FILE.value,
            "content": file_content,
            "filename": "hello.py"
        })
        print(f"创建文件结果: {result}")
        
        # 3. 测试列出文件
        print("\n3. 测试列出文件")
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.LIST_FILES.value
        })
        print(f"文件列表: {result}")
        
        # 4. 测试读取文件
        print("\n4. 测试读取文件")
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.READ_FILE.value,
            "filename": "hello.py"
        })
        print(f"文件内容: {result}")
        
        # 5. 测试执行代码
        print("\n5. 测试执行代码")
        code = """
import math

def calculate_circle_area(radius):
    return math.pi * radius ** 2

radius = 5
area = calculate_circle_area(radius)
print(f"半径为 {radius} 的圆的面积是: {area:.2f}")

# 返回计算结果
result = {
    "radius": radius,
    "area": area,
    "formula": "π * r²"
}
"""
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.EXECUTE_CODE.value,
            "content": code,
            "filename": "circle_calc.py",
            "output_params": ["result"]
        })
        print(f"代码执行结果: {result}")
        
        # 6. 测试执行命令
        print("\n6. 测试执行命令")
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.EXECUTE_COMMAND.value,
            "command": "ls",
            "args": ["-la"]
        })
        print(f"命令执行结果: {result}")
        
        # 7. 测试上传文件
        print("\n7. 测试上传文件")
        # 创建本地测试文件
        test_file_path = "test_upload.txt"
        with open(test_file_path, "w", encoding="utf-8") as f:
            f.write("这是一个测试文件，用于测试上传功能。")
        
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.UPLOAD_FILE.value,
            "file_path": test_file_path
        })
        print(f"文件上传结果: {result}")
        
        # 8. 测试下载文件
        print("\n8. 测试下载文件")
        download_path = "test_download.txt"
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.DOWNLOAD_FILE.value,
            "filename": "test_upload.txt",
            "file_path": download_path
        })
        print(f"文件下载结果: {result}")
        
        # 验证下载的文件
        if os.path.exists(download_path):
            with open(download_path, "r", encoding="utf-8") as f:
                content = f.read()
            print(f"下载的文件内容: {content}")
        
        # 9. 测试执行带参数的代码
        print("\n9. 测试执行带参数的代码")
        code_with_args = """
import sys

def greet(name, age):
    return f"Hello {name}, you are {age} years old!"

if len(sys.argv) >= 3:
    name = sys.argv[1]
    age = sys.argv[2]
    result = greet(name, age)
    print(result)
else:
    print("Please provide name and age as arguments")
"""
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.EXECUTE_CODE.value,
            "content": code_with_args,
            "filename": "greet.py",
            "args": ["Alice", "25"]
        })
        print(f"带参数的代码执行结果: {result}")
        
        # 清理测试文件
        for file_path in [test_file_path, download_path]:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"已删除测试文件: {file_path}")
        
        print("\n=== 所有测试完成 ===")

        # 10. 清理工作区
        result = await sandbox_tool.ainvoke({
            "action": SandboxActionType.CLOSE_SANDBOX.value
        })
        print(f"清理工作区结果: {result}")
        
    except Exception as e:
        print(f"测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()


def test_sandbox_tool_sync():
    """测试 SandboxTool 的同步功能"""
    
    print("\n=== 测试同步功能 ===")
    
    # 创建 sandbox 工具实例
    sandbox_tool = SandboxTool(server_url="http://localhost:9101")
    
    try:
        # 测试同步执行代码
        code = """
print("Hello from synchronous execution!")
result = {"message": "同步执行成功", "timestamp": "2024-01-01"}
"""
        result = sandbox_tool.invoke({
            "action": SandboxActionType.EXECUTE_CODE.value,
            "content": code,
            "filename": "sync_test.py"
        })
        print(f"同步执行结果: {result}")

        # 10. 清理工作区
        result = sandbox_tool.invoke({
            "action": SandboxActionType.CLOSE_SANDBOX.value
        })
        print(f"清理工作区结果: {result}")
        
    except Exception as e:
        print(f"同步测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # 运行异步测试
    asyncio.run(test_sandbox_tool())
    
    # 运行同步测试
    test_sandbox_tool_sync() 