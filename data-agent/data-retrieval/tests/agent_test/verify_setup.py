#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
验证 SandboxTool 测试环境配置
"""

import sys
import os
import importlib

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


def check_imports():
    """检查必要的导入"""
    print("=== 检查依赖导入 ===")
    
    required_modules = [
        ("fastapi", "FastAPI 框架"),
        ("uvicorn", "ASGI 服务器"),
        ("aiohttp", "异步 HTTP 客户端"),
        ("requests", "HTTP 客户端"),
        ("pandas", "数据处理"),
        ("langchain", "LangChain 框架"),
        ("data_retrieval", "AF Agent 框架"),
        ("sandbox_env", "沙箱环境"),
    ]
    
    all_imports_ok = True
    
    for module_name, description in required_modules:
        try:
            importlib.import_module(module_name)
            print(f"✅ {module_name} - {description}")
        except ImportError as e:
            print(f"❌ {module_name} - {description}: {e}")
            all_imports_ok = False
    
    return all_imports_ok


def check_data_retrieval_modules():
    """检查 AF Agent 模块"""
    print("\n=== 检查 AF Agent 模块 ===")
    
    required_af_modules = [
        "data_retrieval.tools.sandbox_tools.shared_env",
        "data_retrieval.tools.tool_api_router",
        "data_retrieval.tools.base",
        "data_retrieval.settings",
        "data_retrieval.errors",
    ]
    
    all_modules_ok = True
    
    for module_name in required_af_modules:
        try:
            importlib.import_module(module_name)
            print(f"✅ {module_name}")
        except ImportError as e:
            print(f"❌ {module_name}: {e}")
            all_modules_ok = False
    
    return all_modules_ok


def check_sandbox_tool():
    """检查 SandboxTool 类"""
    print("\n=== 检查 SandboxTool 类 ===")
    
    try:
        from data_retrieval.tools.sandbox_tools.shared_all_in_one import SandboxTool, SandboxActionType
        
        # 检查类属性
        required_attrs = [
            "name", "description", "args_schema",
            "as_async_api_cls", "get_api_schema"
        ]
        
        all_attrs_ok = True
        for attr in required_attrs:
            if hasattr(SandboxTool, attr):
                print(f"✅ SandboxTool.{attr}")
            else:
                print(f"❌ SandboxTool.{attr} 缺失")
                all_attrs_ok = False
        
        # 检查操作类型
        print(f"✅ SandboxActionType: {list(SandboxActionType)}")
        
        return all_attrs_ok
        
    except Exception as e:
        print(f"❌ 检查 SandboxTool 失败: {e}")
        return False


def check_api_router():
    """检查 API 路由"""
    print("\n=== 检查 API 路由 ===")
    
    try:
        from data_retrieval.tools.tool_api_router import _BASE_TOOLS_MAPPING, _BASE_TOOL_NAMES
        
        # 检查工具注册
        if "sandbox" in _BASE_TOOLS_MAPPING:
            print(f"✅ sandbox 工具已注册: {_BASE_TOOLS_MAPPING['sandbox']}")
        else:
            print("❌ sandbox 工具未注册")
            return False
        
        if "sandbox" in _BASE_TOOL_NAMES:
            print("✅ sandbox 在工具名称列表中")
        else:
            print("❌ sandbox 不在工具名称列表中")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ 检查 API 路由失败: {e}")
        return False


def check_settings():
    """检查设置"""
    print("\n=== 检查设置 ===")
    
    try:
        from data_retrieval.settings import get_settings
        
        settings = get_settings()
        
        # 检查沙箱 URL 配置
        if hasattr(settings, 'SANDBOX_URL'):
            print(f"✅ SANDBOX_URL: {settings.SANDBOX_URL}")
        else:
            print("❌ SANDBOX_URL 未配置")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ 检查设置失败: {e}")
        return False


def check_test_files():
    """检查测试文件"""
    print("\n=== 检查测试文件 ===")
    
    test_files = [
        "test_sandbox_tool.py",
        "test_sandbox_api_router.py", 
        "test_sandbox_api_quick.py",
        "run_sandbox_tests.py"
    ]
    
    all_files_ok = True
    
    for filename in test_files:
        file_path = os.path.join(os.path.dirname(__file__), filename)
        if os.path.exists(file_path):
            print(f"✅ {filename}")
        else:
            print(f"❌ {filename} 不存在")
            all_files_ok = False
    
    return all_files_ok


def main():
    """主函数"""
    print("SandboxTool 测试环境验证")
    print("=" * 50)
    
    checks = [
        ("依赖导入", check_imports),
        ("AF Agent 模块", check_data_retrieval_modules),
        ("SandboxTool 类", check_sandbox_tool),
        ("API 路由", check_api_router),
        ("设置配置", check_settings),
        ("测试文件", check_test_files),
    ]
    
    all_checks_passed = True
    
    for check_name, check_func in checks:
        try:
            result = check_func()
            if not result:
                all_checks_passed = False
        except Exception as e:
            print(f"❌ {check_name} 检查异常: {e}")
            all_checks_passed = False
    
    print("\n" + "=" * 50)
    if all_checks_passed:
        print("✅ 所有检查通过！测试环境配置正确。")
        print("\n可以运行以下测试:")
        print("- python test_sandbox_api_quick.py  # 快速测试")
        print("- python test_sandbox_tool.py       # 功能测试")
        print("- python test_sandbox_api_router.py # 完整测试")
        print("- python run_sandbox_tests.py       # 测试运行器")
    else:
        print("❌ 部分检查失败，请解决上述问题后重试。")
        print("\n常见解决方案:")
        print("1. 安装缺失的依赖: pip install fastapi uvicorn aiohttp requests")
        print("2. 安装 sandbox_env: pip install -e deps/sandbox_env-0.1.0-py3-none-any.whl")
        print("3. 检查项目路径配置")
        print("4. 确认环境变量设置")
    
    return all_checks_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 