from app.common.config import BuiltinIds

name = "DocQA_Agent"
description = "文档问答Agent"

dolphin = f"""
@doc_qa(query=$query) -> doc_retrieval_res
/prompt/给定以下内容：<召回源内容开始>\n    $doc_retrieval_res['answer']['result']   \n<召回源内容结束>\n给出关于问题【$query】的总结。总结内容应该尽可能详细和信息密集。确保在总结中尽可能包含任何实体，如人、地点、公司、产品、事物等，以及任何精确的指标、数字或日期。你的开头应该是: 针对问题【$query】，总结如下：-> answer
"""
tools = [
    {
        "tool_id": BuiltinIds.get_tool_id("doc_qa"),
        "tool_name": "doc_qa",
        "tool_description": "文档问答",
        "tool_box_id": BuiltinIds.get_tool_box_id("搜索工具"),
        "tool_box_name": "搜索工具",
        "tool_type": "tool",
        "tool_use_description": "文档问答",
        "tool_input": [
            {
                "input_name": "query",
                "input_type": "string",
                "input_desc": "用户的问题",
                "map_type": "auto",
                "map_value": "",
                "enable": True,
            },
            {
                "input_name": "props",
                "input_type": "object",
                "input_desc": "文档问答的参数",
                "map_type": "auto",
                "map_value": "",
                "enable": True,
            },
        ],
    }
]

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
    "data_source.doc": True,
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
        "variables": {"answer_var": "answer", "doc_retrieval_var": "doc_retrieval_res"},
        "default_format": "markdown",
    },
    "data_source": {
        "doc": [
            {
                "file_source": "",
                "ds_id": "7",
                "fields": [
                    {
                        "name": "aa",
                        "path": "aa",
                        "source": "gns://3E8088E34EF140A99A1CBC9BF0178579",
                    }
                ],
                "address": "https://XXX",
                "port": 443,
                "as_user_id": "eaa605a4-1b71-11f0-a0af-969b937333a2",
                "disabled": False,
            }
        ],
        "advanced_config": {
            "doc": {
                "document_threshold": -5.5,
                "retrieval_slices_num": 150,
                "max_slice_per_cite": 16,
                "rerank_topk": 15,
                "slice_head_num": 0,
                "slice_tail_num": 2,
                "documents_num": 8,
                "retrieval_max_length": 12288,
            }
        },
    },
    "built_in_can_edit_fields": built_in_can_edit_fields,
    "memory": {"is_enabled": False},
    "related_question": {"is_enabled": False},
    "plan_mode": {"is_enabled": False},
}
