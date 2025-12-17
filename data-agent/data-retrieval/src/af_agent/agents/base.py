# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-5-21

""" Implement base class of AF agent.

    Currently, AF agent is not a true agent.
    Only tools selection is implemented.
"""

from abc import ABC, abstractmethod
from typing import Any, Type

from langchain.pydantic_v1 import BaseModel, Field
from langchain_core.tools import BaseTool
from enum import Enum

from af_agent.logs.logger import logger


class BaseAgent(BaseModel, ABC):
    lang: str = "cn"
    llm: Any = None
    prompt: Any = None
    prompt_manager: Any = None
    session: Any = None
    parameter: Any = None
    tool_name: Any = None
    agent_executor_with_history: Any = None

    def invoke(self, *args, **kwargs):
        """Select tool based on question, and invoke it.
        """
        pass

    async def ainvoke(self, *args, **kwargs):
        """Select tool based on question, and invoke it asynchronously.
        """
        pass

    @abstractmethod
    async def astream_events(self, *args, **kwargs):
        """Select tool based on question, and astream_events it asynchronously.
        """

    def as_tool(self, name: str, description: str) -> BaseTool:
        return AgentTool(self, name, description)


class AgentToolSchema(BaseModel):
    input: str = Field(default="", description="The input of the tool.")
    parameter: dict = Field(default={}, description="Other parameter of the tool.")


class AgentTool(BaseTool):
    """ Make Agent as a tool

    AgentTool is a tool that can be used in LangChain.
    The main concept is Multi-Agent architecture.

    Attributes:
        agent: Any agent that implements BaseAgent.
        name: the name of the tool.
        description: the description of the tool.
    """
    name: str = Field(..., description="The name of the tool.")
    description: str = Field(..., description="The description of the tool.")

    agent: BaseAgent = None

    args_schema: Type[BaseModel] = AgentToolSchema

    def __init__(self, agent: BaseAgent, name: str, description: str, *args, **kwargs):
        super().__init__(name=name, description=description, *args, **kwargs)

        self.agent = agent

    def invoke(self, input: str, session_id: str, *args, **kwargs):
        return self.agent.invoke(input, session_id, *args, **kwargs)

    async def ainvoke(self, input: str, session_id: str, *args, **kwargs):
        return self.agent.ainvoke(input, session_id, *args, **kwargs)

    async def astream_events(self, input: str, session_id: str, *args, **kwargs):
        return self.agent.astream_events(input, session_id, *args, **kwargs)
