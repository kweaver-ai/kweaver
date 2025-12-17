# -*- coding:utf-8 -*-
from dataclasses import dataclass, field
from typing import List, Union

from fastapi import Body


@dataclass
class LogicBlock:
    id: str = None
    name: str = None
    type: str = None  # retriever_block llm_block
    output: str = None
    llm_config: dict = None


@dataclass
class AugmentBlock():
    input: list = field(default_factory=list)
    augment_data_source: dict = field(default_factory=dict)
    need_augment_content: bool = False
    augment_entities: dict = field(default_factory=dict)


@dataclass
class RetrieverBlock(LogicBlock):
    input: str = None
    headers_info: dict = field(default_factory=dict)  # Young:透传AS的身份信息
    body: dict = field(default_factory=dict)  # Young:透传AS的请求体
    data_source: dict = field(default_factory=dict)
    augment_data_source: dict = field(default_factory=dict)  # Young:query增强的concept数据
    processed_query: dict = field(default_factory=dict)  # Young:query处理后得到的结果
    retrival_slices: dict = field(default_factory=dict)  # Young:保存召回原始切片
    rank_slices: dict = field(default_factory=dict)  # Young:保存精排之后的排序切片
    rank_rough_slices: dict = field(default_factory=dict)
    rank_rough_slices_num: dict = field(default_factory=dict)
    rank_accurate_slices: dict = field(default_factory=dict)
    rank_accurate_slices_num: dict = field(default_factory=dict)
    snippets_slices: dict = field(default_factory=dict)
    cites_slices: dict = field(default_factory=dict)  # Young:保存cite拼接结果
    format_out: list = field(default_factory=list)

    faq_retrival_qas: list = field(default=list)
    faq_rank_qas: list = field(default=list)
    faq_find_answer: bool = False
    faq_format_out_qas: Union[list, dict] = field(default_factory=list)

    security_token: set = field(default_factory=set)  # Feature-736016 百胜召回支持外置后过滤功能
    """ 召回后会返回security_token，在后续调用大模型时将security_token作为header传给模型工厂 """


class LLMBlock(LogicBlock):
    system_prompt: str
    tools: List[dict]
    user_prompt: str
    user_prompt_variables: List[dict]


# agent配置信息
@dataclass
class AgentConfig:
    input: dict
    logic_block: List[LogicBlock]
    output: dict
    version: str


'''
{
    "input": {
        "fields": [
            {
                "name": "query",
                "type": "text"
            }
        ],
        "augment": {
            "enable": true,
            "data_source": {
                "kg": [
                    {
                        "kg_id": "1",
                        "kg_name": "人物关系图谱",
                        "fields": [
                            "person"
                        ]
                    }
                ]
            }
        },
        "rewrite": {
            "enable": true,
            "llm_config": {
                "id": "1780110534704762881",
                "name": "l20-qwen1.5",
                "temperature": 0,
                "top_p": 0.95,
                "top_k": 1,
                "frequency_penalty": 0,
                "presence_penalty": 0,
                "max_tokens": 500
            },
            "advanced_config": {
                "history_epochs": 1,
                "do_rewrite_query_check": true,
                "rewrite_qeury_at_origin_query_top_line": 2,
                "rewrite_qeury_at_origin_query_bottom_line": 0.5,
                "rewrite_qeury_at_origin_query_jaccard_bottom_line": 0.3
            }
        }
    },
    "logic_block": [
        {
            "id": "1",
            "name": "Retriever_Block",
            "type": "retriever_block",
            "input": [
                {
                    "name": "query",
                    "type": "text",
                    "from": "input"
                }
            ],
            "data_source": {
                "kg": [
                    {
                        "kg_id": "1",
                        "kg_name": "人物关系图谱",
                        "fields": [
                            "person"
                        ],
                        "output_fields": [
                            "person"
                        ]
                    }
                ],
                "doc": [
                    {
                        "ds_id": "1",
                        "ds_name": "部门文档库",
                        "fields": [
                            {
                                "name": "AnyDATA研发线",
                                "path": "部门文档库1/AnyDATA研发线",
                                "source": "gns://CBBB3180731847DA9CE55F262C7CD3D8/AEC0E4D9BD224763BC5BEF8D72D5866D"
                            }
                        ]
                    }
                ]
            },
            "output": [
                {
                    "name": "retriever_output",
                    "type": "object"
                }
            ],
            "llm_config": {
                "id": "1780110534704762881",
                "name": "l20-qwen1.5",
                "temperature": 0,
                "top_p": 0.95,
                "top_k": 1,
                "frequency_penalty": 0,
                "presence_penalty": 0,
                "max_tokens": 500
            }
        },
        {
            "id": "2",
            "name": "LLM_Block",
            "type": "llm_block",
            "system_prompt": "你是一个擅长图谱问答的专家，能够根据用户问题及图谱信息分析推理答案，也能够借助外部工具获得额外的辅助信息。",
            "tools": [
                {
                    "tool_id": "",
                    "tool_name": "NL2NGQL",
                    "tool_description": "将用户问题的自然语言转为图数据库查询的NGQL查询语句，并返回查询结果。",
                    "tool_box_id": "",
                    "toll_box_name": "",
                    "config": {
                        "kg_id": 1,
                        "llm_config": {
                            "id": "1780110534704762881",
                            "name": "l20-qwen1.5",
                            "temperature": 0,
                            "top_p": 0.95,
                            "top_k": 1,
                            "frequency_penalty": 0,
                            "presence_penalty": 0,
                            "max_tokens": 500
                        }
                    },
                    "tool_use_description": "将用户问题的自然语言转为图数据库查询的NGQL查询语句，并返回查询结果。"
                }
            ],
            "user_prompt": "现在我给你图谱召回的结果，请你先判断图谱召回的结果是否能回答问题，如果可以，组织答案后返回，如果不能直接回答问题，请调用工具回答问题。\n用户的问题 query = {{query}}\n图谱召回的结果 schema_linking_res = {{retriver_output}}\n\n{{1_tool_use}}{{2_format_constraint}}开始！\n\nQuestion： {{query}}",
            "user_prompt_variables": [
                {
                    "name": "query",
                    "from": "input"
                },
                {
                    "name": "1_tool_use",
                    "value": "你可以不使用工具直接回答用户问题，也可以调用以下工具回答用户问题："
                },
                {
                    "name": "2_format_constraint",
                    "value": "如果调用工具，请使用以下格式：\\n\\nQuestion: 你必须回答的问题\\nThought: 思考你需要做什么以及调用哪个工具可以找到答案\\nAction: 你选择使用的工具名称，工具名称必须从 [{tool_names}] 中选择。不需要调用工具时，为null\\nAction Input: 工具输入参数，不使用工具时为null\\nObservation: 调用工具后得到的结果\\n... (Thought/Action/Action Input/Observation的流程可能需要重复多次才能解决问题)\\n\\n当已经满足用户要求时，请使用以下格式：\\nThought: 我已经知道最终答案了\\nFinal Answer: 用户问题的最终答案"
                },
                {
                    "name": "retriver_output.concept",
                    "from":"Retriever_Block"
                }
            ],
            "output": [
                {
                    "name": "llm_output",
                    "type": "text"
                }
            ],
            "llm_config": {
                "id": "1780110534704762881",
                "name": "l20-qwen1.5",
                "temperature": 0,
                "top_p": 0.95,
                "top_k": 1,
                "frequency_penalty": 0,
                "presence_penalty": 0,
                "max_tokens": 500
            }
        }
    ],
    "output": [
        {
            "name": "query",
            "type": "text",
            "from": "input"
        },
        {
            "name": "retriever_output",
            "type": "object",
            "from": "Retriever_Block"
        },
        {
            "name": "llm_output",
            "type": "text",
            "from": "LLM_Block"
        }
    ],
    "version": "3.0.0.9"
}
'''


@dataclass
class PromptInfo:
    id: str = None
    name: str = None
    message: str = None  # 提示词文本
    variables: List[dict] = None  # 提示词变量


@dataclass
class LLMConfig:
    # 实际上参数校验在model-factory，这里不校验取值范围
    model: str = Body(..., description="模型名")
    llm_id: str = None  # 好像没啥用
    temperature: int = Body(None, description="随机性, 范围0-2,默认为1")
    top_p: float = Body(None, description="核采样，默认为0")
    top_k: int = Body(None, description="")
    frequency_penalty: int = Body(None, description="频率惩罚度，范围-2~2")
    presence_penalty: int = Body(None, description="话题新鲜度，范围-2~2")
    max_tokens: int = Body(None, description="单次回复限制")


@dataclass
class NL2nGQLReq:
    # todo 待定
    llm_config: LLMConfig = Body(..., description="大模型配置")
    kg_id: str = Body(..., description="图谱id")
    query: str = Body(..., description="问题内容")
    schema: str = Body(..., description="图谱召回的schema信息")


# nl2ngql的一些写死的配置
COT_CONFIG = {
    'kg_id': '11',
    'cot_config':
        {
            'multi_cot': '0',
            'cot_index': 'as_benchmark_10cot',
            'opensearch_config': {
                'opensearch_host': '10.4.71.172',
                'opensearch_port': '9200',
                'opensearch_user': 'admin',
                'opensearch_password': 'eisoo.com123'
            }, 'few_shot_num': 10
        },
    'self_loop_reason_rules': [
        {
            'reason_edge': '(person)-[person_2_district_work_at]->(district)', 'entity_name': '(district)',
            'contained_by': '(district)<-[district_2_district_child]-(district)', 'max_hops': '5'
        },
        {
            'reason_edge': '(person)-[person_2_orgnization_belong_to]->(orgnization)', 'entity_name': '(orgnization)',
            'contained_by': '(orgnization)<-[orgnization_2_orgnization_child]-(orgnization)', 'max_hops': '5'
        }],
    'reflexion': '1'
}
# jctd
NL2NGQL_PROMPTS = {
    'lf_generation_prompt': {
        'system_message': '你是一个精通知识图谱schema和nebula查询语句的专家,能够根据用户问题、图谱本体信息,总结出来一种固定的Logic Form的json报文.\n用户查询问题为企业员工场景的一个知识网络.接下来给你10个一步步思考的问题示例：\n{{cot_list}}\n',
        'human_message': '我有这样一个问题《{{query}}》，其相关的schema信息可以参考：《{{schema_linking_res}}》，若其中的属性值与问题不相干的，可以忽略。按照上述我给出的示例进行分析并返回Logic Form的json报文,其中包含用户问题涉及到的子图信息(related_subgraph),\n筛选条件(filtered_condition),返回目标(return_target)及其他限制(other_limits)这四个部分.请注意在用户问题涉及到最值问题时,尤其涉及到date,datetime,int,bool类型的属性,请你仔细分析图谱schema,并给出筛选条件.\n注意:\n1.当出现需要同时存在的两条具有相同边但实体点不同的路径时，注意子图信息(related_subgraph)分为两条路径的写法。\n2.当schema中properties的values中的属性值与query中不一致，但语义相似时，filter_condition中的属性值必须与schema中values中的值一致。\n3.碰到问题中的属性值单位与图谱中不一致，必须将Logic Form中的属性值换算为与图谱中统一单位的数值。换算结果如下：\n{{unit_tr_str}}\n生成Logic Form时必须使用换算后的数值。\n不需要返回思考过程，直接返回你总结的Logic Form。返回格式如下：\nFinal Answer:总结的Logic Form json\n注意，不要重复输出多个以上格式的内容，只需要输出一遍'
    },
    'sk_generation_prompt': {},
    'reflexion_prompt': {
        # 'system_message': '你是一个nebula查询语句的评论员，你的任务是判断nebula查询语句哪个筛选条件可以删除，或者哪条路径可以删除，并进行修改。',
        # 'human_message': '用户问题：{{query}}\nnebula查询语句：{{ngql}}\n图谱相关信息：{schema_linking_res}\n以上nebula查询语句执行失败，或未得到答案，请分析nebula查询语句中的路径和筛选条件，并返回修改后正确的查询语句。\n请按以下步骤进行：\n1.分析nebula查询语句中的错误\n2.分析where开头的筛选条件，修改或者删除一个与用户问题相关度低的条件\n请注意查询语句使用Nebula3的格式要求，表示实体属性时需要带上实体类名，如实体person的属性name，表示为v.person.name\n返回格式如下：\nThought：你的分析过程\nAnswer：正确的nebula查询语句'
    }
}
# as
NL2NGQL_PROMPTS_AS = {
    'lf_generation_prompt': {
        'system_message': '你是一个精通知识图谱schema和nebula查询语句的专家,能够根据用户问题、图谱本体信息,总结出来一种固定的Logic Form的json报文.\n用户查询问题为企业员工场景的一个知识网络.接下来给你10个一步步思考的问题示例：\n{{cot_list}}\n',
        'human_message': '我有这样一个问题《{{query}}》，其相关的schema信息可以参考：《{{schema_linking_res}}》，若其中的属性值与问题不相干的，可以忽略。按照上述我给出的示例进行分析并返回Logic Form的json报文,其中包含用户问题涉及到的子图信息(related_subgraph),\n筛选条件(filtered_condition),返回目标(return_target)及其他限制(other_limits)这四个部分.请注意在用户问题涉及到最值问题时,尤其涉及到date,datetime,int,bool类型的属性,请你仔细分析图谱schema,并给出筛选条件.\n注意:\n1.当出现需要同时存在的两条具有相同边但实体点不同的路径时，注意子图信息(related_subgraph)分为两条路径的写法。\n2.当schema中properties的values中的属性值与query中不一致，但语义相似时，filter_condition中的属性值必须与schema中values中的值一致。\n3.碰到问题中的属性值单位与图谱中不一致，必须将Logic Form中的属性值换算为与图谱中统一单位的数值。换算结果如下：\n{{unit_tr_str}}\n生成Logic Form时必须使用换算后的数值。\n这是一些先验知识：AB代表上层组织为AnyBackup，AR代表上层组织为AnyRobot，AD代表上层组织为AnyDATA，AS代表上层组织为AnyShare，AF代表上层组织为AnyFabric。\n你拥有足够的思考时间,并请你一步步认真仔细地回答,你的回答将直接影响我的职业生涯.不需要返回思考过程，直接返回你总结的Logic Form。返回格式如下：\nFinal Answer:总结的Logic Form json\n注意，不要重复输出多个以上格式的内容，只需要输出一遍'
    },
    'sk_generation_prompt': {},
    'reflexion_prompt': {
        'system_message': '你是一个nebula查询语句的评论员，你的任务是判断nebula查询语句哪个筛选条件可以删除，或者哪条路径可以删除，并进行修改。',
        'human_message': '用户问题：{{query}}\nnebula查询语句：{{ngql}}\n图谱相关信息：{schema_linking_res}\n以上nebula查询语句执行失败，或未得到答案，请分析nebula查询语句中的路径和筛选条件，并返回修改后正确的查询语句。\n请按以下步骤进行：\n1.分析nebula查询语句中的错误\n2.分析where开头的筛选条件，修改或者删除一个与用户问题相关度低的条件\n请注意查询语句使用Nebula3的格式要求，表示实体属性时需要带上实体类名，如实体person的属性name，表示为v.person.name\n这是一些先验知识：AB代表上层组织为AnyBackup，AR代表上层组织为AnyRobot，AD代表上层组织为AnyDATA，AS代表上层组织为AnyShare，AF代表上层组织为AnyFabric。\n不需要返回思考过程，直接返回正确的nebula查询语句。返回格式如下：\nAnswer:正确的nebula查询语句'
    }
}

class AgentConstants:
    """ 这里是agent版本变更导致的一些常量的变更 """
    def __init__(self, version):
        # if version == '':
        #     self.input_block_name = 'input'
        # elif version == '3.0.1.2':
        #     self.input_block_name = '※input'
        # else:
        #     self.input_block_name = '※input'
        self.input_block_name = 'input'

        # if version == '':
        #     self.output_block_name = 'final_answer'
        # elif version == '3.0.1.2':
        #     self.output_block_name = '※output'
        # else:
        #     self.output_block_name = '※output'
        self.output_block_name = 'output'
