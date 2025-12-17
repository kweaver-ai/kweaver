import time
from fastapi import Request, Depends
from sse_starlette import EventSourceResponse

from app.logic.agent_core_logic_v2.agent_core_v2 import AgentCoreV2
from app.logic.agent_core_logic_v2.session import SessionManager
from app.domain.vo.session import SessionIdVO

from ..common_v2 import router_v2
from ..dependencies import get_account_id, get_account_type, get_biz_domain_id
from ..rdto.v2.req.run_agent import V2RunAgentReq
from ..rdto.v2.res.run_agent import V2RunAgentResponse

from .prepare import prepare
from .handle_session import handle_session
from .safe_output_generator import create_safe_output_generator

# 全局SessionManager实例
session_manager = SessionManager()


@router_v2.post(
    "/run",
    summary="运行agentV2(由agent-app内部调用)",
    response_model=V2RunAgentResponse,
)
async def run_agent(
    request: Request,
    req: V2RunAgentReq,
    is_debug_run: bool = False,
    account_id: str = Depends(get_account_id),
    account_type: str = Depends(get_account_type),
    biz_domain_id: str = Depends(get_biz_domain_id),
) -> EventSourceResponse:
    """
    运行agentV2

    支持两种模式：
    1. 使用conversation_id（快速）：从options中获取conversation_id，拼接session_id，从缓存加载已初始化的Agent
    2. 不使用conversation_id（传统）：每次重新初始化
    """

    # 记录开始时间（用于计算TTFT）
    start_time = time.time()

    # 1. prepare
    agent_config, agent_input, headers = await prepare(
        request, req, account_id, account_type, biz_domain_id
    )

    # 2. 从options中获取conversation_id（可能为None）
    conversation_id = req.options.conversation_id if req.options else None

    # 3. 初始化AgentCoreV2
    agent_core_v2 = AgentCoreV2(agent_config)

    # 4. 处理session（仅当conversation_id存在时）
    session_id_vo = None
    if conversation_id:
        # 4.1. 构造session_id
        session_id_vo = SessionIdVO(
            account_id,
            account_type,
            conversation_id,
            agent_config.get_config_last_set_timestamp(),
        )

        # 4.2. 检查session是否存在或已过期
        # session_eo = await session_manager.cache_service.load(session_id_vo)

        # 4.3. 检查session是否正在运行
        # 说明：暂时不做这个限制，原因如下：
        # 1. 目前看，可能会因为dolphin sdk等原因导致session_eo.set_running(False)没有执行（即存在is_running没有被正确设置为False的情况）
        # 2. 目前对python了解有限，可能无法较好地处理相关的情况
        # 3. 前端已限制单个对话页面不能同时进行多个问答。后端暂不做控制可能也没有问题

        # if session_eo and session_eo.is_running():
        #     raise ConversationRunningException(
        #         "Conversation is running, please wait it to finish."
        #     )

        # 4.4. 处理session
        await handle_session(
            agent_id=req.agent_id,
            agent_config=agent_config,
            agent_core_v2=agent_core_v2,
            is_debug_run=is_debug_run,
            request=request,
            session_id_vo=session_id_vo,
            biz_domain_id=biz_domain_id,
        )

    return EventSourceResponse(
        create_safe_output_generator(
            agent_core_v2,
            agent_config,
            agent_input,
            headers,
            is_debug_run,
            start_time,
            session_id_vo,
            session_manager,
        ),
        ping=3600,
    )
