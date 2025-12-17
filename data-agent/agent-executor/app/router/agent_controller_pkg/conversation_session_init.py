# -*- coding:utf-8 -*-
import json
import time
from dataclasses import asdict
from fastapi import Request, Depends
from app.common.errors import ParamException, AgentPermissionException
from app.driven.dip.agent_factory_service import agent_factory_service
from app.domain.enum.common.user_account_header_key import (
    set_biz_domain_id,
    set_user_account_id,
    set_user_account_type,
)
from app.logic.agent_core_logic_v2.session import SessionManager
from app.domain.vo.session import SessionIdVO
from app.domain.vo.agentvo import AgentConfigVo
from app.utils.observability.observability_log import get_logger as o11y_logger
from datetime import datetime
from app.domain.constant import (
    CONVERSATION_SESSION_TTL,
    SESSION_CACHE_DATA_UPDATE_INTERVAL,
)

from .common import router
from .dependencies import get_account_id, get_account_type, get_biz_domain_id
from .rdto.v1.req.conversation_session import ConversationSessionInitReq
from .rdto.v1.res.conversation_session import ConversationSessionInitRes
from app.common.config import Config
from typing import Dict, Any

# 全局SessionManager实例
session_manager = SessionManager()


async def _handle_existing_session(
    session_eo,
    session_id_vo: SessionIdVO,
    agent_config: AgentConfigVo,
    request: Request,
    is_debug_mode: bool,
) -> ConversationSessionInitRes:
    """处理已存在的session

    Args:
        session_eo: Session实体对象
        session_id_vo: Session ID
        agent_config: Agent配置
        request: FastAPI请求对象
        is_debug_mode: 是否为调试模式

    Returns:
        Session初始化响应
    """
    # 1. 如果session存在，检查是否需要更新缓存数据
    last_set_timestamp = session_eo.cache_data_last_set_timestamp
    current_time = int(time.time())

    # 如果距离上次更新超过SESSION_CACHE_DATA_UPDATE_INTERVAL秒，则更新缓存数据
    if current_time - last_set_timestamp > SESSION_CACHE_DATA_UPDATE_INTERVAL:
        await session_manager.update_session_cached_data(
            session_id_vo=session_eo.session_id_vo,
            agent_config=agent_config,
            headers=dict(request.headers),
        )

    # 2. 记录日志
    o11y_logger().info(f"Session已存在且未过期，直接返回: session_id={session_id_vo}")

    # 3. 获取剩余TTL
    ttl = await session_manager.cache_service.get_ttl(session_id_vo)

    # 4. 获取最新的session
    session_eo = await session_manager.cache_service.load(session_id_vo)

    # 5. 获取缓存数据
    cache_data: Dict[str, Any] = {}
    if is_debug_mode and session_eo.cache_data:
        cache_data = asdict(session_eo.cache_data)

    return ConversationSessionInitRes(
        conversation_session_id=session_id_vo.get_session_id(),
        ttl=ttl,
        created_at=session_eo.created_at,
        cache_data=cache_data,
    )


@router.post(
    "/conversation-session/init",
    summary="初始化或更新对话Session",
    response_model=ConversationSessionInitRes,
)
async def init_or_update_conversation_session(
    request: Request,
    req: ConversationSessionInitReq,
    account_id: str = Depends(get_account_id),
    account_type: str = Depends(get_account_type),
    biz_domain_id: str = Depends(get_biz_domain_id),
) -> ConversationSessionInitRes:
    """
    初始化对话Session

    功能：
    1. 检查Session是否已存在
    2. 如果已存在且未过期，直接返回
    3. 如果不存在，提前初始化DolphinAgent等组件并缓存到Redis
    4. 返回session_id供后续使用

    优势：
    - 大幅降低首次run_agent的响应时间
    - 避免重复初始化
    - 提升用户体验
    """

    try:
        # 0. 设置agent_factory_service的headers
        service_headers = {}
        set_user_account_id(service_headers, account_id)
        set_user_account_type(service_headers, account_type)
        set_biz_domain_id(service_headers, biz_domain_id)
        agent_factory_service.set_headers(service_headers)

        # 1. 获取agent配置
        agent_config = await _prepare_agent_config(req, account_id, account_type)

        # 2. 构造session_id
        session_id_vo = SessionIdVO(
            account_id,
            account_type,
            req.conversation_id,
            agent_config.get_config_last_set_timestamp(),
        )

        # 3. 检查Session是否已存在
        # session_exists = await session_manager.cache_service.exists(session_id)
        session_eo = await session_manager.cache_service.load(session_id_vo)

        is_debug_mode = Config.is_debug_mode()

        cache_data: Dict[str, Any] = {}

        if session_eo:
            return await _handle_existing_session(
                session_eo=session_eo,
                session_id_vo=session_id_vo,
                agent_config=agent_config,
                request=request,
                is_debug_mode=is_debug_mode,
            )

        # 4. 构造headers
        headers = dict(request.headers)

        # 5. 创建Session
        session_id_vo = await session_manager.create_session(
            uid=account_id,
            visitor_type=account_type,
            conversation_id=req.conversation_id,
            agent_config=agent_config,
            headers=headers,
        )

        if is_debug_mode:
            session_eo = await session_manager.cache_service.load(session_id_vo)
            if session_eo:
                if session_eo.cache_data:
                    cache_data = asdict(session_eo.cache_data)
            else:
                o11y_logger().warn(
                    f"Failed to load session after creation: session_id={session_id_vo}"
                )

        # 6. 返回响应
        return ConversationSessionInitRes(
            conversation_session_id=session_id_vo.get_session_id(),
            ttl=CONVERSATION_SESSION_TTL,
            created_at=datetime.now(),
            cache_data=cache_data,
        )

    except Exception as e:
        o11y_logger().error(
            f"init_or_update_conversation_session failed: {e}"
            # extra={
            #     "conversation_id": req.conversation_id,
            #     "account_id": account_id,
            #     "error": str(e)
            # }
        )
        raise


async def _prepare_agent_config(
    req: ConversationSessionInitReq, account_id: str, account_type: str
) -> AgentConfigVo:
    """准备Agent配置

    优先级：agent_config > agent_id
    """

    # 1. 如果提供了agent_config，直接使用
    if req.agent_config:
        agent_config = req.agent_config

    # 2. 否则通过agent_id获取
    elif req.agent_id:
        config_data = await agent_factory_service.get_agent_config(req.agent_id)

        config_str = config_data["config"]
        if isinstance(config_str, str):
            config_dict = json.loads(config_str)
        else:
            config_dict = config_str

        agent_config = AgentConfigVo(**config_dict)

    else:
        o11y_logger().error(
            "init_conversation_session failed: At least one of agent_id or agent_config must be provided"
        )
        raise ParamException(
            "At least one of agent_id or agent_config must be provided."
        )

    # 3. 设置agent_id（如果未设置）
    if agent_config.agent_id is None:
        agent_config.agent_id = req.agent_id

    # 4. 检查权限
    if not await agent_factory_service.check_agent_permission(
        agent_config.agent_id, account_id, account_type
    ):
        o11y_logger().error(
            f"check_agent_permission failed: agent_id = {agent_config.agent_id}, account_id = {account_id}, account_type = {account_type}"
        )
        raise AgentPermissionException(agent_config.agent_id, account_id)

    return agent_config
