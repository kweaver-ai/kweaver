import time
from textwrap import dedent
import sys
import os
import sys

# 获取当前文件的绝对路径
current_file_path = os.path.abspath(__file__)
grandparent_dir = os.path.abspath(os.path.join(current_file_path, '../../../src'))
# 将上上级目录添加到sys.path中
sys.path.append(grandparent_dir)
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from af_agent.agents.react_agent.react_agent import ReactAgent
from af_agent.datasource import AFIndicator
from af_agent.datasource.vega_datasource import VegaDataSource
from af_agent.sessions.base import GetSessionId
from af_agent.sessions.redis_session import RedisHistorySession
from af_agent.tools import ToolName
from af_agent.tools.base_tools.knowledge_enhanced import KnowledgeEnhancedTool
from af_agent.tools.base_tools.text2metric import Text2MetricTool
from af_agent.tools.base_tools.text2sql import Text2SQLTool
from af_agent.tools.toolkits.base import InstructionBookInsideToolkit
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
    # chat2plot = ChatToPlotTool(
    #     session_id=parameter.get("session_id"),
    #     chat=chat,
    #     session=base_session

    # )
    knowledge_enhanced = KnowledgeEnhancedTool(
        kg_id="1668",
        synonym_id="157",
        word_id="158"
    )
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

        from datetime import datetime

        # 获取当前时间
        now = datetime.now()

        formatted_now = now.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]  # 移除毫秒后的多余0
        text2sql = Text2SQLTool(
            data_source=af_datasource,
            llm=chat,
            # background=dedent(
            #     f"""
            # 当前时间是 {formatted_now}。
            # 此外你需要注意以下的时间处理规则：
            # 1. 问题中未提及年份的时候，默认为当前年；
            # 2. 订单销售场景中：
            #     计算【销量】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 昨天
            #     计算【达成率】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 当前月的最后一天
            # 3. 目前 默认为：今年1月1日 ~ 昨天
            #
            # """
            # ),
            background=dedent(
                f"""
                此外你需要注意以下业务处理规则：
                 1. 查询特定道路的货运量：先查询 【车辆GPS轨迹表】表该道路关联的电子运单号码，然后查询【货物表】中这些电子运单的货运量
                 2. 查询流入特定地点的货运量：查询【货物表】在该特定地点卸货，且从非该特定地点流出的货运量
                 3. 查询从特定地点流出的货运量：查询【货物表】在该特定地点装货，且流入到非该特定地点的货运量
                 4. 查询货运量：需要查询【货物表】的货物重量
                """
            ),
            session_id=parameter.get("session_id"),
            session=base_session
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
            # background=dedent(
            #     f"""
            #         当前时间是 {formatted_now}。
            #         此外你需要注意以下的时间处理规则：
            #         1. 问题中未提及年份的时候，默认为当前年；
            #         2. 订单销售场景中：
            #             计算【销量】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 昨天
            #             计算【达成率】时，问题里没有提及统计日期范围，此时时间默认为：今年1月1日 ~ 当前月的最后一天
            #         3. 目前 默认为：今年1月1日 ~ 昨天
            #
            #         """
            # ),
        )
        tools.append(text2metric)
        tools.append(chat2plot)

    tools.append(chat2plot)

    toolkit = InstructionBookInsideToolkit()
    # TODO 增加工具说明书
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
        max_tokens=10000,
        temperature=0.01,
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
    tool_list: list = Field(..., description="工具列表：1：text2sql，2：text2metric")
    work_mode: str = Field(default="1", description="问答工作模式：1：react，2：tool use")


def get_parameter():
    # parameter = {
    #     "session_id": str(time.time()),
    #     # "view_list": ["6e5dab64-e8f8-4ae0-9edf-35aa554dd5aa"],
    #     "view_list": ["6e5dab64-e8f8-4ae0-9edf-35aa554dd5aa"],
    #     "indicator_list": ["532179399886306706"],
    #     # "token": get_authorization("https://10.4.110.170", "af", "111111"),
    #     "token": get_authorization("https://10.4.109.234", "liberly", "111111"),
    #     # "user_id": "fa1ee91a-643d-11ef-8405-a214ef0d99c8",
    #     "user_id": "bc1e5d48-cfbf-11ee-ac16-f26894970da0",  # 234 用户
    #     "query": "基于工时日期（按季度）和部门名称显示近三年的项目个数。",
    #     "background": "--",
    #     "task_description": "xxx",
    #     "tool_list": ["1"],
    #     "work_mode": "1",
    # }
    parameter = {
        "session_id": str(time.time()),
        "view_list": ["f68c61a7-d7ec-4c05-9406-ab53e140dd01"],
        "indicator_list": [],
        "token": get_authorization("https://10.4.111.246", "xia", "111111"),
        "user_id": "a979abfa-d952-11ef-8ef0-faff6bb8d829",
        "query": "",
        "background": "--",
        "task_description": "xxx",
        "tool_list": ["1", "2"],
        "work_mode": "1",
    }
    if not parameter["session_id"]:
        session_id = GetSessionId.from_user_id(parameter["user_id"])
        parameter["session_id"] = session_id
        print("session_id", session_id)
    return parameter


test_query = {
    5: "时间约束为近三年，通过指标按人员类别分析项目数量",
    6: "立网近3年大立白事业部和好爸爸事业部销量目标达成率分别是多少",
    7: "2023和2024年所有水果的库存",
    8: "近365日，各个水果的库存数量",
    9: "电商去年9月liby护衣柔顺珠销量是多少",

    10: "2023年自营品牌的销量是多少？，折线图",
    11: "上一年1季度成都直营办的销量？",
    12: "去年3月立白品牌、好爸爸品牌和立白卫仕品牌销量目标之和",
    13: "立网大立白和好爸爸事业部销量目标达成率多少, 折线图",
    14: "23年KA渠道销量多少，达成率多少",
    15: "客户业务小白白品牌当月和累计达成分别是多少",
    16: "上一年一季度成都直营办的销量，折线图",
    17: "2023年小白白品牌各品类BO3销量分别是多少？",

    19: "去年3月小白白、好爸爸品牌销量之和",
    20: "23年3月份，立白品牌销量增长多少?",
}

if __name__ == "__main__":
    async def main(text):
        parameter = get_parameter()

        index = 20

        parameter["query"] = text

        llm = get_llm()
        toolkit = get_toolkit(parameter, llm)
        executor = ReactAgent(
            parameter=parameter,
            llm=llm,
            toolkits=toolkit
        )
        res = executor.invoke(
            parameter["query"],
            session_id=parameter["session_id"]
        )
        # res = await executor.ainvoke(
        #     test_query[index],
        #     session_id=parameter["session_id"]
        # )
        # await executor.astream_events()
        print(res)


    import asyncio

    while True:
        text = input('请输入文本：')
        loop = asyncio.get_event_loop()
        loop.run_until_complete(main(text=text))

# 要结合 text2sql 工具获取基本的统计分析数据，并使用 predictor 工具进行时间序列预测，你需要定义一个清晰的工作流程。
# 假设 text2sql 工具返回一些统计数据，比如最近几个月的销售数据，然后 predictor 工具利用这些数据来进行时间序列预测。
# prompt：
# {
#   "agent": "react-agent",
#   "task": "perform_time_series_prediction",
#   "steps": [
#     {
#       "action": "use_text2sql",
#       "prompt": "请从数据库中提取最近12个月的销售数据，包括月份和销售额，并将结果以表格形式返回。",
#       "input_format": "text",
#       "output_format": "table",
#       "params": {
#         "database": "sales_db",
#         "query_type": "sales_summary"
#       }
#     },
#     {
#       "action": "parse_table_to_time_series",
#       "prompt": "将上一步返回的表格数据解析为时间序列数据，格式为：月份, 销售额。",
#       "input_key": "previous_step_output",
#       "output_format": "list_of_tuples",
#       "script": "const parseTable = (table) => {\n  return table.map(row => [row[0], parseFloat(row[1])]);\n}"
#     },
#     {
#       "action": "use_predictor",
#       "prompt": "使用上一步生成的时间序列数据进行未来3个月的销售额预测。",
#       "input_key": "parsed_time_series",
#       "output_format": "prediction",
#       "params": {
#         "model": "sales_forecast_model",
#         "forecast_length": 3
#       }
#     },
#     {
#       "action": "format_result",
#       "prompt": "将预测结果格式化为友好的文本信息。",
#       "input_key": "prediction_result",
#       "output_format": "text",
#       "script": "const formatResult = (prediction) => {\n  return `根据历史数据，未来3个月的销售额预测为：${prediction.map(p => p.toFixed(2)).join(', ')}元。`;\n}"
#     },
#     {
#       "action": "display_result",
#       "prompt": "显示最终的预测结果。",
#       "input_key": "formatted_result",
#       "output_format": "text",
#       "params": {
#         "display_type": "modal"
#       }
#     }
#   ]
# }