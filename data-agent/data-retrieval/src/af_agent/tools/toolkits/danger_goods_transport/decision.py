"""
@File: yunlu_indicator2standardize.py
@Date:2024-09-03
@Author : Danny.gao
@Desc:
"""

from typing import Any, Optional, Type, Dict
from enum import Enum
import pandas as pd
from langchain.callbacks.manager import (AsyncCallbackManagerForToolRun,
                                         CallbackManagerForToolRun)
import os
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
from af_agent.utils.embeddings import M3EEmbeddings, MSE_EMBEDDING_SIZE
import faiss
from langchain_community.vectorstores import FAISS
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain.pydantic_v1 import BaseModel, Field
from langchain.tools import BaseTool
from af_agent.datasource.db_base import DataSource
from af_agent.utils._common import format_table_datas
from af_agent.tools.base import construct_final_answer, async_construct_final_answer, ToolMultipleResult, AFTool

from af_agent.logs.logger import logger
from af_agent.sessions.redis_session import RedisHistorySession
from af_agent.tools import ToolName

_DESCS = {
    'tool_description': {
        'cn': '根据运输品的类别和重量，对道路可能的事故类型和规模进行救援智能决策，'
              '确保救援点配备适当的应急设备和人员。具体设置时，建议与当地应急管理部门合作，进行实地考察和风险评估',
        'en': ' ',
    },
    'chat_history': {
        'cn': '对话历史',
        'en': 'chat history',
    },
    'factors': {
        'cn': '根据用户问题，抽取到的道路名称、危险品名称或品类\n'
          '示例1：{"factors": {"goods_names": ["爆炸品", "气体"], "road_names": ["联航路"]}}\n'
          '示例2：{"factors": {"goods_names": ["爆炸品", "气体"]}}\n'
          '示例3：{"factors": {"road_names": ["联航路"]}}\n',
        'en': '',
    }
}


class DecisionInput(BaseModel):
    factors: dict = Field(description=_DESCS['factors']['cn'])


class RetrieverConfig:
    top_k: int = 3
    threshold: float = 0.5


class DecisionTool(AFTool):
    name: str = ToolName.decision_maker.value
    description: str = _DESCS['tool_description']['cn']
    language: str = 'cn'
    background: str = '--'
    args_schema: Type[BaseModel] = DecisionInput
    llm: Optional[Any] = None
    retry_times: int = 3
    data_source: DataSource  # 逻辑视图资源
    catelogs: dict = None  # 逻辑视图映射表
    vectorstore: Optional[FAISS] = None # 向量数据库
    retriever_config: Optional[RetrieverConfig] = RetrieverConfig()   # 向量数据库检索配置
    session_id: Optional[Any] = None
    session: Optional[RedisHistorySession] = None

    def get_chat_history(
            self,
            session_id,
    ):
        history = self.session.get_chat_history(
            session_id=session_id
        )
        return history

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.catelogs = self.format_tables()
        self._init_vectorstore()

    def load_and_splits(self, directory_path):
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

    def _init_vectorstore(self):
        # current_dir = os.getcwd()
        # directory_path = os.path.join(current_dir, 'data', 'files')
        # directory_path = '/mnt/gaodan/poc_yunlu/data/files'
        directory_path = '/root/yuyuangen/data/poc_yunlu/files'

        split_documents = self.load_and_splits(directory_path=directory_path)
        embedding = M3EEmbeddings()
        index = faiss.IndexFlatL2(MSE_EMBEDDING_SIZE)
        self.vectorstore = FAISS(
            embedding,
            index=index,
            docstore=InMemoryDocstore(),
            index_to_docstore_id={},
            normalize_L2=True
            # distance_strategy=DistanceStrategy.COSINE
        )

        self.vectorstore.add_documents(split_documents)

    def _search_vectorstore(self, query):
        search_res = self.vectorstore.similarity_search_with_score(
            query,
            k=self.retriever_config.top_k
        )
        sorted_docs = sorted(search_res, key=lambda x: x[1], reverse=True)
        # print(sorted_docs, type(sorted_docs))
        res = {
            doc.metadata.get('source', '').split('/')[-1]: doc.page_content for doc, score in search_res
        }
        return res

    def format_tables(self) -> dict:
        res = {}
        # 找到所有的逻辑视图
        # ['vdm_maria_u4u8lxul.default.vehicle_track_road_aggregated', 'vdm_maria_u4u8lxul.default.waybill_main',
        # 'vdm_maria_u4u8lxul.default.waybill_goods']
        catelogs = self.data_source.get_catelog()
        for catelog in catelogs:
            if '.road_weight' in catelog:
                res['road_weight'] = catelog
        return res

    def _search_road_weights(self, road_names, goods_names):
        table_name = self.catelogs.get('road_weight', '')
        if not table_name:
            return []

        where = ''
        if road_names:
            where += f"road_name in ('{', '.join(road_names)}')"
        if goods_names:
            where += f" and (goods_name in ('{', '.join(goods_names)}') or danger_goods_type in ('{', '.join(goods_names)}'))"
        where = where.strip().strip('and')
        if where:
            sql = f"select * from {table_name} where {where}"
        else:
            sql = f"select * from {table_name}"
        data = self.data_source.query(sql)
        data = format_table_datas(data)

        df = pd.DataFrame(data=data)
        return df

    def calculate_road_weight_by_goods(self, road_names, goods_names):
        """
        {
            "2024-06-11": [
                {'道路名称': "road1", '货运量': 20, '货物信息': [{'货物品类': "name1", '货运量': 10, '频次': 3}]}
            ]
        }
        """
        # 1. 查询数据
        df = self._search_road_weights(road_names, goods_names)
        if not isinstance(df, pd.DataFrame) or df.empty:
            return {}
        df['goods_time'] = pd.to_datetime(df['goods_time'])
        df['goods_weight'] = pd.to_numeric(df['goods_weight'])
        df['day'] = df['goods_time'].dt.to_period('D')
        df['day'] = df['day'].astype(str)

        # 2. 获取不同品类的货运总量
        danger_weights = {}
        groups = df.groupby(by='danger_goods_type')
        for danger_goods_type, tmp_df in groups:
            goods_weight = tmp_df['goods_weight'].sum()
            danger_weights[danger_goods_type] = goods_weight

        # 3. 按天分组
        day_res = {}
        groups = df.groupby(by='day')
        for day, day_df in groups:
            # 3.1. 按照道路road_name分组
            groups = day_df.groupby(by='road_name')
            road_res = []
            for road_name, road_df in groups:
                # 计算每条道路的货运量
                road_weight = road_df['goods_weight'].sum()

                danger_goods_types = list(set(list(road_df['danger_goods_type'])))
                goods_infos = []
                for danger_goods_type in danger_goods_types:
                    # 计算每条道路上特定货物的货运量
                    goods_df = road_df[road_df['danger_goods_type'] == danger_goods_type]
                    goods_weight = goods_df['goods_weight'].sum()
                    # 特定品类的总货运里量
                    type_weights = danger_weights[danger_goods_type]
                    # 筛选：重量占比大于道路总货运量*0.1 并且 重量占比大于品类总货运量*0.01 的货物品类
                    # 占比大于道路总货运量*0.1：表示该货物是这条道路的主要运输货物
                    # 占比大于品类总货运量*0.01：表示该货物的主要运输道路是这条道路
                    if goods_weight > road_weight * 0.1 or goods_weight > type_weights * 0.01:
                        goods_info = {'货物品类': danger_goods_type, '货运量': goods_weight,
                                      '品类货物的总货运量': type_weights}
                        goods_infos.append(goods_info)
                # 按照货物的重量进行排序
                goods_infos.sort(key=lambda x: x['货运量'], reverse=True)
                # 将结果添加到字典中
                road_res.append({'道路名称': road_name, '道路总货运量': road_weight, '道路货物信息': goods_infos})

            # 3.2. 按照重量排序
            road_res.sort(key=lambda x: x['道路总货运量'], reverse=True)
            day_res[day] = road_res
        return day_res

    def calculate_rescue_road(self, day_road_infos):
        """
        {
            "2024-06-11": [
                {'道路名称': "road1", '货运量': 20, '货物信息': [{'货物品类': "name1", '货运量': 10, '频次': 3}]}
            ]
        }
        """
        final_res = {}
        for day, day_res in day_road_infos.items():
            sum_weight = sum([item['道路总货运量'] for item in day_res])
            top_roads = []
            for item in day_res:
                # 筛选：重量占比大于当天总货运量*0.1
                # 占比大于当天总货运量*0.1：表示当天这条道路是主要运输通道
                road_weight = item['道路总货运量']
                if road_weight > sum_weight * 0.05:
                    item['当天总货运量'] = sum_weight
                    top_roads.append(item)
                if len(top_roads) >= 5:
                    break
            if top_roads:
                final_res[day] = top_roads
        return final_res

    def get_rescue_docs(self, day_road_infos):

        types = set()
        for day, top_roads in day_road_infos.items():
            items = []
            for road_info in top_roads:
                goods_infos = road_info['道路货物信息']
                for goods_info in goods_infos:
                    danger_goods_type = goods_info['货物品类']
                    types.add(danger_goods_type)
        docs = []
        for _ in types:
            query = f'{_}的应急救援设施有哪些'
            item = {
                '危险品品类': _,
                '国家标准依据': self._search_vectorstore(query)
            }
            docs.append(item)
        return docs

    @construct_final_answer
    def _run(
        self,
        factors: dict,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ):
        """
        基于用户问题inputs、历史信息chat history，执行工具
        :param inputs:
        :param chat_history:
        :param run_manager:
        :return:
        """
        try:
            errors = {}
            res = {}
            for i in range(self.retry_times):
                logger.debug(f'{i + 1} times to summary......')
                try:
                    road_names = factors.get('road_names', [])
                    road_names = [_ for _ in road_names if '未知' not in _]
                    goods_names = factors.get('goods_names', [])
                    day_res = self.calculate_road_weight_by_goods(road_names, goods_names)
                    day_road_infos = self.calculate_rescue_road(day_road_infos=day_res)
                    docs = self.get_rescue_docs(day_road_infos)
                    res['危险品救援设施依据'] = docs
                    res['每个道路危险品运输详细数据'] = day_road_infos
                    self.session.add_agent_logs(
                        self._result_cache_key,
                        logs=res
                    )
                    return res
                except Exception as e:
                    errors['res'] = res
                    errors['error'] = e.__str__()
                    logger.error(f'Error: {errors}')
            return res
        except Exception as e:
            logger.error(f'Error: {e}')

    @async_construct_final_answer
    async def _arun(
        self,
        factors: dict,
        run_manager: Optional[AsyncCallbackManagerForToolRun] = None,
    ):
        return self._run(factors=factors, run_manager=run_manager)
    
    def handle_result(
        self,
        log: Dict[str, Any],
        ans_multiple: ToolMultipleResult
    ) -> None:
        if self.session:
            tool_res = self.session.get_agent_logs(
                self._result_cache_key
            )
            if tool_res:
                log['result'] = tool_res

            ans_multiple.cache_keys[self._result_cache_key] = {
                "tool_name": "decision_maker",
                "title": log.get("title", "decision_maker"),
            }



