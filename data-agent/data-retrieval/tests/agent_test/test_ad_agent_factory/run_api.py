"""
@File: test_tool_api.py
@Date: 2025-02-20
@Author: Danny.gao
@Desc:
"""

import json
import uuid
from textwrap import dedent
from flask import Flask, request
from langchain_openai import ChatOpenAI

from af_agent.datasource.vega_datasource import VegaDataSource
from af_agent.tools.text2sql import Text2SQLTool
from af_agent.tools.toolkits.danger_goods_transport.arima import ArimaTool
from af_agent.tools.chat2plot_simple import ChatToPlotToolSimple
from af_agent.sessions.redis_session import RedisHistorySession
from password import get_authorization


app = Flask(__name__)
base_session = RedisHistorySession()


def get_llm():
    llm = ChatOpenAI(
        model_name="Qwen-72B-Chat",
        openai_api_key="EMPTY",
        openai_api_base="http://192.168.173.19:8304/v1",
        max_tokens=4096,  # 减小 token 限制以提高响应速度
        temperature=0.01,
    )
    return llm
llm = get_llm()


def get_text2sql_tool(with_execution=True):
    af_datasource = VegaDataSource(
        view_list=['2d6625a9-3f44-40a4-92fc-07c5fa8dc51a'],
        token=get_authorization('https://10.4.111.246', 'xia', '111111'),
        user_id=''
    )
    text2sql = Text2SQLTool(
        data_source=af_datasource,
        llm=llm,
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
        session_id=str(uuid.uuid4()),
        session=base_session,
        # with_context=True,
        with_execution=with_execution
    )
    return text2sql
# text2sql_tool = get_text2sql_tool()


def get_json2plot_tool():
    json2plot = ChatToPlotToolSimple(
        session_id=str(uuid.uuid4())
    )
    return json2plot
# json2plot_tool = get_json2plot_tool()

def _init_vectorstore():
    import os
    import faiss
    from langchain_community.vectorstores import FAISS
    from langchain_community.document_loaders import TextLoader
    from langchain_text_splitters import CharacterTextSplitter
    from af_agent.utils.embeddings import M3EEmbeddings, MSE_EMBEDDING_SIZE
    from langchain_community.docstore.in_memory import InMemoryDocstore
    def load_and_splits(directory_path):
        """

        :param directory_path:
        :return:
        """
        # 文本分割器
        splitter = CharacterTextSplitter(chunk_size=512, chunk_overlap=50, separator='\n')
        split_documents = []
        for file in os.listdir(directory_path):
            loader = TextLoader(file_path=os.path.join(directory_path, file), encoding='utf-8')
            docs = loader.load_and_split(text_splitter=splitter)
            split_documents.extend(docs)
        return split_documents
    
    # current_dir = os.getcwd()
    # directory_path = os.path.join(current_dir, 'data', 'files')
    directory_path = '/mnt/gaodan/poc_yunlu/data/files'

    split_documents = load_and_splits(directory_path=directory_path)
    embedding = M3EEmbeddings()
    index = faiss.IndexFlatL2(MSE_EMBEDDING_SIZE)
    vectorstore = FAISS(
        embedding,
        index=index,
        docstore=InMemoryDocstore(),
        index_to_docstore_id={},
        normalize_L2=True
        # distance_strategy=DistanceStrategy.COSINE
    )

    vectorstore.add_documents(split_documents)
    return vectorstore
vectorstore = _init_vectorstore()

def _search_vectorstore(query):
    search_res = vectorstore.similarity_search_with_score(
        query,
        k=3
    )
    sorted_docs = sorted(search_res, key=lambda x: x[1], reverse=True)
    # print(sorted_docs, type(sorted_docs))
    res = {
        doc.metadata.get('source', '').split('/')[-1].replace('.txt', ''): doc.page_content for doc, score in search_res
    }
    return res

def parser_sql(sql):
    """从SQL中提取WHERE条件"""
    # 找到WHERE子句
    where_start = sql.upper().find('WHERE')
    if where_start == -1:
        return {}
    
    # 找到WHERE子句的结束位置(GROUP BY或其他关键字之前)
    where_end = sql.upper().find('GROUP BY', where_start)
    if where_end == -1:
        where_end = len(sql)
    
    # 提取WHERE子句
    where_clause = sql[where_start:where_end]
    
    # 解析条件
    conditions = {}
    # 分割条件语句
    condition_list = where_clause.split('AND')
    
    # 遍历每个条件
    for condition in condition_list:
        if '"danger_goods_type"' in condition and '=' in condition:
            value = condition.split('=')[1].strip().strip("'")
            conditions['danger_goods_type'] = value
        elif '"road_name"' in condition and '=' in condition:
            value = condition.split('=')[1].strip().strip("'")
            conditions['road_name'] = value
            
    return conditions

@app.route('/text2sql', methods=['POST'])
def api_text2sql():
    # text2sql_tool = get_text2sql_tool()
    #
    # datas = json.loads(request.get_data())
    # print('**INPUT**: ', datas)
    # query = datas.get('query', '')
    # if query:
    #     res = text2sql_tool.invoke(query)
    #     res = json.loads(res)
    #     result = res.get('output', {}).get('data', '')
    # else:
    #     result = '输入为空，无法获取数据。'
    # print(f'text2sql工具返回的结果：{result}')
    result = [{'爆炸品运量': 39.4}]
    return {'_answer': result}


@app.route('/json2plot', methods=['POST'])
def api_json2plot():
    json2plot_tool = get_json2plot_tool()
    datas = json.loads(request.get_data())
    print('**INPUT**: ', datas)
    title = datas.get('title', '')
    group_by = datas.get('group_by', [])
    data = datas.get('data', [])
    if data:
        query = {
            'title': title,
            'last_tool_name': '',
            'description': '',
            'chart_type': 'pie',
            'group_by': group_by,
            'data': data
        }
        res = json2plot_tool.invoke(query)
        res = json.loads(res)
        result = res.get('output', {})
    else:
        result = '输入为空，无法获取数据。'
    print(f'json2plot工具返回的结果：{result}')
    return {'_answer': result}


@app.route('/getWeather', methods=['POST'])
def api_get_weather():
    datas = json.loads(request.get_data())
    print('**INPUT**: ', datas)
    date = datas.get('date', '')
    if date:
        result = '晴天' if date in ['今天', '明天'] else '多云'
    else:
        result = '日期为空，无法获取天气信息。'
    return {'_answer': result}

@app.route('/algoCompute', methods=['POST'])
def api_algo_compute():
    datas = json.loads(request.get_data())
    expression = datas.get('expression', '')
    result = 10. if expression else '表达式为空，无法计算。'
    return {'_answer': result}

@app.route('/getDocByGoodsName', methods=['POST'])
def api_docCrawlerAgent():
    datas = json.loads(request.get_data())
    print('**INPUT**: ', datas)
    good_names = datas.get('good_names', [])
    if isinstance(good_names, str):
        good_names = [good_names]
    docs = []
    for name in good_names:
        query = f'{name}的应急救援设施有哪些'
        item = {
            '货物名称': name,
            '救援设施配置的国家标准依据': _search_vectorstore(query)
        }
        docs.append(item)
    print(f'getDocByGoodsName工具返回的结果：{docs}')
    return {'_answer': docs}


@app.route('/getRescueFacilities', methods=['POST'])
def api_get_rescue_facilities():
    import random
    """获取特定道路的危险品救援设施配置情况"""
    datas = json.loads(request.get_data())
    print('**INPUT**: ', datas)
    road_names = datas.get('road_names', [])
    if isinstance(road_names, str):
        road_names = [road_names]
    facilities = []
    for name in road_names:
        num = random.randint(1, 3)
        result = [
            {
                'type': '消防站',
                '数量': num,
                '配置': '消防车、泡沫消防车、化学消防车',
                '应急能力': '可处理各类火灾及危化品泄漏事故'
            },
            {
                'type': '危化品应急处理点',
                '数量': num//2,
                '配置': '防化服、检测仪器、中和剂',
                '应急能力': '可处理酸碱泄漏、有毒气体扩散等事故'
            },
            {
                'type': '应急医疗点',
                '数量': num,
                '配置': '救护车、急救设备、解毒剂',
                '应急能力': '可进行现场救护和中毒救治'
            },
            {
                'type': '应急物资储备库',
                '数量': max(1, num//2),
                '配置': '防护装备、应急器材、救援物资',
                '应急能力': '可供应72小时应急救援物资需求'
            },
            {
                'type': '应急指挥中心',
                '数量': 1,
                '配置': '通信设备、监控系统、决策支持系统',
                '应急能力': '统一指挥调度各类应急资源'
            },
            {
                'type': '环境监测站',
                '数量': max(1, num//2),
                '配置': '空气监测仪、水质检测设备',
                '应急能力': '实时监测空气和水体污染情况'
            },
            {
                'type': '临时安置点',
                '数量': num,
                '配置': '帐篷、生活必需品、临时医疗设施',
                '应急能力': '可紧急安置500人'
            },
            {
                'type': '专业救援队',
                '数量': max(1, num//2),
                '配置': '特种车辆、专业救援设备、防护装备',
                '应急能力': '具备高空救援、地下救援等专业救援能力'
            }
        ]
        item = {
            '道路名称': name,
            '救援设置配置情况': result
        }
        facilities.append(item)
    print(f'getRescueFacilities工具返回的结果：{facilities}')
    return {'_answer': facilities}


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9001)


# query = '6月份的运量'
# res = text2sql_tool.invoke(query)
# res = json.loads(res)
# print(type(res), res)
# output = res.get('output', {})
# print(type(output), output)

# query = {
#     'title': '',
#     'last_tool_name': '',
#     "description": "测试单列数据",
#     "chart_type": "Pie",
#     "group_by": [],
#     "data": [
#         {"销售额": 100},
#         {"销售额": 200},
#         {"销售额": 150},
#         {"销售额": 300},
#         {"销售额": 250}
#     ]
# }
# res = json2plot_tool.invoke(query)
# res = json.loads(res)
# print(type(res), res)
# output = res.get('output', {})
# print(type(output), output)