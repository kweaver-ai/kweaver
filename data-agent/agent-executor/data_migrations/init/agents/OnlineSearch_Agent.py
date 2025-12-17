import json

from app.common.config import BuiltinIds

name = "OnlineSearch_Agent"
description = "负责在线搜索的Agent"

# api_key = "4f7fa828c3894cd8b6e926a55b31027b.xYpHwNzIPDYGXezU"  # 黄思祺
# api_key = "1828616286d4c94b26071585e1f93009.negnhMi3D5KVuc7h"  # 公司账号
api_key = "<<请在这里替换智谱搜索的api_key>>" # 可在部署后在页面上进行设置

dolphin = f"""
/prompt/(flags='{{"debug": true}}')请将以下原始query改写成多个更适合搜索引擎搜索的问题。改写时请注意以下几点：
1. 确保每个改写后的问题简洁明了，包含核心关键词。
2. 针对不同角度或细分领域生成问题，以覆盖更广泛的搜索结果。
3. 避免使用模糊或过于宽泛的表述，尽量具体化。
4. 如果原始问题涉及复杂概念，可以拆解为多个简单问题。
5. 生成的数量控制在3-5个之间。
6. 改写后的问题以列表格式返回。
示例：
原始问题: 如何提高英语口语能力？
参考资料: 英语口语学习需要大量练习和适当方法，包括听力训练、模仿发音、参加语言交换、使用学习应用等。初学者和进阶学习者有不同的学习重点。
改写后的问题：
["提高英语口语能力的最佳方法","适合初学者的英语口语练习技巧","英语听力训练对口语提升的作用","语言交换平台推荐及使用方法","进阶学习者如何突破英语口语瓶颈"]
直接生成改写后的问题list不要生成其他内容和解释。
原始问题: $query
改写后的问题：->sub_querys
eval($sub_querys.answer)->search_querys
#只取前2个 方便联调，实际数量不确定,可以设置成
$search_querys[:2]->search_querys
''->ref
/for/ $search_query in $search_querys:
  @zhipu_search_tool(query=$search_query)->result
  $result['answer']['choices'][0]['message']['tool_calls'] -> result
  /if/ len($result[1]['search_result']) > 0:
    $result[1]['search_result']->search_result
  else:
    []->search_result
  /end/
  $search_result>>search_results
  ''->sub_ref
  /for/ $page in $search_result:
      $sub_ref+$page['content']->sub_ref
  /end/
  $sub_ref[:5000] -> sub_ref
  $ref+$sub_ref ->ref
/end/
''->page
''->sub_ref
''->result
''->search_result
''->sub_querys
''->search_query

/if/ $ref == '':
    /prompt/请忽略其他提示词，直接输出：没有找到相关资料  -> answer
else:
    /prompt/(history=True)请根据问题和参考资料完成撰写任务。
    <参考资料> $ref </参考资料>
    <任务> $query </任务>
    要求：
    1. 尽可能详细

    撰写内容:->answer
/end/


"""
dolphin0 = f"""
@zhipu_search_tool(query=$query) -> ref_list
$ref_list['answer']["choices"][0]["message"]["tool_calls"] -> ref_list
/prompt/(history=True)给定以下内容：<召回源内容开始>\n    $ref_list   \n<召回源内容结束>\n给出关于问题【$query】的总结。总结内容应该尽可能详细和信息密集。确保在总结中尽可能包含任何实体，如人、地点、公司、产品、事物等，以及任何精确的指标、数字或日期。你的开头应该是: 针对问题【$query】，总结如下：-> answer
"""
tools = [
    {
        "tool_id": BuiltinIds.get_tool_id("zhipu_search_tool"),
        "tool_name": "zhipu_search_tool",
        "tool_description": "智谱搜索",
        "tool_box_id": BuiltinIds.get_tool_box_id("搜索工具"),
        "tool_box_name": "搜索工具",
        "tool_type": "tool",
        "tool_use_description": "智谱搜索",
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
                "input_name": "api_key",
                "input_type": "string",
                "input_desc": "智谱搜索的api_key",
                "map_type": "fixedValue",
                "map_value": api_key,
                "enable": True,
            },
        ],
    }
]

llms = [
    {
        "is_default": True,
        "llm_config": {
            "id": "1922491455683825664",
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
    "post_dolphin": [
        {
            "key": "related_questions",
            "name": "相关问题模块",
            "value": '\n/prompt/(flags=\'{"debug": true}\')请根据原始用户问题和上下文信息，更进一步的生成3个问题和答案对。所生成的3个问题与原始用户问题呈递进关系，3个问题之间则相互独立，用户可以使用这些问题深入挖掘上下文中的话题。\n===\n$query\n===\n要求：\n1. 根据上下文信息生成问题答案对，禁止推测；若上下文信息为空。则直接返回空。\n2. 生成的问题不要和原始用户问题重复。\n3. 确保生成的问题主谓宾完整，长度不超过25个字。\n4. 不要输出问题对应的答案。\n5. 输出格式为：\n["第一个问题", "第二个问题", "第三个问题"]\n6. 如果无法生成问题，则返回空列表 []\n7. 示例:\n原始问题:你能帮我写一首描写春天的唐诗吗？\n相关问题:["春天的唐诗中有哪些典型的意象？", "这首唐诗中如何体现春天的生机与活力？", "唐诗中春天的描写与现代人对春天的感受有何不同？"]\n8. 不要输出多余的内容。\n-> related_questions\neval($related_questions.answer) -> related_questions\n',
            "enabled": True,
            "edited": False,
        }
    ],
    "is_dolphin_mode": 1,
    "skills": {
        "tools": tools,
    },
    "llms": llms,
    "is_data_flow_set_enabled": 0,
    "output": {
        "variables": {
            "answer_var": "answer",
            "other_vars": ["search_querys", "search_results"],
            "related_questions_var": "related_questions",
        },
        "default_format": "markdown",
    },
    "built_in_can_edit_fields": built_in_can_edit_fields,
    "memory": {"is_enabled": False},
    "related_question": {"is_enabled": True},
    "plan_mode": {"is_enabled": False},
}

if __name__ == "__main__":
    print(json.dumps(config, ensure_ascii=False))
