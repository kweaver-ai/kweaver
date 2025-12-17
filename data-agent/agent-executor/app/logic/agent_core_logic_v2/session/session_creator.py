# -*- coding:utf-8 -*-
"""Session创建器

负责Session的创建逻辑
"""

import logging
import time
from typing import Dict, TYPE_CHECKING
from datetime import datetime


from app.domain.entity.session import SessionEntity
from app.domain.vo.session import SessionIdVO
from app.domain.vo.agentvo import AgentConfigVo
from app.infra.common.util.redis_cache import RedisCache

from app.utils.observability.observability_log import get_logger as o11y_logger


if TYPE_CHECKING:
    from .session_manager import SessionManager

logger = logging.getLogger(__name__)


class SessionCreator:
    """Session创建器

    负责：
    1. 生成SessionID
    2. 缓存到Redis
    """

    def __init__(self, manager: "SessionManager"):
        """初始化SessionCreator

        Args:
            manager: SessionManager实例
        """
        self.manager = manager
        self.redis_cache = RedisCache(db=3)

    async def create(
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

        """

        # 1. 生成SessionID
        session_id_vo = SessionIdVO(
            uid,
            visitor_type,
            conversation_id,
            agent_config.get_config_last_set_timestamp(),
        )

        try:
            # 2. 初始化Agent组件静态数据

            from ..agent_core_v2 import AgentCoreV2

            agent_core_v2 = AgentCoreV2(agent_config, True)
            await agent_core_v2.warmup_handler.warnup(
                headers=headers,
            )

            # 3. 创建Session实体
            session = SessionEntity(
                session_id_vo=session_id_vo,
                uid=uid,
                visitor_type=visitor_type,
                conversation_id=conversation_id,
                cache_data=agent_core_v2.session_handler.session_cache_data,
                cache_data_last_set_timestamp=int(time.time()),
                created_at=datetime.now(),
            )

            # 4. 保存到Redis
            await self.manager.cache_service.save(session)

        except Exception as e:
            o11y_logger().error(f"session create failed: {e}")
            raise e

        finally:
            pass

        return session_id_vo
