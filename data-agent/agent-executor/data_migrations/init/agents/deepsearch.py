from app.common.config import BuiltinIds

name = "deepsearch"
description = "深度搜索Agent"

dolphin = """
import Plan_Agent,OnlineSearch_Agent,DocQA_Agent,GraphQA_Agent,Summary_Agent

@Plan_Agent(query=$query, _options={"output_vars": ["answer.plan_list"]})->plan_list



@获取agent详情(key='GraphQA_Agent') ->  graph_qa_agent_config
/if/ 'kg' in $graph_qa_agent_config['answer']['config']['data_source'] and $graph_qa_agent_config['answer']['config']['data_source']['kg']:
    ["搜索图谱："+$query] + $plan_list -> plan_list
else:
    '' -> null
/end/

@获取agent详情(key='DocQA_Agent') ->  doc_qa_agent_config
/if/ 'doc' in $doc_qa_agent_config['answer']['config']['data_source'] and $doc_qa_agent_config['answer']['config']['data_source']['doc']:
    ["搜索文档库："+$query] + $plan_list -> plan_list
else:
    '' -> null
/end/

True -> confirm_plan

#为了快速联调只取后两步
# $plan_list[-2:]->plan_list

# for block前： 交互: 修改plan_list
@check(value=$plan_list, field="generate_plan") -> check_plan_list
$check_plan_list['answer'] -> plan_list
list(range(len($plan_list))) -> plan_list_index

/for/ $plan_index in $plan_list_index:
    $plan_list[$plan_index] -> plan

    /prompt/任务如下：$plan ,每个Agent能力如下：
    - OnlineSearch_Agent: 在线搜索
    - DocQA_Agent: 文档问答,提到"搜索文档库"时，必须选择DocQA_Agent
    - GraphQA_Agent: 图谱问答,提到"搜索图谱"时，必须选择GraphQA_Agent
    - Summary_Agent: 总结,只有当任务描述中提到了总结，才选择Summary_Agent
    请选择最合适的Agent处理当前任务。只输出最合适的Agent的名字即可，不要输出多余内容-> temp_result
    $temp_result['answer'] >> SelectAgent

    /if/  "OnlineSearch" in $SelectAgent[-1]:
           @OnlineSearch_Agent(query=$plan, _options={"output_vars": ["answer.search_querys","answer.search_results", "answer.answer"]}) >> ref_list
    elif  "DocQA_Agent" in $SelectAgent[-1]:
           @DocQA_Agent(query=$plan, _options={"output_vars": ["answer.doc_retrieval_res", "answer.answer"]}) >> ref_list
    elif  "GraphQA_Agent" in $SelectAgent[-1]:
           @GraphQA_Agent(query=$plan, _options={"output_vars": ["answer.graph_retrieval_res", "answer.answer"]})  >> ref_list
    elif  "Summary_Agent" in $SelectAgent[-1]:
           @Summary_Agent(query=$plan,ref_list=$llm_ref_list, _options={"output_vars": ["answer.answer", ""]})  >> ref_list
    /end/

    @check(value=$ref_list, field="task_result") -> check_ref_list
    $ref_list[-1]['answer'] >> llm_ref_list

    /if/ $plan_index != len($plan_list) - 1:
        '' -> plan
        # 防止因为confirm_plan被修改，导致if条件内的中断无法继续
        $confirm_plan -> origin_confirm_plan
        /if/ $origin_confirm_plan:
            @check(value=$plan_list, field="confirm_plan") -> check_plan_list
            $check_plan_list['answer'] -> plan_list
        else:
            @pass() -> null
        /end/
        list(range(len($plan_list))) -> plan_list_index
    else:
        '' -> plan
        $confirm_plan -> origin_confirm_plan
        @pass() -> null
        list(range(len($plan_list))) -> plan_list_index
    /end/

/end/

$ref_list[-1]['answer'] -> answer
"""

tools = [
    {
        "tool_id": BuiltinIds.get_tool_id("check"),
        "tool_name": "check",
        "tool_description": "检查",
        "tool_box_id": BuiltinIds.get_tool_box_id("数据处理工具"),
        "tool_box_name": "数据处理工具",
        "intervention": True,
        "tool_type": "tool",
        "tool_use_description": "检查",
        "tool_input": [
            {
                "input_name": "value",
                "input_type": "string",
                "input_desc": "检查的值",
                "map_type": "auto",
                "map_value": "",
                "enable": True,
            },
            {
                "input_name": "field",
                "input_type": "string",
                "input_desc": "检查的对象",
                "map_type": "auto",
                "map_value": "",
                "enable": True,
            },
        ],
    },
    {
        "tool_id": BuiltinIds.get_tool_id("pass"),
        "tool_name": "pass",
        "tool_description": "跳过",
        "tool_box_id": BuiltinIds.get_tool_box_id("数据处理工具"),
        "tool_box_name": "数据处理工具",
        "intervention": False,
        "tool_type": "tool",
        "tool_use_description": "跳过",
        "tool_input": [],
    },
    {
        "tool_id": BuiltinIds.get_tool_id("获取agent详情"),
        "tool_name": "获取agent详情",
        "tool_description": "获取agent配置详情",
        "tool_box_id": BuiltinIds.get_tool_box_id("DataAgent配置相关工具"),
        "tool_box_name": "DataAgent配置相关工具",
        "intervention": False,
        "tool_type": "tool",
        "tool_use_description": "获取agent配置详情",
        "tool_input": [
            {
                "input_name": "key",
                "input_type": "string",
                "input_desc": "Agent Key",
                "map_type": "auto",
                "enable": True,
            }
        ],
    },
]

agents = [
    {
        "agent_key": "Plan_Agent",
        "agent_version": "latest",
        "agent_input": [
            {
                "input_name": "query",
                "input_type": "string",
                "input_desc": "用户输入的问题",
                "map_type": "auto",
                "map_value": "",
                "enable": True,
            }
        ],
    },
    {
        "agent_key": "OnlineSearch_Agent",
        "agent_version": "latest",
        "agent_input": [
            {
                "input_name": "query",
                "input_type": "string",
                "input_desc": "用户输入的问题",
                "map_type": "auto",
                "map_value": "",
                "enable": True,
            }
        ],
    },
    {
        "agent_key": "DocQA_Agent",
        "agent_version": "latest",
        "agent_input": [
            {
                "input_name": "query",
                "input_type": "string",
                "input_desc": "用户输入的问题",
                "map_type": "auto",
                "map_value": "",
                "enable": True,
            }
        ],
    },
    {
        "agent_key": "GraphQA_Agent",
        "agent_version": "latest",
        "agent_input": [
            {
                "input_name": "query",
                "input_type": "string",
                "input_desc": "用户输入的问题",
                "map_type": "auto",
                "map_value": "",
                "enable": True,
            }
        ],
    },
    {
        "agent_key": "Summary_Agent",
        "agent_version": "latest",
        "agent_input": [
            {
                "input_name": "query",
                "input_type": "string",
                "input_desc": "用户输入的问题",
                "map_type": "auto",
                "map_value": "",
                "enable": True,
            }
        ],
    },
]

llms = [
    {
        "is_default": True,
        "llm_config": {
            "id": "1916747870116122624",
            "name": "Tome-pro",
            "temperature": 2,
            "top_p": 1,
            "top_k": 1,
            "frequency_penalty": 0,
            "presence_penalty": 0,
            "max_tokens": 3000,
            "retrieval_max_tokens": 8,
        },
    },
    {
        "is_default": False,
        "llm_config": {
            "id": "1917449106356310016",
            "name": "deepseek-r1",
            "temperature": 2,
            "top_p": 1,
            "top_k": 1,
            "frequency_penalty": 0,
            "presence_penalty": 0,
            "max_tokens": 3000,
            "retrieval_max_tokens": 8,
        },
    },
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
    "skills.tools.tool_input": True,
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
        "agents": agents,
    },
    "llms": llms,
    "is_data_flow_set_enabled": 0,
    "output": {
        "variables": {
            "answer_var": "answer",
            "other_vars": ["plan_list", "ref_list", "plan", "SelectAgent"],
        },
        "default_format": "markdown",
    },
    "built_in_can_edit_fields": built_in_can_edit_fields,
    "memory": {"is_enabled": False},
    "related_question": {"is_enabled": False},
    "plan_mode": {"is_enabled": False},
}
