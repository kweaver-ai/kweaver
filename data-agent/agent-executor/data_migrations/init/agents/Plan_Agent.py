name = "Plan_Agent"
description = "负责规划任务的Agent"
dolphin = f"""
/prompt/请将原始任务拆解成多步骤任务，任务的个数应该在2~4个，前几步应是搜索资料，最后一步应该是总结内容。
以list格式返回
示例:
原始任务:如何提高英语口语能力？
拆解结果:["搜索资料:提高英语口语能力的最佳方法","搜索资料：适合初学者的英语口语练习技巧","总结内容：如何提高英语口语能力？"]

原始任务:$query
拆解结果:->plan_list
eval($plan_list.answer)->plan_list
"""
tools = []

llms = [
    {
        "is_default": True,
        "llm_config": {
            "id": "1922491455683825664",
            "name": "Tome-pro",
            "temperature": 0.7,
            "top_p": 0.8,
            "top_k": 40,
            "frequency_penalty": 0.5,
            "presence_penalty": 0.3,
            "max_tokens": 200,
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
        "fields": [{"name": "query", "type": "string"}],
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
        "variables": {"answer_var": "plan_list"},
        "default_format": "markdown",
    },
    "built_in_can_edit_fields": built_in_can_edit_fields,
    "memory": {"is_enabled": False},
    "related_question": {"is_enabled": False},
    "plan_mode": {"is_enabled": False},
}
