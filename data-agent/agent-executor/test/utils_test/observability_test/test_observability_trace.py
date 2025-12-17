import unittest

from app.utils.observability.observability_setting import *
from app.utils.observability.observability import (
    init_observability,
    shutdown_observability,
)
from exporter.ar_trace.trace_exporter import tracer


class TestObservabilityTrace(unittest.TestCase):
    setting = None
    server_info = None

    def setUp(self) -> None:
        self.setting = ObservabilitySetting(
            log=LogSetting(
                log_enabled=False,
                log_exporter="",
                log_load_interval=1,
                log_load_max_log=1,
                http_log_feed_ingester_url="",
            ),
            trace=TraceSetting(
                trace_enabled=True,
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

    def test_observability_trace(self) -> None:
        with tracer.start_as_current_span("test_observability_log_info") as span:
            span.set_attribute("test_attribute", "test_value")
