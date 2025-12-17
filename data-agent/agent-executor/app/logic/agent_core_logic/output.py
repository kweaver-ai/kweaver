from typing import Any, AsyncGenerator, Dict, List, Optional, TYPE_CHECKING

from app.common.structs import AgentConfig, AgentInput
from app.utils.observability.trace_wrapper import internal_span
from opentelemetry.trace import Span
from app.domain.enum.common.user_account_header_key import get_user_account_id

from app.utils.json import json_serialize_async
from app.utils.increment_json import incremental_async_generator

from app.utils.common import (
    is_dolphin_var,
)

import asyncio

if TYPE_CHECKING:
    from app.logic.agent_core_logic.agent_core import AgentCore


class OutputHandler:
    def __init__(self, agent_core: "AgentCore"):
        self.agentCore = agent_core

    async def string_output(
        self,
        generator: AsyncGenerator[Dict[str, Any], None],
    ) -> AsyncGenerator[str, None]:
        """将字典输出转换为JSON字符串

        Args:
            generator: 原始生成器

        Yields:
            str: JSON字符串
        """
        loop = asyncio.get_event_loop()

        async for chunk in generator:
            yield await json_serialize_async(chunk)

    async def add_status(
        self,
        generator: AsyncGenerator[Dict[str, Any], None],
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """添加状态字段到输出中

        Args:
            generator: 原始生成器

        Yields:
            Dict[str, Any]: 添加了状态字段的输出
        """
        chunk = None
        async for chunk in generator:
            if "status" not in chunk:
                chunk["status"] = "False"
            yield chunk

        if chunk and chunk.get("status") == "False":
            chunk["status"] = "True"
            yield chunk

    @internal_span()
    async def result_output(
        self,
        agent_config: AgentConfig,
        agent_input: AgentInput,
        headers: Dict[str, str],
        debug: bool = False,
        span: Optional[Span] = None,
    ) -> AsyncGenerator[str, None]:
        """处理最终输出结果

        Args:
            config: Agent配置
            inputs: 输入参数
            headers: HTTP请求头

        Yields:
            str: 最终输出的JSON字符串
        """
        if span and span.is_recording():
            span.set_attribute(
                "session_id", agent_config.session_id if agent_config.session_id else ""
            )
            span.set_attribute(
                "agent_id", agent_config.agent_id if agent_config.agent_id else ""
            )
            span.set_attribute("user_id", get_user_account_id(headers) or "")

        try:
            output_generator = self.agentCore.run(
                agent_config, agent_input, headers, debug
            )

            if agent_config.incremental_output:
                output_generator = incremental_async_generator(output_generator)
            elif not agent_config.output_vars:
                output_generator = self.add_status(output_generator)

            output_generator = self.string_output(output_generator)

            async for chunk in output_generator:
                # print(chunk)
                yield chunk

        finally:
            self.agentCore.cleanup()

    @internal_span()
    async def partial_output(
        self,
        dolphin_output: AsyncGenerator[Dict[str, Any], None],
        output_vars: List[str],
        span: Optional[Span] = None,
    ) -> AsyncGenerator[Any, None]:
        """处理输出变量

        Args:
            dolphin_output: Dolphin输出生成器
            output_vars: 输出变量列表

        Yields:
            Any: 处理后的输出
        """
        res = {}
        async for output in dolphin_output:
            if len(output_vars) == 1:
                fields = output_vars[0].split(".")
                value = output
                for field in fields:
                    try:
                        value = value[field]
                        if is_dolphin_var(value):
                            value = value.get("value")
                    except:
                        pass
                res = value
            elif len(output_vars) > 1:
                for output_var in output_vars:
                    if not output_var:
                        continue
                    fields = output_var.split(".")
                    value = output
                    has_value = True
                    for field in fields:
                        try:
                            value = value[field]
                            if is_dolphin_var(value):
                                value = value.get("value")
                        except:
                            has_value = False
                    if has_value:
                        res[field] = value
            else:
                res = output
            yield res
