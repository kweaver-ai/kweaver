# -*- coding: utf-8 -*-
"""
@Time    : 2024/10/31 11:22
@Author  : Danny.gao
@FileName: base.py
@Desc: 工具箱的基础类
"""

from langchain_community.agent_toolkits.base import BaseToolkit
from langchain.agents.tools import BaseTool
from typing import List


class InstructionBookInsideToolkit(BaseToolkit):
    toolkit_instruction: str = ""
    tools: List[BaseTool] = []

    def get_toolkit_instruction(self):
        return self.toolkit_instruction

    def get_tools(self) -> List[BaseTool]:
        return self.tools

    def set_toolkit_instruction(self, toolkit_instruction):
        self.toolkit_instruction = toolkit_instruction

    def set_tools(self, tools: List[BaseTool]):
        self.tools = tools

    def get_tool_names(self):
        return [tool.name for tool in self.tools]
    
    def get_tool(self, name)-> BaseTool:
        for _, v in enumerate(self.tools):
            if v.name == name:
                return v
    
