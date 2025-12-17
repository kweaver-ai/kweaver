# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2025-03-12

from typing import Callable, Union, Dict, List
from functools import wraps
import os
import sys

# 获取当前文件的绝对路径
current_file_path = os.path.abspath(__file__)
grandparent_dir = os.path.abspath(os.path.join(current_file_path, '../../../'))
# 将上上级目录添加到sys.path中
sys.path.append(grandparent_dir)

from fastapi import APIRouter, FastAPI
from af_agent.tools.base_tools.mock_tools import MinusTool
from af_agent.tools.base_tools.json2plot import Json2Plot
from af_agent.tools.base_tools.text2metric import Text2MetricTool
from af_agent.tools.base_tools.text2sql import Text2SQLTool
from af_agent.tools.base_tools.text2dip_metric import Text2DIPMetricTool
from af_agent.tools.base_tools.af_sailor import AfSailorTool
from af_agent.tools.base_tools.knowledge_enhanced import KnowledgeEnhancedTool
from af_agent.tools.base_tools.table_info import get_create_table_statement
from af_agent.tools.graph_tools.nl2ngql_qq import Text2nGQLTool
from af_agent.tools.base_tools.sql_helper import SQLHelperTool
from af_agent.tools.base_tools.knowledge_item import KnowledgeItemTool

# 在顶部导入新增
from af_agent.tools.base_tools.analyzer_with_code import AnalyzerWithCodeTool
from af_agent.tools.base_tools.get_metadata import GetMetadataTool
from af_agent.sessions.base import BaseChatHistorySession
from af_agent.sessions import CreateSession
from af_agent.utils.dip_services.services.builder import Builder
from af_agent.utils.dip_services.base import ServiceType

# 导入 sandbox 工具
from af_agent.tools.sandbox_tools.shared_all_in_one import SandboxTool
from af_agent.tools.sandbox_tools.toolkit import SANDBOX_TOOLS_MAPPING
from af_agent.tools.knowledge_network_tools import KNOWLEDGE_NETWORK_TOOLS_MAPPING


from af_agent.logs import logger


_BASE_TOOLS_MAPPING = {
    # "text2metric": Text2MetricTool,
    "text2sql": Text2SQLTool,
    # "af_sailor": AfSailorTool,
    # "knowledge_enhanced": KnowledgeEnhancedTool,
    # "analyzer_with_code": AnalyzerWithCodeTool,
    "text2ngql": Text2nGQLTool,
    "text2metric": Text2DIPMetricTool,
    "sql_helper": SQLHelperTool,
    "knowledge_item": KnowledgeItemTool,
    "get_metadata": GetMetadataTool,
    "json2plot": Json2Plot
}

class BaseToolAPIRouter(APIRouter): 
    name: str = "基础结构化数据分析工具箱"
    description: str = "支持对结构话数据进行处理的工具箱"

    def __init__(self, tools_mapping: dict = None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.tools_mapping = tools_mapping

        if not self.tools_mapping:
            self.tools_mapping = _BASE_TOOLS_MAPPING
        
        self._init_tools()

    
    def add_tool(self, tool_name: str, tool_cls):
        if hasattr(tool_cls, "as_async_api_cls"):
            self.add_api_route(
                path=f"/{tool_name}",
                endpoint=tool_cls.as_async_api_cls,
                methods=["POST"]
            )
        if hasattr(tool_cls, "get_api_schema"):
            self.add_api_route(
                path=f"/{tool_name}/schema",
                endpoint=tool_cls.get_api_schema,
                methods=["GET"]
            )

    def _init_tools(self):
        for tool_name, tool_cls in self.tools_mapping.items():
            self.add_tool(tool_name, tool_cls)
        
        self.add_api_route(
            path="/docs",
            endpoint=self.get_api_docs,
            methods=["GET"]
        )


    async def get_api_docs(self, server_url: str = "http://data-retrieval:9100"):
        """获取工具的API文档, 符合OpenAPI 3.0规范
        Parameters:
            server_url: 服务地址
            tools: 工具列表, 为空时返回所有工具的API文档
        Returns: 
            符合OpenAPI 3.0规范的API文档
        """
        tools = list(self.tools_mapping.keys())
        if self.description:
            toolbox_desc = self.description + "，工具包含: \n"
        else:
            toolbox_desc = "工具包含: \n"

        for idx, tool_name in enumerate(tools):
            toolbox_desc += f"{idx + 1}. {tool_name}\n"

        schemas = {
            "openapi": "3.0.3",
            "info": {
                "title": self.name,
                "description": toolbox_desc,
                "version": "1.0.11"
            },
            "servers": [
                {
                    "url": server_url
                }
            ],
            "paths": {}
        }
        
        for tool_name in tools:
            schemas["paths"][f"{self.prefix}/{tool_name}"] = await self.tools_mapping[tool_name].get_api_schema()
        
        # schemas["paths"][f"{self.prefix}/result"] = await self.get_tool_result_schema()

        return schemas
    

class SandboxToolAPIRouter(BaseToolAPIRouter):
    name: str = "沙箱环境工具箱"
    description: str = "支持对沙箱环境进行操作, 沙箱是一个 Linux 环境, 有一个工作区目录, 其中安装了 python3, pandas 等基础库,"

    def __init__(self, *args, **kwargs):
        super().__init__(tools_mapping=SANDBOX_TOOLS_MAPPING, *args, **kwargs)
        self._init_tools()


def create_app():
    router = BaseToolAPIRouter(prefix="/tools", tools_mapping=_BASE_TOOLS_MAPPING | SANDBOX_TOOLS_MAPPING | KNOWLEDGE_NETWORK_TOOLS_MAPPING)

    app = FastAPI(
        title="AF Agent Tools API",
        description="AF Agent Tools API",
        version="1.0.0",
        openapi_url="/openapi.json",
        log_level="debug"
    )
    app.include_router(router)
    return app


DEFAULT_APP = create_app()


if __name__ == "__main__":
    import uvicorn
    
    router = BaseToolAPIRouter(prefix="/tools", tools_mapping=_BASE_TOOLS_MAPPING | SANDBOX_TOOLS_MAPPING | KNOWLEDGE_NETWORK_TOOLS_MAPPING)
    # sandbox_router = SandboxToolAPIRouter(prefix="/sandbox_tools")
    # router.include_router(sandbox_router)

    app = create_app()

    @app.get("/")
    async def root():
        return {"message": "Hello World"}

    uvicorn.run(app, host="0.0.0.0", port=9100)
