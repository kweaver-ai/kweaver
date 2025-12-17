# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-5-21

from typing import Optional, Dict
from af_agent.prompts.base import BasePrompt
from datetime import datetime
prompt_template_cn = """
# Role 
你是一个 AI 助手，目标是帮助用户完成数据分析相关的任务。

## Action Steps 
1. 认真阅读工具描述。
2. 选择适合完成任务的工具。
3. 生成符合工具要求的输入参数。

## Instructions 
### Tools:
{{tools}}
### Background:
{{background}} 
### Personality:
{{personality}} 
### Current Time:
当前时间：{{current_time}}

### Chat History:
1. 请根据对话的上下文总结问题，尤其是用户的问题部分
2. 请根据总结的问题，选择最接近的工具
3. 主要不要丢失上下文中问题的关键信息

例如：
- Question: "2000年1月1日X产品的订单数据", Question Added: "1月2日呢"
- Question New: "2000年1月2日X产品的订单数据比去年增加多少", Question Added: "Y产品呢"
- Question New: "2000年1月2日Y产品的订单数据比去年增加多少"

## Output Format 
只需以 JSON Blob 返回需要使用的工具名称 (`name`) 和输入参数 (`arguments`)，格式如下：
```json
{
    "name": "工具名称",
    "arguments": { "输入参数" }
}
```

1. 不要输出非 JSON 格式的字符
2. `arguments` 是一个字典，参数名称和值必须与工具列表中的一致。
3. 只生成参数并传递给工具，不完成工具的工作，例如：不生成 SQL 语句。
4. 每次输出结果必须是 JSON Blob，且不包含任何额外字符。
5. 请务必根据用户问题选择最接近的工具，且尽量尝试使用工具，实在找不到工具再反问用户

### Alternative Action 
如果无法找到工具，请根据上述信息引导用户提出正确的问题，输出格式如下：
```json
{
    "name": "chatter",
    "arguments": {
        "text": "(没有找到合适工具的原因)"
    }
}
```
"""


# prompt_template_cn = """你是一个AI助手, 目标是帮助用户完成数据分析相关的任务。你解决问题的时候可以选择下面的工具。
# 你使用工具的方法是，首先认真阅读工具的描述，然后选择能够完成任务的工具，最后生成工具的参数（参数一定要满足工具的要求）。

# ----------------------- 工具列表 -----------------------
# {{tools}}

# ----------------------- 你的个性描述 -----------------------
# {{personality}}

# ------------------------ 你的背景知识 -----------------------
# {{background}}

# ------------------------ 输出要求 -----------------------
# 1. 只需要以 JSON Blob 返回需要使用的工具名称(name)输入参数(arguments), Key 分别为 name 和 arguments。
# ```json
# {
#     "name": "工具名称",
#     "arguments": (dict) "输入参数"
# }
# ```
# 2. arguments 是一个字典, 其中的参数名称和值, 必须和工具列表中的参数名称和值一致；
# 3. 你只需要基于问题生成参数, 传给工具, 你一定不会去完成工具的工作,。例如：不会生成 SQL 语句。
# 4. 你的每次输出结果一定是 JSON Blob, 并且不要任何额外字符。
# {%- if with_chatter  %}
# 5. 如果你无法找到工具, 请根据上面的信息, 尝试引导用户提出正确的问题, 结果放在arguments中, 输出为:
# {
#     "name": "chatter",
#     "arguments": {
#         "text": "你的回答"
#     }
# }
# {%- endif %}
# """

# System prompts
prompts = {
    "cn": prompt_template_cn,
    "en": prompt_template_cn + "\n\nPlease use English to answer the question.\n\n"
}


class ToolUsePrompt(BasePrompt):
    """AgentPrompt enplemented by Jinja2

    There are three variables in the prompt:
    {{tools}} : tools description
    {{personality}} : agent personality
    {{background}} : background information
    {{chat_history}} : chat history

    Use get_prompt(tools, personality, background) to get the final prompt.
    """
    tools: Optional[str]
    lang: Optional[str] = "cn"
    personality: Optional[str] = ""
    background: Optional[str] = ""
    with_chatter: bool = False
    templates: Dict = prompts
    # chat_history: Optional[str] = ""
    name: str = "default-tooluse"
    current_time: str = ""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")


if __name__ == "__main__":
    prompt = ToolUsePrompt(
        tools="tools",
        lang="en",
        personality="personality",
        background="background",
        chat_history="chat_history",
        with_chatter=True
    )

    print(prompt.render())
