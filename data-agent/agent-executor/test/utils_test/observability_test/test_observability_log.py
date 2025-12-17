import unittest

from app.utils.observability.observability_setting import *
from app.utils.observability.observability import (
    init_observability,
    shutdown_observability,
)
from app.utils.observability.observability_log import get_logger


class TestObservabilityLog(unittest.TestCase):
    setting = None
    server_info = None

    def setUp(self) -> None:
        self.setting = ObservabilitySetting(
            log=LogSetting(
                log_enabled=True,
                log_exporter="",
                log_load_interval=1,
                log_load_max_log=1,
                http_log_feed_ingester_url="",
            ),
            trace=TraceSetting(
                trace_enabled=False,
                trace_provider="console",
            ),
        )

        self.server_info = ServerInfo(
            server_name="test",
            server_version="1.0.0",
            language="Python",
            python_version="3.9.9",
        )

        init_observability(self.server_info, self.setting)

    def tearDown(self) -> None:
        shutdown_observability()

    def test_observability_log_info(self) -> None:
        get_logger().info("test info")
