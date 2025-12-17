#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
SandboxTool API 快速测试
"""

import asyncio
import sys
import os
import json
import aiohttp
import uvicorn
from fastapi import FastAPI

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from af_agent.tools.tool_api_router import BaseToolAPIRouter
from af_agent.tools.sandbox_tools.shared_all_in_one import SandboxActionType


def create_test_app():
    """创建测试应用"""
    app = FastAPI(title="Sandbox API Test")
    router = BaseToolAPIRouter(prefix="/tools")
    app.include_router(router)
    
    @app.get("/health")
    async def health():
        return {"status": "healthy"}
    
    return app


async def test_basic_api_calls():
    """测试基本的 API 调用"""
    print("=== SandboxTool API 快速测试 ===")
    
    # 创建应用
    app = create_test_app()
    
    # 启动服务器
    config = uvicorn.Config(app, host="127.0.0.1", port=9201, log_level="error")
    server = uvicorn.Server(config)
    server_task = asyncio.create_task(server.serve())
    
    # 等待服务器启动
    print("启动测试服务器...")
    await asyncio.sleep(2)
    
    try:
        async with aiohttp.ClientSession() as session:
            # 1. 健康检查
            print("\n1. 健康检查")
            async with session.get("http://127.0.0.1:9201/health") as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ 服务器运行正常: {result}")
                else:
                    print(f"❌ 服务器异常: {response.status}")
                    return
            
            # 2. 测试获取状态
            print("\n2. 测试获取状态")
            data = {
                "action": "get_status",
                "session_id": "quick_test_123",
                "server_url": "http://127.0.0.1:9101"
            }
            
            async with session.post(
                "http://127.0.0.1:9201/tools/sandbox",
                json=data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ 获取状态成功")
                    print(f"   响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
                else:
                    error_text = await response.text()
                    print(f"❌ 获取状态失败: {response.status}")
                    print(f"   错误: {error_text}")
            
            # 3. 测试执行代码
            print("\n3. 测试执行代码")
            data = {
                "action": "execute_code",
                "content": "print('Hello from quick test')\nx = 10\ny = 20\nresult = x + y\nprint(f'{x} + {y} = {result}')",
                "filename": "quick_test.py",
                "output_params": ["result"],
                "session_id": "quick_test_123",
                "server_url": "http://127.0.0.1:9101"
            }
            
            async with session.post(
                "http://127.0.0.1:9201/tools/sandbox",
                json=data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ 执行代码成功")
                    print(f"   响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
                else:
                    error_text = await response.text()
                    print(f"❌ 执行代码失败: {response.status}")
                    print(f"   错误: {error_text}")
            
            # 4. 测试创建文件
            print("\n4. 测试创建文件")
            data = {
                "action": "create_file",
                "content": "def hello():\n    return 'Hello from file'\n\nprint(hello())",
                "filename": "hello.py",
                "session_id": "quick_test_123",
                "server_url": "http://127.0.0.1:9101"
            }
            
            async with session.post(
                "http://127.0.0.1:9201/tools/sandbox",
                json=data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ 创建文件成功")
                    print(f"   响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
                else:
                    error_text = await response.text()
                    print(f"❌ 创建文件失败: {response.status}")
                    print(f"   错误: {error_text}")
            
            # 5. 测试列出文件
            print("\n5. 测试列出文件")
            data = {
                "action": "list_files",
                "session_id": "quick_test_123",
                "server_url": "http://127.0.0.1:9101"
            }
            
            async with session.post(
                "http://127.0.0.1:9201/tools/sandbox",
                json=data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ 列出文件成功")
                    print(f"   响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
                else:
                    error_text = await response.text()
                    print(f"❌ 列出文件失败: {response.status}")
                    print(f"   错误: {error_text}")
            
            # 6. 测试 API Schema
            print("\n6. 测试 API Schema")
            async with session.get("http://127.0.0.1:9201/tools/sandbox/schema") as response:
                if response.status == 200:
                    schema = await response.json()
                    print(f"✅ API Schema 获取成功")
                    print(f"   Schema 类型: {type(schema)}")
                    print(f"   Schema 预览: {json.dumps(schema, indent=2, ensure_ascii=False)[:300]}...")
                else:
                    print(f"❌ API Schema 获取失败: {response.status}")
            
            # 7. 测试错误处理
            print("\n7. 测试错误处理")
            error_cases = [
                {
                    "name": "缺少 action 参数",
                    "data": {"session_id": "test"}
                },
                {
                    "name": "无效的 action",
                    "data": {"action": "invalid_action", "session_id": "test"}
                },
                {
                    "name": "execute_code 缺少 content",
                    "data": {"action": "execute_code", "session_id": "test"}
                }
            ]
            
            for case in error_cases:
                print(f"   测试: {case['name']}")
                async with session.post(
                    "http://127.0.0.1:9201/tools/sandbox",
                    json=case['data'],
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status != 200:
                        result = await response.json()
                        print(f"   ✅ 错误处理正确: {response.status}")
                        print(f"      错误信息: {result.get('message', 'N/A')}")
                    else:
                        print(f"   ❌ 应该返回错误但成功了")
    
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # 停止服务器
        print("\n停止测试服务器...")
        server_task.cancel()
        try:
            await server_task
        except asyncio.CancelledError:
            pass


async def test_api_examples():
    """测试 API 示例"""
    print("\n=== 测试 API 示例 ===")
    
    app = create_test_app()
    config = uvicorn.Config(app, host="127.0.0.1", port=9202, log_level="error")
    server = uvicorn.Server(config)
    server_task = asyncio.create_task(server.serve())
    
    await asyncio.sleep(2)
    
    try:
        async with aiohttp.ClientSession() as session:
            # 测试数据分析示例
            print("\n1. 数据分析示例")
            data_analysis_code = """
import pandas as pd
import numpy as np

# 创建示例数据
data = {
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35],
    'salary': [50000, 60000, 70000]
}
df = pd.DataFrame(data)

# 计算统计信息
stats = {
    'mean_age': df['age'].mean(),
    'mean_salary': df['salary'].mean(),
    'total_records': len(df)
}

print('数据统计:')
for key, value in stats.items():
    print(f'{key}: {value}')

result = stats
"""
            
            data = {
                "action": "execute_code",
                "content": data_analysis_code,
                "filename": "data_analysis.py",
                "output_params": ["result", "df"],
                "session_id": "example_test_123",
                "server_url": "http://127.0.0.1:9101"
            }
            
            async with session.post(
                "http://127.0.0.1:9202/tools/sandbox",
                json=data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ 数据分析示例成功")
                    print(f"   输出: {result.get('result', {}).get('output', 'N/A')}")
                    if 'variables' in result.get('result', {}):
                        variables = result['result']['variables']
                        if 'result' in variables:
                            stats = variables['result']
                            print(f"   统计结果: {json.dumps(stats, indent=2, ensure_ascii=False)}")
                else:
                    error_text = await response.text()
                    print(f"❌ 数据分析示例失败: {response.status}")
                    print(f"   错误: {error_text}")
            
            # 测试文件操作示例
            print("\n2. 文件操作示例")
            
            # 创建多个文件
            files_to_create = [
                {
                    "name": "config.json",
                    "content": '{"app_name": "Test App", "version": "1.0.0"}'
                },
                {
                    "name": "utils.py",
                    "content": "def greet(name):\n    return f'Hello, {name}!'\n\ndef add(a, b):\n    return a + b"
                }
            ]
            
            for file_info in files_to_create:
                data = {
                    "action": "create_file",
                    "content": file_info["content"],
                    "filename": file_info["name"],
                    "session_id": "example_test_123",
                    "server_url": "http://127.0.0.1:9101"
                }
                
                async with session.post(
                    "http://127.0.0.1:9202/tools/sandbox",
                    json=data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        print(f"   ✅ 创建文件 {file_info['name']} 成功")
                    else:
                        print(f"   ❌ 创建文件 {file_info['name']} 失败")
            
            # 列出所有文件
            data = {
                "action": "list_files",
                "session_id": "example_test_123",
                "server_url": "http://127.0.0.1:9101"
            }
            
            async with session.post(
                "http://127.0.0.1:9202/tools/sandbox",
                json=data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    files = result.get('result', [])
                    print(f"   📁 当前文件列表: {files}")
                else:
                    print(f"   ❌ 列出文件失败")
    
    except Exception as e:
        print(f"❌ 示例测试失败: {e}")
    
    finally:
        server_task.cancel()
        try:
            await server_task
        except asyncio.CancelledError:
            pass


async def main():
    """主函数"""
    print("开始 SandboxTool API 快速测试...")
    
    # 基本功能测试
    await test_basic_api_calls()
    
    # 示例测试
    await test_api_examples()
    
    print("\n=== 快速测试完成 ===")


if __name__ == "__main__":
    asyncio.run(main()) 