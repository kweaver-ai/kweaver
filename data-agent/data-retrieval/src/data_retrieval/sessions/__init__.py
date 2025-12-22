from data_retrieval.sessions.in_memory_session import InMemoryChatSession
from data_retrieval.sessions.redis_session import RedisHistorySession
from data_retrieval.sessions.base import BaseChatHistorySession

__all__ = [
    "InMemoryChatSession",
    "RedisHistorySession",
    "BaseChatHistorySession"
]

def CreateSession(session_type: str):
    if session_type == "redis":
        return RedisHistorySession()
    elif session_type == "in_memory":
        return InMemoryChatSession()
    elif session_type == "":
        return None
    else:
        raise ValueError(f"不支持的 session_type: {session_type}")
