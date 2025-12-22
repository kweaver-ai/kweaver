import json
import re
import sys
from collections import Counter

import aiohttp
import math
import numpy as np
import pandas as pd

import data_retrieval.tools.graph_tools.common.stand_log as log_oper
from data_retrieval.tools.graph_tools.common import errors
from data_retrieval.tools.graph_tools.common.config import Config
from data_retrieval.tools.graph_tools.common.errors import CodeException
from data_retrieval.tools.graph_tools.common.stand_log import StandLogger
from data_retrieval.tools.graph_tools.driven.external.embedding_client import embedding_client

http_max_initial_line_length = 16384  # opensearch http.max_initial_line_length配置


class OpenSearchConnector(object):
    """
    OpenSearch Connect and Search API
    从search-engine-app的Executors/utils里搬来的
    """

    def __init__(self, ips: list, ports: list, user: str, password: str):
        """
        Initialize a Connector
        :param ips: stand-alone service ip or distributed service ips
        :param ports: stand-alone service port or distributed service ports
        :param user: username to connect the service
        :param password: user password to connect the service
        """
        self.ip = ips[0]
        self.port = ports[0]
        self.user = user
        self.password = password
        self.headers = {
            "Accept-Encoding": "gzip,deflate",
            "Content-Type": "application/json",
            "Connection": "close"
        }
        self.pre_url = 'http://{ip}:{port}/'.format(ip=self.ip, port=self.port)

    async def execute(self, url, body=None, timeout=300.0):
        """
        execute a query
        """
        timeout = aiohttp.ClientTimeout(total=timeout)
        auth = aiohttp.BasicAuth(login=self.user, password=self.password)
        async with aiohttp.ClientSession(auth=auth) as session:
            url = self.pre_url + url
            if len(url) > http_max_initial_line_length:
                raise Exception("Opensearch supports a maximum URL length of 16k, with too many indexes exceeding the "
                                "maximum length.")
            if '_msearch' in url:
                response = await session.get(url, timeout=timeout, data=body, verify_ssl=False, headers=self.headers)
            elif body:
                response = await session.get(url, timeout=timeout, json=body, verify_ssl=False, headers=self.headers)
            else:
                response = await session.get(url, timeout=timeout, verify_ssl=False, headers=self.headers)
            result = await response.content.read()
            if response.status == 401:
                raise Exception('opensearch参数配置错误')
            result = json.loads(result.decode(), strict=False)
            if response.status != 200:
                pass
                # todo:x
                # raise NewErrorBase(
                #     status.HTTP_500_INTERNAL_SERVER_ERROR, ErrVal.Err_OpenSearch_Err,
                #     result)
        return result

    async def search(self, query="", page=1, size=10, indexs=None, fields=None, bm25_weight=1, phrase_match_weight=0,
                     max_return_num=1000):
        outputs = {}
        if indexs is None:
            raise Exception("The opensearch index cannot be empty.")
        # if fields is None:
        #     fields = ["_id"]
        if not indexs:
            outputs["count"] = 0
            outputs["entities"] = []
            return outputs
        url = ",".join(set(indexs)) + "/_search"
        # 不开启重排使用默认bm25请求体
        if bm25_weight == 1 and phrase_match_weight == 0:
            body = {
                "_source": [""],
                "query": {
                    "bool": {
                        "must": {
                            "multi_match": {
                                "type": "best_fields",
                                "query": query.strip().lower(),
                                "boost": 0.5
                            }
                        },
                        "should": {
                            "multi_match": {
                                "type": "phrase",
                                "query": query.strip().lower(),
                                "boost": 2
                            }
                        }
                    }
                },
                "from": (page - 1) * size,
                "size": size
            }
            if fields:
                body['query']['bool']['must']['multi_match']['fields'] = fields
                body['query']['bool']['should']['multi_match']['fields'] = fields

            entities = []
            results = await self.execute(url=url, body=body)
            total = min(max_return_num, results.get("hits", {}).get("total", {}).get("value", 0))
            for line in results.get("hits", {}).get("hits", []):
                temp = {}
                temp["vid"] = line["_id"]
                temp["score"] = float('{:.2f}'.format(line["_score"]))
                temp["_index"] = line["_index"]
                entities.append(temp)
            outputs["count"] = total
            outputs["entities"] = entities
            return outputs
        body = {
            "_source": [""],
            "query": {
                "bool": {
                    "must": {
                        "multi_match": {
                            "type": "best_fields",
                            "query": query.strip().lower(),
                            "boost": 0.5
                        }
                    },
                    "should": {
                        "multi_match": {
                            "type": "phrase",
                            "query": query.strip().lower(),
                            "boost": 2
                        }
                    }
                }
            },
            "highlight": {
                "fields": {
                    "*": {}
                }
            },
            "from": 0,
            "size": 300
        }
        if fields:
            body['query']['bool']['must']['multi_match']['fields'] = fields
            body['query']['bool']['should']['multi_match']['fields'] = fields
        entities = []
        results = await self.execute(url=url, body=body)
        total = min(max_return_num, results.get("hits", {}).get("total", {}).get("value", 0))
        min_rescore = 1
        hit_val = ''
        for hit_rank, line in enumerate(results.get("hits", {}).get("hits", [])):
            # 因为性能问题,最大支持前300重排
            if hit_rank < 300:
                temp = {}
                temp["vid"] = line["_id"]
                total_field_term_len = 0
                cur_hit_val = ''
                cur_hit_field = ''
                # 通过highlight查看BM25评分规则，并对其进行重拍计算，重拍得分公式
                # max同一实体不同属性下的((query分词命中属性的分词词长*query分词命中属性的分词词长)/(命中属性的文本长度))
                for field, singl_filde_highlight in line["highlight"].items():
                    highlight_str = singl_filde_highlight[0]
                    term_split_list = re.findall(r'<em>(.*?)</em>', highlight_str)
                    hash_sub_str = Counter(term_split_list)
                    advgl = len(highlight_str.replace('<em>', '').replace('</em>', ''))
                    cur_prop = highlight_str.replace('<em>', '').replace('</em>', '')

                    term_fre_and_len_score = sum(len(k) * v for k, v in hash_sub_str.items())
                    shot_percent = term_fre_and_len_score / advgl
                    if shot_percent == 1:  # 这一步是为了区分属性完全匹配情况下的长度权重问题
                        shot_percent *= term_fre_and_len_score
                    if shot_percent > total_field_term_len:
                        total_field_term_len = shot_percent
                        cur_hit_val = cur_prop
                        cur_hit_field = field
                    # total_field_term_len = max(total_field_term_len, shot_percent)
                re_score = bm25_weight * float(
                    '{:.2f}'.format(line["_score"])) + phrase_match_weight * total_field_term_len
                min_rescore = min(min_rescore, re_score)
                temp['hit_prop'] = cur_hit_field
                temp['hit_value'] = cur_hit_val
                temp["score"] = re_score
                temp["_index"] = line["_index"]
                entities.append(temp)
            else:
                temp = {}
                temp["vid"] = line["_id"]
                temp["score"] = min_rescore  # min_rescore
                temp["_index"] = line["_index"]
                temp['hit_prop'] = ''
                temp['hit_value'] = ''
                entities.append(temp)
        sorted_entities = sorted(entities, key=lambda x: x['score'], reverse=True)
        outputs["count"] = total
        outputs["entities"] = sorted_entities[max((page - 1) * size, 0):min((page * size), len(sorted_entities))]
        return outputs

    async def scalar_quantizer(self, embedding):
        def get_positive_number(dataset, val):
            max = np.max(dataset)
            min = 0
            B = 127
            val = (val - min) / (max - min)
            val = (val * B)
            int_part = math.floor(val)
            frac_part = val - int_part

            if 0.5 < frac_part:
                bval = int_part + 1
            else:
                bval = int_part

            return int(bval)

        def get_negative_number(dataset, val):
            min = 0
            max = -np.min(dataset)
            B = 128
            val = (val - min) / (max - min)
            val = (val * B)
            int_part = math.floor(val)
            frac_part = val - int_part
            if 0.5 < frac_part:
                bval = int_part + 1
            else:
                bval = int_part

            return int(bval)

        b_embedding = []
        np_embedding = np.array(embedding)
        for i in embedding:
            if i > 0:
                b_embedding.append(get_positive_number(np_embedding, i))
            elif i < 0:
                b_embedding.append(get_negative_number(np_embedding, i))
            else:
                b_embedding.append(0)
        return b_embedding

    async def emb_msearch(self, query="", model_url=None, spacename_entity_dict=None, page=1, size=20,
                          max_return_num=1000):
        outputs = {}
        if model_url is None:
            raise Exception("The model_url cannot be empty.")
        if not spacename_entity_dict:
            raise Exception("please check graph_id is correct.")
        # 问题编码
        async with aiohttp.ClientSession() as session:
            async with session.post(model_url, json={"texts": [query.strip()]}, verify_ssl=False) as resp:
                res = await resp.text()
        query_float_embedding = json.loads(res)[0]
        query_byte_embedding = await self.scalar_quantizer(query_float_embedding)
        # nested ann 请求体生成
        float_requests_index = []
        byte_requests_index = []
        # 在这里对量化和不量化的向量索引做一个区分查询
        for _space_name, _quantized_entities_items in spacename_entity_dict.items():
            if _quantized_entities_items['quantized_flag'] == '0' or _quantized_entities_items['quantized_flag'] == 0:
                # 没量化则使用float请求
                for _single_entity_list in _quantized_entities_items['entity_emb_info']:
                    _entity_name = str(list(_single_entity_list.keys())[0])
                    _entity_fileds = _single_entity_list[_entity_name]
                    if _entity_fileds == []:  # 属性的向量编码为空则跳过该实体
                        continue
                    _os_entity_name = _entity_name.lower()
                    float_requests_index.append(_space_name + '_' + _os_entity_name)
            else:
                # 量化则使用Byte请求
                for _single_entity_list in _quantized_entities_items['entity_emb_info']:
                    _entity_name = str(list(_single_entity_list.keys())[0])
                    _entity_fileds = _single_entity_list[_entity_name]
                    if _entity_fileds == []:  # 属性的向量编码为空则跳过该实体
                        continue
                    _os_entity_name = _entity_name.lower()
                    byte_requests_index.append(_space_name + '_' + _os_entity_name)
        # 重组量化和没量化请求的答案
        entities = []
        float_results = {}
        byte_results = {}
        if float_requests_index:
            float_requests_url = ",".join(set(float_requests_index)) + '/_search'
            float_requests_body = {
                "_source": [""],
                "query": {
                    "nested": {
                        "path": "_vector768",
                        "query": {
                            "knn": {
                                "_vector768.vec": {
                                    "vector": query_float_embedding,
                                    "k": 50
                                }
                            }
                        }
                    }
                },
                "from": 0,
                "size": page * size
            }
            float_results = await self.execute(url=float_requests_url, body=float_requests_body)
        if byte_requests_index:
            # 如果有量化后的查询
            byte_requests_url = ",".join(set(byte_requests_index)) + '/_search'
            byte_requests_body = {
                "_source": [""],
                "query": {
                    "nested": {
                        "path": "_vector768",
                        "query": {
                            "knn": {
                                "_vector768.vec": {
                                    "vector": query_byte_embedding,
                                    "k": 50
                                }
                            }
                        }
                    }
                },
                "from": 0,
                "size": page * size
            }
            byte_results = await self.execute(url=byte_requests_url, body=byte_requests_body)
        byte_recall_number = byte_results.get("hits", {}).get("total", {}).get("value", 0)
        float_recall_number = float_results.get("hits", {}).get("total", {}).get("value", 0)
        total = min(max_return_num, byte_recall_number + float_recall_number)
        # 为混合匹配做准备
        if byte_recall_number == 0:  # 没有召回结果
            byte_pd_res = pd.DataFrame(columns=["_index", "_id", "_score"])
        else:
            byte_pd_res = pd.DataFrame(byte_results['hits']['hits'], columns=["_index", "_id", "_score"])
        if float_recall_number == 0:
            float_pd_res = pd.DataFrame(columns=["_index", "_id", "_score"])
        else:
            float_pd_res = pd.DataFrame(float_results['hits']['hits'], columns=["_index", "_id", "_score"])
        sorted_merge_pd_res = pd.concat([float_pd_res, byte_pd_res])
        sorted_merge_pd_res = sorted_merge_pd_res.sort_values(by=["_score"], ascending=False)
        sorted_merge_pd_res.reset_index(drop=True, inplace=True)
        for rank in range(max(0, (page - 1) * size), min(total, page * size)):
            _line = sorted_merge_pd_res.loc[rank]
            temp = {}
            temp["vid"] = _line["_id"]
            temp["score"] = _line["_score"]
            temp["_index"] = _line["_index"]
            entities.append(temp)
        outputs["count"] = total
        outputs["entities"] = entities
        return outputs, sorted_merge_pd_res

    async def comb_search(self, query="", model_url=None, spacename_entity_dict=None, page=1, size=20,
                          max_return_num=1000):
        outputs = {}
        # 权重配置
        weight_emb = 0.7
        weight_text = (1 - weight_emb)
        if model_url is None:
            raise Exception("The model_url cannot be empty.")
        if not spacename_entity_dict:
            raise Exception("please check graph_id is correct.")
        # 向量召回
        embedd_res, sorted_emb_pd_res = await self.emb_msearch(query, model_url, spacename_entity_dict, page, size,
                                                               max_return_num)
        emb_recall_number = embedd_res.get("count", 0)
        # 如果组合匹配中的向量匹配结果为空，直接返回
        if emb_recall_number == 0:
            sorted_emb_pd_res = pd.DataFrame(columns=["_index", "_id", "_score", "rrf_norm_emb_score"])
        else:  # rrf归一化embedding recall 分值0-1
            sorted_emb_pd_res["rrf_norm_emb_score"] = 1 / (sorted_emb_pd_res.index + 1)
        # 文本召回 默认BM25 不开启phrase_match
        text_recall_url_ls = []
        # 混合匹配中的文本匹配只会检测勾选了向量的实体
        for _space_name, _quantized_entities_items in spacename_entity_dict.items():
            for _single_entity_list in _quantized_entities_items['entity_emb_info']:
                _entity_name = str(list(_single_entity_list.keys())[0]).lower()
                text_recall_url_ls.append(_space_name + '_' + _entity_name)
        text_recall_url = ",".join(set(text_recall_url_ls)) + "/_search"
        body = {
            "_source": [""],
            "query": {
                "bool": {
                    "must": {
                        "multi_match": {
                            "type": "best_fields",
                            "query": query.strip().lower(),
                            "boost": 0.5
                        }
                    },
                    "should": {
                        "multi_match": {
                            "type": "phrase",
                            "query": query.strip().lower(),
                            "boost": 1,
                        }
                    }
                }
            },
            "from": 0,
            "size": page * size
        }
        entities = []
        text_response = await self.execute(url=text_recall_url, body=body)
        text_recall_number = min(max_return_num, text_response.get("hits", {}).get("total", {}).get("value", 0))
        # 处理文本召回结果
        if text_recall_number > 0:
            # 如果文本召回查出結果
            sorted_text_pd_res = pd.DataFrame(text_response['hits']['hits'], columns=["_index", "_id", "_score"])
            # #rrf归一化embedding recall 分值0-1
            sorted_text_pd_res["rrf_norm_text_score"] = 1 / (sorted_text_pd_res.index + 1)

            sorted_merge_pd_res = pd.merge(
                sorted_emb_pd_res[["_index", "_id", "_score", "rrf_norm_emb_score"]]
                .rename(columns={"_score": "original_cos_sim_score", "_index": "emb_index"}),
                sorted_text_pd_res[["_index", "_id", "_score", "rrf_norm_text_score"]].rename(
                    columns={"_score": "original_bm25_score", "_index": "text_index"}), on="_id", how="outer")

            # 非零值置零，索引为nan也置为0
            sorted_merge_pd_res = sorted_merge_pd_res.fillna(0)
            # 计算融合得分
            sorted_merge_pd_res["merge_score"] = sorted_merge_pd_res["rrf_norm_emb_score"] * weight_emb + \
                                                 sorted_merge_pd_res["rrf_norm_text_score"] * weight_text

            # 重排序
            sorted_merge_pd_res = sorted_merge_pd_res.sort_values(by=["merge_score"], ascending=False)
            sorted_merge_pd_res.reset_index(drop=True, inplace=True)
            # 文本和向量的合并，考虑到性能问题，不能取所有的文本进行合并，只能取二者的最大值
            total = min(max_return_num, max(emb_recall_number, text_recall_number))
            for rank in range(max(0, ((page - 1) * size)), min(total, (max(0, (page - 1) * size) + size))):
                _line = sorted_merge_pd_res.loc[rank]
                temp = {}
                temp["vid"] = _line["_id"]
                temp["score"] = float('{:.2f}'.format(_line["merge_score"]))
                # 两路召回 融合后必有一个索引
                if _line["emb_index"] != 0:
                    temp["_index"] = _line["emb_index"]
                else:
                    temp["_index"] = _line["text_index"]
                entities.append(temp)
        else:
            # 文本召回沒有結果
            if not embedd_res:
                # 文本没搜到结果,但是向量搜到结果
                total = len(sorted_emb_pd_res)
                for rank in range(max(0, ((page - 1) * size)), min(total, (max(0, (page - 1) * size) + size))):
                    _line = sorted_emb_pd_res.loc[rank]
                    temp = {}
                    temp["vid"] = _line["_id"]
                    temp["score"] = float('{:.2f}'.format(_line["rrf_norm_emb_score"]))
                    # 两路召回 融合后必有一个索引
                    temp["_index"] = _line["_index"]
                    entities.append(temp)
            else:
                # 文本没搜到,向量也没搜到
                total = 0
                entities = []
        outputs["count"] = total
        outputs["entities"] = entities

        return outputs

        # 定义结构体

    async def create_cot_schema(self, cot_index):
        # 获取节点数
        node_url = '_nodes'
        response = await self.execute(node_url)
        nodenum = response['_nodes']['total']
        replicanum = 1
        if nodenum == 1:
            replicanum = 0
        # 创建索引
        cot_url = self.pre_url + cot_index
        index_body = {
            "settings": {
                "number_of_shards": min(3, nodenum),
                "number_of_replicas": replicanum,
                "index": {
                    "knn": True,
                    "knn.algo_param.ef_search": 100
                }
            },
            "mappings": {
                "properties": {
                }
            }
        }
        text_filed_list = ['question', 'question_skeleton', 'ngql_skeleton', 'cot_content']
        vec_field_list = ['question_vec', 'question_skeleton_vec', 'ngql_skeleton_vec']
        fields = {}
        for filed in text_filed_list:
            fields[filed] = {
                "type": "text",
                "analyzer": "standard",
                "fields": {
                    "keyword": {
                        "type": "keyword"
                    }
                }
            }
        for filed in vec_field_list:
            fields[filed] = {
                "type": "knn_vector",
                "dimension": Config.EMBEDDING_DIMENSION,
                "method": {
                    "name": "hnsw",
                    "space_type": "cosinesimil",
                    "engine": "nmslib",
                    "parameters": {
                        "ef_construction": 128,
                        "m": 24
                    }
                }
            }
        index_body['mappings']['properties'] = fields
        # 创建index索引
        timeout = aiohttp.ClientTimeout(total=300)
        auth = aiohttp.BasicAuth(login=self.user, password=self.password)
        async with aiohttp.ClientSession(auth=auth) as session:
            if len(cot_url) > http_max_initial_line_length:
                raise Exception(
                    "Opensearch supports a maximum URL length of 16k, with too many indexes exceeding the "
                    "maximum length.")
            response = await session.put(cot_url, timeout=timeout, json=index_body, verify_ssl=False,
                                         headers=self.headers)
            result = await response.content.read()
            result = json.loads(result.decode(), strict=False)
            if response.status != 200:
                if result['error']['type'] == 'resource_already_exists_exception':
                    print('{}索引已存在，删除后重建索引'.format(cot_url))
                    async with aiohttp.ClientSession(auth=auth) as session:
                        response = await session.delete(url=cot_url, verify_ssl=False, headers=self.headers)
                        result = await response.content.read()
                        result = json.loads(result.decode(), strict=False)
                        if response.status != 200:
                            pass
                            # todo 报错处理
                            # raise NewErrorBase(
                            #     status.HTTP_500_INTERNAL_SERVER_ERROR, ErrVal.Err_OpenSearch_Err,
                            #     result)
                        print('{}索引删除完毕！'.format(cot_url))
                    async with aiohttp.ClientSession(auth=auth) as session:
                        response = await session.put(url=cot_url, json=index_body, verify_ssl=False,
                                                     headers=self.headers)
                        result = await response.content.read()
                        result = json.loads(result.decode(), strict=False)
                        if response.status != 200:
                            pass
                            # todo 报错处理
                            # raise NewErrorBase(
                            #     status.HTTP_500_INTERNAL_SERVER_ERROR, ErrVal.Err_OpenSearch_Err,
                            #     result)
                        print('{}索引重构完毕！'.format(cot_url))
                else:
                    pass
                    # todo 报错处理
                    # raise NewErrorBase(
                    #     status.HTTP_500_INTERNAL_SERVER_ERROR, ErrVal.Err_OpenSearch_Err,
                    #     result)

        print('创建{}索引完成'.format(cot_url))
        return response

    # 插入数据
    async def inseart_cot_data(self, cot_index, cot_contents: list):
        insert_url = self.pre_url + cot_index + '/_doc'
        auth = aiohttp.BasicAuth(login=self.user, password=self.password)
        for cot_content in cot_contents:
            # 创建插入请求体
            insert_body = {}
            # 获取cot_content内容
            question = cot_content.get('question', '')
            question_skeleton = cot_content.get('question_skeleton', '')
            # ngql_skeleton = cot_content.get['ngql_skeleton', '']
            cot_content = cot_content.get('cot_content', '')
            # 编码
            embedding_ls = await embedding_client.ado_embedding([question, question_skeleton])
            question_vec = embedding_ls[0]
            question_skeleton_vec = embedding_ls[1]
            # ngql_skeleton_vec = embedding_ls[2]
            # 组织insert请求体
            insert_body['question'] = question
            insert_body['question_skeleton'] = question_skeleton
            # insert_body['ngql_skeleton'] = ngql_skeleton
            insert_body['cot_content'] = cot_content
            insert_body['question_vec'] = question_vec
            insert_body['question_skeleton_vec'] = question_skeleton_vec
            # insert_body['ngql_skeleton_vec'] = ngql_skeleton_vec
            # 请求写入
            async with aiohttp.ClientSession(auth=auth) as session:
                response = await session.post(url=insert_url, json=insert_body, verify_ssl=False,
                                              headers=self.headers)
                result = await response.content.read()
                result = json.loads(result.decode(), strict=False)
                if response.status != 201:
                    pass
                    # todo 报错处理
                    # raise NewErrorBase(
                    #     status.HTTP_500_INTERNAL_SERVER_ERROR, ErrVal.Err_OpenSearch_Err,
                    #     result)
        print('写入{}索引完成'.format(insert_url))

    # 搜索测试
    async def emb_cot_search(self, cot_index, query, field_name: str):
        # 问题编码
        query_float_embedding = (await embedding_client.ado_embedding([query]))[0]
        # 构建请求体
        requests_body = {
            # "_source": [""],
            "query": {
                "knn": {
                    field_name: {
                        "vector": query_float_embedding,
                        "k": 50
                    }
                }
            },
            "size": 20
        }
        search_response = await self.execute(url=cot_index + '/_search', body=requests_body)
        return search_response

    async def create_index(self, index_name: str, index_body: dict):
        """ 创建索引 """
        index_url = self.pre_url + index_name
        # 创建index索引
        timeout = aiohttp.ClientTimeout(total=300)
        auth = aiohttp.BasicAuth(login=self.user, password=self.password)
        async with aiohttp.ClientSession(auth=auth) as session:
            response = await session.put(index_url, timeout=timeout, json=index_body, verify_ssl=False,
                                         headers=self.headers)
            result = await response.content.read()
            result = json.loads(result.decode(), strict=False)
            if response.status != 200:
                err = self.pre_url + " create_index error: {}".format(await response.text())
                error_log = log_oper.get_error_log(err, sys._getframe())
                StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                raise CodeException(errors.AgentApp_ExternalServiceError, err)

        StandLogger.info_log('opensearch 创建 {} 索引完成'.format(index_name))
        return result

    async def is_index_exists(self, index_name: str):
        """ 索引是否存在 """
        index_url = self.pre_url + index_name
        timeout = aiohttp.ClientTimeout(total=300)
        auth = aiohttp.BasicAuth(login=self.user, password=self.password)
        async with aiohttp.ClientSession(auth=auth) as session:
            response = await session.get(index_url, timeout=timeout, verify_ssl=False, headers=self.headers)
            if response.status == 200:
                return True
            else:
                return False

    async def insert_data(self, index_name: str, data: dict, doc_id=None):
        insert_url = self.pre_url + index_name + '/_doc'
        if doc_id:
            insert_url += '/' + doc_id
        auth = aiohttp.BasicAuth(login=self.user, password=self.password)
        async with aiohttp.ClientSession(auth=auth) as session:
            response = await session.post(url=insert_url, json=data, verify_ssl=False,
                                          headers=self.headers)
            result = await response.content.read()
            res_json = json.loads(result.decode(), strict=False)
            if response.status not in [200, 201]:
                err = self.pre_url + " insert_data error: {}".format(await response.text())
                error_log = log_oper.get_error_log(err, sys._getframe())
                StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                raise CodeException(errors.AgentApp_ExternalServiceError, err)
            doc_id = res_json['_id']
        StandLogger.info_log(f'opensearch 索引 {index_name} 写入文档 {doc_id} 完成')
        return doc_id

    async def delete_by_query(self, index_name: str, query: dict):
        delete_url = self.pre_url + index_name + '/_delete_by_query'
        auth = aiohttp.BasicAuth(login=self.user, password=self.password)
        async with aiohttp.ClientSession(auth=auth) as session:
            response = await session.post(url=delete_url, json=query, verify_ssl=False,
                                          headers=self.headers)
            result = await response.content.read()
            res_json = json.loads(result.decode(), strict=False)
            if response.status != 200:
                err = self.pre_url + " delete_by_query error: {}".format(await response.text())
                error_log = log_oper.get_error_log(err, sys._getframe())
                StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                raise CodeException(errors.AgentApp_ExternalServiceError, err)
            return res_json

    async def get_doc_by_ids(self, index_name: str, doc_ids: list) -> list:
        url = self.pre_url + index_name + '/_mget'
        auth = aiohttp.BasicAuth(login=self.user, password=self.password)
        body = {
            "ids": doc_ids
        }
        async with aiohttp.ClientSession(auth=auth) as session:
            response = await session.get(url=url, json=body, verify_ssl=False,
                                         headers=self.headers)
            if response.status != 200:
                err = self.pre_url + " get_doc_by_ids error: {}".format(await response.text())
                error_log = log_oper.get_error_log(err, sys._getframe())
                StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                raise CodeException(errors.AgentApp_ExternalServiceError, err)
            res_json = await response.text()
            res_json = json.loads(res_json, strict=False)
            return res_json['docs']


opensearch_engine = OpenSearchConnector(ips=Config.OPENSEARCH_HOST.split(','),
                                        ports=Config.OPENSEARCH_PORT.split(','),
                                        user=Config.OPENSEARCH_USER,
                                        password=Config.OPENSEARCH_PASS)
