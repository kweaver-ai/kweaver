from typing import Optional, Any, Dict, List
from uuid import UUID

from langchain.callbacks.base import BaseCallbackHandler, AsyncCallbackHandler
from langchain_core.agents import AgentAction

from data_retrieval.logs.logger import logger


class AfAgentActionCallbackHandler(BaseCallbackHandler):
    def on_agent_action(
        self,
        action: AgentAction,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        logger.debug("当前action为: {}".format(action.log))


class AsyncAfAgentActionCallbackHandler(AsyncCallbackHandler):
    async def on_agent_action(
        self,
        action: AgentAction,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        logger.debug("当前action为: {}".format(action.log))


class AfAgentToolCallbackHandler(BaseCallbackHandler):
    def on_tool_start(
        self,
        serialized: Dict[str, Any],
        input_str: str,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Any:
        logger.debug("正要执行的tool信息为: {}".format(input_str))

    def on_tool_end(
        self,
        output: str,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        logger.debug("刚刚执行完成的tool结果为: {}".format(output))


class AsyncAfAgentToolCallbackHandler(AsyncCallbackHandler):
    async def on_tool_start(
        self,
        serialized: Dict[str, Any],
        input_str: str,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Any:
        logger.debug("正要执行的tool信息为: {}".format(input_str))

    async def on_tool_end(
        self,
        output: str,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        logger.debug("刚刚执行完成的tool结果为: {}".format(output))
