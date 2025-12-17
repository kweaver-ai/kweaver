import json
from typing import Any, Dict, Optional
from DolphinLanguageSDK.utils.tools import ToolInterrupt

from app.common.stand_log import StandLogger
from app.driven.infrastructure.redis import redis_pool
from app.utils.json import custom_serializer
from app.utils.observability.trace_wrapper import internal_span
from opentelemetry.trace import Span

from .trace import span_set_attrs


class InterruptHandler:
    @classmethod
    @internal_span()
    async def handle_tool_interrupt(
        cls,
        tool_interrupt: ToolInterrupt,
        res: Dict[str, Any],
        context_variables: Dict[str, Any],
        event_key: str,
        span: Optional[Span] = None,
    ) -> None:
        """处理工具中断

        Args:
            tool_interrupt: 工具中断异常
            res: 结果字典
            context_variables: 上下文变量
            event_key: 事件键
        """

        span_set_attrs(
            span=span,
            agent_run_id=context_variables.get("session_id", ""),
            agent_id=context_variables.get("agent_id", ""),
        )

        StandLogger.info(f"ToolInterrupt: {tool_interrupt}")

        context_variables = res.get("context", {})
        context_variables.update(res.get("answer", {}))
        async with redis_pool.acquire(3, "write") as redis_write_client:
            redis_key_context = f"dip:agent-executor:{event_key}:context"

            # 确保使用※tool而非tool
            if "tool" in context_variables:
                context_variables.pop("tool")

            await redis_write_client.set(
                redis_key_context,
                json.dumps(context_variables, ensure_ascii=False),
                ex=30 * 60,
            )

            res["ask"] = {
                "session_id": event_key,
                "tool_name": tool_interrupt.tool_name,
                "tool_args": tool_interrupt.tool_args,
            }

            res["status"] = "True"

        StandLogger.info(
            f"ToolInterrupt res: {json.dumps(res, ensure_ascii=False, default=custom_serializer)}"
        )
