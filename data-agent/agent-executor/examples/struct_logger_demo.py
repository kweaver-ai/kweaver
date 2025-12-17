#!/usr/bin/env python3
"""
结构化日志演示脚本
直接运行此脚本查看 struct_logger 的输出效果
"""
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.common.struct_logger import struct_logger
from app.common.errors import CodeException
from app.common import errors


def demo_basic_logging():
    """演示基本日志功能"""
    print("=" * 80)
    print("1. 基本日志演示")
    print("=" * 80)
    
    struct_logger.info("这是一条简单的信息日志")
    print()
    
    struct_logger.info(
        "用户登录成功",
        user_id="12345",
        username="张三",
        ip="XXX",
        login_time="2025-10-23 18:00:00"
    )
    print()


def demo_different_levels():
    """演示不同日志级别"""
    print("=" * 80)
    print("2. 不同日志级别演示")
    print("=" * 80)
    
    struct_logger.debug("这是 DEBUG 级别日志", debug_info="调试信息")
    print()
    
    struct_logger.info("这是 INFO 级别日志", info="一般信息")
    print()
    
    struct_logger.warning("这是 WARNING 级别日志", warning="需要注意的警告")
    print()
    
    struct_logger.error("这是 ERROR 级别日志", error="发生了错误")
    print()
    
    struct_logger.fatal("这是 FATAL 级别日志", fatal="致命错误")
    print()


def demo_complex_data():
    """演示复杂数据结构"""
    print("=" * 80)
    print("3. 复杂数据结构演示")
    print("=" * 80)
    
    struct_logger.info(
        "复杂数据结构",
        user_info={
            "id": "user-123",
            "name": "李四",
            "email": "lisi@example.com",
            "roles": ["admin", "user"],
            "metadata": {
                "department": "技术部",
                "level": 5
            }
        },
        request_data={
            "method": "POST",
            "url": "/api/v1/users",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer ***"
            },
            "body": {
                "action": "create",
                "data": {"name": "新用户"}
            }
        },
        numbers=[1, 2, 3, 4, 5],
        boolean_flag=True,
        null_value=None
    )
    print()


def demo_exception_handling():
    """演示异常处理"""
    print("=" * 80)
    print("4. 异常处理演示")
    print("=" * 80)
    
    # 普通异常
    try:
        result = 10 / 0
    except ZeroDivisionError as e:
        struct_logger.error(
            "捕获到除零异常",
            exc_info=e,
            operation="division",
            dividend=10,
            divisor=0
        )
    print()
    
    # CodeException
    try:
        raise CodeException(
            errors.ExternalServiceError,
            "外部服务调用失败：连接超时"
        )
    except CodeException as e:
        struct_logger.error(
            "业务异常",
            exc_info=e,
            service="external_api",
            endpoint="/api/v1/data"
        )
    print()


def demo_api_error_scenario():
    """演示 API 错误场景（类似 model_manager_service）"""
    print("=" * 80)
    print("5. API 错误场景演示（模拟 model_manager_service）")
    print("=" * 80)
    
    # 模拟 API 调用失败
    url = "http://127.0.0.1:9898/api/private/mf-model-manager/v1/llm/get"
    params = {"model_id": "1951511743712858114"}
    response_status = 400
    response_body = {
        "code": "ModelFactory.ConnectController.LLMCheck.ParameterError",
        "description": "大模型不存在",
        "detail": "大模型不存在",
        "solution": "请刷新列表",
        "link": ""
    }
    
    struct_logger.error(
        "get_llm_config failed",
        req_url=url,
        req_params=params,
        response_status=response_status,
        response_body=response_body,
    )
    print()
    
    # 模拟异常场景
    try:
        raise CodeException(
            errors.ExternalServiceError,
            f"req_url: {url}req_params: {params} get_llm_config error: {response_body}"
        )
    except CodeException as e:
        struct_logger.error(
            "get_llm_config exception",
            exc_info=e,
            model_id=params["model_id"],
        )
    print()


def demo_context_binding():
    """演示上下文绑定"""
    print("=" * 80)
    print("6. 上下文绑定演示")
    print("=" * 80)
    
    # 绑定请求上下文
    request_logger = struct_logger.bind(
        request_id="req-abc123",
        user_id="user-456",
        session_id="session-789"
    )
    
    request_logger.info("开始处理请求")
    print()
    
    request_logger.info("验证用户权限", permission="read")
    print()
    
    request_logger.info("查询数据库", table="users", query="SELECT * FROM users")
    print()
    
    request_logger.info("处理完成", result="success", duration_ms=150)
    print()


def demo_nested_function_calls():
    """演示嵌套函数调用的调用者信息"""
    print("=" * 80)
    print("7. 嵌套函数调用演示（查看 caller 信息）")
    print("=" * 80)
    
    def level_3():
        struct_logger.info("第三层函数调用", level=3)
    
    def level_2():
        struct_logger.info("第二层函数调用", level=2)
        level_3()
    
    def level_1():
        struct_logger.info("第一层函数调用", level=1)
        level_2()
    
    level_1()
    print()


def demo_chinese_support():
    """演示中文支持"""
    print("=" * 80)
    print("8. 中文支持演示")
    print("=" * 80)
    
    struct_logger.info(
        "系统通知",
        标题="重要通知",
        内容="系统将于今晚 22:00 进行维护，预计持续 2 小时",
        通知类型="维护",
        影响范围=["用户服务", "数据服务", "API 网关"],
        联系人={
            "姓名": "王五",
            "电话": "138-0000-0000",
            "邮箱": "wangwu@example.com"
        }
    )
    print()


def main():
    """主函数"""
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 20 + "结构化日志演示程序" + " " * 20 + "║")
    print("╚" + "=" * 78 + "╝")
    print()
    
    try:
        demo_basic_logging()
        demo_different_levels()
        demo_complex_data()
        demo_exception_handling()
        demo_api_error_scenario()
        demo_context_binding()
        demo_nested_function_calls()
        demo_chinese_support()
        
        print("=" * 80)
        print("演示完成！")
        print("=" * 80)
        print()
        print("提示：")
        print("1. 所有日志都是格式化的 JSON，易于阅读和解析")
        print("2. 每条日志都包含 caller 信息（文件名:行号）")
        print("3. 每条日志都包含时间戳")
        print("4. 支持中文字符")
        print("5. 异常信息会被自动格式化")
        print()
        
    except Exception as e:
        struct_logger.error("演示程序异常", exc_info=e)
        raise


if __name__ == "__main__":
    main()
