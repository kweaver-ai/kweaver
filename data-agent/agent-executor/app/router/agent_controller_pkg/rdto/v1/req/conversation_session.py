# -*- coding:utf-8 -*-
from typing import Optional
from pydantic import BaseModel, Field, field_validator, model_validator

from app.domain.vo.agentvo import AgentConfigVo


class ConversationSessionInitReq(BaseModel):
    """对话Session初始化请求

    至少需要提供agent_id或agent_config之一
    agent_config优先级高于agent_id
    """

    conversation_id: str = Field(
        ...,
        description="对话ID",
        min_length=1,
        max_length=100,
        json_schema_extra={"example": "conv_123"},
    )

    agent_id: Optional[str] = Field(
        None,
        description="Agent ID，与agent_config二选一，agent_config优先",
        json_schema_extra={"example": "xxx"},
    )

    agent_version: Optional[str] = Field(
        default=None,
        title="agent_version",
        description="agent版本号,与agent_id配合使用",
        example="latest",
    )

    agent_config: Optional[AgentConfigVo] = Field(
        None, description="Agent配置，与agent_id二选一，优先级更高"
    )

    @field_validator("conversation_id")
    @classmethod
    def validate_conversation_id(cls, v: str) -> str:
        """验证conversation_id格式"""
        if not v or not v.strip():
            raise ValueError("conversation_id不能为空")
        return v.strip()

    @model_validator(mode="after")
    def validate_agent_params(self) -> "ConversationSessionInitReq":
        """验证agent_id和agent_config至少有一个"""
        if not self.agent_id and not self.agent_config:
            raise ValueError("agent_id和agent_config至少需要提供一个")

        # if self.agent_id and not self.agent_version:
        #     raise ValueError("当agent_id提供时，agent_version不能为空")

        return self
