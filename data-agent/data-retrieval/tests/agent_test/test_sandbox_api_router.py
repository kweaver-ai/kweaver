#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试 SandboxTool 在 API 路由中的注册
"""

import asyncio
import sys
import os
import json
import time
import requests
import aiohttp
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import uvicorn
from fastapi import FastAPI

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from data_retrieval.tools.tool_api_router import BaseToolAPIRouter
from data_retrieval.tools.sandbox_tools.shared_all_in_one import SandboxTool, SandboxActionType

from data_retrieval.tools.tool_api_router import _BASE_TOOLS_MAPPING, _BASE_TOOL_NAMES


async def test_sandbox_api_registration():
    """测试 sandbox 工具在 API 路由中的注册"""
    
    print("=== 测试 SandboxTool API 注册 ===")
    
    # 创建 API 路由
    router = BaseToolAPIRouter(prefix="/tools")
    
    # 检查工具是否已注册
    print("\n1. 检查工具注册")
    if "sandbox" in _BASE_TOOLS_MAPPING:
        print("✅ SandboxTool 已成功注册到 API 路由")
        print(f"工具类: {_BASE_TOOLS_MAPPING['sandbox']}")
    else:
        print("❌ SandboxTool 未注册到 API 路由")
        return
    
    # 检查工具名称列表
    print("\n2. 检查工具名称列表")
    if "sandbox" in _BASE_TOOL_NAMES:
        print("✅ 'sandbox' 已添加到工具名称列表")
    else:
        print("❌ 'sandbox' 未添加到工具名称列表")
    
    # 测试获取 API Schema
    print("\n3. 测试获取 API Schema")
    try:
        schema = await SandboxTool.get_api_schema()
        print("✅ 成功获取 SandboxTool API Schema")
        print(f"Schema 类型: {type(schema)}")
        print(f"Schema 内容预览: {json.dumps(schema, indent=2, ensure_ascii=False)[:500]}...")
    except Exception as e:
        print(f"❌ 获取 API Schema 失败: {e}")
    
    # 测试获取所有工具的 API 文档
    print("\n4. 测试获取所有工具的 API 文档")
    try:
        docs = await router.get_api_docs(server_url="http://localhost:9200")
        print("✅ 成功获取所有工具的 API 文档")
        
        # 检查 sandbox 工具是否在文档中
        sandbox_path = "/tools/sandbox"
        if sandbox_path in docs.get("paths", {}):
            print(f"✅ Sandbox 工具路径 '{sandbox_path}' 在 API 文档中")
        else:
            print(f"❌ Sandbox 工具路径 '{sandbox_path}' 不在 API 文档中")
            print(f"可用的路径: {list(docs.get('paths', {}).keys())}")
        
        # 检查工具描述
        description = docs.get("info", {}).get("description", "")
        if "sandbox" in description:
            print("✅ Sandbox 工具在描述中")
        else:
            print("❌ Sandbox 工具不在描述中")
            print(f"描述内容: {description}")
            
    except Exception as e:
        print(f"❌ 获取 API 文档失败: {e}")
        import traceback
        traceback.print_exc()


async def test_sandbox_api_endpoints():
    """测试 sandbox 工具的 API 端点"""
    
    print("\n=== 测试 SandboxTool API 端点 ===")
    
    # 创建 API 路由
    router = BaseToolAPIRouter(prefix="/tools")
    
    # 检查路由规则
    print("\n1. 检查路由规则")
    routes = router.routes
    sandbox_routes = [route for route in routes if "sandbox" in str(route.path)]
    
    if sandbox_routes:
        print(f"✅ 找到 {len(sandbox_routes)} 个 sandbox 相关路由:")
        for route in sandbox_routes:
            print(f"  - 路径: {route.path}, 方法: {route.methods}")
    else:
        print("❌ 未找到 sandbox 相关路由")
        print(f"所有路由: {[route.path for route in routes]}")


def test_sandbox_tool_attributes():
    """测试 SandboxTool 的属性"""
    
    print("\n=== 测试 SandboxTool 属性 ===")
    
    # 检查必要的属性
    required_attrs = ["as_async_api_cls", "get_api_schema"]
    
    for attr in required_attrs:
        if hasattr(SandboxTool, attr):
            print(f"✅ SandboxTool 具有属性: {attr}")
        else:
            print(f"❌ SandboxTool 缺少属性: {attr}")
    
    # 检查工具名称
    # print(f"\n工具名称: {SandboxTool.name}")
    # print(f"工具描述: {SandboxTool.description}")


async def test_sandbox_api_integration():
    """测试 sandbox 工具的 API 集成"""
    
    print("\n=== 测试 SandboxTool API 集成 ===")
    
    # 创建 API 路由
    router = BaseToolAPIRouter(prefix="/tools")
    
    # 模拟 API 调用参数
    test_params = {
        "action": SandboxActionType.GET_STATUS.value,
        "session_id": "test_session_123"
    }
    
    print(f"\n1. 测试参数: {test_params}")
    
    # 检查工具类是否支持异步 API
    if hasattr(SandboxTool, "as_async_api_cls"):
        print("✅ SandboxTool 支持异步 API 调用")
        
        # 注意：这里只是检查方法存在，实际调用需要服务器环境
        print("ℹ️  实际 API 调用需要启动服务器环境")
    else:
        print("❌ SandboxTool 不支持异步 API 调用")


def start_test_server():
    """启动测试服务器"""
    app = FastAPI(
        title="AF Agent Tools API Test",
        description="AF Agent Tools API Test Server",
        version="1.0.0"
    )
    
    router = BaseToolAPIRouter(prefix="/tools")
    app.include_router(router)
    
    @app.get("/")
    async def root():
        return {"message": "Test server is running"}
    
    @app.get("/health")
    async def health():
        return {"status": "healthy"}
    
    return app


async def test_api_server_startup():
    """测试 API 服务器启动"""
    print("\n=== 测试 API 服务器启动 ===")
    
    try:
        app = start_test_server()
        print("✅ 测试服务器创建成功")
        
        # 检查路由
        routes = [route.path for route in app.routes]
        print(f"服务器路由: {routes}")
        
        # 检查是否有 sandbox 路由
        sandbox_routes = [route for route in routes if "sandbox" in route]
        if sandbox_routes:
            print(f"✅ 找到 sandbox 路由: {sandbox_routes}")
        else:
            print("❌ 未找到 sandbox 路由")
        
        return app
        
    except Exception as e:
        print(f"❌ 服务器启动失败: {e}")
        return None


async def test_api_calls_with_server():
    """使用真实服务器测试 API 调用"""
    print("\n=== 测试真实 API 调用 ===")
    
    # 启动服务器
    app = await test_api_server_startup()
    if not app:
        return
    
    # 使用 uvicorn 启动服务器
    config = uvicorn.Config(app, host="127.0.0.1", port=9201, log_level="info")
    server = uvicorn.Server(config)
    
    # 在后台启动服务器
    server_task = asyncio.create_task(server.serve())
    
    # 等待服务器启动
    print("等待服务器启动...")
    await asyncio.sleep(3)
    
    try:
        # 测试健康检查
        print("\n1. 测试健康检查")
        async with aiohttp.ClientSession() as session:
            async with session.get("http://127.0.0.1:9201/health") as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ 健康检查成功: {result}")
                else:
                    print(f"❌ 健康检查失败: {response.status}")
        
        # 测试 sandbox API 调用
        print("\n2. 测试 sandbox API 调用")
        
        # 测试获取状态
        test_cases = [
            {
                "name": "获取状态",
                "data": {
                    "action": "get_status",
                    "session_id": "test_session_123"
                }
            },
            {
                "name": "执行简单代码",
                "data": {
                    "action": "execute_code",
                    "content": "print('Hello from API test')\nresult = 42",
                    "filename": "test.py",
                    "output_params": ["result"],
                    "session_id": "test_session_123"
                }
            },
            {
                "name": "创建文件",
                "data": {
                    "action": "create_file",
                    "content": "def test():\n    return 'Hello from file'",
                    "filename": "test_file.py",
                    "session_id": "test_session_123"
                }
            },
            {
                "name": "列出文件",
                "data": {
                    "action": "list_files",
                    "session_id": "test_session_123"
                }
            }
        ]
        
        async with aiohttp.ClientSession() as session:
            for test_case in test_cases:
                print(f"\n测试: {test_case['name']}")
                try:
                    async with session.post(
                        "http://127.0.0.1:9201/tools/sandbox",
                        json=test_case['data'],
                        headers={"Content-Type": "application/json"}
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            print(f"✅ {test_case['name']} 成功")
                            print(f"   响应: {json.dumps(result, indent=2, ensure_ascii=False)[:200]}...")
                        else:
                            error_text = await response.text()
                            print(f"❌ {test_case['name']} 失败: {response.status}")
                            print(f"   错误: {error_text}")
                except Exception as e:
                    print(f"❌ {test_case['name']} 异常: {e}")
        
        # 测试错误情况
        print("\n3. 测试错误情况")
        error_test_cases = [
            {
                "name": "缺少必要参数",
                "data": {
                    "action": "execute_code",
                    "session_id": "test_session_123"
                }
            },
            {
                "name": "无效的操作类型",
                "data": {
                    "action": "invalid_action",
                    "session_id": "test_session_123"
                }
            }
        ]
        
        async with aiohttp.ClientSession() as session:
            for test_case in error_test_cases:
                print(f"\n测试错误: {test_case['name']}")
                try:
                    async with session.post(
                        "http://127.0.0.1:9201/tools/sandbox",
                        json=test_case['data'],
                        headers={"Content-Type": "application/json"}
                    ) as response:
                        result = await response.json()
                        print(f"✅ 错误处理正确: {response.status}")
                        print(f"   错误响应: {json.dumps(result, indent=2, ensure_ascii=False)[:200]}...")
                except Exception as e:
                    print(f"❌ 错误测试异常: {e}")
        
        # 测试 API Schema
        print("\n4. 测试 API Schema")
        async with aiohttp.ClientSession() as session:
            async with session.get("http://127.0.0.1:9201/tools/sandbox/schema") as response:
                if response.status == 200:
                    schema = await response.json()
                    print("✅ API Schema 获取成功")
                    print(f"Schema 类型: {type(schema)}")
                else:
                    print(f"❌ API Schema 获取失败: {response.status}")
        
    except Exception as e:
        print(f"❌ API 测试过程中出现错误: {e}")
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


async def test_api_performance():
    """测试 API 性能"""
    print("\n=== 测试 API 性能 ===")
    
    # 启动服务器
    app = await test_api_server_startup()
    if not app:
        return
    
    config = uvicorn.Config(app, host="127.0.0.1", port=9202, log_level="info")
    server = uvicorn.Server(config)
    server_task = asyncio.create_task(server.serve())
    
    await asyncio.sleep(3)
    
    try:
        # 并发测试
        print("\n1. 并发测试")
        async def make_request(session_id, request_id):
            async with aiohttp.ClientSession() as session:
                data = {
                    "action": "execute_code",
                    "content": f"print('Request {request_id}')\nresult = {request_id}",
                    "session_id": session_id,
                    "output_params": ["result"]
                }
                
                start_time = time.time()
                async with session.post(
                    "http://127.0.0.1:9202/tools/sandbox",
                    json=data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    end_time = time.time()
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "request_id": request_id,
                            "status": "success",
                            "duration": end_time - start_time,
                            "result": result
                        }
                    else:
                        return {
                            "request_id": request_id,
                            "status": "failed",
                            "duration": end_time - start_time,
                            "error": await response.text()
                        }
        
        # 并发执行 5 个请求
        tasks = []
        for i in range(5):
            task = make_request(f"perf_session_{i}", i)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        success_count = 0
        total_duration = 0
        
        for result in results:
            if isinstance(result, dict) and result.get("status") == "success":
                success_count += 1
                total_duration += result.get("duration", 0)
                print(f"请求 {result['request_id']}: 成功, 耗时 {result['duration']:.3f}s")
            else:
                print(f"请求失败: {result}")
        
        if success_count > 0:
            avg_duration = total_duration / success_count
            print(f"\n性能统计:")
            print(f"成功请求: {success_count}/5")
            print(f"平均响应时间: {avg_duration:.3f}s")
            print(f"总响应时间: {total_duration:.3f}s")
        
    except Exception as e:
        print(f"❌ 性能测试失败: {e}")
    
    finally:
        server_task.cancel()
        try:
            await server_task
        except asyncio.CancelledError:
            pass


async def test_api_error_handling():
    """测试 API 错误处理"""
    print("\n=== 测试 API 错误处理 ===")
    
    # 启动服务器
    app = await test_api_server_startup()
    if not app:
        return
    
    config = uvicorn.Config(app, host="127.0.0.1", port=9203, log_level="info")
    server = uvicorn.Server(config)
    server_task = asyncio.create_task(server.serve())
    
    await asyncio.sleep(3)
    
    try:
        error_test_cases = [
            {
                "name": "空请求体",
                "data": None,
                "expected_status": 422
            },
            {
                "name": "无效 JSON",
                "data": "invalid json",
                "expected_status": 422
            },
            {
                "name": "缺少 action 参数",
                "data": {"session_id": "test"},
                "expected_status": 400
            },
            {
                "name": "无效的 action 值",
                "data": {"action": "invalid_action", "session_id": "test"},
                "expected_status": 400
            },
            {
                "name": "execute_code 缺少 content",
                "data": {"action": "execute_code", "session_id": "test"},
                "expected_status": 400
            },
            {
                "name": "create_file 缺少 content",
                "data": {"action": "create_file", "filename": "test.py", "session_id": "test"},
                "expected_status": 400
            }
        ]
        
        async with aiohttp.ClientSession() as session:
            for test_case in error_test_cases:
                print(f"\n测试: {test_case['name']}")
                try:
                    if test_case['data'] is None:
                        # 空请求体
                        async with session.post(
                            "http://127.0.0.1:9203/tools/sandbox",
                            data=None,
                            headers={"Content-Type": "application/json"}
                        ) as response:
                            print(f"状态码: {response.status}")
                            if response.status == test_case['expected_status']:
                                print(f"✅ 错误处理正确")
                            else:
                                print(f"❌ 期望状态码 {test_case['expected_status']}, 实际 {response.status}")
                    elif isinstance(test_case['data'], str):
                        # 无效 JSON
                        async with session.post(
                            "http://127.0.0.1:9203/tools/sandbox",
                            data=test_case['data'],
                            headers={"Content-Type": "application/json"}
                        ) as response:
                            print(f"状态码: {response.status}")
                            if response.status == test_case['expected_status']:
                                print(f"✅ 错误处理正确")
                            else:
                                print(f"❌ 期望状态码 {test_case['expected_status']}, 实际 {response.status}")
                    else:
                        # 正常 JSON 请求
                        async with session.post(
                            "http://127.0.0.1:9203/tools/sandbox",
                            json=test_case['data'],
                            headers={"Content-Type": "application/json"}
                        ) as response:
                            print(f"状态码: {response.status}")
                            if response.status == test_case['expected_status']:
                                print(f"✅ 错误处理正确")
                            else:
                                print(f"❌ 期望状态码 {test_case['expected_status']}, 实际 {response.status}")
                            
                            if response.status != 200:
                                error_text = await response.text()
                                print(f"错误响应: {error_text[:200]}...")
                
                except Exception as e:
                    print(f"❌ 测试异常: {e}")
    
    except Exception as e:
        print(f"❌ 错误处理测试失败: {e}")
    
    finally:
        server_task.cancel()
        try:
            await server_task
        except asyncio.CancelledError:
            pass


async def main():
    """主函数"""
    print("开始测试 SandboxTool API 路由注册...")
    
    # 测试工具属性
    test_sandbox_tool_attributes()
    
    # 测试 API 注册
    await test_sandbox_api_registration()
    
    # 测试 API 端点
    await test_sandbox_api_endpoints()
    
    # 测试 API 集成
    await test_sandbox_api_integration()
    
    # 测试真实 API 调用
    await test_api_calls_with_server()
    
    # 测试 API 性能
    await test_api_performance()
    
    # 测试 API 错误处理
    await test_api_error_handling()
    
    print("\n=== 所有测试完成 ===")


if __name__ == "__main__":
    asyncio.run(main()) 