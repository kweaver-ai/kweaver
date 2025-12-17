import asyncio
from typing import AsyncGenerator, Dict

from anyio import CancelScope

from app.domain.vo.session import SessionIdVO
from app.logic.agent_core_logic_v2.agent_core_v2 import AgentCoreV2
from app.logic.agent_core_logic_v2.session import SessionManager
from app.domain.vo.agentvo import AgentConfigVo, AgentInputVo
from app.utils.observability.observability_log import get_logger as o11y_logger


async def create_safe_output_generator(
    agent_core_v2: AgentCoreV2,
    agent_config: AgentConfigVo,
    agent_input: AgentInputVo,
    headers: Dict[str, str],
    is_debug_run: bool,
    start_time: float,
    session_id_vo: SessionIdVO = None,
    session_manager: SessionManager = None,
) -> AsyncGenerator[str, None]:
    """
    包装输出生成器，安全处理客户端断开连接的情况

    Args:
        agent_core_v2: Agent核心实例
        agent_config: Agent配置
        agent_input: Agent输入
        headers: 请求头
        is_debug_run: 是否为调试模式
        start_time: 开始时间
        session_id_vo: 会话ID（可选）
        session_manager: 会话管理器（可选）
    """

    # 1. 获得generator
    output_generator = agent_core_v2.output_handler.result_output(
        agent_config, agent_input, headers, is_debug_run, start_time=start_time
    )

    # AnyioCancelledError = get_cancelled_exc_class()

    closed = False

    # 2. 遍历generator
    try:
        async for chunk in output_generator:
            yield chunk
        closed = True
    except GeneratorExit:
        # 客户端断开连接，保持异常向外传播
        raise
    # except AnyioCancelledError:
    #     o11y_logger().info("Client cancelled stream")
    #     raise
    except asyncio.CancelledError:
        o11y_logger().info("Client cancelled stream")
        raise
    except Exception as e:
        o11y_logger().error(f"Output generator error: {e}")
        raise
    finally:
        if not closed:
            try:
                with CancelScope(shield=True):
                    await output_generator.aclose()
            except StopAsyncIteration:
                pass
            except Exception as close_err:
                o11y_logger().warn(
                    f"Failed to close output generator gracefully: {close_err}"
                )

        # 3. 延长session过期时间
        if session_id_vo:
            try:
                from app.domain.constant import CONVERSATION_SESSION_TTL

                success = await session_manager.cache_service.update_ttl(
                    session_id_vo, CONVERSATION_SESSION_TTL
                )
                if success:
                    o11y_logger().info(f"Extended TTL for session: {session_id_vo}")
                else:
                    o11y_logger().warn(
                        f"Failed to extend TTL for session: {session_id_vo}"
                    )

            except Exception as e:
                o11y_logger().error(f"Failed to extend session TTL: {e}")
