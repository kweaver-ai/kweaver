# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2025-1-3

from typing import Dict, Type
from importlib import import_module


# :TODO get models automatically
PROMPT_MAPPINGS = [
    # Agent Prompts
    {
        "module": "data_retrieval.prompts.agent_prompts.react_agent_prompt.langchain",
        "class": "LangchainReactAgentPrompt"
    },
    {
        "module": "data_retrieval.prompts.agent_prompts.react_agent_prompt.default",
        "class": "DefaultReactAgentPrompt"
    },
    {
        "module": "data_retrieval.prompts.agent_prompts.react_agent_prompt.deepseek_r1",
        "class": "DeepSeekR1ReactAgentPrompt"
    },
    # Tool Use
    {
        "module": "data_retrieval.prompts.agent_prompts.tool_use_prompt",
        "class": "ToolUsePrompt"
    },

    # Tools Prompts

    {
        "module": "data_retrieval.prompts.tools_prompts.text2sql_prompt.text2sql",
        "class": "Text2SQLPrompt"
    },
    {
        "module": "data_retrieval.prompts.tools_prompts.text2metric_prompt.unified",
        "class": "Text2MetricPrompt"
    },
    {
        "module": "data_retrieval.prompts.tools_prompts.datasource_filter_prompt",
        "class": "DataSourceFilterPrompt"
    },
    {
        "module": "data_retrieval.prompts.tools_prompts.text2dip_metric_prompt",
        "class": "Text2DIPMetricPrompt"
    }
]

class BasePromptManager:
    _instance = None
    _initialized = False
    
    def __new__(cls, language="cn"):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, language="cn"):
        if not BasePromptManager._initialized:
            self.language = language
            self._default_prompts = {}
            self._load_default_prompts()
            BasePromptManager._initialized = True

    def _load_default_prompts(self):
        """加载默认的 prompts"""
        for mapping in PROMPT_MAPPINGS:
            try:
                # 导入模块
                module = import_module(mapping["module"])
                # 获取类
                prompt_class = getattr(module, mapping["class"])
                self._default_prompts[prompt_class.get_name()] = prompt_class.get_prompt()

            except (ImportError, AttributeError) as e:
                print(f"Failed to load prompt {mapping['class']}: {str(e)}")

    def save_prompts(self):
        pass

    def load_prompts(self):
        pass

    def delete_prompt(self, prompt_type: str):
        """删除指定类型的 prompt"""
        if prompt_type in self._default_prompts:
            del self._default_prompts[prompt_type]

    def get_prompt(self, prompt_type: str, language=""):
        """获取指定类型的 prompt"""
        if prompt_type not in self._default_prompts:
            raise ValueError(f"Unsupported prompt type: {prompt_type}")
        
        if not language:
            return self._default_prompts[prompt_type]
        else:
            return self._default_prompts[prompt_type].get(language, "")

    @property
    def available_prompts(self) -> list[str]:
        """获取所有可用的 prompt 类型"""
        return self._default_prompts


if __name__ == "__main__":
    prompt_manager = BasePromptManager()
    print(prompt_manager.available_prompts)
