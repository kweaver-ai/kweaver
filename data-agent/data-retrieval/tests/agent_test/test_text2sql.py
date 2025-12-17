# from af_agent.agent_v2 import AFAgent
import uuid
from textwrap import dedent

from langchain_community.chat_models import ChatOpenAI

from af_agent.agents import ToolUseAgent
from af_agent.datasource.vega_datasource import VegaDataSource
from af_agent.sessions.redis_session import RedisHistorySession
from af_agent.tools.base_tools.text2sql import Text2SQLTool


def get_chat_history(
    session_id,
    session: RedisHistorySession = RedisHistorySession()
):
    history = session.get_chat_history(
        session_id=session_id
    )
    return history


def get_time():
    from datetime import datetime

    # 获取当前时间
    now = datetime.now()

    # 获取具体时间
    current_time = now.strftime("%Y-%m-%d %H:%M:%S")

    # 获取星期几的中文表示
    weekdays = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]
    weekday_index = now.weekday()  # Monday is 0, Sunday is 6
    weekday = weekdays[weekday_index]

    return f"当前时间: {current_time}, 星期: {weekday}"


from af_agent.api.auth import get_authorization

def test_234():
    tool_model = ChatOpenAI(
        model_name="Qwen-72B-Chat",
        openai_api_key="EMPTY",
        openai_api_base="http://192.168.173.19:8304/v1",
        max_tokens=10000,
        temperature=0.01,
    )

    # tool_model = ChatOpenAI(
    #     model_name='loom-7B',
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://192.168.173.19:8789/v1",
    #     max_tokens=2000,
    #     temperature=0.01,
    # )

    gen_model = tool_model

    token = get_authorization("https://10.4.109.234", "liberly", "111111")
    # token = get_authorization("https://10.4.110.170", "af", "111111")
    datasource = VegaDataSource(
        view_list=[
            # "330755ad-6126-415e-adb5-79adb12a0455",
            # "ee4aaa09-498c-4126-ae29-8a8590c2d1f0",
            "85189295-7a2d-4812-b676-3cbcaeb78676",  # 234 水果种类表
            "278cf5dd-c7af-4121-8e46-4be2cc7ab946",  # 234 水果库存销量统计表

            # "6e5dab64-e8f8-4ae0-9edf-35aa554dd5aa"  # 234 的 立白 数据视图
        ],
        token=token,
        # user_id="fa1ee91a-643d-11ef-8405-a214ef0d99c8"
        user_id="bc1e5d48-cfbf-11ee-ac16-f26894970da0"  # 234 用户
    )
    session_id = str(uuid.uuid4())

    # session_id = "11111111"
    text2sql_tool = Text2SQLTool(
        language="cn",
        data_source=datasource,
        llm=gen_model,
        background=dedent(
            f"""
                当前时间是 {get_time()}。
                此外你需要注意以下的时间处理规则：
                1. 问题中未提及年份的时候，默认为当前年；
                2. 订单销售场景中：
                    计算【销量】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 昨天
                    计算【达成率】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 上个月最后一天
                    同时计算 【销量】 和【达成率】时，你需要分别对【销量】和【达成率】的时间进行筛选 使用 UNION，以满足上述要求。
                3. 目前 默认为：今年1月1日 ~ 昨天
                """
        ),
        with_execution=True,
        get_desc_from_datasource=True,
        session_id=session_id,
        session=RedisHistorySession(),
        retry_times=3

    )

    agent = ToolUseAgent(
        tools=[text2sql_tool],
        llm=tool_model,
        personality="你有两个数据分析工具，分别是指标分析和数据库SQL查询，可以回答用户的数据分析类的问题，如果你无法回答，可以告诉用户，并引导他们回答这类问题",
        # background="如果用户问题无关电影，请提示用户",
        with_chatter=True
    )

    question = {
        3: "2023年自营牌的销量是多少",
        4: "成都直营办的销量",
        5: "去年6月立白品牌、好爸爸品牌和立白卫仕品牌销量目标多少。",
        6: "KA渠道销量多少",
        7: "金帅苹果在2024年的12个月的月销量是多少",

    }
    index = 7
    question = question[index]

    res = agent.invoke(
        {
            "input": question,
            "session_id": session_id

        }
    )
    print(res)

def test_142():
    tool_model = ChatOpenAI(
        model_name="Qwen-72B-Chat",
        openai_api_key="EMPTY",
        openai_api_base="http://192.168.173.19:8304/v1",
        max_tokens=10000,
        temperature=0.01,
    )

    # tool_model = ChatOpenAI(
    #     model_name='loom-7B',
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://192.168.173.19:8789/v1",
    #     max_tokens=2000,
    #     temperature=0.01,
    # )

    gen_model = tool_model

    token = get_authorization("https://10.4.109.142", "liberly", "111111")
    # token = get_authorization("https://10.4.110.170", "af", "111111")
    datasource = VegaDataSource(
        view_list=[
            # "330755ad-6126-415e-adb5-79adb12a0455",
            # "ee4aaa09-498c-4126-ae29-8a8590c2d1f0",
            "a008563a-71d1-459f-a7ca-f73200d5b065",  # 142 ICT项目台账

            # "6e5dab64-e8f8-4ae0-9edf-35aa554dd5aa"  # 234 的 立白 数据视图
        ],
        token=token,
        # user_id="fa1ee91a-643d-11ef-8405-a214ef0d99c8"
        user_id="1a5df062-e2e9-11ee-bc25-de01d9e8c5c1"  # 234 用户
    )
    session_id = str(uuid.uuid4())

    # session_id = "11111111"
    text2sql_tool = Text2SQLTool(
        language="cn",
        data_source=datasource,
        llm=gen_model,
        background=dedent(
            f"""
                当前时间是 {get_time()}。
                此外你需要注意以下的时间处理规则：
                1. 问题中未提及年份的时候，默认为当前年；
                2. 订单销售场景中：
                    计算【销量】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 昨天
                    计算【达成率】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 上个月最后一天
                    同时计算 【销量】 和【达成率】时，你需要分别对【销量】和【达成率】的时间进行筛选 使用 UNION，以满足上述要求。
                3. 目前 默认为：今年1月1日 ~ 昨天
                """
        ),
        with_execution=True,
        get_desc_from_datasource=True,
        session_id=session_id,
        session=RedisHistorySession(),
        retry_times=3

    )

    agent = ToolUseAgent(
        tools=[text2sql_tool],
        llm=tool_model,
        personality="你有两个数据分析工具，分别是指标分析和数据库SQL查询，可以回答用户的数据分析类的问题，如果你无法回答，可以告诉用户，并引导他们回答这类问题",
        # background="如果用户问题无关电影，请提示用户",
        with_chatter=True
    )

    question = {
        3: "2023年自营牌的销量是多少",
        4: "成都直营办的销量",
        5: "去年6月立白品牌、好爸爸品牌和立白卫仕品牌销量目标多少。",
        6: "KA渠道销量多少",
        7: "金帅苹果在2024年的12个月的月销量是多少",
        8: "运维结束时间在2024年的综合单价多少?"

    }
    index = 8
    question = question[index]

    res = agent.invoke(
        {
            "input": question,
            "session_id": session_id

        }
    )
    print(res)


def test_266():
    tool_model = ChatOpenAI(
        model_name="Tome-L",
        openai_api_key="EMPTY",
        openai_api_base="http://192.168.152.11:8303/v1",
        max_tokens=10000,
        temperature=0.01,
    )

    # tool_model = ChatOpenAI(
    #     model_name='loom-7B',
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://192.168.173.19:8789/v1",
    #     max_tokens=2000,
    #     temperature=0.01,
    # )

    gen_model = tool_model

    token = get_authorization("https://10.4.31.226", "Pure", "123qweASD")
    # token = get_authorization("https://10.4.110.170", "af", "111111")
    datasource = VegaDataSource(
        view_list=[
            # "330755ad-6126-415e-adb5-79adb12a0455",
            # "ee4aaa09-498c-4126-ae29-8a8590c2d1f0",
            "2a26474a-4cb9-478f-8e3b-1dab6f729154",  # 142 ICT项目台账

            # "6e5dab64-e8f8-4ae0-9edf-35aa554dd5aa"  # 234 的 立白 数据视图
        ],
        token=token,
        # user_id="fa1ee91a-643d-11ef-8405-a214ef0d99c8"
        user_id="0ac40eba-d151-11ee-b9ee-322e2d859dc5"  # 234 用户
    )
    session_id = str(uuid.uuid4())

    # session_id = "11111111"
    text2sql_tool = Text2SQLTool(
        language="cn",
        data_source=datasource,
        llm=gen_model,
        background=dedent(
            f"""
                当前时间是 {get_time()}。
                此外你需要注意以下的时间处理规则：
                1. 问题中未提及年份的时候，默认为当前年；
                2. 订单销售场景中：
                    计算【销量】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 昨天
                    计算【达成率】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 上个月最后一天
                    同时计算 【销量】 和【达成率】时，你需要分别对【销量】和【达成率】的时间进行筛选 使用 UNION，以满足上述要求。
                3. 目前 默认为：今年1月1日 ~ 昨天
                """
        ),
        with_execution=True,
        get_desc_from_datasource=True,
        session_id=session_id,
        session=RedisHistorySession(),
        retry_times=3

    )

    agent = ToolUseAgent(
        tools=[text2sql_tool],
        llm=tool_model,
        personality="你有两个数据分析工具，分别是指标分析和数据库SQL查询，可以回答用户的数据分析类的问题，如果你无法回答，可以告诉用户，并引导他们回答这类问题",
        # background="如果用户问题无关电影，请提示用户",
        with_chatter=True
    )

    question = {
        1: "领取方式有哪些",
        2: "车道数有哪些",

    }
    index = 2
    question = question[index]

    res = agent.invoke(
        {
            "input": question,
            "session_id": session_id

        }
    )
    print(res)

if __name__ == "__main__":
    test_266()
