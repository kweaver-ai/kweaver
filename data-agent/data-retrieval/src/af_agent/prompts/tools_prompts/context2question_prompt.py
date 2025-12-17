# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-6-14
from typing import Dict
from af_agent.prompts.base import BasePrompt


# prompt_template_cn = """
# ======== 任务说明 ========
# 你的任务是根据用户与机器人之间的对话，将根据上下文的问题和答案总结成一个新的、简洁清晰的问题，在符合逻辑的前提下包含更多的信息。
#
# ======== 例子 ========
# 输入:
#     "用户: 请问2023年有哪些公司实现了盈利"
#     "机器人: SELECT company_name FROM company WHERE year=2023 AND profit>0;"
#     "用户: 请问这些公司盈利的平均值是多少"
# 输出:
#     "2023年实现盈利的公司盈利的平均值是多少"
# 不能出现:
#     "2023年有哪些公司盈利？这些公司盈利的平均是多少？"
#
# ======== 上下文的来源 ========
# 你要总结的是一个数据库问答的机器人，他的任务是通过人类输入的问题来生成 SQL 语句，同时到数据库中执行 SQL 语句返回答案，这个机器人的返回信息都是 JSON 格式
#
# ======== 输出要求 ========
# 1. 请你也用 JSON 的格式，包含一个 question 的 key
# 2. 只输出一个问题
# """
prompt_template_cn = """# ROLE 
你需要根据上一环为你提供的对话信息，总结出一个新的问题

## SKILLS
1. 根据上下文总结问题
2. 简要输出问题
3. 精通JSON格式


## EXAMPLES
输入:
    "用户: 请问2023年有哪些公司实现了盈利"
    "用户: 请问这些公司盈利的平均值是多少"
输出:
    "2023年实现盈利的公司盈利的平均值是多少"

## INSTRUCTIONS
1. 请你也用 JSON 的格式，包含一个 question 的 key
2. 只输出一个问题
3. 你一定不会输出你的思考过程或者与问题无关的信息
4. 你输出的问题一定要包含最后一个问题的信息！！！
5. 如果你认为最新一个问题与先前的问题相关性不大，或者主题不一致，直接输出最新问题；
6. 不要丢失上下文中的关键信息，尤其是是一个问题中的上下半句

## OUTPUT FORMAT
```json
{
    "question": "..."
}
```
"""


prompt_template_en = """# ROLE 
You need to summarize a new question based on the conversation information provided in the previous step.

## SKILLS
1. Summarize questions based on context
2. Output concise questions
3. Proficient in JSON format

## EXAMPLES
Input:
    "User: Which companies achieved profitability in 2023?"
    "User: What is the average profit of these companies?"
Output:
    "What is the average profit of companies that achieved profitability in 2023?"

## INSTRUCTIONS
1. Please use JSON format, including a key named "question"
2. Output only one question
3. You must not output your thought process or information unrelated to the question
4. Your output question must include information from the last question!!!
5. If you think the latest question is not closely related to or consistent with the previous questions, directly output the latest question

## OUTPUT FORMAT
{
    "question": "..."
}
"""

context2question_prompts = {
    "cn": prompt_template_cn,
    "en": prompt_template_en
}


class Context2QueryPrompt(BasePrompt):
    """Generate prompt from context of dialogues
    """
    language: str = "cn"
    templates: Dict[str, str] = context2question_prompts
    name: str = "default-context2question"


if __name__ == "__main__":
    prompt = Context2QueryPrompt(language="cn")
    print(prompt.render())
