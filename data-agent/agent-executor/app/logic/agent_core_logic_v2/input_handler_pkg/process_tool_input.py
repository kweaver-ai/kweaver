import json
from typing import Any, Dict, List, Optional

from app.common.config import Config
from app.common.stand_log import StandLogger
from app.domain.vo.agentvo import AgentInputVo
from app.driven.infrastructure.redis import redis_pool
from app.utils.observability.trace_wrapper import internal_span
from opentelemetry.trace import Span

from DolphinLanguageSDK.common import (
    Messages,
)

from ..trace import span_set_attrs
from app.domain.enum.common.user_account_header_key import get_user_account_id


def _convert_history_to_messages(inputs_dict: Dict[str, Any]) -> None:
    """如果使用context_engineer_v2，将history从dict类型转换为Messages类型

    Args:
        inputs_dict: 输入字典，会被就地修改
    """
    if Config.features.use_context_engineer_v2:
        history_dict: Optional[List[Dict[str, Any]]] = inputs_dict.get("history")

        history_messages = Messages()

        if history_dict is not None and len(history_dict) > 0:
            history_messages.extend_plain_messages(history_dict)

        inputs_dict["history"] = history_messages


@internal_span()
async def process_tool_input(
    inputs: AgentInputVo,
    span: Optional[Span] = None,
) -> tuple[Dict[str, Any], Optional[str]]:
    """处理工具输入

    Args:
        inputs: 输入参数
        event_key: 事件键

    Returns:
        tuple: (处理后的上下文变量, 可能更新的event_key)
    """
    # 1. o11y记录
    span_set_attrs(
        span=span,
        user_id=get_user_account_id(inputs.header) or "" if inputs.header else "",
    )

    if not inputs.tool:
        # if not inputs.tool or 'agent_run_id' not in inputs.tool:
        # 返回模型导出的字典，确保没有tool键
        inputs_dict = inputs.model_dump()
        # 转换history为Messages类型
        # _convert_history_to_messages(inputs_dict)
        return inputs_dict, None

    async with (
        redis_pool.acquire(3, "read") as redis_read_client,
        redis_pool.acquire(3, "write") as redis_write_client,
    ):
        agent_run_id = inputs.tool.get("agent_run_id") or inputs.tool.get("session_id")
        redis_key_context = f"dip:agent-executor:{agent_run_id}:context"

        cached_context = await redis_read_client.get(redis_key_context)

        new_event_key = None

        if cached_context:
            StandLogger.info(f"cached_context = {cached_context}")

            context_variables = json.loads(cached_context)
            context_variables.update(inputs.model_dump())

            new_event_key = agent_run_id
        else:
            inputs_dict = inputs.model_dump()

            # 移除tool字段
            if "tool" in inputs_dict:
                inputs_dict.pop("tool")

            # 转换history为Messages类型
            # _convert_history_to_messages(inputs_dict)

            context_variables = inputs_dict

        await redis_write_client.delete(redis_key_context.encode("utf-8"))

        return context_variables, new_event_key
