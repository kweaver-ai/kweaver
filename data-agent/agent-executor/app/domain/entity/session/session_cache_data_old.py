# -*- coding:utf-8 -*-
from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class SessionCacheDataOld:
    """Session缓存数据实体

    只保存创建DolphinAgent所需的静态数据（JSON可序列化）
    """

    # 创建DolphinAgent所需的静态数据
    llm_config: Dict[str, Any]  # LLM配置
    agent_config: Dict[str, Any]  # Agent配置
    dolphin_prompt: str  # Dolphin Prompt
    skills: Dict[str, Any]  # Skills配置

    # 工具相关数据（仅元数据，不包含实例）
    tool_dict_metadata: Dict[str, Any]  # 工具元数据

    # HTTP请求头（用于rebuild和工具调用）
    headers: Dict[str, str]

    # 用户标识
    uid: str
    visitor_type: str
    conversation_id: str

    # 时间戳
    created_at: float
    last_accessed: float

    def to_json_dict(self) -> Dict[str, Any]:
        """转换为JSON可序列化的字典

        Returns:
            JSON可序列化的字典
        """
        return {
            "llm_config": self.llm_config,
            "agent_config": self.agent_config,
            "dolphin_prompt": self.dolphin_prompt,
            "skills": self.skills,
            "tool_dict_metadata": self.tool_dict_metadata,
            "headers": self.headers,
            "uid": self.uid,
            "visitor_type": self.visitor_type,
            "conversation_id": self.conversation_id,
            "created_at": self.created_at,
            "last_accessed": self.last_accessed,
        }

    @classmethod
    def from_json_dict(cls, data: Dict[str, Any]) -> "SessionCacheData":
        """从JSON字典创建

        Args:
            data: JSON字典

        Returns:
            SessionCacheData实例
        """
        return cls(
            llm_config=data["llm_config"],
            agent_config=data["agent_config"],
            dolphin_prompt=data["dolphin_prompt"],
            skills=data["skills"],
            tool_dict_metadata=data["tool_dict_metadata"],
            headers=data.get("headers", {}),
            uid=data["uid"],
            visitor_type=data["visitor_type"],
            conversation_id=data["conversation_id"],
            created_at=data["created_at"],
            last_accessed=data["last_accessed"],
        )
