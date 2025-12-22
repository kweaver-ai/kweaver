import uuid
import sys
# sys.path.append("/mnt/pan/zkn/code_sdk/agent_678138/af-agent/src")

from datetime import datetime
from textwrap import dedent
from data_retrieval.tools.base_tools.text2sql import Text2SQLTool
from data_retrieval.tools.base_tools.text2metric import Text2MetricTool
from data_retrieval.sessions.redis_session import RedisHistorySession
from data_retrieval.datasource import AFIndicator
from data_retrieval.agents.tool_use_agent import ToolUseAgent
from langchain_openai import ChatOpenAI
from data_retrieval.utils.llm import CustomChatOpenAI
from data_retrieval.utils.repl import astart_repl

# from data_retrieval.agent_v2 import AFAgent
# from data_retrieval.datasource.af_ds import AFDataSource

base_session = RedisHistorySession()

# 获取当前时间
now = datetime.now()

formatted_now = now.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]  # 移除毫秒后的多余0


def init_agent(session_id):
    tool_model = ChatOpenAI(
        model_name="Qwen-72B-Chat",
        openai_api_key="EMPTY",
        openai_api_base="http://192.168.173.19:8304/v1",
        max_tokens=2000,
        temperature=0.01,
    )
    # deepseek = ChatOpenAI(
    #     model_name="qwen32b-distill-r1",
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://10.4.119.108:8000/v1"
    # )
    deepseek = CustomChatOpenAI(
        model_name="deepseek_v3_vol",
        openai_api_key="OIZ6_KHCKIk-ASpNLg5",
        openai_api_base = "https://10.4.135.251:8444/api/model-factory/v1/",
        verify_ssl=False
    )

    # tool_model = deepseek

    from data_retrieval.api.auth import get_authorization
    from data_retrieval.datasource.vega_datasource import VegaDataSource

    # token = get_authorization("https://10.4.109.201", "liberly", "111111")
    # token = get_authorization("https://10.4.109.233", "liberly", "111111")
    token = get_authorization("https://10.4.111.246", "xia", "111111")


    # Text2SQL
    # datasource = AFDataSource(
    #     view_list=["a83ed47b-61e9-47b2-813f-0f33b1054158", "63ca0026-fe84-4100-92e0-d24529d7fb77", "c6a892e6-2101-4929-9ea4-b5280e47ce73"],
    #     token=token,
    #     user_id="e985fa88-1d0e-11ef-80f4-627fe4c83a4e"
    # )
    
    datasource = VegaDataSource(
        view_list=["f68c61a7-d7ec-4c05-9406-ab53e140dd01"],
        token=token,
        user_id="a979abfa-d952-11ef-8ef0-faff6bb8d829"
    )

    text2sql_tool = Text2SQLTool(
        data_source=datasource,
        llm=tool_model,
        session_id=session_id,
        session=base_session,
        handle_tool_error=True,
        retry_times=1,
        with_context=True,
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
        # background=dedent(
        #     f"""
        # 当前时间是 {formatted_now}。
        # 此外你需要注意以下的时间处理规则：
        # 1. 问题中未提及年份的时候，默认为当前年；
        # 2. 订单销售场景中：
        #     计算【销量】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 昨天
        #     计算【达成率】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 当前月的最后一天
        # 3. 目前 默认为：今年1月1日 ~ 昨天
        # """
        # ),
    )

    # Text2Metric
    # indicator = AFIndicator(
    #     indicator_list=["529821310889503670"],
    #     token=token
    # )
    indicator = AFIndicator(
        indicator_list=["550553203188496077", "550553625571686093"],
        token=token
    )

    test2indicator_tool = Text2MetricTool.from_indicator(
        indicator=indicator,
        llm=tool_model,
        with_execution=True,
        retry_times=2,
        session_id=session_id,
        session=base_session,
        with_context=True,
        # background=dedent(
        #     f"""
        # 当前时间是 {formatted_now}。
        # 此外你需要注意以下的时间处理规则：
        # 1. 问题中未提及年份的时候，默认为当前年；
        # 2. 订单销售场景中：
        #     计算【销量】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 昨天
        #     计算【达成率】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 当前月的最后一天
        # 3. 目前 默认为：今年1月1日 ~ 昨天
        # """
        # )
    )

    agent = ToolUseAgent(
        tools=[test2indicator_tool, text2sql_tool],
        # tools=[text2sql_tool],
        # tools=[test2indicator_tool],
        llm=tool_model,
        # personality="你有两个数据分析工具，分别是指标分析和数据库SQL查询，可以回答用户的数据分析类的问题，如果你无法回答，可以告诉用户，并引导他们回答这类问题",
        # personality="你有两个数据分析工具，请分别使用两个工具进行指标分析和数据库SQL查询，并对两个工具返回的答案进行分析",
        personality="",
        with_chatter=True,
        session=base_session,
        kg_id="2623",
        synonym_id="11",
        word_id="10"
    )

    return agent


async def amain(session_id, question):
    # session_id = str(uuid.uuid4())
    agent = init_agent(session_id)
    res = await agent.ainvoke({
        "input": question,
        "session_id": session_id,
    })
    print(res)


async def aevent_main(session_id, question):
    agent = init_agent(session_id)
    
    res = agent.astream_events(
        question,
        session_id,
    )
    async for event in res:
        pass




def main(session_id, question):
    agent = init_agent(session_id)

    res = agent.invoke(
        question,
        session_id,
    )
    print(res)
    # print(json.dumps(res_r3, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    import asyncio
    import uuid
    session_id = str(uuid.uuid4())
    # session_id = "--test--agent---"
    # query = '上海装货的运量是多少'
    # query = '小白白去年销量是多少，用立白销量指标回答'
    # query = 'hello'
    # query = '好'
    # asyncio.run(aevent_main(session_id, query))

    def agent_getter():
        return init_agent(session_id)

    asyncio.run(astart_repl(session_id=session_id, agent_getter=agent_getter))
