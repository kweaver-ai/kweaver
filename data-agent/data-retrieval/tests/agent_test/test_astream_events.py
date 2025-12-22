import sys
import time
from textwrap import dedent
sys.path.append("/mnt/pan/zkn/code_sdk/agent_678138/af-agent/src/")
from data_retrieval.tools.base_tools.json2plot import Json2Plot
from langchain_community.chat_models import ChatOpenAI
from pydantic import BaseModel, Field
from data_retrieval.agents import ReactAgent
from data_retrieval.datasource import AFIndicator
from data_retrieval.datasource.vega_datasource import VegaDataSource
from data_retrieval.sessions import GetSessionId
from data_retrieval.sessions.redis_session import RedisHistorySession
from data_retrieval.tools.base_tools.text2metric import Text2MetricTool
from data_retrieval.tools.base_tools.text2sql import Text2SQLTool
from data_retrieval.tools.toolkits import InstructionBookInsideToolkit
from data_retrieval.api.auth import get_authorization
from data_retrieval.tools import ToolName
from data_retrieval.tools.base_tools.knowledge_enhanced import KnowledgeEnhancedTool



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


    json2plot = Json2Plot(
        session_id=parameter.get("session_id"),
        chat=chat,
        session=base_session
    )
    # knowledge_enhanced = KnowledgeEnhancedTool(
    #     kg_id="1668",
    #     synonym_id="157",
    #     word_id="158"
    # )
    from datetime import datetime

    # 获取当前时间
    now = datetime.now()

    formatted_now = now.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]  # 移除毫秒后的多余0
    tools = []
    # tools.append(knowledge_enhanced)
    if "1" in parameter.get("tool_list"):
        af_datasource = VegaDataSource(
            view_list=parameter.get("view_list"),
            token=parameter.get("token"),
            user_id=parameter.get("user_id")
        )
        text2sql = Text2SQLTool(
            data_source=af_datasource,
            llm=chat,
            session_id=parameter.get("session_id"),
            session=base_session,
            handle_tool_error=True,
            retry_times=1,
            background=dedent(
                f"""
            当前时间是 {formatted_now}。
            此外你需要注意以下的时间处理规则：
            1. 问题中未提及年份的时候，默认为当前年；
            2. 订单销售场景中：
                计算【销量】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 昨天
                计算【达成率】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 当前月的最后一天
            3. 目前 默认为：今年1月1日 ~ 昨天

            """
            ),
        )
        tools.append(text2sql)
    if "2" in parameter.get("tool_list"):
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
            background=dedent(
                f"""
            当前时间是 {formatted_now}。
            此外你需要注意以下的时间处理规则：
            1. 问题中未提及年份的时候，默认为当前年；
            2. 订单销售场景中：
                计算【销量】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 昨天
                计算【达成率】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 当前月的最后一天
            3. 目前 默认为：今年1月1日 ~ 昨天

            """
            )
        )
        tools.append(text2metric)
    tools.append(json2plot)

    toolkit = InstructionBookInsideToolkit()
    toolkit.set_toolkit_instruction(
        dedent(
            f"""    - 用户的问题可能不会如同表象那么简单，**必须使用** {ToolName.from_knowledge_enhanced.value} 工具去进一步理解用户问题，同时将其**完整结果**作为知识增强信息告诉接下来你使用的工具；
    - 注意：所有的工具都不是万能的，不一定能一次性返回需要的所有数据，所以在没有拿到足够数据的时候，你可以多次调用工具，以获取不同需求的数据"""
        )
    )
    toolkit.set_tools(tools)

    return toolkit


class Parameter(BaseModel):
    query: str = Field(..., description="用户提出的问题")
    token: str = Field(..., description="用户token")
    user_id: str = Field(..., description="用户 user id")
    session_id: str = Field(..., description="对话管理id")
    view_list: list = Field(default=[], description="用户text2sql的视图列表")
    indicator_list: list = Field(default=[], description="用户text2metric的指标列表")
    background: str = Field(default="", description="背景信息")
    task_description: str = Field(default="", description="任务描述")
    tool_list: list = Field(...,description="工具列表：1：text2sql，2：text2metric")
    work_mode: str = Field(default="1", description="问答工作模式：1：react，2：tool use")


def get_parameter():
    parameter = {
        "session_id": str(time.time()),
        "view_list": ["be45a345-d9a4-4505-bbaa-e65fa36bfe78"],
        "indicator_list": ["535772491461722839"],
        "token": get_authorization("https://10.4.109.201", "liberly", "111111"),
        "user_id": "e3e51a0a-0f30-11ef-a09c-62fb8b52b81d", 
        "query": "",
        "background": "--",
        "task_description": "xxx",
        "tool_list": ["2"],
        "work_mode": "1",
    }
    if not parameter["session_id"]:
        session_id = GetSessionId.from_user_id(parameter["user_id"])
        parameter["session_id"] = session_id
        print("session_id", session_id)
    return parameter


def get_llm():
    llm = ChatOpenAI(
        model_name="Qwen-72B-Chat",
        openai_api_key="EMPTY",
        openai_api_base="http://192.168.173.19:8304/v1",
        max_tokens=5000,
        temperature=0.01,
    )
    return llm


test_query = {

    6: "立网近3个月大立白事业部和好爸爸事业部销量目标达成率多少",
    7: "基于工时日期（按季度）和部门名称显示近三年的项目个数。",

    10: "2023年自营品牌的销量是多少？",
    11: "上一年二季度成都直营办的销量？",
    12: "去年6月立白品牌、好爸爸品牌和立白卫仕品牌销量目标多少",
    13: "去年好爸爸品牌的销售量变化趋势",
    20: "23年3月份，立白品牌环比销量增长多少?",
    21: "2023年第一季度洗衣液的销售量是多少",
    22: "3月小白白品牌的销量,其中小白白品牌是一个字段值",
    23: "bo3系列为APG薄荷精去年的目标是多少",
    24: "本月的收入是多少",
    25: "今年的收入是多少"

}

if __name__ == "__main__":
    async def main():
        parameter = get_parameter()

        index = 23

        parameter["query"] = test_query[index]
        parameter[""]

        llm = get_llm()
        toolkit = get_toolkit(parameter, llm)
        executor = ReactAgent(
            llm=llm,
            toolkits=toolkit,
            session=base_session,
        )

 
        res = executor.astream_events(
            test_query[index],
            session_id=parameter["session_id"]
        )
        async for event in res:
            print("## #########" * 9)
            print(event)

        print("====================")
        print(res)

    import asyncio

    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
