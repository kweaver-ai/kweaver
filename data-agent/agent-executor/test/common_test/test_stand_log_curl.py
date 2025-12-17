# -*- coding: utf-8 -*-
"""
StandLog._generate_curl_command 方法的单元测试
覆盖各种请求场景的 curl 命令生成
"""

import pytest
from unittest.mock import MagicMock, patch


class TestGenerateCurlCommand:
    """测试 _generate_curl_command 方法"""

    @pytest.fixture
    def stand_log(self):
        """创建 StandLog 实例用于测试"""
        with patch("app.common.stand_log.Config") as mock_config:
            mock_config.app.enable_system_log = "false"
            from app.common.stand_log import StandLog_logging
            return StandLog_logging()

    # ==================== 基础场景 ====================

    def test_simple_get_request(self, stand_log):
        """测试简单的 GET 请求"""
        req_info = {
            "method": "GET",
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert curl.startswith("curl")
        assert "-X GET" not in curl  # GET 是默认方法，不需要 -X
        assert "'http://localhost:8080/api/test'" in curl

    def test_simple_post_request(self, stand_log):
        """测试简单的 POST 请求"""
        req_info = {
            "method": "POST",
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "body": '{"key": "value"}',
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-X POST" in curl
        assert "-d " in curl
        assert '{"key": "value"}' in curl

    def test_put_request(self, stand_log):
        """测试 PUT 请求"""
        req_info = {
            "method": "PUT",
            "path": "/api/resource/1",
            "headers": {"host": "localhost:8080"},
            "body": '{"name": "updated"}',
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-X PUT" in curl
        assert "-d " in curl

    def test_patch_request(self, stand_log):
        """测试 PATCH 请求"""
        req_info = {
            "method": "PATCH",
            "path": "/api/resource/1",
            "headers": {"host": "localhost:8080"},
            "body": '{"status": "active"}',
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-X PATCH" in curl
        assert "-d " in curl

    def test_delete_request(self, stand_log):
        """测试 DELETE 请求（无 body）"""
        req_info = {
            "method": "DELETE",
            "path": "/api/resource/1",
            "headers": {"host": "localhost:8080"},
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-X DELETE" in curl
        assert "-d " not in curl  # DELETE 通常没有 body

    # ==================== Headers 处理 ====================

    def test_headers_included(self, stand_log):
        """测试请求头被正确包含"""
        req_info = {
            "method": "GET",
            "path": "/api/test",
            "headers": {
                "host": "localhost:8080",
                "authorization": "Bearer token123",
                "x-custom-header": "custom-value",
            },
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-H 'authorization: Bearer token123'" in curl
        assert "-H 'x-custom-header: custom-value'" in curl

    def test_skip_host_header(self, stand_log):
        """测试跳过 host 头"""
        req_info = {
            "method": "GET",
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-H 'host:" not in curl

    def test_skip_connection_header(self, stand_log):
        """测试跳过 connection 头"""
        req_info = {
            "method": "GET",
            "path": "/api/test",
            "headers": {
                "host": "localhost:8080",
                "connection": "keep-alive",
            },
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-H 'connection:" not in curl

    def test_skip_content_length_header(self, stand_log):
        """测试跳过 content-length 头"""
        req_info = {
            "method": "POST",
            "path": "/api/test",
            "headers": {
                "host": "localhost:8080",
                "content-length": "100",
            },
            "body": '{"test": true}',
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-H 'content-length:" not in curl

    # ==================== Content-Type 自动添加 ====================

    def test_auto_add_content_type_for_json_body(self, stand_log):
        """测试：当没有 Content-Type 且 body 是 JSON 时，自动添加"""
        req_info = {
            "method": "POST",
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "body": '{"key": "value"}',
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-H 'Content-Type: application/json'" in curl

    def test_auto_add_content_type_for_json_array(self, stand_log):
        """测试：当 body 是 JSON 数组时，自动添加 Content-Type"""
        req_info = {
            "method": "POST",
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "body": '[{"id": 1}, {"id": 2}]',
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-H 'Content-Type: application/json'" in curl

    def test_no_auto_content_type_when_exists(self, stand_log):
        """测试：当已有 Content-Type 时，不重复添加"""
        req_info = {
            "method": "POST",
            "path": "/api/test",
            "headers": {
                "host": "localhost:8080",
                "content-type": "application/xml",
            },
            "body": '{"key": "value"}',
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        # 应该保留原有的 content-type，不添加新的
        assert "-H 'content-type: application/xml'" in curl
        assert curl.count("Content-Type") + curl.count("content-type") == 1

    def test_no_auto_content_type_for_non_json(self, stand_log):
        """测试：当 body 不是 JSON 格式时，不自动添加 Content-Type"""
        req_info = {
            "method": "POST",
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "body": "plain text body",
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-H 'Content-Type: application/json'" not in curl

    # ==================== gzip/compressed 处理 ====================

    def test_gzip_encoding_replaced_with_compressed(self, stand_log):
        """测试：accept-encoding: gzip 被替换为 --compressed"""
        req_info = {
            "method": "GET",
            "path": "/api/test",
            "headers": {
                "host": "localhost:8080",
                "accept-encoding": "gzip, deflate",
            },
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "--compressed" in curl
        assert "-H 'accept-encoding:" not in curl

    def test_no_compressed_without_gzip(self, stand_log):
        """测试：没有 gzip 时不添加 --compressed"""
        req_info = {
            "method": "GET",
            "path": "/api/test",
            "headers": {
                "host": "localhost:8080",
                "accept-encoding": "identity",
            },
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "--compressed" not in curl

    # ==================== 单引号转义 ====================

    def test_escape_single_quote_in_body(self, stand_log):
        """测试：body 中的单引号被正确转义"""
        req_info = {
            "method": "POST",
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "body": """{"message": "it's a test"}""",
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        # 单引号应该被转义为 '\''
        assert "it'\\''s a test" in curl

    def test_escape_single_quote_in_header(self, stand_log):
        """测试：header 值中的单引号被正确转义"""
        req_info = {
            "method": "GET",
            "path": "/api/test",
            "headers": {
                "host": "localhost:8080",
                "x-custom": "value's here",
            },
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "value'\\''s here" in curl

    def test_escape_multiple_single_quotes(self, stand_log):
        """测试：多个单引号都被正确转义"""
        req_info = {
            "method": "POST",
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "body": """{"text": "it's John's book"}""",
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "it'\\''s John'\\''s book" in curl

    # ==================== 查询参数 ====================

    def test_query_params_included(self, stand_log):
        """测试：查询参数被正确包含"""
        req_info = {
            "method": "GET",
            "path": "/api/search",
            "headers": {"host": "localhost:8080"},
            "query_params": {"q": "test", "page": "1"},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "q=test" in curl
        assert "page=1" in curl
        assert "?" in curl

    def test_query_params_url_encoded(self, stand_log):
        """测试：查询参数中的特殊字符被 URL 编码"""
        req_info = {
            "method": "GET",
            "path": "/api/search",
            "headers": {"host": "localhost:8080"},
            "query_params": {"q": "hello world", "filter": "a=b&c=d"},
        }
        curl = stand_log._generate_curl_command(req_info)

        # 空格应该被编码为 + 或 %20
        assert "hello+world" in curl or "hello%20world" in curl
        # & 和 = 应该被编码
        assert "a%3Db%26c%3Dd" in curl or "a=b&c=d" not in curl.split("?")[1].split("&filter=")[1].split("'")[0]

    def test_empty_query_params(self, stand_log):
        """测试：空查询参数不添加 ?"""
        req_info = {
            "method": "GET",
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "?" not in curl

    # ==================== URL 构建 ====================

    def test_url_from_host_header(self, stand_log):
        """测试：从 host header 构建 URL"""
        req_info = {
            "method": "GET",
            "path": "/api/test",
            "headers": {"host": "example.com:8080"},
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "'http://example.com:8080/api/test'" in curl

    def test_url_from_client_when_no_host(self, stand_log):
        """测试：没有 host header 时使用 client"""
        req_info = {
            "method": "GET",
            "path": "/api/test",
            "headers": {},
            "client": "XXX",
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "'http://XXX/api/test'" in curl

    def test_url_fallback_to_localhost(self, stand_log):
        """测试：没有 host 和 client 时使用 localhost"""
        req_info = {
            "method": "GET",
            "path": "/api/test",
            "headers": {},
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "'http://localhost/api/test'" in curl

    def test_url_with_https_prefix(self, stand_log):
        """测试：host 已有 https:// 前缀时不重复添加"""
        req_info = {
            "method": "GET",
            "path": "/api/test",
            "headers": {"host": "https://secure.example.com"},
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "'https://secure.example.com/api/test'" in curl
        assert "http://https://" not in curl

    # ==================== Body 处理 ====================

    def test_dict_body_converted_to_json(self, stand_log):
        """测试：dict 类型的 body 被转换为 JSON 字符串"""
        req_info = {
            "method": "POST",
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "body": {"key": "value", "number": 123},
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert '"key": "value"' in curl or '"key":"value"' in curl
        assert "-d '" in curl

    def test_empty_body_not_included(self, stand_log):
        """测试：空 body 不添加 -d 参数"""
        req_info = {
            "method": "POST",
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "body": "",
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-d " not in curl

    def test_none_body_not_included(self, stand_log):
        """测试：None body 不添加 -d 参数"""
        req_info = {
            "method": "POST",
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "body": None,
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-d " not in curl

    # ==================== 边界情况 ====================

    def test_empty_headers(self, stand_log):
        """测试：空 headers"""
        req_info = {
            "method": "GET",
            "path": "/api/test",
            "headers": {},
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert curl.startswith("curl")
        assert "-H " not in curl

    def test_none_headers(self, stand_log):
        """测试：None headers"""
        req_info = {
            "method": "GET",
            "path": "/api/test",
            "headers": None,
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert curl.startswith("curl")

    def test_missing_method_defaults_to_get(self, stand_log):
        """测试：缺少 method 时默认为 GET"""
        req_info = {
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-X " not in curl  # GET 不需要 -X

    def test_chinese_characters_in_body(self, stand_log):
        """测试：body 中包含中文字符"""
        req_info = {
            "method": "POST",
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "body": '{"message": "你好世界"}',
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "你好世界" in curl

    def test_special_characters_in_body(self, stand_log):
        """测试：body 中包含特殊字符（换行、制表符等）"""
        req_info = {
            "method": "POST",
            "path": "/api/test",
            "headers": {"host": "localhost:8080"},
            "body": '{"text": "line1\\nline2\\ttab"}',
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        assert "-d '" in curl
        # 确保命令可以生成，不会因特殊字符报错

    # ==================== 完整场景测试 ====================

    def test_full_realistic_request(self, stand_log):
        """测试：完整的真实请求场景"""
        req_info = {
            "method": "POST",
            "path": "/api/agent-executor/v2/agent/run",
            "headers": {
                "host": "127.0.0.1:30778",
                "user-agent": "Go-http-client/1.1",
                "content-length": "2537",
                "authorization": "Bearer mock_token",
                "accept-encoding": "gzip",
                "x-account-id": "user-123",
            },
            "body": '{"agent_id":"01K9EV8K46XTD1SJ4YM1E830CR","query":"test"}',
            "query_params": {},
            "client": "127.0.0.1",
        }
        curl = stand_log._generate_curl_command(req_info)

        # 验证基本结构
        assert curl.startswith("curl -X POST")
        assert "--compressed" in curl
        assert "-H 'Content-Type: application/json'" in curl
        assert "-H 'authorization: Bearer mock_token'" in curl
        assert "-H 'x-account-id: user-123'" in curl
        assert "'http://127.0.0.1:30778/api/agent-executor/v2/agent/run'" in curl

        # 验证跳过的 headers
        assert "-H 'host:" not in curl
        assert "-H 'content-length:" not in curl
        assert "-H 'accept-encoding:" not in curl


class TestCurlCommandExecution:
    """测试生成的 curl 命令是否可以被 shell 正确解析"""

    @pytest.fixture
    def stand_log(self):
        """创建 StandLog 实例用于测试"""
        with patch("app.common.stand_log.Config") as mock_config:
            mock_config.app.enable_system_log = "false"
            from app.common.stand_log import StandLog_logging
            return StandLog_logging()

    def test_curl_command_shell_safe(self, stand_log):
        """测试：生成的命令可以被 shell 安全解析（包含各种特殊字符）"""
        req_info = {
            "method": "POST",
            "path": "/api/test",
            "headers": {
                "host": "localhost:8080",
                "x-special": "value with 'quotes' and \"double quotes\"",
            },
            "body": """{"msg": "it's a test with 'single' quotes"}""",
            "query_params": {},
        }
        curl = stand_log._generate_curl_command(req_info)

        # 验证单引号被正确转义
        assert "'\\''quotes'\\''" in curl or "quotes" in curl
        # 命令应该以 curl 开头，以 URL 结尾
        assert curl.startswith("curl")
        assert curl.endswith("'")
