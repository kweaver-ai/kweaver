"""
@File: test_danger_goods_transport_toolkits.py
@Date: 2024-09-12
@Author: Danny.gao
@Desc:
"""

import time
from textwrap import dedent
import sys
import os

# 获取当前文件的绝对路径
current_file_path = os.path.abspath(__file__)
grandparent_dir = os.path.abspath(os.path.join(current_file_path, '../../../src'))
# 将上上级目录添加到sys.path中
sys.path.append(grandparent_dir)
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
import uuid

from af_agent.agents.react_agent.react_agent import ReactAgent
from af_agent.datasource import AFIndicator
from af_agent.datasource.vega_datasource import VegaDataSource
from af_agent.sessions.base import GetSessionId
from af_agent.sessions.redis_session import RedisHistorySession
from af_agent.tools import ToolName
from af_agent.tools.base_tools.context2question import Context2QuestionTool
from af_agent.tools.base_tools.knowledge_enhanced import KnowledgeEnhancedTool
from af_agent.tools.base_tools.text2metric import Text2MetricTool
from af_agent.tools.base_tools.text2sql import Text2SQLTool
from af_agent.tools.toolkits.danger_goods_transport.arima import ArimaTool
from af_agent.tools.toolkits.danger_goods_transport.detection import DetectionTool
from af_agent.tools.toolkits.danger_goods_transport.decision import DecisionTool
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


def get_llm():
    llm = ChatOpenAI(
        model_name="Qwen-72B-Chat",
        openai_api_key="EMPTY",
        openai_api_base="http://192.168.173.19:8304/v1",
        max_tokens=4096,  # 减小 token 限制以提高响应速度
        temperature=0.01,
    )
    #
    # ## 云路：客户环境
    # llm = ChatOpenAI(
    #     #model_name="AIshuReader",
    #     model_name="Tome-max",
    #     openai_api_key="EMPTY",
    #     #openai_api_base="http://172.31.8.93:8501/v1",
    #     openai_api_base="http://172.31.8.93:18001/v1",
    #     # max_token_length=2000,
    #     temperature=0.01,
    # )

    return llm


def get_context2question_tool(parameter, chat, with_execution=True):
    context2question_tool = Context2QuestionTool(
        llm=chat,
        session_id=parameter.get("session_id"),
        session=base_session,
    )
    return context2question_tool

def get_text2sql_tool(parameter, chat, with_execution=True):
    from datetime import datetime

    # 获取当前时间
    now = datetime.now()

    formatted_now = now.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]  # 移除毫秒后的多余0

    af_datasource = VegaDataSource(
        view_list=parameter.get("view_list"),
        token=parameter.get("token"),
        user_id=parameter.get("user_id")
    )
    text2sql = Text2SQLTool(
        data_source=af_datasource,
        llm=chat,
        background=dedent(
            f"""
                此外你需要注意以下业务处理规则：
                1. 所有SQL语法都要用派车单号（dispatch_id）字段和其他字段进行分组，否则会报错，例如：
                    WITH T1 AS
                        (
                            SELECT SUM(DISTINCT T."weight") AS weight, ...其他字段列表...
                            FROM 表名 AS T
                            GROUP BY T."dispatch_id", ...其他字段列表...
                        )
                    SELECT SUM(T1."weight"), ...其他字段... 
                    FROM T1
                    GROUP BY ...其他字段...;
                    **注意**：货重字段（weight）一定要去重求和
                    **注意**：没有明确时间约束时，一定要查询所有时间范围的数据
                    **特别注意**：货运量的计算单位都是"吨"，譬如货重字段求和sum(weight)>50表示50吨以上的运输量
                    **特别注意**：周数字段是1-53周，是一年中的周数，是从第1周开始，譬如‌6月第一周通常是第26周，即week=26
                2. 货物流动是一定时间内某一运输线路路段上一定方向的货物流动，包含流向、流量和流时等要素
                3. 流向：货物运输的方向，货物从一地流向另一地，例如：从上海装货到北京卸货，那么该方向就是流出上海、流入北京
                4. 流出上海的运量对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT SUM(DISTINCT T."weight") AS weight, "load_province", "unload_province", "flow_direction", "danger_goods_type"
                            FROM 表名  AS T
                            GROUP BY T."dispatch_id", T."load_province", T."unload_province", T."flow_direction", T."danger_goods_type"
                        )
                    SELECT SUM(T1."weight") AS "流出上海的货运总量"
                    FROM T1
                    WHERE T1."load_province" = '上海市'
                      AND T1."unload_province" != '上海市';
                    **注意**：流量流向的SQL语句必须查询流向（flow_direction）字段、危险货物类别（danger_goods_type）字段
                5. 从上海流出的运量对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT SUM(DISTINCT T."weight") AS weight, "load_province", "unload_province", "flow_direction", "danger_goods_type"
                            FROM 表名  AS T
                            GROUP BY T."dispatch_id", T."load_province", T."unload_province", T."flow_direction", T."danger_goods_type"
                        )
                    SELECT SUM(T1."weight") AS "流出上海的货运总量"
                    FROM T1
                    WHERE T1."load_province" != '上海市'
                      AND T1."unload_province" = '上海市';
                    **注意**：流量流向的SQL语句必须查询流向（flow_direction）字段、危险货物类别（danger_goods_type）字段
                6. 查询爆炸品运量占比对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT SUM(DISTINCT T."weight") AS weight, T."danger_goods_type"
                            FROM 表名 AS T
                            GROUP BY T."dispatch_id", T."danger_goods_type"
                        ),
                         T2 AS
                        (
                            SELECT SUM(T1.weight) AS "总运量"
                            FROM T1
                        ),
                        T3 AS
                        (
                            SELECT SUM(T1.weight) AS "爆炸品的运量"
                            FROM T1
                            WHERE T1."danger_goods_type" = '爆炸品'
                        )
                    SELECT T2."总运量", T3."爆炸品的运量"
                    FROM T2, T3
                    LIMIT 100
                7. 查询每周运量占比对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT SUM(DISTINCT T."weight") AS weight, T."week"
                            FROM 表名 AS T
                            GROUP BY T."dispatch_id", T."week"
                        ),
                        T2 AS
                        (
                            SELECT CONCAT('第 ', CAST(T1."week" AS VARCHAR), ' 周') AS "周数", SUM(T1."weight") AS "每周运量"
                            FROM T1
                            GROUP BY T1."week"
                            ORDER BY T1."week"
                        ),
                        T3 AS
                        (
                            SELECT SUM(T1."weight") AS "总运量"
                            FROM T1
                        )
                        SELECT T2."周数", T2."每周运量", T3."总运量", CONCAT(ROUND(T2."每周运量" / T3."总运量" * 100, 2), '%') AS "占比"
                        FROM T2, T3;
                    **注意**：周数字段（week）要按照从小到大的顺序排列
                    **特别注意**：周数字段是1-53周，是一年中的周数，是从第1周开始，譬如‌6月第一周通常是第26周，即week=26
                8. 查询每天运量对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT SUM(DISTINCT T."weight") AS weight, T."day"
                            FROM 表名 AS T
                            GROUP BY T."dispatch_id", T."day"
                        )
                    SELECT T1."day" AS "日期", SUM(T1."weight") AS "运量"
                    FROM T1
                    GROUP BY T1."day"
                    ORDER BY T1."day";
                    **注意**：查询周运量时，SQL语句需要改为根据字段周（week）聚合
                9. 查询道路运量对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT SUM(DISTINCT T."weight") AS weight, T."road_name"
                            FROM 表名 AS T
                            GROUP BY T."dispatch_id", T."road_name"
                        )
                    SELECT T1."road_name" AS "道路名称", SUM(T1."weight") AS "运量"
                    FROM T1
                    GROUP BY T1."road_name";
                10. 查询各类危险品运量对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT SUM(DISTINCT T."weight") AS weight, T."danger_goods_type"
                            FROM 表名 AS T
                            GROUP BY T."dispatch_id", T."danger_goods_type"
                        ),
                        T2 AS
                        (
                            SELECT T1."danger_goods_type" AS "危险品类别", SUM(T1."weight") AS "运量"
                            FROM T1
                            GROUP BY T1."danger_goods_type"
                        ),
                        T3 AS
                        (
                            SELECT SUM(T1."weight") AS "总运量"
                            FROM T1
                        )
                    SELECT T2."危险品类别", T2."运量", CONCAT(ROUND(T2."运量" / T3."总运量" * 100, 2), '%') AS "占比"
                    FROM T2, T3;
                    **注意**：查询具体危险品名称时，SQL语句需要改为根据字段危险品名称（goods_name）聚合
                11. 查询运量最大的危险品对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT SUM(DISTINCT T."weight") AS "weight", T."danger_goods_type"
                            FROM 表名 AS T
                            GROUP BY T."dispatch_id", T."danger_goods_type"
                        ),
                        T2 AS
                        (
                            SELECT T1."danger_goods_type" AS "危险品类别", SUM(T1.weight) AS "运量"
                            FROM T1
                            GROUP BY T1."danger_goods_type"
                        )
                    select T2."危险品类别", T2."运量"
                    from T2
                    where T2."运量" in (SELECT MAX(T2."运量") FROM T2);
                12. 查询所有运单的平均运量对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT SUM(DISTINCT T."weight") AS "weight"
                            FROM 表名 AS T
                            GROUP BY T."dispatch_id"
                        ),
                        T2 AS
                        (
                            SELECT SUM(T1."weight") AS "总运量"
                            FROM T1
                        ),
                        T3 AS
                        (
                            SELECT COUNT(1) AS "记录数量"
                            FROM T1
                        )
                    SELECT ROUND(T2."总运量" / T3."记录数量", 2) AS "平均运量"
                    FROM T2, T3;
                13. 查询6月第一周的运量对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT SUM(DISTINCT T."weight") AS "weight", T."month", T."week"
                            FROM 表名 AS T
                            GROUP BY T."dispatch_id", T."month", T."week"
                        ),
                        T2 AS
                        (
                            SELECT T1."month", T1."week", SUM(T1."weight") AS "weight"
                            FROM T1
                            GROUP BY T1."month", T1."week"
                            ORDER BY T1."month", T1."week"
                        ),
                        T3 AS
                        (
                            SELECT T2."month" AS "月份", T2."week" AS "周数", T2."weight" AS "运量", ROW_NUMBER() OVER (ORDER BY T2."week" ASC) AS "rn"
                            FROM T2
                        )
                    SELECT CONCAT('第', T3."周数", '周') AS "周数", T3."运量"
                    FROM T3
                    WHERE T3."月份" = 6 AND T3."rn" = 1;
                14. 查询6月第一周比第二周增加的运量对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT SUM(DISTINCT T."weight") AS "weight", T."month", T."week"
                            FROM 表名 AS T
                            GROUP BY T."dispatch_id", T."month", T."week"
                        ),
                        T2 AS
                        (
                            SELECT T1."month", T1."week", SUM(T1."weight") AS "weight"
                            FROM T1
                            GROUP BY T1."month", T1."week"
                            ORDER BY T1."month", T1."week"
                        ),
                        T3 AS
                        (
                            SELECT T2."month" AS "月份", T2."week" AS "周数", T2."weight" AS "运量", ROW_NUMBER() OVER (ORDER BY T2."week" ASC) AS "rn"
                            FROM T2
                        )
                    SELECT (SELECT T3."运量"
                        FROM T3
                        WHERE T3."rn" = 1) - (SELECT T3."运量"
                        FROM T3
                        WHERE T3."rn" = 2) AS "增加的运量"
                    FROM T3
                    WHERE T3."月份" = 6;
                15. 查询运单数量/派车单数量对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT COUNT(DISTINCT T."dispatch_id") AS "运单数量"
                            FROM 表名 AS T
                        )
                    SELECT SUM(T1."运单数量") AS "派车单数量"
                    FROM T1;
                16. 查询运输趟次对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT COUNT(DISTINCT T."cargo_id") AS "运输趟次"
                            FROM 表名 AS T
                        )
                    SELECT SUM(T1."运输趟次") AS "运输趟次"
                    FROM T1;
                17. 查询运输车辆数量对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT COUNT(DISTINCT T."veh_no") AS "车辆数量"
                            FROM 表名 AS T
                        )
                    SELECT SUM(T1."车辆数量") AS "运输车辆数量"
                    FROM T1
                18. 查询驾驶时长对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT SUM(T."driving_duration") AS "驾驶时长"
                            FROM 表名 AS T
                        )
                    SELECT SUM(T1."驾驶时长") AS "驾驶时长"
                    FROM T1;
                    **注意**：驾驶时长字段（driving_duration）求和不需要用DISTINCT去重统计
                19. 查询每辆车的平均驾驶时长对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT T.veh_no, SUM(T."total_travel_duration") AS "驾驶时长"
                            FROM goods_transport_details AS T
                            GROUP BY T."veh_no"),
                        T2 AS
                        (
                            SELECT COUNT(DISTINCT T1."veh_no") AS "车辆数量"
                            FROM T1
                        ),
                        T3 AS
                        (
                            SELECT SUM(T1."驾驶时长") AS "总驾驶时长"
                            FROM T1
                        )
                        SELECT ROUND(T3."总驾驶时长" / T2."车辆数量", 2) AS "平均驾驶时长"
                        FROM T2, T3;
                20. 查询运输时长对应的SQL语法：
                    WITH T1 AS
                        (
                            SELECT SUM(T."total_travel_duration") AS "运输时长"
                            FROM 表名 AS T
                        )
                    SELECT SUM(T1."运输时长") AS "运输时长"
                    FROM T1;
                    **注意**：驾驶时长字段（transport_duration）求和不需要用DISTINCT去重统计
                21. 查询结果包含null、None、--时，表示数据缺失且查询成功，直接返回结果，不要再调用工具
                21. 没有明确时间点时，表示查询所有时间的数据
                """
        ),
        session_id=parameter.get("session_id"),
        session=base_session,
        # with_context=True,
        with_execution=with_execution
    )
    return text2sql


def get_text2metric_tool(parameter, chat):
    af_indicator = AFIndicator(
        indicator_list=parameter.get("indicator_list"),
        token=parameter.get("token"),
    )
    text2indicator = Text2MetricTool.from_indicator(
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
    return text2indicator


def get_knowledge_enhancement_tool(parameter, chat):
    knowledge_enhanced = KnowledgeEnhancedTool(
        ## 10.4.135.251 环境
        kg_id="3064", 
        synonym_id="13",
        word_id="12",

        ## 云路：客户环境
        # kg_id='459',
        # synonym_id='8',
        # word_id='7',

        session_id=parameter.get("session_id"),
        session=base_session,
    )
    return knowledge_enhanced


def get_chat2plot_tool(parameter, chat):
    chat2plot = ChatToPlotTool(
        session_id=parameter.get("session_id"),
        chat=chat,
        session=base_session

    )
    return chat2plot


def get_arima_tool(parameter, chat):
    text2sql_tool = get_text2sql_tool(parameter=parameter, chat=chat, with_execution=False)
    arima_tool = ArimaTool(
        session_id=parameter.get("session_id"),
        session=base_session,
        text2sql_tool=text2sql_tool,
    )
    return arima_tool


def get_detection_tool(parameter, chat):
    detect_ds = VegaDataSource(
        view_list=parameter.get("detect_view_list"),
        token=parameter.get("token"),
        user_id=parameter.get("user_id")
    )
    detect_tool = DetectionTool(
        data_source=detect_ds,
        session_id=parameter.get("session_id"),
        session=base_session,
    )
    return detect_tool


def get_decision_tool(parameter, chat):
    decision_ds = VegaDataSource(
        view_list=parameter.get("decision_view_list"),
        token=parameter.get("token"),
        user_id=parameter.get("user_id")
    )
    decision_tool = DecisionTool(
        data_source=decision_ds,
        session_id=parameter.get("session_id"),
        session=base_session,
    )
    return decision_tool



def get_toolkit(
        parameter,
        chat
):
    tools = []

    # sailor_tool = AfSailorTool(parameter=parameter, **kwargs)
    # human_tool = AfHumanInputTool(parameter=parameter, **kwargs)

    context2question_tool = get_context2question_tool(parameter=parameter, chat=chat)
    chat2plot_tool = get_chat2plot_tool(parameter=parameter, chat=chat)
    knowledge_enhancement_tool = get_knowledge_enhancement_tool(parameter=parameter, chat=chat)
    text2sql_tool = get_text2sql_tool(parameter=parameter, chat=chat)
    text2metric_tool = get_text2metric_tool(parameter=parameter, chat=chat)
    arima_tool = get_arima_tool(parameter=parameter, chat=chat)
    detect_tool = get_detection_tool(parameter=parameter, chat=chat)
    decision_tool = get_decision_tool(parameter=parameter, chat=chat)

    tools.append(knowledge_enhancement_tool)
    if parameter.get('view_list', []):
        tools.append(text2sql_tool)
    # if parameter.get('indicator_list', []):
    #     tools.append(text2metric_tool)

    tools.append(arima_tool)
    tools.append(detect_tool)
    tools.append(decision_tool)
    # tools.append(chat2plot_tool)
    tools.append(context2question_tool)

    toolkit = InstructionBookInsideToolkit()
    # TODO 增加工具说明书
    # toolkit.set_toolkit_instruction(f"""
    #          严格执行以下步骤：
    #          步骤1: 准确理解用户意图。
    #          步骤2: 无论如何，都必须使用 {ToolName.from_knowledge_enhanced.value} ，将用户的问题进行知识图谱搜索和同义词搜索，将搜索到的结果进行组合，形成一个新的问题，同时你需要将知识增强工具的结果作为额外信息告诉工具。
    #          步骤3: 根据步骤1-3提供的数据信息，尝试一步一步选择合适的工具的获取问题的结果。
    #          步骤4：总结最终答案。
    #
    #          注意：
    #          1. 步骤3中，调用工具是一个多次迭代调用工具的过程，即可能会多次调用不同的工具按照思考过程一步一步获取问题的答案。
    #          2. 一个工具在同一个问题上，最多调用两次。
    #          3. 查询结果包含null、None、--时，表示数据缺失且查询成功，直接返回结果，不要再调用工具。
    #          4. 没有明确时间点时，表示查询所有时间的数据，不要指定时间范围。
    #
    #          **特别注意**：当没有明确时间约束时，表示查询所有时间的数据，不要指定时间范围。
    #          **特别注意**：不要编造工具、如果工具没有返回数据，不要编造数据。
    #          **特别注意**：货运量的计算单位都是"吨"。
    #          **特别注意**：询问"每周的运量变化"优先使用 {ToolName.from_text2sql.value} 查询数据库返回结果
    #
    #     """)
    toolkit.set_toolkit_instruction(f"""
         严格执行以下步骤：
         步骤1: 无论如何，都必须使用 {ToolName.context2question.value} ，准确理解用户意图。
         步骤2: 无论如何，都必须使用 {ToolName.from_knowledge_enhanced.value} ，将用户的问题进行知识图谱搜索和同义词搜索，将搜索到的结果进行组合，形成一个新的问题，同时你需要将知识增强工具的结果作为额外信息告诉工具。
         步骤3: 根据步骤1-3提供的数据信息，尝试一步一步选择合适的工具的获取问题的结果。
         步骤4：总结最终答案。

         注意：
         1. 步骤3中，调用工具是一个多次迭代调用工具的过程，即可能会多次调用不同的工具按照思考过程一步一步获取问题的答案。
         2. 一个工具在同一个问题上，最多调用两次。
         3. 查询结果包含null、None、--时，表示数据缺失且查询成功，直接返回结果，不要再调用工具。
         4. 没有明确时间点时，表示查询所有时间的数据，不要指定时间范围。

         **特别注意**：当没有明确的查询时间时，请查询所有时间的数据，不需要指定时间范围。
         **特别注意**：不要编造工具、如果工具没有返回数据，不要编造数据。
         **特别注意**：货运量的计算单位都是"吨"。
         **特别注意**：询问"每周的运量变化"优先使用 {ToolName.from_text2sql.value} 查询数据库返回结果
         **特别注意**：询问"气体的运量"默认是查询所有时间的气体的运输量
         
    """)

    toolkit.set_tools(tools)

    return toolkit


class Parameter(BaseModel):
    query: str = Field(..., description="用户提出的问题")
    token: str = Field(..., description="用户token")
    user_id: str = Field(..., description="用户 user id")
    session_id: str = Field(..., description="对话管理id")
    view_list: list = Field(default=[], description="用户text2sql的视图列表")
    indicator_list: list = Field(default=[], description="用户text2indicator的指标列表")
    background: str = Field(default="", description="背景信息")
    task_description: str = Field(default="", description="任务描述")
    tool_list: list = Field(..., description="工具列表：1：text2sql，2：text2indicator")
    work_mode: str = Field(default="1", description="问答工作模式：1：react，2：tool use")


def get_parameter(query, session_id=None):
    if not session_id:
        session_id = str(uuid.uuid4())
    parameter = {
        # "session_id": str(time.time()),
        # "session_id": str(uuid.uuid4()),
        # "session_id": '_yunlu_poc',
        "session_id": session_id,
        "view_list": [
            ## 10.4.111.246 环境
            '2d6625a9-3f44-40a4-92fc-07c5fa8dc51a', # 大宽表 goods_transport_details

            ## 云路：客户环境
            # "5129c7fa-addc-44d7-b09c-7979e349636b", # 大宽表 goods_transport_details
            # "d23e02f4-a518-472f-af03-2b2c6fa8ca7f", # 危险品道路运输统计_运单粒度
            # "91d1f278-8eb6-46e9-8129-39b013cc021a", # 危险品道路运输统计_轨迹粒度
            # "958100f2-27a1-46cf-8273-78c08e66e373", # 危险品运输统计_道路运输粒度
            # "afd87a6d-1084-4d8d-b202-a8d025fc4e71", # 危险货物运输统计_货物装卸粒度
        ],
        'indicator_list': [
            ## 10.4.111.246 环境

            ## 云路：客户环境
            # '543054541923296356',    # 派车单数量
            # '543062069054809188',   # 运单运输货重
            # '543159262050788522',   # 装卸货运输货重
            # '543159667841311914',   # 运输趟次
            # '543159842945115306',   # 运输车辆数量
            # '543160452109051050',   # 驾驶时长
            # '543160754954577066',   # 运输时长
            # '543317637325661329',   # 道路运输货重
        ],
        'detect_view_list': [
            ## 10.4.111.246 环境
            '2d6625a9-3f44-40a4-92fc-07c5fa8dc51a',  # 大宽表
            'fb86d4c6-a2dd-4df5-8842-43dff875bca0',  # 货物表
            'c23760d7-3316-45d9-9686-29ef7f7165f8',  # 区域的货物运输模式 loc_patterns
            '91742f10-2803-4ff0-8fad-e35fa1db43a2',  # 常规路线 regular_routes
            'd5bd0d3b-0ad6-46f2-b587-b1dd55bdb2e6',  # 货物的运输模式 goods_loc_patterns
            '6ac7dcfd-dd8a-4bd1-a8ed-1ca15c045841'  # 电子运单异常信息 bill_an

            ## 云路：客户环境
            # "5129c7fa-addc-44d7-b09c-7979e349636b",  # 大宽表
            # "a796a45b-e636-4359-b740-c2f54c40823f",  # 货物表（原始表）
            # "a8f1dc01-1f2b-4897-be21-93b594d13780",  # 区域的货物运输模式 loc_patterns
            # "ce81b659-eaa6-416e-8096-ddf465e9fc18",  # 常规路线 regular_routes
            # "a3a16a44-2001-45c6-8bb7-67533551efe7",  # 货物的运输模式 goods_loc_patterns
            # "dd7fe368-ee62-4ea4-b880-815f7a8a3bbf"  # 电子运单异常信息 bill_an
        ],
        'decision_view_list': [
            ## 10.4.111.246 环境
            '8152371f-912a-4302-9aa6-68d413921481'  # 道路货物 goods_weight

            ## 云路：客户环境
            # 'bd416afd-48e6-48d5-b0cb-f9cbe1b75c41'  # 道路货物 goods_weight
        ],


        ## 10.4.111.246 环境
        "token": get_authorization("https://10.4.111.246", "xia", "111111"),
        "user_id": "",
        ## 云路：客户环境
        # "token": get_authorization("https://172.25.17.92", "admin", "eisoo.com123"),
        # "user_id": "266c6a42-6131-4d62-8f39-853e7093701c",

        "query": query,
        "background": "--",
        "task_description": "xxx",
        "tool_list": ["1", "2"],
        "work_mode": "1",
    }
    print('session_id', session_id)
    if not parameter["session_id"]:
        session_id = GetSessionId.from_user_id(parameter["user_id"])
        parameter["session_id"] = session_id
        print("session_id", session_id)
    return parameter


questions = [
    # 统计
    '在上海装货的所有数据',
    '上海的货运量',
    "查询过去一年每月第一周的货运量",  # tet2sql会理解成 大于等于2022-03-01且小于2023-03-01
    "查询2023年6月第1周到2024年7月第1周的货运量",  # text2sql 返回正确结果
    "查询2023年4月第1周到2024年4月第1周的货运量指标",  # text2indicator 返回正确结果
    "查询过去一年每月第一周的货运量指标",  # text2indicator 返回正确结果
    "淀山湖大道的货运量",
    "沪青平公路的货运量",

    # 预测
    "查询2023年7月至2024年6月每周的货运量，以预测2024年7月第1周的货运量",  # TODO 预测场景
    "预测2024年7月第1周的货运量",  # TODO 预测场景


    # 异常检测
    "电子运单310000516124060300324023的异常检测",    # 异常
    "电子运单310002035724061602935362的异常检测",    # 正常
    "电子运单310000525424062200092012的异常检测",    # 正常

    # 智能决策
    # 根据每条道路上运输的危险品类别、危险品重量，设计一个智能决策系统，为危险品运输量最大的道路设置救援点，以减少危险品运输过程中可能产生的意外。
    "为运输爆炸品的路线设置救援点，请给出建议"
    "为运输危险品的路线设置救援点，请给出建议"
    # 在危险品运输过程中，需要根据运输品类别、运输品重量确定应当设置救援点的具体道路，并根据运输类别、重量等方面，进行救援应急
#     在为运输危险品的路线设置救援点时，应考虑以下几点：1) 根据运输品的类别和重量，预估可能的事故类型和规模；2) 选择交通便利、易于紧急服务到达的地点；3) 避免人口密集区，减少潜在风险；4) 确保救援点配备适当的应急设备和人员。具体设置时，建议与当地应急管理部门合作，进行实地考察和风险评估。
]

async def main(query):
    parameter['query'] = query
    res = executor.astream_events(
        parameter["query"],
        session_id=parameter["session_id"]
    )

    idx = 1
    async_cache = res
    observation = ''
    try:
        while True:
            print(f'############ {idx}')
            event = await async_cache.__anext__()
            print(event)
            idx += 1
    except:
        pass


if __name__ == "__main__":
    import asyncio

    parameter = get_parameter(query='')
    llm = get_llm()
    toolkit = get_toolkit(parameter, llm)
    executor = ReactAgent(
        parameter=parameter,
        llm=llm,
        toolkits=toolkit
    )
    
    idx = 1
    while idx < 1000:
        idx += 1
        query = input('请输入问题：')
        # query = '7月运量'
        # query = '潘石村616号的运量'
        # query = '6月份货运量'
        # query = '预测2024年7月第1周的货运量'
        # query = '电子运单310000525424062200092012的异常检测'
        # query = '为运输爆炸品的路线设置救援点，请给出建议'

        loop = asyncio.get_event_loop()
        loop.run_until_complete(main(query=query))

        flag = input('是否退出程序：')
        if flag == 'y':
            break



    """ context2question工具 """
    context2question = get_context2question_tool(parameter=parameter, chat=llm)
    # res = context2question.invoke(input='运量')
    # res = context2question.invoke(input='我问的是运输趟次，不是运量')
    # print(res)

    """ text2sql工具 """
    # text2sql_tool = get_text2sql_tool(parameter=parameter, chat=llm)
    text2sql_tool = get_text2sql_tool(parameter=parameter, chat=llm, with_execution=False)
    # idx = 1
    # while idx < 10:
    #     query = input('请输入：')
    #     # query = '6月运量'
    #     res = text2sql_tool.invoke(query)
    #     print('*'*100, '\n', res)
    #     idx+=1


    """ 异常检测工具 """
    detect_tool = get_detection_tool(parameter=parameter, chat=llm)
    # res = detect_tool.invoke({'factors':{'bill_nos': ['310000333024060100054632']}})
    # print(res)

    """ 预测工具 """
    arima_tool = get_arima_tool(parameter=parameter, chat=llm)
    # datas = [{"月": "2024-05", "货运量": "30"}, {"月": "2024-06", "货运量": "40"}]
    # datas = [{'周数': '第 22 周', '每周运量': '11736.52'}, {'周数': '第 23 周', '每周运量': '68916.88'}, {'周数': '第 24 周', '每周运量': '68152.18'}, {'周数': '第 25 周', '每周运量': '74618.97'}, {'周数': '第 26 周', '每周运量': '71077.48'}]
    # print(datas)
    res = arima_tool.invoke(input='预测7月第一周的运量')
    print(res)

    """ 智能决策工具 """
    decision_tool = get_decision_tool(parameter=parameter, chat=llm)
    # query = {
    #     'factors': {
    #         'goods_names': ['爆炸品'],
    #         'road_names': []
    #     }
    # }
    # res = decision_tool.invoke(query)
    # print(res)

