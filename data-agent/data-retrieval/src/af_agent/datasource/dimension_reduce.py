# -*- coding: utf-8 -*-
# @Author:  jack.li@aishu.cn
# @Date: 2025-01-13
import requests
import numpy as np
import concurrent.futures
import asyncio
from urllib.parse import urljoin
from af_agent.settings import get_settings
from af_agent.logs.logger import logger
from af_agent.utils.embeddings import EmbeddingServiceFactory
from af_agent.utils.ranking import HybridRetriever
import traceback

def cosine_similarity(vec1, vec2):
    dot_product = np.dot(vec1, vec2)
    norm_vec1 = np.linalg.norm(vec1)
    norm_vec2 = np.linalg.norm(vec2)
    return dot_product / (norm_vec1 * norm_vec2)

class DimensionReduce(object):

    def __init__(
            self,
            source_type="data-view",
            input_llm=None,
            embedding_url="",
            token="",
            user_id="",
            batch_size=64
        ):
        settings = get_settings()
        self.source_type = source_type
        self.batch_size = batch_size
    
        factory = EmbeddingServiceFactory(
            embedding_type=settings.EMB_TYPE,
            base_url=embedding_url,
            token=token,
            user_id=user_id,
        )
        self.embedding = factory.get_service()

        self.llm = input_llm

    def get_embedding(self, input_text):
        vec = self.embedding.embed_texts([input_text])
        return vec[0]

    def get_more_embedding(self, input_text, input_id):
        vec = self.embedding.embed_texts([input_text])
        return input_id, vec[0]
    
    def get_embedding_by_batch(self, input_texts):
        vec = self.embedding.embed_texts(input_texts)
        return vec
    
    def get_more_embedding_by_batch(self, input_texts, input_ids):
        vec = self.embedding.embed_texts(input_texts)
        return zip(input_ids, vec)

    async def aget_embedding(self, input_text):
        """异步获取单个文本的嵌入向量"""
        vec = await self.embedding.aembed_texts([input_text])
        return vec[0]

    async def aget_more_embedding(self, input_text, input_id):
        """异步获取单个文本和ID的嵌入向量"""
        vec = await self.embedding.aembed_texts([input_text])
        return input_id, vec[0]

    async def aget_embedding_by_batch(self, input_texts):
        """异步批量获取文本的嵌入向量"""
        vec = await self.embedding.aembed_texts(input_texts)
        return vec

    async def aget_more_embedding_by_batch(self, input_texts, input_ids):
        """异步批量获取文本和ID的嵌入向量"""
        vec = await self.embedding.aembed_texts(input_texts)
        return zip(input_ids, vec)

    def get_score(self):
        pass

    def datasource_reduce(
            self,
            input_query,
            input_data_source: dict,
            num=4,
            datasource_type: str = "dataview"
        ):
        if num < 1:
            return input_data_source
        if len(input_query) == 0:
            return input_data_source
        if len(input_data_source) <= num:
            return input_data_source
        logger.info("reduce datasource by query {} before datasource num {}".format(input_query, len(input_data_source)))

        datasource_list = []
        
        try:
            q_embed = self.get_embedding(input_query)

            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:

                # 批量提交 embedding 请求
                futures = []
                input_texts = []
                input_ids = []
                if datasource_type == "dataview":
                    for datasource_id, datasource in input_data_source.items():
                        input_text = f"{datasource['technical_name']}|{datasource['name']}|{datasource['comment']}".strip("|")
                        input_texts.append(input_text)
                        input_ids.append(datasource_id)

                elif datasource_type == "metric":
                    for datasource_id, datasource in input_data_source.items():
                        input_text = f"{datasource['name']}|{datasource['comment']}".strip("|")
                        input_texts.append(input_text)
                        input_ids.append(datasource_id)

                for i in range(0, len(input_texts), self.batch_size):
                    batch_texts = input_texts[i:i+self.batch_size]
                    batch_ids = input_ids[i:i+self.batch_size]
                    if batch_texts:
                        futures.append(executor.submit(self.get_more_embedding_by_batch, batch_texts, batch_ids))

                for future in concurrent.futures.as_completed(futures):
                    field_vecs = future.result()
                    for field_id, field_vec in field_vecs:
                        score = cosine_similarity(q_embed, field_vec)
                        datasource_list.append((score, field_id))

            datasource_list.sort(key=lambda x: x[0], reverse=True)

            datasource_res = {}
            for i_datasource in datasource_list[:num]:
                datasource_res[i_datasource[1]] = input_data_source[i_datasource[1]]
            logger.info("reduce datasource by query {} after datasource num {}".format(input_query, len(datasource_res)))

            return datasource_res

        except Exception as e:
            logger.error(e)
            logger.error("向量索引可能有问题， 对query {} 不做降维处理".format(input_query))
            return input_data_source
    
    def datasource_reduce_v2(self, input_query, input_data_source, num=4, datasource_type: str = "dataview"):
        if num < 1:
            return input_data_source
        if len(input_query) == 0:
            return input_data_source
        if len(input_data_source) <= num:
            return input_data_source
        logger.info("reduce datasource by query {} before datasource num {}".format(input_query, len(input_data_source)))
        datasource_map = dict()
        try:
            if datasource_type == "dataview":
                for datasource_id, datasource in input_data_source.items():
                    input_text = f"{datasource['technical_name']}|{datasource['name']}|{datasource['comment']}".strip("|")
                    datasource_map[datasource_id] = input_text

            elif datasource_type == "metric":
                for datasource_id, datasource in input_data_source.items():
                    input_text = f"{datasource['name']}|{datasource['comment']}".strip("|")
                    datasource_map[datasource_id] = input_text
            
            logger.info(f"datasource_map: {datasource_map}")
            retriever = HybridRetriever(self.embedding, datasource_map)
            retriever.build()

            logger.info(f"input_query: {input_query}, num: {num}, bm25mode: okapi")
            results = retriever.search(input_query, num, bm25mode="okapi")
            logger.info(f"results: {results}")
           
            datasource_res = {}
            # results 是 List[Tuple[str, float, int, int]]
            for i_datasource in results:
                # i_datasource[0] 是文档ID，i_datasource[1] 是分数
                datasource_id = i_datasource[0]
                datasource_res[datasource_id] = input_data_source[datasource_id]
            logger.info("reduce datasource by query {} after datasource num {}".format(input_query, len(datasource_res)))

            return datasource_res

        except Exception as e:
            logger.error(e)
            logger.error("降维出错， 对query {} 不做降维处理".format(input_query))
            traceback.print_exc()
            return input_data_source

    async def adatasource_reduce_v2(self, input_query, input_data_source, num=4, datasource_type: str = "dataview"):
        """异步版本的datasource_reduce_v2"""
        if num < 1:
            return input_data_source
        if len(input_query) == 0:
            return input_data_source
        if len(input_data_source) <= num:
            return input_data_source
        logger.info("async reduce datasource by query {} before datasource num {}".format(input_query, len(input_data_source)))
        datasource_map = dict()
        try:
            if datasource_type == "dataview":
                for datasource_id, datasource in input_data_source.items():
                    input_text = f"{datasource['technical_name']}|{datasource['name']}|{datasource['comment']}".strip("|")
                    datasource_map[datasource_id] = input_text

            elif datasource_type == "metric":
                for datasource_id, datasource in input_data_source.items():
                    input_text = f"{datasource['name']}|{datasource['comment']}".strip("|")
                    datasource_map[datasource_id] = input_text

            logger.info(f"async datasource_map: {datasource_map}")
            retriever = HybridRetriever(self.embedding, datasource_map)
            await retriever.abuild()

            logger.info(f"async input_query: {input_query}, num: {num}, bm25mode: okapi")
            results = await retriever.asearch(input_query, num, bm25mode="okapi")
            logger.info(f"async results: {results}")

            datasource_res = {}
            # results 是 List[Tuple[str, float, int, int]]
            for i_datasource in results:
                # i_datasource[0] 是文档ID，i_datasource[1] 是分数
                datasource_id = i_datasource[0]
                datasource_res[datasource_id] = input_data_source[datasource_id]
            logger.info("async reduce datasource by query {} after datasource num {}".format(input_query, len(datasource_res)))

            return datasource_res

        except Exception as e:
            logger.error(e)
            logger.error("async 降维出错， 对query {} 不做降维处理".format(input_query))
            traceback.print_exc()
            return input_data_source

    def data_view_reduce(self, input_query, input_fields, num=30, input_common_fields=[]):

        if num < 1:
            return input_fields
        if len(input_query) == 0:
            return input_fields
        if len(input_fields) <= num:
            return input_fields
        logger.info("reduce dimension query {} before filed num {}".format(input_query, len(input_fields)))
        logger.info("common fields {}".format(input_common_fields))
        field_info_list = []
        input_fields_map = dict()
        common_fields_map = dict()
        for field in input_fields:
            input_fields_map[field["original_name"]] = field
            if field["name"] in input_common_fields:
                common_fields_map[field["original_name"]] = field
        try:
            q_embed = self.get_embedding(input_query)

            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                
                # 批量提交 embedding 请求
                input_texts = [f"{field['original_name']} {field['display_name']}" for field in input_fields]
                input_ids = [field["original_name"] for field in input_fields]

                futures = []
                for i in range(0, len(input_texts), self.batch_size):
                    batch_texts = input_texts[i:i+self.batch_size]
                    batch_ids = input_ids[i:i+self.batch_size]
                    if batch_texts:
                        futures.append(executor.submit(self.get_more_embedding_by_batch, batch_texts, batch_ids))

                for future in concurrent.futures.as_completed(futures):
                    field_vecs = future.result()
                    for field_id, field_vec in field_vecs:
                        # 如果是相同字段
                        if field_id in common_fields_map:
                            field_info_list.append((1.0, field_id))
                        else:
                            score = cosine_similarity(q_embed, field_vec)
                            field_info_list.append((score, field_id))

            field_info_list.sort(key=lambda x: x[0], reverse=True)

            field_info_res = [input_fields_map[i_field[1]] for i_field in field_info_list[:num]]
            logger.info("reduce dimension  query {} after filed num {}".format(input_query, len(field_info_res)))
        except Exception as e:
            logger.error(e)
            logger.error("向量索引可能有问题， 对query {} 不做降维处理".format(input_query))
            return input_fields
        return field_info_res

    def data_view_reduce_by_llm(self, input_query, input_data_view_map, num=30):


        # logger.info("reduce dimension query {} before filed num {}".format(input_query, len(input_fields)))

        return 0
    def data_view_reduce_v2(self, input_query, input_fields, num=30):
        if num < 1:
            return input_fields
        if len(input_query) == 0:
            return input_fields
        if len(input_fields) <= num:
            return input_fields
        logger.info("reduce dimension query {} before filed num {}".format(input_query, len(input_fields)))
        field_info_list = []
        try:
            q_embed = self.get_embedding(input_query)
            for field in input_fields:
                field_info = field["name"] + " " + field["display_name"]
                field_vec = self.get_embedding(field_info)
                score = cosine_similarity(q_embed, field_vec)
                field_info_list.append((score, field))
            field_info_list.sort(key=lambda x: x[0], reverse=True)
            field_info_res = [filed[1] for filed in field_info_list[:num]]
            logger.info("reduce dimension  query {} after filed num {}".format(input_query, len(field_info_res)))
        except Exception as e:
            logger.error(e)
            logger.error("向量索引可能有问题， 对query {} 不做降维处理".format(input_query))
            return input_fields
        return field_info_res

    def data_view_reduce_v3(self, input_query, input_fields, num=30, input_common_fields=[]):

        if num < 1:
            return input_fields
        if len(input_query) == 0:
            return input_fields
        if len(input_fields) <= num:
            return input_fields
        logger.info("reduce dimension query {} before filed num {}".format(input_query, len(input_fields)))
        logger.info("common fields {}".format(input_common_fields))
        reduced_fields = []
        input_fields_map = dict()
        input_texts = {}
        for field in input_fields:
            input_fields_map[field["original_name"]] = field
            input_texts[field["original_name"]] = f"{field['original_name']} {field['display_name']}"

        try:
            logger.info(f"input_texts: {input_texts}, input_common_fields: {input_common_fields}")
            hybrid_retriever = HybridRetriever(self.embedding, input_texts, input_common_fields)
            logger.info(f"hybrid_retriever: {hybrid_retriever}")
            hybrid_retriever.build()
            results = hybrid_retriever.search(input_query, num, bm25mode="okapi")
            logger.info(f"results: {results}")
            logger.info("reduce dimension query {} after filed num {}".format(input_query, len(results)))
            for result in results:
                reduced_fields.append(input_fields_map.get(result[0], ""))

        except Exception as e:
            logger.error(e)
            logger.error("向量索引可能有问题， 对query {} 不做降维处理".format(input_query))
            return input_fields
        return reduced_fields

    async def adata_view_reduce_v3(self, input_query, input_fields, num=30, input_common_fields=[]):
        """异步版本的data_view_reduce_v3"""
        if num < 1:
            return input_fields
        if len(input_query) == 0:
            return input_fields
        if len(input_fields) <= num:
            return input_fields
        logger.info("async reduce dimension query {} before filed num {}".format(input_query, len(input_fields)))
        logger.info("async common fields {}".format(input_common_fields))
        reduced_fields = []
        input_fields_map = dict()
        input_texts = {}
        for field in input_fields:
            input_fields_map[field["original_name"]] = field
            input_texts[field["original_name"]] = f"{field['original_name']} {field['display_name']}"

        try:
            logger.info(f"async input_texts: {input_texts}, input_common_fields: {input_common_fields}")
            hybrid_retriever = HybridRetriever(self.embedding, input_texts, input_common_fields)
            logger.info(f"async hybrid_retriever: {hybrid_retriever}")
            await hybrid_retriever.abuild()
            results = await hybrid_retriever.asearch(input_query, num, bm25mode="okapi")
            logger.info(f"async results: {results}")
            logger.info("async reduce dimension query {} after filed num {}".format(input_query, len(results)))
            for result in results:
                reduced_fields.append(input_fields_map.get(result[0], ""))

        except Exception as e:
            logger.error(e)
            logger.error("async 向量索引可能有问题， 对query {} 不做降维处理".format(input_query))
            return input_fields
        return reduced_fields

    async def a_metric_reduce_v3(self, input_query, input_analysis_dimensions, num=30, date_mark_field_id=""):
        """异步版本的metric_reduce_v3，用于减少分析维度的数量"""
        if num < 1:
            return input_analysis_dimensions
        if len(input_query) == 0:
            return input_analysis_dimensions
        if len(input_analysis_dimensions) <= num:
            return input_analysis_dimensions
        logger.info("async reduce dimension query {} before filed num {}".format(input_query, len(input_analysis_dimensions)))
        logger.info("async date_mark_field_id {}".format(date_mark_field_id))
        reduced_dimensions = []
        input_dimensions_map = dict()
        input_texts = {}
        force_retrieval_keys = []
        
        for dimension in input_analysis_dimensions:
            # 使用 field_id 作为唯一标识，参考 indicator_reduce 的实现
            field_id = dimension.get("field_id") or dimension.get("id") or dimension.get("name")
            input_dimensions_map[field_id] = dimension
            # 构建文本：使用 business_name 或 name，参考 indicator_reduce 的实现
            business_name = dimension.get("business_name") or dimension.get("name", "")
            display_name = dimension.get("display_name", "")
            input_text = f"{business_name} {display_name}".strip()
            input_texts[field_id] = input_text
            
            # 如果是指定的日期字段，添加到强制检索列表中
            if date_mark_field_id and field_id == date_mark_field_id:
                force_retrieval_keys.append(field_id)

        try:
            logger.info(f"async input_texts: {input_texts}, force_retrieval_keys: {force_retrieval_keys}")
            hybrid_retriever = HybridRetriever(self.embedding, input_texts, force_retrieval_keys=force_retrieval_keys)
            logger.info(f"async hybrid_retriever: {hybrid_retriever}")
            await hybrid_retriever.abuild()
            results = await hybrid_retriever.asearch(input_query, num, bm25mode="okapi")
            logger.info(f"async results: {results}")
            logger.info("async reduce dimension query {} after filed num {}".format(input_query, len(results)))
            for result in results:
                dimension = input_dimensions_map.get(result[0])
                if dimension:
                    reduced_dimensions.append(dimension)

        except Exception as e:
            logger.error(e)
            logger.error("async 向量索引可能有问题， 对query {} 不做降维处理".format(input_query))
            traceback.print_exc()
            return input_analysis_dimensions
        return reduced_dimensions

    def indicator_reduce_v2(self, input_query, input_analysis_dimensions, num=30):
        if num < 1:
            return input_analysis_dimensions
        if len(input_query) == 0:
            return input_analysis_dimensions
        if len(input_analysis_dimensions) <= num:
            return input_analysis_dimensions
        logger.info("reduce dimension query {} before filed num {}".format(input_query, len(input_analysis_dimensions)))
        try:
            q_embed = self.get_embedding(input_query)
            analysis_dimensions_info_list = []
            for analysis_dimensions in input_analysis_dimensions:
                analysis_dimensions_info = analysis_dimensions["name"] + " " + analysis_dimensions["display_name"]
                analysis_dimensions_vec = self.get_embedding(analysis_dimensions_info)
                score = cosine_similarity(q_embed, analysis_dimensions_vec)
                analysis_dimensions_info_list.append((score, analysis_dimensions))
            analysis_dimensions_info_list.sort(key=lambda x: x[0], reverse=True)
            analysis_dimensions_info_res = [filed[1] for filed in analysis_dimensions_info_list[:num]]
            logger.info("reduce dimension  query {} after filed num {}".format(input_query, len(analysis_dimensions_info_res)))
        except Exception as e:
            logger.error(e)
            logger.error("向量索引可能有问题， 对query {} 不做降维处理".format(input_query))
            return input_analysis_dimensions
        return analysis_dimensions_info_res


    def indicator_reduce(
            self,
            input_query,
            input_analysis_dimensions,
            num=30,
            date_mark_field_id=""
        ):
        if num < 1:
            return input_analysis_dimensions
        if len(input_query) == 0:
            return input_analysis_dimensions
        if len(input_analysis_dimensions) <= num:
            return input_analysis_dimensions
        logger.info("reduce dimension query {} before filed num {}".format(input_query, len(input_analysis_dimensions)))
        input_analysis_dimensions_map = dict()
        for analysis_dimensions in input_analysis_dimensions:
            input_analysis_dimensions_map[analysis_dimensions["field_id"]] = analysis_dimensions
        try:
            q_embed = self.get_embedding(input_query)
            analysis_dimensions_info_list = []

            input_texts = [field["business_name"] for field in input_analysis_dimensions]
            input_ids = [field["field_id"] for field in input_analysis_dimensions]

            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = []
                for i in range(0, len(input_texts), self.batch_size):
                    batch_texts = input_texts[i:i+self.batch_size]
                    batch_ids = input_ids[i:i+self.batch_size]
                    if batch_texts:
                        futures.append(executor.submit(self.get_more_embedding_by_batch, batch_texts, batch_ids))

                for future in concurrent.futures.as_completed(futures):
                    field_vecs = future.result()
                    for field_id, field_vec in field_vecs:
                        if field_id == date_mark_field_id:
                            score = 1.0
                        else:
                            score = cosine_similarity(q_embed, field_vec)
                    analysis_dimensions_info_list.append((score, field_id))

            analysis_dimensions_info_list.sort(key=lambda x: x[0], reverse=True)
            analysis_dimensions_info_res = [input_analysis_dimensions_map[field[1]] for field in analysis_dimensions_info_list[:num]]
            logger.info("reduce dimension  query {} after filed num {}".format(input_query, len(analysis_dimensions_info_res)))
        except Exception as e:
            logger.error(e)
            logger.error("向量索引可能有问题， 对query {} 不做降维处理".format(input_query))
            return input_analysis_dimensions
        return analysis_dimensions_info_res
