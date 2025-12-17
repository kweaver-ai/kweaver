# -*- coding:utf-8 -*-
from dataclasses import dataclass


@dataclass(frozen=True)  # 值对象不可变
class SessionIdVO:
    """会话ID值对象"""

    uid: str
    visitor_type: str
    conversation_id: str
    agent_config_last_set_timestamp: int

    def to_redis_key(self) -> str:
        """转换为Redis key

        Returns:
            Redis key字符串
        """
        return f"agent_executor:session:{self.get_session_id()}"

    def get_session_id(self) -> str:
        """获取session_id（不含前缀）

        Returns:
            session_id字符串，格式：{uid}:{visitor_type}:{conversation_id}:{agent_config_last_set_timestamp}
        """
        return f"{self.uid}:{self.visitor_type}:{self.conversation_id}:{str(self.agent_config_last_set_timestamp)}"

    def __str__(self) -> str:
        """字符串表示

        Returns:
            session_id字符串
        """
        return self.get_session_id()
