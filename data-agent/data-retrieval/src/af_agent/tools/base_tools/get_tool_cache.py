import traceback
from enum import Enum
from typing import Any, Optional
from af_agent.logs.logger import logger
from af_agent.tools.base import (
    ToolName,
    AFTool
)
from langchain.pydantic_v1 import BaseModel, Field, PrivateAttr
from typing import Type
from textwrap import dedent
from af_agent.sessions import BaseChatHistorySession, CreateSession
from af_agent.tools import async_construct_final_answer, construct_final_answer

from af_agent.settings import get_settings

import json


_SETTINGS = get_settings()

class GetToolCacheInput(BaseModel):
    cache_key: str = Field(..., description="工具缓存 key")

class GetToolCacheTool(AFTool):
    """
    获取工具缓存
    """
    name: str = ToolName.from_get_tool_cache.value
    description: str = "根据工具的缓存 key 获取工具缓存，如果获取出错，则需要重新调用其他工具获取数据，一般情况下不需要调用"
    parameters: BaseModel = GetToolCacheInput
    session_type: str = "redis"
    session_id: str = ""
    session: BaseChatHistorySession = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if not self.session:
            self.session = CreateSession(self.session_type)

    @construct_final_answer
    def _run(self, cache_key: str) -> str:
        """
        获取工具缓存
        """
        return self.session.get_agent_logs(cache_key)

    @async_construct_final_answer
    async def _arun(self, cache_key: str) -> str:
        """
        异步获取工具缓存
        """
        tool_res = self.session.get_agent_logs(cache_key)
        res_str = json.dumps(tool_res, ensure_ascii=False)
        
        if len(res_str) > _SETTINGS.CACHE_SIZE_LIMIT:
            # 如果超过限制，则需要截取一部分, CACHE_SIZE_LIMIT 的 前 80% 和后 20%
            res_str = (
                res_str[:int(_SETTINGS.CACHE_SIZE_LIMIT * 0.8)] +
                f"\n...实际长度为 {len(res_str)}, 中间省去 {len(res_str) - _SETTINGS.CACHE_SIZE_LIMIT}...\n" +
                res_str[-int(_SETTINGS.CACHE_SIZE_LIMIT * 0.2):]
            )
        return res_str

