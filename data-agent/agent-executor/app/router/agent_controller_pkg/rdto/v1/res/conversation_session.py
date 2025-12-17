# -*- coding:utf-8 -*-
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ConversationSessionInitRes(BaseModel):
    """对话Session初始化响应"""

    conversation_session_id: str = Field(
        ...,
        description="对话Session ID",
        json_schema_extra={
            "example": "agent_executor:session_cache:user_123:conv_456:1234567890:uuid"
        },
    )

    ttl: int = Field(
        ..., description="会话有效期（秒）", json_schema_extra={"example": 60}
    )

    created_at: datetime = Field(..., description="创建时间")

    cache_data: Optional[Dict[str, Any]] = Field(
        default=None, description="Session缓存数据（仅在DEBUG模式下返回）"
    )
