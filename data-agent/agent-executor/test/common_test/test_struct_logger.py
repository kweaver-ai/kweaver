"""
结构化日志模块测试
测试 struct_logger 的各种功能
"""

import json
import pytest
from app.common.struct_logger import struct_logger, StructLogger
from app.common.errors import CodeException
from app.common import errors


class TestStructLogger:
    """结构化日志测试类"""

    def test_singleton_pattern(self):
        """测试单例模式"""
        logger1 = StructLogger()
        logger2 = StructLogger()
        assert logger1 is logger2, "StructLogger 应该是单例"

    def test_basic_info_log(self, caplog):
        """测试基本的 info 日志"""
        struct_logger.info("测试信息日志")

        # 验证日志被记录
        assert len(caplog.records) > 0

    def test_info_log_with_params(self, caplog):
        """测试带参数的 info 日志"""
        struct_logger.info(
            "用户登录", user_id="12345", username="张三", ip="XXX"
        )

        # 验证日志被记录
        assert len(caplog.records) > 0

        # 解析日志消息（应该是 JSON 格式）
        log_message = caplog.records[-1].message
        try:
            log_data = json.loads(log_message)
            assert log_data["event"] == "用户登录"
            assert log_data["user_id"] == "12345"
            assert log_data["username"] == "张三"
            assert log_data["ip"] == "XXX"
            assert "timestamp" in log_data
            assert "caller" in log_data
        except json.JSONDecodeError:
            pytest.fail(f"日志消息不是有效的 JSON: {log_message}")

    def test_debug_log(self, caplog):
        """测试 debug 日志"""
        struct_logger.debug("调试信息", variable="value", count=42)

        assert len(caplog.records) > 0

    def test_warning_log(self, caplog):
        """测试 warning 日志"""
        struct_logger.warning(
            "警告信息", warning_type="deprecated_api", details="此 API 将在下个版本移除"
        )

        assert len(caplog.records) > 0
        log_message = caplog.records[-1].message
        log_data = json.loads(log_message)
        assert log_data["event"] == "警告信息"
        assert log_data["warning_type"] == "deprecated_api"

    def test_warn_alias(self, caplog):
        """测试 warn 是 warning 的别名"""
        struct_logger.warn("警告")
        assert len(caplog.records) > 0

    def test_error_log(self, caplog):
        """测试 error 日志"""
        struct_logger.error(
            "错误发生", error_type="database_error", error_message="连接超时"
        )

        assert len(caplog.records) > 0
        log_message = caplog.records[-1].message
        log_data = json.loads(log_message)
        assert log_data["event"] == "错误发生"
        assert log_data["error_type"] == "database_error"

    def test_error_log_with_exception(self, caplog):
        """测试带异常对象的 error 日志"""
        try:
            raise ValueError("测试异常")
        except ValueError as e:
            struct_logger.error("捕获到异常", exc_info=e, context="测试上下文")

        assert len(caplog.records) > 0
        log_message = caplog.records[-1].message
        log_data = json.loads(log_message)
        assert log_data["event"] == "捕获到异常"
        assert log_data["context"] == "测试上下文"
        assert "exception" in log_data

    def test_error_log_with_code_exception(self, caplog):
        """测试带 CodeException 的 error 日志"""
        try:
            raise CodeException(
                errors.ExternalServiceError, "外部服务调用失败"
            )
        except CodeException as e:
            struct_logger.error("业务异常", exc_info=e, service="model_manager")

        assert len(caplog.records) > 0
        log_message = caplog.records[-1].message
        log_data = json.loads(log_message)
        assert log_data["event"] == "业务异常"
        assert log_data["service"] == "model_manager"
        assert "error_details" in log_data

        # 验证 error_details 包含 CodeException 的格式化信息
        error_details = log_data["error_details"]
        assert "error_code" in error_details
        assert "description" in error_details

    def test_fatal_log(self, caplog):
        """测试 fatal 日志"""
        struct_logger.fatal("致命错误", error="系统崩溃")

        assert len(caplog.records) > 0
        # fatal 映射到 critical 级别
        assert caplog.records[-1].levelname == "CRITICAL"

    def test_bind_context(self, caplog):
        """测试上下文绑定"""
        # 绑定上下文
        logger = struct_logger.bind(request_id="req-123456", user_id="user-789")

        # 记录日志
        logger.info("处理请求开始")
        logger.info("处理请求完成", result="success")

        # 验证两条日志都包含绑定的上下文
        assert len(caplog.records) >= 2

        for record in caplog.records[-2:]:
            log_data = json.loads(record.message)
            assert log_data["request_id"] == "req-123456"
            assert log_data["user_id"] == "user-789"

    def test_json_format(self, caplog):
        """测试 JSON 格式输出"""
        struct_logger.info(
            "测试 JSON 格式",
            nested_dict={"key1": "value1", "key2": {"nested_key": "nested_value"}},
            list_data=[1, 2, 3, 4, 5],
        )

        assert len(caplog.records) > 0
        log_message = caplog.records[-1].message

        # 验证是有效的 JSON
        log_data = json.loads(log_message)

        # 验证嵌套结构被正确保留
        assert log_data["nested_dict"]["key1"] == "value1"
        assert log_data["nested_dict"]["key2"]["nested_key"] == "nested_value"
        assert log_data["list_data"] == [1, 2, 3, 4, 5]

    def test_chinese_characters(self, caplog):
        """测试中文字符支持"""
        struct_logger.info(
            "测试中文",
            用户名="张三",
            描述="这是一个中文描述",
            错误信息="发生了一个错误",
        )

        assert len(caplog.records) > 0
        log_message = caplog.records[-1].message
        log_data = json.loads(log_message)

        # 验证中文被正确处理
        assert log_data["用户名"] == "张三"
        assert log_data["描述"] == "这是一个中文描述"
        assert log_data["错误信息"] == "发生了一个错误"

    def test_caller_info(self, caplog):
        """测试调用者信息"""
        struct_logger.info("测试调用者信息")

        assert len(caplog.records) > 0
        log_message = caplog.records[-1].message
        log_data = json.loads(log_message)

        # 验证包含调用者信息
        assert "caller" in log_data
        assert "test_struct_logger.py" in log_data["caller"]
        assert ":" in log_data["caller"]  # 文件名:行号格式

    def test_timestamp_format(self, caplog):
        """测试时间戳格式"""
        struct_logger.info("测试时间戳")

        assert len(caplog.records) > 0
        log_message = caplog.records[-1].message
        log_data = json.loads(log_message)

        # 验证时间戳格式
        assert "timestamp" in log_data
        # 格式应该是 YYYY-MM-DD HH:MM:SS
        import re

        timestamp_pattern = r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}"
        assert re.match(timestamp_pattern, log_data["timestamp"])

    def test_log_level(self, caplog):
        """测试日志级别"""
        struct_logger.debug("debug 消息")
        struct_logger.info("info 消息")
        struct_logger.warning("warning 消息")
        struct_logger.error("error 消息")

        # 验证不同级别的日志
        levels = [record.levelname for record in caplog.records]
        assert "DEBUG" in levels or "INFO" in levels  # debug 可能被过滤
        assert "INFO" in levels
        assert "WARNING" in levels
        assert "ERROR" in levels

    def test_complex_data_types(self, caplog):
        """测试复杂数据类型"""
        struct_logger.info(
            "复杂数据类型测试",
            string="字符串",
            integer=42,
            float_num=3.14,
            boolean=True,
            none_value=None,
            list_data=[1, "two", 3.0],
            dict_data={"key": "value"},
            tuple_data=(1, 2, 3),  # 元组会被转换为列表
        )

        assert len(caplog.records) > 0
        log_message = caplog.records[-1].message
        log_data = json.loads(log_message)

        assert log_data["string"] == "字符串"
        assert log_data["integer"] == 42
        assert log_data["float_num"] == 3.14
        assert log_data["boolean"] is True
        assert log_data["none_value"] is None
        assert log_data["list_data"] == [1, "two", 3.0]
        assert log_data["dict_data"] == {"key": "value"}

    def test_api_error_scenario(self, caplog):
        """测试 API 错误场景（模拟实际使用）"""
        # 模拟 API 调用失败
        url = "http://example.com/api/v1/users"
        params = {"user_id": "12345"}
        response_status = 500
        response_body = {"code": "INTERNAL_ERROR", "message": "服务器内部错误"}

        struct_logger.error(
            "API 调用失败",
            req_url=url,
            req_params=params,
            response_status=response_status,
            response_body=response_body,
        )

        assert len(caplog.records) > 0
        log_message = caplog.records[-1].message
        log_data = json.loads(log_message)

        assert log_data["event"] == "API 调用失败"
        assert log_data["req_url"] == url
        assert log_data["req_params"] == params
        assert log_data["response_status"] == response_status
        assert log_data["response_body"] == response_body

    def test_exception_with_traceback(self, caplog):
        """测试异常堆栈信息"""

        def inner_function():
            raise RuntimeError("内部错误")

        def outer_function():
            inner_function()

        try:
            outer_function()
        except RuntimeError as e:
            struct_logger.error("捕获异常", exc_info=e, operation="outer_function")

        assert len(caplog.records) > 0
        log_message = caplog.records[-1].message
        log_data = json.loads(log_message)

        assert log_data["event"] == "捕获异常"
        assert "exception" in log_data
        assert "RuntimeError" in str(log_data["exception"])


class TestStructLoggerIntegration:
    """集成测试"""

    def test_model_manager_error_scenario(self, caplog):
        """测试模拟 model_manager_service 的错误场景"""
        # 模拟 get_llm_config 失败
        url = "http://127.0.0.1:9898/api/private/mf-model-manager/v1/llm/get"
        params = {"model_id": "1951511743712858114"}
        response_status = 400
        response_body = {
            "code": "ModelFactory.ConnectController.LLMCheck.ParameterError",
            "description": "大模型不存在",
            "detail": "大模型不存在",
            "solution": "请刷新列表",
            "link": "",
        }

        struct_logger.error(
            "get_llm_config failed",
            req_url=url,
            req_params=params,
            response_status=response_status,
            response_body=response_body,
        )

        assert len(caplog.records) > 0
        log_message = caplog.records[-1].message

        # 验证日志是格式化的 JSON
        log_data = json.loads(log_message)

        # 验证所有关键信息都在
        assert log_data["event"] == "get_llm_config failed"
        assert log_data["req_url"] == url
        assert log_data["req_params"]["model_id"] == "1951511743712858114"
        assert log_data["response_status"] == 400
        assert (
            log_data["response_body"]["code"]
            == "ModelFactory.ConnectController.LLMCheck.ParameterError"
        )
        assert log_data["response_body"]["description"] == "大模型不存在"

        # 验证 JSON 是格式化的（包含换行符）
        assert "\n" in log_message, "日志应该是格式化的 JSON（包含换行符）"

    def test_exception_handling_flow(self, caplog):
        """测试完整的异常处理流程"""
        model_id = "test-model-123"

        try:
            # 模拟抛出 CodeException
            raise CodeException(
                errors.ExternalServiceError, "模型服务不可用"
            )
        except CodeException as e:
            # 使用结构化日志记录
            struct_logger.error(
                "get_llm_config exception",
                exc_info=e,
                model_id=model_id,
            )

        assert len(caplog.records) > 0
        log_message = caplog.records[-1].message
        log_data = json.loads(log_message)

        # 验证日志包含所有必要信息
        assert log_data["event"] == "get_llm_config exception"
        assert log_data["model_id"] == model_id
        assert "error_details" in log_data
        assert (
            log_data["error_details"]["error_code"]
            == "AgentExecutor.InternalError.ExternalServiceError"
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
