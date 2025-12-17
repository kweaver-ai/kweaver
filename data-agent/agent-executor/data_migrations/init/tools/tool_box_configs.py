"""
内置工具箱配置
"""
import os
from pathlib import Path

from app.common.config import Config

# 配置API和数据库连接信息
API_BASE_URL = "http://{host}:{port}/api/agent-operator-integration/internal-v1".format(
    host=Config.services.agent_operator_integration.host,
    port=Config.services.agent_operator_integration.port,
)

openapi_file_path = Path(__file__).parent / "openapi"

tool_box_configs = [
    {
        "box_id": "939bb1db-9239-43f5-8100-ba03eed683db",
        "box_name": "搜索工具",
        "box_desc": "包含 图数据库问答、文档问答、智谱搜索 三个工具",
        # "box_category": "data_query",
        "metadata_type": "openapi",
        "source": "internal",
        "config_version": "1.0.0",
        "config_source": "auto",
        "files": [
            (
                "data",
                (
                    "search_tools.json",
                    open(openapi_file_path / "search_tools.json", "rb"),
                    "application/json",
                ),
            )
        ],
    },
    {
        "box_id": "4cc04ed2-8b9e-4352-8ea6-103bf50b4250",
        "box_name": "文件处理工具",
        "box_desc": "包含 获取文件切片、获取文件完整内容、智能文件处理策略、获取文件下载URL 四个工具",
        # "box_category": "data_extract",
        "metadata_type": "openapi",
        "source": "internal",
        "config_version": "1.0.0",
        "config_source": "auto",
        "files": [
            (
                "data",
                (
                    "file_process_tools.json",
                    open(openapi_file_path / "file_process_tools.json", "rb"),
                    "application/json",
                ),
            )
        ],
    },
    {
        "box_id": "c1ad888b-2591-4e33-804b-66face219c4b",
        "box_name": "数据处理工具",
        "box_desc": "包含 通过工具、检查工具 两个工具",
        # "box_category": "data_process",
        "metadata_type": "openapi",
        "source": "internal",
        "config_version": "1.0.0",
        "config_source": "auto",
        "files": [
            (
                "data",
                (
                    "data_process_tools.json",
                    open(openapi_file_path / "data_process_tools.json", "rb"),
                    "application/json",
                ),
            )
        ],
    },
    {
        "box_id": "55cd6b6c-b546-4236-961a-4d09571fc931",
        "box_name": "记忆管理",
        "box_desc": "包含 记忆构建&召回 两个工具",
        # "box_category": "data_analysis",
        "metadata_type": "openapi",
        "source": "internal",
        "config_version": "1.0.0",
        "config_source": "auto",
        "files": [
            (
                "data",
                (
                    "agent_memory.yaml",
                    open(openapi_file_path / "agent_memory.yaml", "rb"),
                    "application/yaml",
                ),
            )
        ],
    },
    {
        "box_id": "91883b13-d5a6-f754-c90d-daf4ab416205",
        "box_name": "DataAgent配置相关工具",
        "box_desc": "获取agent配置详情",
        "metadata_type": "openapi",
        "source": "internal",
        "config_version": "1.0.0",
        "config_source": "auto",
        "files": [
            (
                "data",
                (
                    "agent_config.yaml",
                    open(openapi_file_path / "agent_config.yaml", "rb"),
                    "application/yaml",
                ),
            )
        ],
    },
    {
        "box_id": "bf0da1b2-e3b5-4bc5-83a2-ef0d3042ed83",
        "box_name": "联网搜索添加引用工具",
        "box_desc": "包含 一个工具，用于联网搜索并添加引用",
        "metadata_type": "openapi",
        "source": "internal",
        "config_version": "1.0.0",
        "config_source": "auto",
        "files": [
            (
                "data",
                (
                    "online_search_cite_tools.json",
                    open(openapi_file_path / "online_search_cite_tools.json", "rb"),
                    "application/json",
                ),
            )
        ],
    },
]
