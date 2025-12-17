name = "SimpleChat_Agent"
description = "简单问答Agent"
dolphin = f"""
/explore/(history=True)$query -> answer
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
            {"name": "file", "type": "file"},
        ],
        "is_temp_zone_enabled": 1,
        "temp_zone_config": {
            "name": "临时上传区",
            "tmp_file_use_type": "upload",
            "max_file_count": 50,
            "single_file_size_limit": 100,
            "single_file_size_limit_unit": "MB",
            "support_data_type": ["file"],
            "allowed_file_categories": [
                "spreadsheet",
                "document",
                "text",
                "presentation",
                "pdf",
                "audio",
                "video",
                "other",
            ],
        },
    },
    "system_prompt": "",
    "dolphin": "",
    "pre_dolphin": [],
    "post_dolphin": [],
    "is_dolphin_mode": 0,
    "skills": {
        "tools": tools,
    },
    "llms": llms,
    "is_data_flow_set_enabled": 0,
    "output": {
        "variables": {
            "answer_var": "answer",
            "doc_retrieval_var": "doc_retrieval_res",
            "graph_retrieval_var": "graph_retrieval_res",
            "related_questions_var": "related_questions",
        },
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
        "kg": [
            {
                "kg_id": "15",
                "fields": [
                    "custom_subject",
                    "tag",
                    "business",
                    "district",
                    "customer",
                    "industry",
                    "person",
                    "orgnization",
                    "project",
                    "document",
                ],
                "output_fields": [
                    "custom_subject",
                    "tag",
                    "business",
                    "district",
                    "customer",
                    "industry",
                    "person",
                    "orgnization",
                    "project",
                    "document",
                ],
                "field_properties": {
                    "district": ["※vid", "parent", "name"],
                    "document": [
                        "※vid",
                        "abstract",
                        "size",
                        "file_location",
                        "modified_at",
                        "created_at",
                        "version",
                        "name",
                        "doc_id",
                    ],
                    "orgnization": ["※vid", "parent", "id", "name"],
                    "person": [
                        "※vid",
                        "english_name",
                        "is_expert",
                        "university",
                        "email",
                        "contact",
                        "position",
                        "name",
                    ],
                    "business": ["※vid", "name"],
                    "custom_subject": ["※vid", "alias", "description", "name"],
                    "customer": ["※vid", "name", "id"],
                    "industry": ["※vid", "parent", "description", "name", "id"],
                    "project": ["※vid", "name"],
                    "tag": ["※vid", "name", "path", "id"],
                },
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
            },
            "kg": {
                "graph_rag_topk": 25,
                "long_text_length": 256,
                "reranker_sim_threshold": -5.5,
                "text_match_entity_nums": 60,
                "vector_match_entity_nums": 60,
                "enable_rag": True,
                "enable_ngql": False,
                "retrieval_max_length": 12288,
            },
        },
    },
    "built_in_can_edit_fields": built_in_can_edit_fields,
    "memory": {"is_enabled": False},
    "related_question": {"is_enabled": True},
    "plan_mode": {"is_enabled": False},
}
