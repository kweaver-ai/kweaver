# -*- coding:utf-8 -*-
"""Session管理器主类

负责协调各个子模块，提供统一的Session管理接口
"""

import time
from typing import Dict

from app.domain.vo.session import SessionIdVO
from app.domain.vo.agentvo import AgentConfigVo
from .session_cache_service import SessionCacheService
from .session_creator import SessionCreator

from app.utils.observability.observability_log import get_logger as o11y_logger


class SessionManager:
    """Session管理器 - 主类

    负责协调各个子模块，提供统一的Session管理接口
    """

    def __init__(self):
        """初始化SessionManager"""
        # 初始化基础服务
        self.cache_service = SessionCacheService()

        # 初始化子模块
        self.creator = SessionCreator(self)

    async def create_session(
        self,
        uid: str,
        visitor_type: str,
        conversation_id: str,
        agent_config: AgentConfigVo,
        headers: Dict[str, str],
    ) -> SessionIdVO:
        """创建新会话

        Args:
            uid: 用户ID
            visitor_type: 访问者类型
            conversation_id: 对话ID
            agent_config: Agent配置
            headers: HTTP请求头

        Returns:
            SessionIdVO: 创建的会话ID

        Raises:
            ConcurrencyLimitException: 并发数已达上限
        """

        return await self.creator.create(
            uid, visitor_type, conversation_id, agent_config, headers
        )

    async def update_session_cached_data(
        self,
        session_id_vo: SessionIdVO,
        agent_config: AgentConfigVo,
        headers: Dict[str, str],
    ) -> None:
        """更新Session缓存数据
        保持session的ttl不变

        Args:
            session_id_vo: 会话ID
            agent_config: Agent配置
            headers: HTTP请求头
        """

        try:
            # 1. load session
            session = await self.cache_service.load(session_id_vo)

            # 2. get cache data

            from ..agent_core_v2 import AgentCoreV2

            agent_core_v2 = AgentCoreV2(agent_config, True)
            await agent_core_v2.warmup_handler.warnup(
                headers=headers,
            )

            # 3. update session cache data
            session.cache_data = agent_core_v2.session_handler.session_cache_data
            session.cache_data_last_set_timestamp = int(time.time())

            # 4. 保存到Redis(ttl 保持不变)
            ttl = await self.cache_service.get_ttl(session_id_vo)
            await self.cache_service.save(session, ttl=ttl)

        except Exception as e:
            o11y_logger().error(f"session update cached data failed: {e}")
            raise e
