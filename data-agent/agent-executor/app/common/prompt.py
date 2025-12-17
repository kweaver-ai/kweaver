from dataclasses import dataclass
from enum import Enum
from typing import List, Dict


class PromptType(Enum):
    """提示词类型"""

    CHAT = "chat"  # 对话类型
    COMPLETION = "completion"  # 补全类型


@dataclass
class BasePrompt:
    """提示词基类"""

    name: str  # 提示词名称
    description: str  # 提示词描述
    content: str  # 提示词内容
    prompt_type: PromptType  # 提示词类型

    def to_message(self, query: str = None, **kwargs) -> List[Dict[str, str]]:
        """将prompt转换为message格式

        Args:
            query (str, optional): 用户查询. Defaults to None.
            **kwargs: 其他参数，用于替换prompt中的变量

        Returns:
            List[Dict[str, str]]: message列表
        """
        messages = []

        # 如果是chat类型且没有参数，则prompt为系统提示词
        if self.prompt_type == PromptType.CHAT:
            messages = [
                {"role": "system", "content": self.content},
                {"role": "user", "content": query},
            ]
        # 如果是completion类型，则直接返回格式化后的内容
        else:
            formatted_content = (
                self.content.format(query=query, **kwargs)
                if query
                else self.content.format(**kwargs)
            )
            messages = [
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": formatted_content},
            ]

        return messages


class QueryRewritePrompt(BasePrompt):
    """查询重写提示词"""

    def __init__(self):
        super().__init__(
            name="query_rewrite",
            description="用于重写用户查询,使其更加明确和完整",
            content="""你是一个用户问题重写专家，可以按照要求和历史对话信息改写用户最新的问题。请根据历史对话信息，对用户当前问题进行补充完善，生成一个语义明确、没有指代的问题。当前用户问题为：{query}
改写后的问题符合以下要求：
1.如果历史对话信息和当前用户问题无关，或无法改写题，请直接返回：{query}
2.根据历史信息对当前用户问题的指代词进行信息补充，以丰富当前问题，禁止随意发挥
3.不要输出多余的格式或者内容，直接返回改写后的问题
4.改写后的问题与用户输入的当前问题的相似度不能太低
5.这个问题对我至关重要，请认真、仔细思考后，对问题改写！！
历史信息如下：
{history}
当前用户问题：
{query}
改写后的问题：
""",
            prompt_type=PromptType.COMPLETION,
        )


class HistoryJudgePrompt(BasePrompt):
    """历史判断提示词"""

    def __init__(self):
        super().__init__(
            name="history_judge",
            description="用于判断是否需要使用历史对话内容对当前问题进行改写",
            content="""给定前几轮对话内容和当前的最新问题，判断是否需要使用前几轮对话内容对当前的最新问题进行改写。
历史对话：{history}
当前最新问题：{query}
需要改写的一些场景：
1、当前问题缺少关键信息的时候需要补充内容。
2、当前问题中有代词时，如：它、他、她、其、该、这个等等。
3、其他情况均不需要补充信息。
如果需要使用历史信息对当前最新问题改写直接返回"True"，如果不需要则返回"False"。""",
            prompt_type=PromptType.COMPLETION,
        )


class GenerateCodePrompt(BasePrompt):
    """代码生成提示词"""

    def __init__(self):
        super().__init__(
            name="generate_code",
            description="用于根据用户需求生成Python代码",
            content='''自动生成Python代码

## 目标
根据用户提供的需求和参数，自动生成符合预期功能的Python代码。

## 步骤

### Step 1：需求分析
- 仔细聆听和分析用户提供的需求。
- 确定需求的具体功能、输入、输出以及任何特定的业务逻辑。

### Step 2：确定代码结构
- 根据需求分析的结果，设计代码的基本结构。
- 确定所需的函数、类、模块和它们之间的关系。

### Step 3：编写伪代码
- 为每个函数和类编写伪代码，概述代码的逻辑流程。
- 确保伪代码清晰地反映了用户的需求。

### Step 4：生成Python代码
- 根据伪代码，开始编写具体的Python代码。
- 使用合适的数据结构和算法来实现需求。

### Step 5：代码优化
- 检查代码的效率和可读性，进行必要的优化。
- 确保代码遵循Python的最佳实践和风格指南。

### Step 6：添加注释和文档
- 为代码添加必要的注释，解释复杂的逻辑和决策。
- 如果适用，编写函数和类的文档字符串。

### Step 7：测试代码
- 编写单元测试来验证代码的功能。
- 确保代码能够处理预期的输入，并产生正确的输出。

### Step 8：代码审查
- 审查代码以查找潜在的错误和改进的机会。
- 确保代码的质量和一致性。

## 示例代码模板

以下是一个简单的Python函数模板，可以根据用户需求进行调整：

def main(param1, param2):
    """
    函数描述
    :param param1: 参数1的描述
    :param param2: 参数2的描述
    :return: 返回值的描述
    """
    # 代码逻辑
    result = None
    # ...
    return result

-----------------------------------------------------------

接下来我会输入简短的代码内容或者需求描述，请直接给出生成的代码结果，不要输出任何其他内容。
如果有额外的内容，请写在注释中。
代码中必须含有main函数
如果输入内容意义不明确或者输入为空白，你需要给出较为泛用的代码''',
            prompt_type=PromptType.CHAT,
        )


class GeneratePromptPrompt(BasePrompt):
    """提示词生成提示词"""

    def __init__(self):
        super().__init__(
            name="generate_prompt",
            description="用于生成结构化的提示词",
            content="""你是一个提示词工程师，你可以根据用户的需求描述和简短提示词内容，给出优化后的结构化的提示词，使其遵循特定的模式和规则，从而方便有效理解信息。
格式和规则如下：
-----------------------------------------------------------
## Role : [请填写你想定义的角色名称]

## Background : [请描述角色的背景信息，例如其历史、来源或特定的知识背景]

## Preferences : [请描述角色的偏好或特定风格，例如对某种设计或文化的偏好]

## Profile :

- language: 中文
- description: [请简短描述该角色的主要功能，50 字以内]

## Goals :
[请列出该角色的主要目标 1]
[请列出该角色的主要目标 2]
...

## Constrains :
[请列出该角色在互动中必须遵循的限制条件 1]
[请列出该角色在互动中必须遵循的限制条件 2]
...

## Skills :

[为了在限制条件下实现目标，该角色需要拥有的技能 1]
[为了在限制条件下实现目标，该角色需要拥有的技能 2]
...

## Examples :

[提供一个输出示例 1，展示角色的可能回答或行为]
[提供一个输出示例 2]
...

## OutputFormat :

[请描述该角色的工作流程的第一步]
[请描述该角色的工作流程的第二步]
...

## Initialization : 作为 [角色名称], 拥有 [列举技能], 严格遵守 [列举限制条件], 使用默认 [选择语言] 与用户对话，友好的欢迎用户。然后介绍自己，并提示用户输入.
-----------------------------------------------------------

接下来我会输入简短的提示词内容或者需求描述，请直接给出优化后的提示词结果，不要输出任何其他内容。
如果输入内容意义不明确或者输入为空白，你需要给出较为泛用的提示词""",
            prompt_type=PromptType.CHAT,
        )


class Prompt:
    """提示词管理类"""

    query_rewrite = QueryRewritePrompt()
    history_judge = HistoryJudgePrompt()
    generate_code = GenerateCodePrompt()
    generate_prompt = GeneratePromptPrompt()
