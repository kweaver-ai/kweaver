# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-12-02

from af_agent.prompts.agent_prompts.react_agent_prompt.default import DefaultReactAgentPrompt
from af_agent.prompts.agent_prompts.react_agent_prompt.langchain import LangchainReactAgentPrompt
from af_agent.prompts.agent_prompts.react_agent_prompt.deepseek_r1 import DeepSeekR1ReactAgentPrompt

__all__ = [
    "DefaultReactAgentPrompt",
    "LangchainReactAgentPrompt",
    "DeepSeekR1ReactAgentPrompt"
]