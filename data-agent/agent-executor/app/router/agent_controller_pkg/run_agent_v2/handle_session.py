from fastapi import Request

from app.logic.agent_core_logic_v2.agent_core_v2 import AgentCoreV2
from app.logic.agent_core_logic_v2.session import SessionManager
from app.domain.vo.session import SessionIdVO
from app.domain.vo.agentvo import AgentConfigVo
from app.domain.constant import (
    CONVERSATION_SESSION_TTL,
)

from ..conversation_session_init import init_or_update_conversation_session
from ..rdto.v1.req.conversation_session import ConversationSessionInitReq

# 全局SessionManager实例
session_manager = SessionManager()


async def handle_session(
    agent_id: str,
    agent_config: AgentConfigVo,
    agent_core_v2: AgentCoreV2,
    is_debug_run: bool,
    request: Request,
    session_id_vo: SessionIdVO,
    biz_domain_id: str = "",
):
    """
    处理会话初始化和状态管理

    Args:
        agent_id: Agent ID
        agent_config: Agent配置
        agent_core_v2: Agent核心实例
        is_debug_run: 是否为调试模式
        request: FastAPI请求对象
        session_id_vo: 会话ID
        biz_domain_id: 业务域ID
    """

    session_eo = None

    # 如果不是调试模式，设置session的缓存数据
    if not is_debug_run:
        # 1. 初始化或更新session
        await init_or_update_conversation_session(
            request,
            ConversationSessionInitReq(
                conversation_id=session_id_vo.conversation_id,
                agent_id=agent_id,
                agent_config=agent_config,
            ),
            session_id_vo.uid,
            session_id_vo.visitor_type,
            biz_domain_id,
        )

        # 1.1 重新获取session
        session_eo = await session_manager.cache_service.load(session_id_vo)

        # 2. 如果session存在，加载session缓存数据
        if session_eo:
            agent_core_v2.session_handler.session_cache_data = session_eo.cache_data

    # 3. 更新session的过期时间（延长session的生命周期，即每次run都会延长session的过期时间到CONVERSATION_SESSION_TTL）
    if session_eo:
        await session_manager.cache_service.update_ttl(
            session_id_vo, CONVERSATION_SESSION_TTL
        )
