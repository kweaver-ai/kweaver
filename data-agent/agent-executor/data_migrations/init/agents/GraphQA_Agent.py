from app.common.config import BuiltinIds

name = "GraphQA_Agent"
description = "图谱问答Agent"

dolphin = f"""
@graph_qa(query=$query) -> graph_retrieval_res
/prompt/给定以下内容：<召回源内容开始>\n    $graph_retrieval_res['answer']['result']   \n<召回源内容结束>\n给出关于问题【$query】的总结。总结内容应该尽可能详细和信息密集。确保在总结中尽可能包含任何实体，如人、地点、公司、产品、事物等，以及任何精确的指标、数字或日期。你的开头应该是: 针对问题【$query】，总结如下：-> answer
"""

dolphin0 = """
@get_business_rules(query=$query) -> retrieval_info

# 问题改写
[] -> history
@get_schema(search_schema=["orgnization", "person", "district"]) ->schema

# 别名替换

$retrieval_info['answer']['replace_query'] -> replace_query
$replace_query -> query
# 1、子图召回
@graph_qa(query=$query) -> graph_rag

# 2、业务规则召回
$retrieval_info['answer']['doc_rag'] -> doc_rag

# 3、问题改写
f'''你是一个图谱问答专家，你能准确的根据用户的问题，从图谱中找到答案，第一步，你需要根据已有知识，对问题进行补全。
要求：
1、用户提问时，可能存在指代不明，意图不明，缩略词等问题，所以请根据提供的信息，进行问题补全。
2、提供的信息可能已有部分线索，请务必补全到问题中。
3、先给出补全的分析过程，然后把补全的关键线索，对用户问题进行补全。
4、不要直接给出最终结果，只需要补全问题的线索即可。

图谱schema如下：
{$schema['answer']}

问题相关的模糊检索信息如下，可能不相关，请仔细筛选：
{$graph_rag['answer']}

问题相关的背景知识，没有错误，非常重要，请重点参考，如下：
{$doc_rag}

输出格式：
用户问题:{$query}
补全分析过程：
补全后的问题:'''-> rewrite_content


/prompt/(history=False)$rewrite_content-> llm_rewrite_query




[] -> history
# 别名替换


# 3、问题改写
str($llm_rewrite_query.answer).split("补全后的问题:")[-1] -> rewrite_query

@graph_qa(query=$rewrite_query) -> graph_rag

f'''你是一个图谱问答专家，你擅长根据问题生成nGQL查询语句，你有以下材料供参考：
问题相关的背景知识，没有错误，非常重要，请重点参考，如下：
{$doc_rag}

问题相关的模糊检索信息如下，可能不相关，请仔细筛选：
{$graph_rag.answer}

问题：{$query}
下一步你会给你更多的信息。
''' -> user_content

{"role": "user", "content": $user_content} >> history



# 4、主问题生成nGQL
@text2ngql(query=$rewrite_query, retrieval=true, history=$history, search_schema=["orgnization", "person", "district"]) -> result

$result.answer.response -> ngql_answer
$result.answer.messages -> messages



# 5、获取答案
f'''我对你返回的nGQL查询语句做了简单的校验执行后，得到了执行结果，可能不正确，你可以作为参考，请仔细判断，并继续回答问题。
{$ngql_answer}


注意：
1、nGQL查询语句和执行结果可能不正确，请根据提供的图谱schema，仔细甄别生成的查询语句和执行结果。
2、如果图数据库查询语句有错误，或者执行结果为空，请根据检索结果和背景知识，做总结回答。
3、请根据问题，严格筛选符合全部条件的信息，但是你惜字如金，只会简要解释选择每个人员或组织的原因。
4、回答不要输出和解释图查询语句，200字以内。

question: {$query}
重写后的问题：{$rewrite_query}
response：''' -> main_query_response_content

$messages -> history
/prompt/(history=True)$main_query_response_content-> llm_main_query_response

{"role": "assistant", "content": $llm_main_query_response.answer} >> history


# 6、拆分子问题判断

# 你需要判断答案是否100%完整和正确，否则就拆分子问题进行校对。
# 1、你需要判断答案是否存在明显错误，或明显遗漏，这种情况下才需要拆分。

f'''请根据以上对话，你需要帮我判断最后总结答案是否已经能完整回答问题。

注意：
1、你需要判断答案是否存在明显错误，或明显遗漏，这种情况下才需要拆分。
2、有些问题包含多个子问题，但答案只回答了部分，这种情况需要进行拆分。
3、如果需要拆分，请帮我将问题拆分为尽可能简单的子问题，子问题生成请参考schema能涉及的字段生成。
4、拆分的子问题不能存在指代问题。

以下是答案不完整的拆分问题的思考过程和样例，供参考。
//
举例：张三团队有多少人？
思考：问题是查人，我们可以先查到张三所在的部门，再通过部门，找到所有人，这样可以简化问题。
第一个子问题：张三的部门是哪个？
第二个子问题：部门名称为《》有多少人？
//

5、如果我的答案完整，不需要输出下一个子问题。

输出格式：
分析过程：给出拆分或不拆分子问题的逻辑。
最终结论：答案完整、答案不完整
子问题：只需要输出下一个子问题，不要输出其他。''' -> split_sub_query_content

/prompt/(history=True)$split_sub_query_content-> llm_check_is_answer_complete

{"role": "assistant", "content": $llm_check_is_answer_complete.answer} >> history


list(range(5)) -> split_count
0 -> split
# 6、拆分子问题判断
# 7、子问题生成ngql
$llm_check_is_answer_complete.answer -> llm_check_is_answer_complete
/if/ "最终结论：答案完整" not in $llm_check_is_answer_complete:
    /for/ $index in $split_count:
        /if/ "最终结论：答案完整"  not in $llm_check_is_answer_complete:
            str($llm_check_is_answer_complete).split("子问题：")[-1] -> sub_query
            @text2ngql(query=$sub_query, retrieval=false, history=$history, search_schema=["orgnization", "person", "district"]) -> result
            $result.answer.response -> sub_ngql_answer


            f'''我对你返回的nGQL查询语句做了简单的校验执行后，得到了执行结果，可能不正确，请仔细判断，最后总结子问题的答案。
            {$sub_ngql_answer}
            question: {$sub_query}
            子问题答案：''' -> sub_query_response_content

            /prompt/(history=True)$sub_query_response_content-> llm_sub_query_response
            {"role": "assistant", "content": $llm_sub_query_response.answer} >> history


            f'''如果原始问题：{$query}。已经可以根据以上所有子问题答案，已经完整找到原始问题的答案，就不要继续拆分下一个子问题，
            输出格式如下：
            最终结论：答案完整

            如果原始问题答案不完整，并请继续输出下一个子问题。
            注意：子问题不能存在指代问题。
            输出格式：
            分析过程：解释生成下一个子问题的分析逻辑，下一个子问题应和图谱schema相关，简单查询就能查到。
            最终结论：答案不完整
            子问题：只需要输出下一个子问题，不要输出其他。''' -> llm_split_next_sub_query_content

            /prompt/(history=True)$llm_split_next_sub_query_content-> llm_check_is_answer_complete
            {"role": "assistant", "content": $llm_check_is_answer_complete.answer} >> history
            $llm_check_is_answer_complete.answer -> llm_check_is_answer_complete
        /end/
    /end/
/end/


# 最后总结
f'''因资源有限，有些子问题没有回答，请根据以上所有对话信息，对原始问题做一个总结回答。
注意：信息可能很多，请筛选最有可能的信息作为答案，进行总结，和问题无关的答案不要总结。
原始问题：{$query}
补全问题：{$rewrite_query}
答案：''' -> content

/prompt/(history=True)$content-> final_answer

"""
tools = [
    {
        "tool_id": BuiltinIds.get_tool_id("graph_qa"),
        "tool_name": "graph_qa",
        "tool_description": "图谱问答",
        "tool_box_id": BuiltinIds.get_tool_box_id("搜索工具"),
        "tool_box_name": "搜索工具",
        "tool_type": "tool",
        "tool_use_description": "图谱问答",
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
                "input_desc": "图谱问答的参数",
                "map_type": "auto",
                "map_value": "",
                "enable": True,
            },
        ],
    },
    # {
    #     "tool_id": "get_business_rules",
    #     "tool_name": "get_business_rules",
    #     "tool_description": "获取业务规则",
    #     "tool_box_id": "code",
    #     "tool_box_name": "code",
    # },
    # {
    #     "tool_id": "get_schema",
    #     "tool_name": "get_schema",
    #     "tool_description": "获取schema",
    #     "tool_box_id": "import",
    #     "tool_box_name": "import",
    # },
    # {
    #     "tool_id": "text2ngql",
    #     "tool_name": "text2ngql",
    #     "tool_description": "文本转nGQL",
    #     "tool_box_id": "import",
    #     "tool_box_name": "import",
    # },
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
            "max_tokens": 30000,
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
    "data_source.kg": True,
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
        "variables": {
            "answer_var": "answer",
            "graph_retrieval_var": "graph_retrieval_res",
        },
        "default_format": "markdown",
    },
    "data_source": {
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
            "kg": {
                "graph_rag_topk": 25,
                "long_text_length": 256,
                "reranker_sim_threshold": -5.5,
                "text_match_entity_nums": 60,
                "vector_match_entity_nums": 60,
                "enable_rag": True,
                "enable_ngql": False,
                "retrieval_max_length": 12288,
            }
        },
    },
    "kg_ontology": {
        "15": {
            "dbname": "uc6748b8cef3011efad8f1694208d2405-4",
            "edge": [
                {
                    "alias": "相关主题",
                    "colour": "rgba(198,79,88,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id9ed6b79f-911e-4292-9c20-ba204dc95ba3",
                    "index_default_switch": False,
                    "model": "",
                    "name": "custom_subject_2_custom_subject_releated_manual",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": [
                        "custom_subject",
                        "custom_subject_2_custom_subject_releated_manual",
                        "custom_subject",
                    ],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "关联主题",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id617ad4c9-f0f6-46b6-8cd4-f4eb09fb8125",
                    "index_default_switch": False,
                    "model": "",
                    "name": "person_2_custom_subject_releated_manual",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": [
                        "person",
                        "person_2_custom_subject_releated_manual",
                        "custom_subject",
                    ],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "相关",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_idca8708f3-7f41-471e-ae14-d13ece366046",
                    "index_default_switch": False,
                    "model": "",
                    "name": "document_2_custom_subject_releated_manual",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": [
                        "document",
                        "document_2_custom_subject_releated_manual",
                        "custom_subject",
                    ],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "提及",
                    "colour": "rgba(42,144,143,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_ide5391bf9-827d-41c5-88e4-12d0d460cbb4",
                    "index_default_switch": False,
                    "model": "",
                    "name": "document_2_custom_subject_mention",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": [
                        "document",
                        "document_2_custom_subject_mention",
                        "custom_subject",
                    ],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "下层分类",
                    "colour": "rgba(42,144,143,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_ida8dcba4b-9d6c-427d-849b-9f1e135aa783",
                    "index_default_switch": False,
                    "model": "",
                    "name": "tag_2_tag_child",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["tag", "tag_2_tag_child", "tag"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "关联标签",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id84a37d0f-4234-4813-91c5-108f0f54733f",
                    "index_default_switch": False,
                    "model": "",
                    "name": "person_2_tag_include",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["person", "person_2_tag_include", "tag"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "提及",
                    "colour": "rgba(42,144,143,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_idc292332f-7d03-4d94-9e67-3a8ff8e90bb2",
                    "index_default_switch": False,
                    "model": "",
                    "name": "document_2_tag_mention",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["document", "document_2_tag_mention", "tag"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "编辑",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id2ced4ed3-1304-4842-849d-b40d03878f93",
                    "index_default_switch": False,
                    "model": "",
                    "name": "person_2_document_edit",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["person", "person_2_document_edit", "document"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "创建",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id46c0d868-fe0a-467f-8498-aa5215112b65",
                    "index_default_switch": False,
                    "model": "",
                    "name": "person_2_document_create",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["person", "person_2_document_create", "document"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "擅长领域",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id4e3c8a35-14dd-479f-8828-877c97f6917e",
                    "index_default_switch": False,
                    "model": "",
                    "name": "person_2_business_belong_to",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["person", "person_2_business_belong_to", "business"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "子行业",
                    "colour": "rgba(217,112,76,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_idd272a25c-a6e3-479c-b6f8-53036dc59dc4",
                    "index_default_switch": False,
                    "model": "",
                    "name": "industry_2_industry",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["industry", "industry_2_industry", "industry"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "下级地区",
                    "colour": "rgba(217,83,76,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_idcfcdc7fd-8acd-4720-9269-ff77b6a069df",
                    "index_default_switch": False,
                    "model": "",
                    "name": "district_2_district_child",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["district", "district_2_district_child", "district"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "提及",
                    "colour": "rgba(42,144,143,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_idacd741c8-ad86-42ed-9758-b5272a3810a8",
                    "index_default_switch": False,
                    "model": "",
                    "name": "document_2_person_mention",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["document", "document_2_person_mention", "person"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "参与项目",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id0dc8604c-b8d5-4436-8c2d-ee6b04ecea5e",
                    "index_default_switch": False,
                    "model": "",
                    "name": "customer_2_project_join",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["customer", "customer_2_project_join", "project"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "所在地区",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_idc8eb6bc9-cd57-4736-b39f-78fa19c99e18",
                    "index_default_switch": False,
                    "model": "",
                    "name": "customer_2_district_located",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": [
                        "customer",
                        "customer_2_district_located",
                        "district",
                    ],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "客户行业",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id1d4f1ea4-e446-4e3e-a6b1-4a3e1367df52",
                    "index_default_switch": False,
                    "model": "",
                    "name": "customer_2_industry_belong_to",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": [
                        "customer",
                        "customer_2_industry_belong_to",
                        "industry",
                    ],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "工作地点",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_idafb7822a-3dfc-4106-8779-9417c3a5ae4d",
                    "index_default_switch": False,
                    "model": "",
                    "name": "person_2_district_work_at",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["person", "person_2_district_work_at", "district"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "专注行业",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_iddab53e61-630d-4ee8-806a-98574a4d6fc2",
                    "index_default_switch": False,
                    "model": "",
                    "name": "person_2_industry_service",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["person", "person_2_industry_service", "industry"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "负责项目",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_ida2396bf8-3924-49c8-8aa7-8ea1fee5aee7",
                    "index_default_switch": False,
                    "model": "",
                    "name": "person_2_project_join",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["person", "person_2_project_join", "project"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "所在部门",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id52a5fc33-95a6-427c-8955-97ce61bbd154",
                    "index_default_switch": False,
                    "model": "",
                    "name": "person_2_orgnization_belong_to",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": [
                        "person",
                        "person_2_orgnization_belong_to",
                        "orgnization",
                    ],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "子部门",
                    "colour": "rgba(216,112,122,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_idad8e298c-c056-4190-aefd-7d00f73c2bd7",
                    "index_default_switch": False,
                    "model": "",
                    "name": "orgnization_2_orgnization_child",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": [
                        "orgnization",
                        "orgnization_2_orgnization_child",
                        "orgnization",
                    ],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "提及",
                    "colour": "rgba(42,144,143,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id18f9698a-f147-4cc2-892c-e36f7d1e9a6e",
                    "index_default_switch": False,
                    "model": "",
                    "name": "document_2_customer_mention",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": [
                        "document",
                        "document_2_customer_mention",
                        "customer",
                    ],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "提及",
                    "colour": "rgba(42,144,143,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id7d29c933-9432-4709-abe5-b84ea537dc12",
                    "index_default_switch": False,
                    "model": "",
                    "name": "document_2_industry_mention",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": [
                        "document",
                        "document_2_industry_mention",
                        "industry",
                    ],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "提及",
                    "colour": "rgba(42,144,143,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_idfbe31cda-edca-4d03-8474-099126aed2d2",
                    "index_default_switch": False,
                    "model": "",
                    "name": "document_2_project_mention",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["document", "document_2_project_mention", "project"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
            ],
            "entity": [
                {
                    "alias": "自定义主题",
                    "default_tag": "name",
                    "description": "",
                    "entity_id": "entity_idc090f331-5c5a-4605-88b4-2b67620285d8",
                    "fill_color": "rgba(198,79,88,1)",
                    "icon": "empty",
                    "icon_color": "#ffffff",
                    "index_default_switch": False,
                    "model": "",
                    "name": "custom_subject",
                    "primary_key": ["name"],
                    "properties": [
                        {
                            "alias": "主题别名",
                            "data_type": "string",
                            "description": "",
                            "name": "alias",
                        },
                        {
                            "alias": "描述",
                            "data_type": "string",
                            "description": "",
                            "name": "description",
                        },
                        {
                            "alias": "名称",
                            "data_type": "string",
                            "description": "",
                            "name": "name",
                        },
                    ],
                    "properties_index": ["alias", "description", "name"],
                    "search_prop": "name",
                    "shape": "circle",
                    "size": "0.5x",
                    "source_type": "manual",
                    "stroke_color": "rgba(198,79,88,1)",
                    "synonym": [],
                    "task_id": "",
                    "text_color": "rgba(0,0,0,1)",
                    "text_position": "top",
                    "text_type": "adaptive",
                    "text_width": 15,
                    "vector_generation": ["alias", "description", "name"],
                    "x": 1925.0973936899863,
                    "y": 322.23508230452666,
                },
                {
                    "alias": "标签",
                    "default_tag": "name",
                    "description": "",
                    "entity_id": "entity_idfc058d22-c844-4e4e-9aa4-9bae97a13259",
                    "fill_color": "rgba(42,144,143,1)",
                    "icon": "empty",
                    "icon_color": "#ffffff",
                    "index_default_switch": False,
                    "model": "",
                    "name": "tag",
                    "primary_key": ["id"],
                    "properties": [
                        {
                            "alias": "名称",
                            "data_type": "string",
                            "description": "",
                            "name": "name",
                        },
                        {
                            "alias": "版本",
                            "data_type": "integer",
                            "description": "",
                            "name": "version",
                        },
                        {
                            "alias": "路径",
                            "data_type": "string",
                            "description": "",
                            "name": "path",
                        },
                        {
                            "alias": "id",
                            "data_type": "string",
                            "description": "",
                            "name": "id",
                        },
                    ],
                    "properties_index": ["name", "path", "id"],
                    "search_prop": "name",
                    "shape": "circle",
                    "size": "0.5x",
                    "source_type": "manual",
                    "stroke_color": "rgba(42,144,143,1)",
                    "synonym": [],
                    "task_id": "",
                    "text_color": "rgba(0,0,0,1)",
                    "text_position": "top",
                    "text_type": "adaptive",
                    "text_width": 15,
                    "vector_generation": ["name", "path", "id"],
                    "x": 952.1512160493828,
                    "y": 258.28444787379965,
                },
                {
                    "alias": "专业领域",
                    "default_tag": "name",
                    "description": "专业领域是指员工的业务领域，通常与员工的职位和工作职责密切相关。",
                    "entity_id": "entity_id3ee43850-533f-4672-8889-e91fa8eed2b4",
                    "fill_color": "rgba(217,83,76,1)",
                    "icon": "graph-decentralization",
                    "icon_color": "#ffffff",
                    "index_default_switch": False,
                    "model": "",
                    "name": "business",
                    "primary_key": ["name"],
                    "properties": [
                        {
                            "alias": "name",
                            "data_type": "string",
                            "description": "",
                            "name": "name",
                        }
                    ],
                    "properties_index": ["name"],
                    "search_prop": "name",
                    "shape": "circle",
                    "size": "0.5x",
                    "source_type": "manual",
                    "stroke_color": "rgba(217,83,76,1)",
                    "synonym": [],
                    "task_id": "",
                    "text_color": "rgba(0,0,0,1)",
                    "text_position": "top",
                    "text_type": "adaptive",
                    "text_width": 15,
                    "vector_generation": ["name"],
                    "x": 1955.2344269437488,
                    "y": 470.30531269374006,
                },
                {
                    "alias": "地区",
                    "default_tag": "name",
                    "description": "行政区划",
                    "entity_id": "entity_ida4c0a656-e77f-4942-9300-615242e84889",
                    "fill_color": "rgba(217,83,76,1)",
                    "icon": "graph-location",
                    "icon_color": "#ffffff",
                    "index_default_switch": False,
                    "model": "",
                    "name": "district",
                    "primary_key": ["code"],
                    "properties": [
                        {
                            "alias": "隶属于",
                            "data_type": "string",
                            "description": "",
                            "name": "parent",
                        },
                        {
                            "alias": "层级",
                            "data_type": "integer",
                            "description": "",
                            "name": "level",
                        },
                        {
                            "alias": "区划代码",
                            "data_type": "string",
                            "description": "",
                            "name": "code",
                        },
                        {
                            "alias": "名称",
                            "data_type": "string",
                            "description": "",
                            "name": "name",
                        },
                    ],
                    "properties_index": ["parent", "name"],
                    "search_prop": "name",
                    "shape": "circle",
                    "size": "0.5x",
                    "source_type": "manual",
                    "stroke_color": "rgba(217,83,76,1)",
                    "synonym": [],
                    "task_id": "",
                    "text_color": "rgba(0,0,0,1)",
                    "text_position": "top",
                    "text_type": "adaptive",
                    "text_width": 15,
                    "vector_generation": ["parent", "name"],
                    "x": 1661.3772290809327,
                    "y": 820.4701646090533,
                },
                {
                    "alias": "客户",
                    "default_tag": "id",
                    "description": "企业商品服务的采购者",
                    "entity_id": "entity_id59b0c68b-aac6-43c0-9295-9d88d8fc0041",
                    "fill_color": "rgba(145,192,115,1)",
                    "icon": "graph-customer_service",
                    "icon_color": "#ffffff",
                    "index_default_switch": False,
                    "model": "",
                    "name": "customer",
                    "primary_key": ["id"],
                    "properties": [
                        {
                            "alias": "名称",
                            "data_type": "string",
                            "description": "",
                            "name": "name",
                        },
                        {
                            "alias": "ID",
                            "data_type": "string",
                            "description": "",
                            "name": "id",
                        },
                    ],
                    "properties_index": ["name", "id"],
                    "search_prop": "id",
                    "shape": "circle",
                    "size": "0.5x",
                    "source_type": "manual",
                    "stroke_color": "rgba(145,192,115,1)",
                    "synonym": [],
                    "task_id": "",
                    "text_color": "rgba(0,0,0,1)",
                    "text_position": "top",
                    "text_type": "adaptive",
                    "text_width": 15,
                    "vector_generation": ["name", "id"],
                    "x": 1178.127572016461,
                    "y": 796.278120713306,
                },
                {
                    "alias": "行业",
                    "default_tag": "name",
                    "description": "生产同类产品/相同工艺/提供同类劳动服务的企业或组织的集合",
                    "entity_id": "entity_ida8c94541-fca2-4f54-aa8d-40a09e388582",
                    "fill_color": "rgba(217,112,76,1)",
                    "icon": "graph-apps",
                    "icon_color": "#ffffff",
                    "index_default_switch": False,
                    "model": "",
                    "name": "industry",
                    "primary_key": ["id"],
                    "properties": [
                        {
                            "alias": "父级路径",
                            "data_type": "string",
                            "description": "",
                            "name": "parent",
                        },
                        {
                            "alias": "level",
                            "data_type": "integer",
                            "description": "",
                            "name": "level",
                        },
                        {
                            "alias": "描述",
                            "data_type": "string",
                            "description": "",
                            "name": "description",
                        },
                        {
                            "alias": "名称",
                            "data_type": "string",
                            "description": "",
                            "name": "name",
                        },
                        {
                            "alias": "ID",
                            "data_type": "string",
                            "description": "",
                            "name": "id",
                        },
                    ],
                    "properties_index": ["parent", "description", "name", "id"],
                    "search_prop": "name",
                    "shape": "circle",
                    "size": "0.5x",
                    "source_type": "manual",
                    "stroke_color": "rgba(217,112,76,1)",
                    "synonym": [],
                    "task_id": "",
                    "text_color": "rgba(0,0,0,1)",
                    "text_position": "top",
                    "text_type": "adaptive",
                    "text_width": 15,
                    "vector_generation": ["parent", "description", "name", "id"],
                    "x": 967.1111111111111,
                    "y": 577.9722222222222,
                },
                {
                    "alias": "人员",
                    "default_tag": "name",
                    "description": "企业组织结构的员工/AnyShare系统中的用户",
                    "entity_id": "entity_id5e09f69b-1da2-47a1-b558-9bb731615aab",
                    "fill_color": "rgba(145,192,115,1)",
                    "icon": "graph-user",
                    "icon_color": "#ffffff",
                    "index_default_switch": False,
                    "model": "",
                    "name": "person",
                    "primary_key": ["id"],
                    "properties": [
                        {
                            "alias": "英文名",
                            "data_type": "string",
                            "description": "",
                            "name": "english_name",
                        },
                        {
                            "alias": "用户状态",
                            "data_type": "string",
                            "description": "",
                            "name": "status",
                        },
                        {
                            "alias": "专家角色",
                            "data_type": "boolean",
                            "description": "",
                            "name": "is_expert",
                        },
                        {
                            "alias": "毕业院校",
                            "data_type": "string",
                            "description": "",
                            "name": "university",
                        },
                        {
                            "alias": "邮箱",
                            "data_type": "string",
                            "description": "",
                            "name": "email",
                        },
                        {
                            "alias": "联系方式",
                            "data_type": "string",
                            "description": "",
                            "name": "contact",
                        },
                        {
                            "alias": "用户密级",
                            "data_type": "integer",
                            "description": "",
                            "name": "user_securtiy_level",
                        },
                        {
                            "alias": "用户角色",
                            "data_type": "string",
                            "description": "",
                            "name": "user_role",
                        },
                        {
                            "alias": "职位",
                            "data_type": "string",
                            "description": "",
                            "name": "position",
                        },
                        {
                            "alias": "id",
                            "data_type": "string",
                            "description": "",
                            "name": "id",
                        },
                        {
                            "alias": "姓名",
                            "data_type": "string",
                            "description": "",
                            "name": "name",
                        },
                    ],
                    "properties_index": [
                        "english_name",
                        "is_expert",
                        "university",
                        "email",
                        "contact",
                        "position",
                        "name",
                    ],
                    "search_prop": "name",
                    "shape": "circle",
                    "size": "0.5x",
                    "source_type": "manual",
                    "stroke_color": "rgba(145,192,115,1)",
                    "synonym": [],
                    "task_id": "",
                    "text_color": "rgba(0,0,0,1)",
                    "text_position": "top",
                    "text_type": "adaptive",
                    "text_width": 15,
                    "vector_generation": [
                        "english_name",
                        "is_expert",
                        "university",
                        "email",
                        "contact",
                        "position",
                        "name",
                    ],
                    "x": 1263.936899862826,
                    "y": 591.1999314128943,
                },
                {
                    "alias": "部门",
                    "default_tag": "name",
                    "description": "AnyShare系统中的组织结构及部门",
                    "entity_id": "entity_id24803cd0-9bbd-4108-ab94-6ad47b93c92b",
                    "fill_color": "rgba(216,112,122,1)",
                    "icon": "graph-connections",
                    "icon_color": "#ffffff",
                    "index_default_switch": False,
                    "model": "",
                    "name": "orgnization",
                    "primary_key": ["id"],
                    "properties": [
                        {
                            "alias": "隶属于",
                            "data_type": "string",
                            "description": "",
                            "name": "parent",
                        },
                        {
                            "alias": "邮箱",
                            "data_type": "string",
                            "description": "",
                            "name": "email",
                        },
                        {
                            "alias": "id",
                            "data_type": "string",
                            "description": "",
                            "name": "id",
                        },
                        {
                            "alias": "名称",
                            "data_type": "string",
                            "description": "",
                            "name": "name",
                        },
                    ],
                    "properties_index": ["parent", "id", "name"],
                    "search_prop": "name",
                    "shape": "circle",
                    "size": "0.5x",
                    "source_type": "manual",
                    "stroke_color": "rgba(216,112,122,1)",
                    "synonym": [],
                    "task_id": "",
                    "text_color": "rgba(0,0,0,1)",
                    "text_position": "top",
                    "text_type": "adaptive",
                    "text_width": 15,
                    "vector_generation": ["parent", "id", "name"],
                    "x": 1258.1426611796983,
                    "y": 360.1848422496571,
                },
                {
                    "alias": "项目",
                    "default_tag": "name",
                    "description": "企业内部发生的一些重大的/有影响的事情，不同领域有不同含义，如法律领域，会将事件即为案件",
                    "entity_id": "entity_id414676a5-5a4c-4e50-81e4-207045b39d48",
                    "fill_color": "rgba(42,144,143,1)",
                    "icon": "graph-order",
                    "icon_color": "#ffffff",
                    "index_default_switch": False,
                    "model": "",
                    "name": "project",
                    "primary_key": ["name"],
                    "properties": [
                        {
                            "alias": "名称",
                            "data_type": "string",
                            "description": "",
                            "name": "name",
                        }
                    ],
                    "properties_index": ["name"],
                    "search_prop": "name",
                    "shape": "circle",
                    "size": "0.5x",
                    "source_type": "manual",
                    "stroke_color": "rgba(42,144,143,1)",
                    "synonym": [],
                    "task_id": "",
                    "text_color": "rgba(0,0,0,1)",
                    "text_position": "top",
                    "text_type": "adaptive",
                    "text_width": 15,
                    "vector_generation": ["name"],
                    "x": 1854.0973936899863,
                    "y": 613.548353909465,
                },
                {
                    "alias": "文档",
                    "default_tag": "name",
                    "description": "由创建者所定义的、具有文件名的一组相关元素的集合",
                    "entity_id": "entity_idc93b0ac1-e9bc-4c35-9fee-e90b8f4a01fd",
                    "fill_color": "rgba(42,144,143,1)",
                    "icon": "graph-document",
                    "icon_color": "#ffffff",
                    "index_default_switch": False,
                    "model": "",
                    "name": "document",
                    "primary_key": ["doc_id"],
                    "properties": [
                        {
                            "alias": "需要预览权限",
                            "data_type": "boolean",
                            "description": "",
                            "name": "need_preview_perm",
                        },
                        {
                            "alias": "摘要",
                            "data_type": "string",
                            "description": "",
                            "name": "abstract",
                        },
                        {
                            "alias": "大小",
                            "data_type": "integer",
                            "description": "",
                            "name": "size",
                        },
                        {
                            "alias": "文档路径",
                            "data_type": "string",
                            "description": "",
                            "name": "file_location",
                        },
                        {
                            "alias": "文档密级",
                            "data_type": "integer",
                            "description": "",
                            "name": "file_security_level",
                        },
                        {
                            "alias": "修改时间",
                            "data_type": "datetime",
                            "description": "",
                            "name": "modified_at",
                        },
                        {
                            "alias": "创建时间",
                            "data_type": "datetime",
                            "description": "",
                            "name": "created_at",
                        },
                        {
                            "alias": "版本",
                            "data_type": "string",
                            "description": "AS文档版本",
                            "name": "version",
                        },
                        {
                            "alias": "文件名",
                            "data_type": "string",
                            "description": "",
                            "name": "name",
                        },
                        {
                            "alias": "文档标识",
                            "data_type": "string",
                            "description": "AS文档ID",
                            "name": "doc_id",
                        },
                    ],
                    "properties_index": [
                        "abstract",
                        "size",
                        "file_location",
                        "modified_at",
                        "created_at",
                        "version",
                        "name",
                        "doc_id",
                    ],
                    "search_prop": "name",
                    "shape": "circle",
                    "size": "0.5x",
                    "source_type": "manual",
                    "stroke_color": "rgba(42,144,143,1)",
                    "synonym": [],
                    "task_id": "",
                    "text_color": "rgba(0,0,0,1)",
                    "text_position": "top",
                    "text_type": "adaptive",
                    "text_width": 15,
                    "vector_generation": ["abstract", "file_location", "name"],
                    "x": 1720.205761316872,
                    "y": 267.6659807956105,
                },
            ],
            "graph_name": "AS线上图谱20241217",
            "knw_id": 1,
            "quantized_flag": 0,
        }
    },
    "built_in_can_edit_fields": built_in_can_edit_fields,
    "memory": {"is_enabled": False},
    "related_question": {"is_enabled": False},
    "plan_mode": {"is_enabled": False},
}
