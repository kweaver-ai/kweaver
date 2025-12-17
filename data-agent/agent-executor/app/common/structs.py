# -*- coding:utf-8 -*-
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, validator

from app.utils.snow_id import snow_id
from app.domain.vo.agentvo.agent_config_vos import (
    SkillVo,
    AgentSkillVo,
    AgentInputVo,
    DataSourceConfigVo,
    LlmConfigVo,
)
from app.domain.vo.agentvo.agent_config_vos.agent_skill_vo import (
    DataSourceTypeEnum,
    LlmConfigTypeEnum,
)


@dataclass
class LogicBlock:
    id: str = None
    name: str = None
    type: str = None  # retriever_block llm_block
    output: str = None
    llm_config: dict = None


@dataclass
class AugmentBlock:
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
    augment_data_source: dict = field(
        default_factory=dict
    )  # Young:query增强的concept数据

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

    security_token: set = field(
        default_factory=set
    )  # Feature-736016 百胜召回支持外置后过滤功能
    """ 召回后会返回security_token，在后续调用大模型时将security_token作为header传给模型工厂 """


class AgentConfig(BaseModel):
    """Agent配置模型"""

    # agent-factory & 前端页面 传入
    input: Optional[Dict[str, Any]] = None
    llms: Optional[List[Dict[str, Any]]] = None

    skills: Optional[SkillVo] = None

    data_source: Optional[Dict[str, Any]] = {}

    system_prompt: Optional[str] = None
    is_dolphin_mode: bool = False
    dolphin: Optional[str] = None

    pre_dolphin: Optional[List[Dict[str, Any]]] = []
    post_dolphin: Optional[List[Dict[str, Any]]] = []

    output: Optional[Dict[str, Any]] = {}
    memory: Optional[Dict[str, Any]] = {}
    related_question: Optional[Dict[str, Any]] = {}

    # plan_mode 任务规划模式
    plan_mode: Optional[Dict[str, bool]] = None

    # agent-app 传入
    agent_id: Optional[str] = None
    conversation_id: Optional[str] = None
    session_id: Optional[str] = None

    # agent-executor 由_options参数传入，在调用agent工具时使用
    output_vars: Optional[List[str]] = None
    incremental_output: bool = False

    @validator("skills", pre=True, always=True)
    def validate_skills(cls, v):
        """验证skills字段，如果传入null则转换为SkillVo对象"""
        if v is None:
            return SkillVo()

        # 如果已经是SkillVo对象，直接返回
        if isinstance(v, SkillVo):
            return v

        # 如果是字典，转换为SkillVo对象
        if isinstance(v, dict):
            return SkillVo(**v)

        return SkillVo()

    @validator("conversation_id", pre=True, always=True)
    def set_conversation_id(cls, v):
        """如果conversation_id为空，则自动生成"""
        if not v:
            return str(snow_id())

        return v

    @validator("pre_dolphin", "post_dolphin", pre=True, always=True)
    def handle_none(cls, v):
        """处理None, 将 None 转换为 []"""
        return [] if v is None else v

    def is_plan_mode(self) -> bool:
        return self.plan_mode and self.plan_mode.get("is_enabled", False)

    def append_task_plan_agent(self):
        if self.is_plan_mode():
            # 确保skills不为None
            if self.skills is None:
                self.skills = SkillVo()

            # 创建Task_Plan_Agent配置
            task_plan_agent = AgentSkillVo(
                agent_key="Task_Plan_Agent",
                agent_version="latest",
                agent_input=[
                    AgentInputVo(
                        input_name="query",
                        input_type="string",
                        map_type="auto",
                        enable=True,
                        input_desc="用户输入的问题",
                    )
                ],
                intervention=False,
                data_source_config=DataSourceConfigVo(
                    type=DataSourceTypeEnum.SELF_CONFIGURED
                ),
                llm_config=LlmConfigVo(type=LlmConfigTypeEnum.SELF_CONFIGURED),
            )

            self.skills.agents.append(task_plan_agent)


class AgentOptions(BaseModel):
    """Agent运行选项模型(由agent-executor定义)"""

    output_vars: Optional[List[str]] = None
    incremental_output: Optional[bool] = None
    data_source: Optional[Dict[str, Any]] = None
    llm_config: Optional[Dict[str, Any]] = None
    tmp_files: Optional[List] = None


class AgentInput(BaseModel):
    """Agent输入模型"""

    query: str
    history: Optional[List[Dict[str, str]]] = None
    tool: Optional[Dict[str, Any]] = Field(default_factory=dict)
    header: Optional[Dict[str, Any]] = Field(default_factory=dict)
    self_config: Optional[Dict[str, Any]] = Field(default_factory=dict)

    class Config:
        """Pydantic配置"""

        extra = "allow"  # 允许额外的字段
        populate_by_name = True  # 允许使用别名初始化模型
        populate_by_alias = True  # 允许使用别名初始化模型

    def get_value(self, key: str, default: Any = None) -> Any:
        """灵活获取字段值，无论字段是否在模型定义中"""
        # 先检查是否为定义的属性
        if hasattr(self, key):
            return getattr(self, key)

        # 再检查额外字段
        data = self.model_dump()
        return data.get(key, default)

    def set_value(self, key: str, value: Any) -> None:
        """设置字段值，无论字段是否在模型定义中"""
        # 对于Pydantic模型，直接使用setattr设置属性
        # 对于定义的字段，会应用验证逻辑
        # 对于额外字段，会存储在模型的内部数据结构中
        setattr(self, key, value)

    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        if not self.tool:
            data.pop("tool")
        return data


DEFAULT_INPUTS = ["history", "tool", "header", "self_config"]

if __name__ == "__main__":
    inputs = {"query": "爱数是一家怎样的公司？", "json_input": "{}"}
    agent_input = AgentInput(**inputs)
    dump = agent_input.model_dump()
    print(dump)

# jctd
NL2NGQL_PROMPTS = {
    "lf_generation_prompt": {
        "system_message": "你是一个精通知识图谱schema和nebula查询语句的专家,能够根据用户问题、图谱本体信息,总结出来一种固定的Logic Form的json报文.\n用户查询问题为企业员工场景的一个知识网络.接下来给你10个一步步思考的问题示例：\n{{cot_list}}\n",
        "human_message": "我有这样一个问题《{{query}}》，其相关的schema信息可以参考：《{{schema_linking_res}}》，若其中的属性值与问题不相干的，可以忽略。按照上述我给出的示例进行分析并返回Logic Form的json报文,其中包含用户问题涉及到的子图信息(related_subgraph),\n筛选条件(filtered_condition),返回目标(return_target)及其他限制(other_limits)这四个部分.请注意在用户问题涉及到最值问题时,尤其涉及到date,datetime,int,bool类型的属性,请你仔细分析图谱schema,并给出筛选条件.\n注意:\n1.当出现需要同时存在的两条具有相同边但实体点不同的路径时，注意子图信息(related_subgraph)分为两条路径的写法。\n2.当schema中properties的values中的属性值与query中不一致，但语义相似时，filter_condition中的属性值必须与schema中values中的值一致。\n3.碰到问题中的属性值单位与图谱中不一致，必须将Logic Form中的属性值换算为与图谱中统一单位的数值。换算结果如下：\n{{unit_tr_str}}\n生成Logic Form时必须使用换算后的数值。\n不需要返回思考过程，直接返回你总结的Logic Form。返回格式如下：\nFinal Answer:总结的Logic Form json\n注意，不要重复输出多个以上格式的内容，只需要输出一遍",
    },
    "sk_generation_prompt": {},
    "reflexion_prompt": {
        # 'system_message': '你是一个nebula查询语句的评论员，你的任务是判断nebula查询语句哪个筛选条件可以删除，或者哪条路径可以删除，并进行修改。',
        # 'human_message': '用户问题：{{query}}\nnebula查询语句：{{ngql}}\n图谱相关信息：{schema_linking_res}\n以上nebula查询语句执行失败，或未得到答案，请分析nebula查询语句中的路径和筛选条件，并返回修改后正确的查询语句。\n请按以下步骤进行：\n1.分析nebula查询语句中的错误\n2.分析where开头的筛选条件，修改或者删除一个与用户问题相关度低的条件\n请注意查询语句使用Nebula3的格式要求，表示实体属性时需要带上实体类名，如实体person的属性name，表示为v.person.name\n返回格式如下：\nThought：你的分析过程\nAnswer：正确的nebula查询语句'
    },
}
# as
NL2NGQL_PROMPTS_AS = {
    "lf_generation_prompt": {
        "system_message": "你是一个精通知识图谱schema和nebula查询语句的专家,能够根据用户问题、图谱本体信息,总结出来一种固定的Logic Form的json报文.\n用户查询问题为企业员工场景的一个知识网络.接下来给你10个一步步思考的问题示例：\n{{cot_list}}\n",
        "human_message": "我有这样一个问题《{{query}}》，其相关的schema信息可以参考：《{{schema_linking_res}}》，若其中的属性值与问题不相干的，可以忽略。按照上述我给出的示例进行分析并返回Logic Form的json报文,其中包含用户问题涉及到的子图信息(related_subgraph),\n筛选条件(filtered_condition),返回目标(return_target)及其他限制(other_limits)这四个部分.请注意在用户问题涉及到最值问题时,尤其涉及到date,datetime,int,bool类型的属性,请你仔细分析图谱schema,并给出筛选条件.\n注意:\n1.当出现需要同时存在的两条具有相同边但实体点不同的路径时，注意子图信息(related_subgraph)分为两条路径的写法。\n2.当schema中properties的values中的属性值与query中不一致，但语义相似时，filter_condition中的属性值必须与schema中values中的值一致。\n3.碰到问题中的属性值单位与图谱中不一致，必须将Logic Form中的属性值换算为与图谱中统一单位的数值。换算结果如下：\n{{unit_tr_str}}\n生成Logic Form时必须使用换算后的数值。\n这是一些先验知识：AB代表上层组织为AnyBackup，AR代表上层组织为AnyRobot，AD代表上层组织为AnyDATA，AS代表上层组织为AnyShare，AF代表上层组织为AnyFabric。\n你拥有足够的思考时间,并请你一步步认真仔细地回答,你的回答将直接影响我的职业生涯.不需要返回思考过程，直接返回你总结的Logic Form。返回格式如下：\nFinal Answer:总结的Logic Form json\n注意，不要重复输出多个以上格式的内容，只需要输出一遍",
    },
    "sk_generation_prompt": {},
    "reflexion_prompt": {
        "system_message": "你是一个nebula查询语句的评论员，你的任务是判断nebula查询语句哪个筛选条件可以删除，或者哪条路径可以删除，并进行修改。",
        "human_message": "用户问题：{{query}}\nnebula查询语句：{{ngql}}\n图谱相关信息：{schema_linking_res}\n以上nebula查询语句执行失败，或未得到答案，请分析nebula查询语句中的路径和筛选条件，并返回修改后正确的查询语句。\n请按以下步骤进行：\n1.分析nebula查询语句中的错误\n2.分析where开头的筛选条件，修改或者删除一个与用户问题相关度低的条件\n请注意查询语句使用Nebula3的格式要求，表示实体属性时需要带上实体类名，如实体person的属性name，表示为v.person.name\n这是一些先验知识：AB代表上层组织为AnyBackup，AR代表上层组织为AnyRobot，AD代表上层组织为AnyDATA，AS代表上层组织为AnyShare，AF代表上层组织为AnyFabric。\n不需要返回思考过程，直接返回正确的nebula查询语句。返回格式如下：\nAnswer:正确的nebula查询语句",
    },
}
