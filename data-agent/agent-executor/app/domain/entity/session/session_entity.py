# -*- coding:utf-8 -*-
from dataclasses import dataclass
from datetime import datetime

from app.domain.vo.session import SessionIdVO
from .session_cache_data import SessionCacheData


@dataclass
class SessionEntity:
    """会话实体"""

    session_id_vo: SessionIdVO
    uid: str
    visitor_type: str
    conversation_id: str
    cache_data: SessionCacheData
    cache_data_last_set_timestamp: int
    created_at: datetime
