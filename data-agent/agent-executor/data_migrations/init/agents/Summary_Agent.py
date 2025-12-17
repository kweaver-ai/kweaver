name = "Summary_Agent"
description = "负责总结任务的Agent"
dolphin = f"""
/prompt/你擅长发现独立发现、推理并整合各种见解，给出深度洞察。根据用户给出的主题【$query】，利用从研究中获得的知识，就该主题写一份最终报告。尽可能详细，你需要深入细节，从多维度、专家的角度来撰写3页或更多页的专业报告。数据部分可以先文字总结描述之后再以表格的形式呈现结果。研究中获得的知识为：【$ref_list】。现在开始你的分析，以markdown格式生成，但不要使用 ```markdown 标签。 -> answer
"""
tools = []
llms = [
    {
        "is_default": True,
        "llm_config": {
            "id": "1916319990936637440",
            "name": "Tome-pro",
            "temperature": 0,
            "top_p": 0.95,
            "top_k": 1,
            "frequency_penalty": 0,
            "presence_penalty": 0,
            "max_tokens": 3000,
            "retrieval_max_tokens": 8,
        },
    }
]
""" built_in_can_edit_fields:
- 内置agent可编辑字段
- 当is_built_in为1时有效
- 用途：
    - 内置agent创建者可以根据需要来设置此字段，来控制用户可以编辑的agent配置字段
    - 前端根据此字段来控制用户可以编辑的agent配置字段
    - agent后端编辑接口根据此字段来验证前端传过来的字段是否符合要求
"""
built_in_can_edit_fields = {
    "name": False,
    "avatar": False,
    "profile": False,
    "input_config": False,
    "system_prompt": False,
    "knowledge_source": False,
    "model": True,
    "skills": False,
    "opening_remark_config": False,
    "preset_questions": False,
    "skills.tools.tool_input": False,
}

config = {
    "input": {
        "fields": [
            {"name": "query", "type": "string"},
            {"name": "ref_list", "type": "string"},
        ],
        "is_temp_zone_enabled": 0,
    },
    "system_prompt": "",
    "dolphin": dolphin,
    "pre_dolphin": [],
    "post_dolphin": [],
    "is_dolphin_mode": 1,
    "skills": {
        "tools": tools,
    },
    "llms": llms,
    "is_data_flow_set_enabled": 0,
    "output": {
        "variables": {"answer_var": "answer"},
        "default_format": "markdown",
    },
    "built_in_can_edit_fields": built_in_can_edit_fields,
    "memory": {"is_enabled": False},
    "related_question": {"is_enabled": False},
    "plan_mode": {"is_enabled": False},
}
