# -*- coding:utf-8 -*-
"""Session缓存服务

负责会话数据的缓存操作，使用JSON序列化存储静态数据
"""

import logging
from typing import Optional

from app.domain.constant import CONVERSATION_SESSION_TTL
from app.domain.entity.session import SessionEntity
from app.domain.vo.session import SessionIdVO
from app.infra.common.util.redis_cache import RedisCache
from app.infra.common.util.redis_cache.redis_cache import SerializationType

logger = logging.getLogger(__name__)


class SessionCacheService:
    """会话缓存服务

    负责：
    1. Session数据的JSON序列化和反序列化
    2. Redis缓存操作（保存、加载、更新TTL、删除）

    存储策略：
    - 只存储JSON数据：存储在 {session_id} key中，包含创建DolphinAgent所需的所有静态数据
    """

    def __init__(self, redis_db: int = 3):
        """初始化缓存服务

        Args:
            redis_db: Redis数据库编号，默认为3
        """
        self.redis_cache = RedisCache(db=redis_db)
        self.redis_db = redis_db

    async def save(
        self, session_eo: SessionEntity, ttl: int = CONVERSATION_SESSION_TTL
    ) -> bool:
        """保存会话到缓存

        Args:
            session_eo: Session实体

        Returns:
            是否成功保存
        """
        try:
            key = session_eo.session_id_vo.to_redis_key()

            # 保存JSON数据
            # json_data = session.cache_data.to_json_dict()
            # json_data = session
            success = await self.redis_cache.set(
                key,
                session_eo,
                ttl=ttl,
                serialization_type=SerializationType.PICKLE,
            )

            if not success:
                logger.error(
                    f"保存Session数据失败: session_id={session_eo.session_id_vo}"
                )
                return False

            logger.info(
                f"成功保存会话: session_id={session_eo.session_id_vo}, ttl={ttl}"
            )
            return True

        except Exception as e:
            logger.error(
                f"保存会话失败: session_id={session_eo.session_id_vo}, error={e}",
                exc_info=True,
            )
            return False

    async def load(self, session_id_vo: SessionIdVO) -> Optional[SessionEntity]:
        """从缓存加载会话

        Args:
            session_id_vo: Session ID

        Returns:
            SessionEntity或None（不存在）
        """
        try:
            key = session_id_vo.to_redis_key()

            # 加载JSON数据
            data = await self.redis_cache.get(key)

            if not data:
                logger.debug(f"会话不存在: session_id={session_id_vo}")
                return None

            logger.info(f"成功加载会话: session_id={session_id_vo}")

            # sessionEo = SessionEntity(data)
            return data

        except Exception as e:
            logger.error(
                f"加载会话失败: session_id={session_id_vo}, error={e}", exc_info=True
            )
            return None

    async def update_ttl(self, session_id_vo: SessionIdVO, ttl: int) -> bool:
        """更新TTL

        Args:
            session_id_vo: Session ID
            ttl: 新的TTL（秒）

        Returns:
            是否成功更新
        """
        try:
            key = session_id_vo.to_redis_key()
            success = await self.redis_cache.expire(key, ttl)

            if not success:
                logger.warning(f"更新TTL失败: session_id={session_id_vo}")
                return False

            logger.debug(f"成功更新TTL: session_id={session_id_vo}, ttl={ttl}")
            return True

        except Exception as e:
            logger.error(
                f"更新TTL失败: session_id={session_id_vo}, error={e}", exc_info=True
            )
            return False

    async def exists(self, session_id_vo: SessionIdVO) -> bool:
        """检查会话是否存在

        Args:
            session_id_vo: Session ID

        Returns:
            是否存在
        """
        try:
            key = session_id_vo.to_redis_key()
            return await self.redis_cache.exists(key)
        except Exception as e:
            logger.error(
                f"检查会话存在失败: session_id={session_id_vo}, error={e}",
                exc_info=True,
            )
            return False

    async def get_ttl(self, session_id_vo: SessionIdVO) -> int:
        """获取剩余TTL

        Args:
            session_id_vo: Session ID

        Returns:
            剩余秒数，-1表示永不过期，-2表示不存在
        """
        try:
            key = session_id_vo.to_redis_key()
            ttl = await self.redis_cache.ttl(key)
            logger.debug(f"获取TTL: session_id={session_id_vo}, ttl={ttl}")
            return ttl
        except Exception as e:
            logger.error(
                f"获取TTL失败: session_id={session_id_vo}, error={e}", exc_info=True
            )
            return -2
