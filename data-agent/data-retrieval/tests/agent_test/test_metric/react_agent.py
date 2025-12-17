import time
from textwrap import dedent
from uuid import uuid4
import os

from langchain_community.chat_models import ChatOpenAI
from pydantic import BaseModel, Field

from af_agent.agents import ReactAgent
from af_agent.datasource import AFIndicator
from af_agent.datasource.vega_datasource import VegaDataSource
from af_agent.sessions import GetSessionId
from af_agent.sessions.redis_session import RedisHistorySession
from af_agent.tools import ToolName
from af_agent.tools.base_tools.json2plot import Json2Plot
from af_agent.tools.base_tools.knowledge_enhanced import KnowledgeEnhancedTool
from af_agent.tools.base_tools.text2metric import Text2MetricTool, RetrieverConfig
from af_agent.tools.base_tools.text2sql import Text2SQLTool
from af_agent.tools.toolkits import InstructionBookInsideToolkit
from af_agent.api.auth import get_authorization

base_session = RedisHistorySession()


def get_chat_history(
    session_id,
    session: RedisHistorySession = base_session
):
    history = session.get_chat_history(
        session_id=session_id
    )
    return history


def get_toolkit(
    parameter,
    chat,
    **kwargs
):
    chat_history = get_chat_history(parameter.get("session_id"))

    # sailor_tool = AfSailorTool(parameter=parameter, **kwargs)
    # human_tool = AfHumanInputTool(parameter=parameter, **kwargs)
    json2plot = Json2Plot(
        session_id=parameter.get("session_id"),
        chat=chat,
        session=base_session
    )
    knowledge_enhanced = KnowledgeEnhancedTool(
        kg_id="1668",
        synonym_id="170",
        word_id="169"
    )

    tools = []
    tools.append(knowledge_enhanced)
    
    af_indicator = AFIndicator(
        indicator_list=parameter.get("indicator_list"),
        token=parameter.get("token"),
    )
    text2metric = Text2MetricTool.from_indicator(
        indicator=af_indicator,
        llm=chat,
        with_execution=True,
        retry_times=2,
        session_id=parameter.get("session_id"),
        session=base_session,
        background=parameter.get("background"),
        retriever_config=RetrieverConfig(
            top_k=2,
            # threshold=0.5
        )
    )
    
    tools.append(text2metric)
    tools.append(json2plot)

    toolkit = InstructionBookInsideToolkit()
    toolkit.set_toolkit_instruction(f"""
     严格执行以下步骤：
     步骤1: 必须使用{ToolName.from_knowledge_enhanced.value}，将用户的问题进行知识图谱搜索和同义词搜索，将搜索到的结果进行组合，形成一个新的问题，同时你需要将知识增强工具的结果作为额外信息告诉工具。
     步骤2: 根据步骤1的结果和前文为你提供的 数据信息 从 {ToolName.from_text2sql.value} 和 {ToolName.from_text2metric.value} 选择一个去获取 问题的结果。

    
    """)

    toolkit.set_tools(tools)

    return toolkit


def get_llm():
    llm = ChatOpenAI(
        model_name="Qwen-72B-Chat",
        openai_api_key="EMPTY",
        openai_api_base="http://192.168.173.19:8304/v1",
        max_tokens=4096,        # 减小 token 限制以提高响应速度
        temperature=0.2,        # 降低温度使输出更确定性
        request_timeout=60,     # 添加请求超时设置
        top_p=0.95,             # 添加 top_p 采样
        presence_penalty=0.1,   # 添加存在惩罚以减少重复
        frequency_penalty=0.1,  # 添加频率惩罚以增加多样性
    )
    return llm


class Parameter(BaseModel):
    query: str = Field(..., description="用户提出的问题")
    token: str = Field(..., description="用户token")
    user_id: str = Field(..., description="用户 user id")
    session_id: str = Field(..., description="对话管理id")
    view_list: list = Field(default=[], description="用户text2sql的视图列表")
    indicator_list: list = Field(default=[], description="用户text2metric的指标列表")
    background: str = Field(default="", description="背景信息")
    task_description: str = Field(default="", description="任务描述")
    # tool_list: list = Field(..., description="工具列表：1：text2sql，2：text2metric")
    # work_mode: str = Field(default="1", description="问答工作模式：1：react，2：tool use")


def get_parameter():
    parameter = {
        "session_id": str(uuid4()),

        # 234
        "AF_DEBUG_IP": "http://10.4.109.234",
        "view_list": ["8113d24a-9d56-4eb3-8da1-95bf339007d8"],
        "indicator_list": ["532179399886306706", "532180019821215122", "532179886694006162", "532179603914030482"],
        # "indicator_list": ["532179603914030482"],
        "token": get_authorization("https://10.4.109.234", "liberly", "111111"),
        "user_id": "bc1e5d48-cfbf-11ee-ac16-f26894970da0",  # 234 用户

        # 201
        # AF_DEBUG_IP: "http://10.4.109.201"
        # "indicator_list": ["536341918896915159", "536342027512611543", "536342444980077271", "536342689256342231"],
        # "token": get_authorization("http://10.4.109.201", "liberly", "111111"),
        # "user_id": "e3e51a0a-0f30-11ef-a09c-62fb8b52b81d",

        # "query": "基于工时日期（按季度）和部门名称显示近三年的项目个数。",
        "background": """
此外你需要注意以下的时间处理规则：
 1. 问题中未提及年份的时候，默认为当前年；
 2. 订单销售场景中：
        计算【销量】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 昨天
        计算【达成率】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 当前月的最后一天
 3. 目前 默认为：今年1月1日 ~ 昨天
 **注意：如果找不到指标，可以尝试找相近的指标来回答**
""",
        "background": "",
        "task_description": "xxx",
        # "tool_list": ["2"],
        "work_mode": "1",
    }

    if not parameter["session_id"]:
        session_id = GetSessionId.from_user_id(parameter["user_id"])
        parameter["session_id"] = session_id
        print("session_id", session_id)

    if parameter.get("AF_DEBUG_IP"):
        os.environ["AF_DEBUG_IP"] = parameter["AF_DEBUG_IP"]
    return parameter


test_query = {
    1: "立网去年大立白事业部和好爸爸事业部目标是多少",
    2: "去年1季度白鞋、白衣系列的销售额分别是多少",
    3: "留香珠今年的完成率",
    4: "1~3月的销售额",
    5: "时间约束为近三年，通过指标按人员类别分析项目数量",
    6: "立网近3年大立白事业部和好爸爸事业部销量目标达成率分别是多少",
    7: "这个月的销量是多少",
    8: "近365日，各个水果的库存数量",
    9: "近三年立白各片区销量",
    10: "除菌液上海的销量",
    11: "bo3系列为APG薄荷精去年的目标是多少",
    12: "今年除菌液上海的销量",
    # 201
    100: "按报告时间按季度分析今年鲁西化工收入",
    101: "今年鲁西化工哪个季度的收入小于 3426350080",
    102: "去年鲁西化工年报收入是多少",
    103: "去年收入是多少",
    104: "前年鲁西化工的每季度收入",
    105: "基于报告时间按季度分组查询鲁西化工今年的营收收入"
}

if __name__ == "__main__":
    async def main():
        parameter = get_parameter()

        index = 11
        parameter["query"] = test_query[index]

        llm = get_llm()
        toolkit = get_toolkit(parameter, llm)
        executor = ReactAgent(
            parameter=parameter,
            llm=llm,
            toolkits=toolkit
        )
 
        # res = await executor.ainvoke(
        #     test_query[index],
        #     session_id=parameter["session_id"]
        # )
        # print(res)

        res = executor.astream_events(
            test_query[index],
            session_id=parameter["session_id"]
        )
        async for event in res:
            print("## #########" * 9)
            print(event)

    import asyncio
    asyncio.run(main())
