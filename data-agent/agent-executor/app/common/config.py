import os
import sys

from app.config.builtin_ids_class import BuiltinIdsConfig
from app.config.config_v2 import ConfigClassV2
from app.utils.observability.observability_setting import (
    ServerInfo,
    ObservabilitySetting,
    LogSetting,
    TraceSetting,
)

## 1. 初始化 server info

server_info = ServerInfo(
    server_name="agent-executor",
    server_version="1.0.0",
    language="python",
    python_version=sys.version,
)

## 2. 初始化配置
# TODO: 这里的环境需要在配置中添加环境变量
observability_config = ObservabilitySetting(
    log=LogSetting(
        log_enabled=os.getenv("O11Y_LOG_ENABLED", "false") == "true",
        log_exporter=os.getenv("O11Y_LOG_EXPORTER", "http"),
        log_load_interval=int(os.getenv("O11Y_LOG_LOAD_INTERVAL", "10")),
        log_load_max_log=int(os.getenv("O11Y_LOG_LOAD_MAX_LOG", "1000")),
        http_log_feed_ingester_url=os.getenv(
            "O11Y_HTTP_LOG_FEED_INGESTER_URL",
            "http://feed-ingester-service:13031/api/feed_ingester/v1/jobs/dip-o11y-log/events",
        ),
    ),
    trace=TraceSetting(
        trace_enabled=os.getenv("O11Y_TRACE_ENABLED", "false") == "true",
        trace_provider=os.getenv("O11Y_TRACE_PROVIDER", "http"),
        trace_max_queue_size=int(os.getenv("O11Y_TRACE_MAX_QUEUE_SIZE", "512")),
        max_export_batch_size=int(os.getenv("O11Y_TRACE_MAX_EXPORT_BATCH_SIZE", "512")),
        http_trace_feed_ingester_url=os.getenv(
            "O11Y_HTTP_TRACE_FEED_INGESTER_URL",
            "http://feed-ingester-service:13031/api/feed_ingester/v1/jobs/dip-o11y-trace/events",
        ),
    ),
)


# 3. 初始化Config配置
Config = ConfigClassV2()


# 4. 初始化BuiltinIds配置
# 创建内置ID配置实例
BuiltinIds = BuiltinIdsConfig()


# 5. 调试模式下的一些处理 (这些可能是不需要的 先注释掉 2025年10月23日16:56:46）
# if Config.is_debug_mode() :
#     # 更新内置ID
#     from app.driven.dip.agent_operator_integration_service import (
#         agent_operator_integration_service,
#     )
#
#     async def update_builtin_ids():
#
#         tool_box_list = await agent_operator_integration_service.get_tool_box_list()
#
#         for tool_box in tool_box_list["data"]:
#
#             BuiltinIds.set_tool_box_id(tool_box["box_name"], tool_box["box_id"])
#
#             tool_list = await agent_operator_integration_service.get_tool_list(
#                 tool_box["box_id"]
#             )
#
#             for tool in tool_list["tools"]:
#                 BuiltinIds.set_tool_id(tool["name"], tool["tool_id"])
#
#     loop = asyncio.get_event_loop()
#     loop.run_until_complete(update_builtin_ids())
#
