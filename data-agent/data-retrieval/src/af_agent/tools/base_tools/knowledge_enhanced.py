import traceback
from enum import Enum
from typing import Any, Optional, Union, List
from af_agent.errors import KnowledgeEnhancedError
from af_agent.logs.logger import logger
from af_agent.api.ad_api import ad_builder_get_kg_info, ad_builder_download_lexicon, ad_opensearch_connector, \
    AD_CONNECT, ad_builder_get_kg_info_async, ad_opensearch_with_kgid_connector_async, \
    ad_opensearch_with_kgid_connector
from af_agent.tools.base import (
    ToolName,
    async_construct_final_answer,
    construct_final_answer,
    AFTool,
    ToolMultipleResult
)
from langchain.pydantic_v1 import BaseModel, Field
import jieba
import ahocorasick
from typing import Type
from textwrap import dedent
from af_agent.sessions.redis_session import RedisHistorySession
from af_agent.tools.base import api_tool_decorator
from af_agent.utils.stop_word import get_default_stop_words
import json
from af_agent.settings import get_settings

settings = get_settings()


class KnowledgeEnhancedToolModel(BaseModel):
    query: str = Field(..., description="需要进行知识增强的文本,包含需要查询的关键信息, 类型是 str")


_TOOL_DESCS = dedent(
f"""
知识增强工具，工具包含以下能力： a. 知识图谱搜索； b. 同义词搜索； c. 关键词排序，调用方式为 {ToolName.from_knowledge_enhanced.value}(query: str)

**工具须知**: 
- 每次调用获取数据前，都**必须**首先调用 {ToolName.from_knowledge_enhanced.value} 工具进行知识增强
""")

class KnowledgeEnhancedTool(AFTool):
    name: str = ToolName.from_knowledge_enhanced.value
    description: str = _TOOL_DESCS
    args_schema: Type[BaseModel] = KnowledgeEnhancedToolModel
    kg_id: Union[str, List] = None  # 分析维度图谱
    synonym_id: str = ""  # 同义词库
    word_id: str = ""  # 自定义词库
    sep: str = ";"
    query: str = ''
    # 添加session
    session: Optional[RedisHistorySession] = None
    ad_connect: AD_CONNECT = None
    ad_appid: str = ""
    token: str = ""
    kg_type: str = "default" # 图谱类型 默认手动构建的分析维度图谱 default 和基于主题专题模型构建的图谱 model
    kg_info: dict = dict() # 图谱信息，根据kg_id获取

    def __init__(self, kg_id: Union[str, List], synonym_id: str, word_id: str, token: str, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.kg_id = kg_id
        self.synonym_id = synonym_id
        self.word_id = word_id
        self.token = token

        if settings.AD_GATEWAY_URL:
            self.ad_connect = AD_CONNECT()
            self.ad_appid = self.ad_connect.get_appid()
        else:
            self.ad_appid = ""

        # 图谱信息
        self.kg_info = self.get_kg_info()
        logger.info("图谱信息 {}".format(self.kg_info))


    @construct_final_answer
    def _run(self, query: str) -> list:
        logger.debug(f"知识增强 run : {query}")
        self.query = query
        try:
            result = self.finally_fun()
        except Exception as e:
            tb_str = traceback.format_exc()
            logger.info(f"Sailor工具执行错误，实际错误为{tb_str}")
            result = [{}]
        # print("最终返回结果为", *result, sep='\n')
        logger.debug(f"知识增强 _run : {result}")

        if self.session:
            self.session.add_agent_logs(
                self._result_cache_key,
                logs={'result': result}
            )
        return json.dumps(result, ensure_ascii=False)

    @async_construct_final_answer
    async def _arun(
            self,
            query: str
    ) -> list:
        logger.debug(f"知识增强 arun : {query}")
        self.query = query
        try:
            result = await self.finally_fun_async()
        except Exception as e:
            tb_str = traceback.format_exc()
            logger.info(f"Sailor工具执行错误，实际错误为{tb_str}")
            result = [{}]
        # print("最终返回结果为", *result, sep='\n')
        logger.debug(f"知识增强 arun : {result}")
        if self.session:
            self.session.add_agent_logs(
                self._result_cache_key,
                logs={'result': result}
            )
        
        return json.dumps(result, ensure_ascii=False)


    def syns_run(self):
        if not self.synonym_id:
            actrie = None
            synonym_to_main_dict = None
        else:
            logger.debug(f"syns_run -> self.synonym_id: {self.synonym_id}")

            # 这里暂时处理多个同义词词库问题，词库格式必须通过英文逗号格开
            synonym_id_list = self.synonym_id.split(",")
            synonym_to_main_dict = {}
            actrie = None
            for synonym_id in synonym_id_list:
                synonym_id = synonym_id.strip()
                if len(synonym_id) == 0:
                    continue
                if not synonym_id.isdigit():
                    continue
                line_synonym = self.get_words_from_ad(synonym_id, 'synonym_id')
                # print(f"line_synonym : {line_synonym}")
                if len(line_synonym) == 0:
                    continue
                for line in line_synonym:
                    if line:
                        line = line.strip()
                        parts = line.split(";")  # 假设词库中使用的是中文逗号
                        main_word = parts[0]
                        synonyms = parts[1:]

                        if actrie is None:
                            actrie = ahocorasick.Automaton()

                        # if main_word:
                        #     actrie.add_word(main_word, (main_word,))

                        for synonym in synonyms:
                            if actrie is None:
                                actrie = ahocorasick.Automaton()
                            actrie.add_word(synonym, (synonym, ))
                            if synonym in synonym_to_main_dict.keys():
                                synonym_to_main_dict[synonym].append(main_word)
                            else:
                                synonym_to_main_dict[synonym] = []
                                synonym_to_main_dict[synonym].append(main_word)
                # print(synonym_to_main_dict)

            if actrie is not None:
                actrie.make_automaton()

        double_syns = 0
        if not self.word_id:
            wordlist = None
        else:
            logger.debug(f"syns_run -> self.word_id: {self.word_id}")

            # 这里暂时处理多个自定义词库问题，词库格式必须通过英文逗号格开
            wordlist = None
            word_id_list = self.word_id.split(",")

            for word_id in word_id_list:
                word_id = word_id.strip()
                if len(word_id) == 0:
                    continue
                if not word_id.isdigit():
                    continue
                lines = self.get_words_from_ad(word_id, 'word_id')
                for line in lines:
                    n_word = line.replace('\t1\tn', '').strip()
                    if len(n_word) == 0:
                        continue
                    if wordlist is None:
                        wordlist = []
                    wordlist.append(n_word)
            lines = self.get_words_from_ad(word_id, 'word_id')
            wordlist = [line.replace('\t1\tn', '') for line in lines]
            # logger.debug(f"syns_run -> wordlist: {wordlist}")
            # logger.debug(f"syns_run -> wordlist: {wordlist}")
        # print(f"actrie : {actrie}, wordlist : {wordlist}, synonym_to_main_dict: {synonym_to_main_dict}")
        words, query_cuts, all_syns_re = self.cal_queries(
            actrie, wordlist, synonym_to_main_dict)
        product_list = []
        for i in query_cuts:
            if len(i['synonym']) >= 1:
                product_list.append(i['synonym'])
                if len(i['synonym']) > 1:
                    double_syns += 1
        print("分词结果为", *query_cuts, sep='\n')
        print("初始找到的同义词为", all_syns_re)
        print("找到的同义词为", product_list)

        return query_cuts, product_list, words, double_syns

    # 从AD加载同义词库并且整理,构建同义词actrie
    def get_words_from_ad(self, actrie_id, id_name):
        try:
            words_content = ad_builder_download_lexicon(
                actrie_id, self.ad_appid, self.token)
            if not isinstance(words_content, str):
                logger.error('Download words dict failed.')
                msg = words_content
                if 'LexiconIdNotExist' in msg['ErrorCode']:
                    logger.info(
                        'Please check the {} in config file.').__format__(id_name)
                    raise KnowledgeEnhancedError(Exception)
                elif 'ParamError' in msg['ErrorCode']:
                    raise KnowledgeEnhancedError(Exception)
                else:
                    raise KnowledgeEnhancedError(Exception)
            lines = words_content.split('\n')
            lines.pop(0)
            return lines
        except Exception as e:
            logger.info(e)
            return []

    def cal_queries(self, actrie, wordlist, synonym_to_main_dict):
        query_cuts = []
        all_syns = []
        if wordlist is not None:
            for w in wordlist:
                nw = w.split('\\t1\\tn')[0]
                jieba.add_word(nw, len(nw) * 1000, 'n')
                jieba.suggest_freq(nw, tune=True)
        words = jieba.lcut(self.query, cut_all=False)
        # 从actrie获取同义词
        if actrie and synonym_to_main_dict:
            # 原代码中 iter_long 在 overlap 的情况下有 bug，比如 23年，23年度，Query: 23年度，可能匹配的是 23 年度
            for end_index, (main_word,) in actrie.iter(self.query):
                source_word = self.query[end_index -
                                         len(main_word) + 1:end_index + 1]
                if source_word in words and source_word not in all_syns:
                    all_syns.append(source_word)
                    query_cuts.append(
                        {"source": source_word, "synonym": synonym_to_main_dict[source_word]})
                else:
                    continue
        for i in [w for w in words if w not in all_syns]:
            query_cuts.append({
                "source": i,
                "synonym": [],
            })
        return words, query_cuts, all_syns

    async def get_space_name_async(self):
        if self.kg_id:
            kg_otl = await ad_builder_get_kg_info_async(self.kg_id, self.ad_appid, self.token)

            kg_otl = kg_otl['res']
            if isinstance(kg_otl['graph_baseInfo'], list):
                space_name = kg_otl['graph_baseInfo'][0]['graph_DBName']
            else:
                space_name = kg_otl['graph_baseInfo']['graph_DBName']
        else:
            space_name = ""
        return space_name

    def get_space_name(self):
        if self.kg_id:
            kg_otl = ad_builder_get_kg_info(self.kg_id, self.ad_appid, self.token)
            kg_otl = kg_otl['res']
            if isinstance(kg_otl['graph_baseInfo'], list):
                space_name = kg_otl['graph_baseInfo'][0]['graph_DBName']
            else:
                space_name = kg_otl['graph_baseInfo']['graph_DBName']
        else:
            space_name = ""
        return space_name
    def get_kg_info(self):
        kg_info = dict()
        if self.kg_id:
            kg_id_list = []
            if isinstance(self.kg_id, str):
                kg_id_list.append(self.kg_id)
            elif isinstance(self.kg_id, list):
                kg_id_list = self.kg_id
            try:
                for kg_id in kg_id_list:
                    space_name = ""
                    kg_otl = ad_builder_get_kg_info(kg_id, self.ad_appid, self.token)
                    kg_otl = kg_otl['res']
                    if isinstance(kg_otl['graph_baseInfo'], list):
                        space_name = kg_otl['graph_baseInfo'][0]['graph_DBName']
                    else:
                        space_name = kg_otl['graph_baseInfo']['graph_DBName']
                    kg_info[kg_id] = {"space_name": space_name}
            except Exception as e:
                traceback.print_exc()
                logger.error("获取图谱本体信息失败")
        return kg_info

    async def finally_fun_async(self):
        # space_name = await self.get_space_name_async()
        query_cuts, product_list, words, double_syns = self.syns_run()
        # logger.debug(f"finally_fun_async -> product_list: {product_list}")
        result = []
        if self.kg_id:
            for kg_id, kg_value in self.kg_info.items():
                if double_syns == 1:

                    for i in product_list:
                        if len(i) == 1:
                            words.append(i[0])
                    for product in product_list:
                        if len(product) > 1:
                            for j in product:
                                words.append(j)
                                logger.info('用于查找维度值的关键词为:{}'.format(words))
                                if self.kg_type == "default":
                                    result_in = await search_by_keyword_async_with_kgid(self.ad_appid, kg_id, kg_value["space_name"],
                                                                                        words)
                                else:
                                    logger.info("使用模型图谱进行知识增强")
                                    result_in = await search_by_keyword_async_with_kgid_with_model(self.ad_appid, kg_id, kg_value["space_name"],
                                                                                        words)
                                words.remove(j)
                                for value in result_in:
                                    result.append(value)
                else:
                    for p in product_list:
                        for i in p:
                            words.append(i)
                    if self.kg_type == "default":
                        result_in = await search_by_keyword_async_with_kgid(self.ad_appid, kg_id, kg_value["space_name"], words, )
                    else:
                        result_in = await search_by_keyword_async_with_kgid_with_model(self.ad_appid, kg_id, kg_value["space_name"], words,
                                                                         )
                    for value in result_in:
                        result.append(value)
        else:
            # 添加分词结果
            logger.info("使用分词结果作为知识增强")
            for q in query_cuts:
                result.append(q)
        # print('最红返回结果',*result, sep='\n')
        logger.debug(f"知识增强 finally_fun_async : {result}")
        return result

    def finally_fun(self):
        logger.debug(f"知识增强 finally_fun : {self.query}")
        # space_name = self.get_space_name()
        query_cuts, product_list, words, double_syns = self.syns_run()
        logger.debug(f'{query_cuts}, {product_list}, {words}, {double_syns}')
        result = []
        if self.kg_id:
            for kg_id, kg_value in self.kg_info.items():
                if double_syns == 1:

                    for i in product_list:
                        if len(i) == 1:
                            words.append(i[0])
                    for product in product_list:
                        if len(product) > 1:
                            for j in product:
                                words.append(j)
                                print('用于查找维度值的关键词为', words)
                                if self.kg_type == "default":
                                    result_in = search_by_keyword_with_kgid(self.ad_appid, kg_id, kg_value["space_name"], words)
                                else:
                                    logger.info("使用模型图谱进行知识增强")
                                    result_in = search_by_keyword_with_kgid_with_model(self.ad_appid, kg_id, kg_value["space_name"], words)
                                words.remove(j)
                                for value in result_in:
                                    result.append(value)
                else:
                    for p in product_list:
                        for i in p:
                            words.append(i)
                    if self.kg_type == "default":
                        result_in = search_by_keyword_with_kgid(self.ad_appid, kg_id, kg_value["space_name"], words)
                    else:
                        logger.info("使用模型图谱进行知识增强")
                        result_in = search_by_keyword_with_kgid_with_model(self.ad_appid, kg_id, kg_value["space_name"], words)
                    for value in result_in:
                        result.append(value)
        else:

            logger.info("使用分词结果作为知识增强")
            # 使用分词结果
            for word in query_cuts:
                result.append(word)

        logger.debug(f"知识增强 finally_fun : {result}")
        return result
    
    def handle_result(
        self,
        log,
        ans_multiple: ToolMultipleResult
    ):
        if self.session:
            tool_res = self.session.get_agent_logs(
                self._result_cache_key
            )
        
            if tool_res:
                log['result'] = tool_res.get('result', [])
                
                # 知识增强不需要记录缓存
                ans_multiple.cache_keys.extend({
                    "tool_name": "knowledge_enhanced",
                    "data": log['result']
                })

    @classmethod
    @api_tool_decorator
    async def as_async_api_cls(
            cls,
            params: dict
    ):
        # lexicon Params
        dict = params.get('lexicon', {})
        kg_id = dict.get('kg_id', '')
        synonym_id = dict.get('synonym_id', '')
        word_id = dict.get('word_id', '')
        config_dict = params.get("config", {})
        tool = cls(kg_id=kg_id, synonym_id=synonym_id, word_id=word_id, **config_dict)

        # Input Params
        input = params.get("input", '')

        # invoke tool
        res = await tool.ainvoke(input=input)
        return res

    @staticmethod
    async def get_api_schema():
        inputs = {
            'lexicon': {
                'kg_id': '3064',
                'synonym_id': '13',
                'word_id': '12'
            },
            'config': {
                'session_type': 'in_memory',
                'session_id': '123',
            },
            'input': 'XX 和 YY 去年每天销量是多少?'
        }

        outputs = {
            "output": {
                "result": [{"brand": ["XX", "YY"]}]
            }
        }

        return {
            "post": {
                "summary": ToolName.from_knowledge_enhanced.value,
                "description": _TOOL_DESCS,
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "lexicon": {
                                        "type": "object",
                                        "description": "知识图谱、自定义词库、自定义词库配置信息",
                                        "properties": {
                                            "kg_id": {
                                                "type": "string",
                                                "description": "知识图谱ID"
                                            },
                                            "synonym_id": {
                                                "type": "string",
                                                "description": "同义词库ID"
                                            },
                                            "word_id": {
                                                "type": "string",
                                                "description": "自定义词库ID"
                                            }
                                        },
                                        "required": ["kg_id", "synonym_id", "word_id"]
                                    },
                                    "config": {
                                        "type": "object",
                                        "description": "工具配置参数",
                                        "properties": {
                                            "session_type": {
                                                "type": "string",
                                                "description": "会话类型",
                                                "enum": ["in_memory", "redis"],
                                                "default": "redis"
                                            },
                                            "session_id": {
                                                "type": "string",
                                                "description": "会话ID"
                                            }
                                        }
                                    },
                                    "input": {
                                        "type": "string",
                                        "description": "用户查询"
                                    }
                                },
                                "required": ["lexicon", "input"],
                                "example": inputs
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful operation",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                },
                                "example": outputs
                            }
                        }
                    }
                }
            }
        }


async def search_by_keyword_async_with_kgid(kg_id, space_name, cal_query, appid="", token="", entity_classes=["*"], kg_type="default"):
    logger.debug(f"search_by_keyword_async_with_kgid -> cal_query: {cal_query}")

    body1 = {
        "query": {
            "terms": {
                "name.keyword": cal_query
            }
        }
    }

    # {"terms": {"name.keyword": ["客户", "电商","中部大区", "北部大区"]}}
    logger.info("entity_class {}".format(entity_classes))
    res = await ad_opensearch_with_kgid_connector_async(kg_id, appid, token, body1, entity_classes)
    query_vertice = {}
    hits = res['hits']['hits']
    hits_keys = []
    if hits:
        for hit in hits:
            # 实体类名带有多个下划线，所以要获取space_name之后的，只获取最后一个下划线后的内容，不是完整的实体类名
            a = hit["_index"].replace(space_name + '_', '')
            hits_keys.append(a)
            if a in query_vertice.keys():
                query_vertice[a].append(hit['_source']["name"])
            else:
                query_vertice[a] = []
                query_vertice[a].append(hit['_source']["name"])
    query_step_2 = []
    # print('第一次查询结果', query_vertice)
    if len(query_vertice) > 1:
        logger.info("找到多个维度，需要进行维度关联")
        for key, value in query_vertice.items():
            query_vertice = {"terms": {key + '.keyword': value}}
            query_step_2.append(query_vertice)
    elif len(query_vertice) == 0:
        logger.info("没有找到结果")
        return [query_vertice]
    else:
        logger.info("找到1个维度，直接返回结果")
        finally_res = [query_vertice]
        logger.debug(f"知识增强 finally_fun : {finally_res}")
        return finally_res
    body2 = {
        "query": {
            "bool": {
                "should": query_step_2,
                "minimum_should_match": 2
            }
        },
        "size": 5000
    }
    logger.info("查询语句：{}".format(body2))
    # url2 = space_name + '_salesdata' + "/_search"
    # url2 = space_name + '_dimensioncombinations' + "/_search"
    try:
        res = await ad_opensearch_with_kgid_connector_async(
            kg_id, appid, token, body2,
            entity_classes=["dimensioncombinations"]
        )
        hits = res['hits']['hits']
    except:
        hits = []
        logger.info('opensearch查询报错')
    find_num = []
    for i, hit in enumerate(hits):
        re = {}
        if hits:
            for value in hits_keys:
                if value in hit["_source"].keys() and hit["_source"][value] in cal_query:
                    re[value] = hit["_source"][value]
        if re not in find_num:
            find_num.append(re)
    return find_num


async def search_by_keyword_async_with_kgid_with_model(kg_id, space_name, cal_query, appid="", token="", entity_classes=["*"]):
    logger.debug(f"search_by_keyword_async_with_kgid_with_model -> cal_query: {cal_query}")
    stop_words = get_default_stop_words()

    new_cut_query  = []
    for item in cal_query:
        if item in stop_words:
            continue
        new_cut_query.append(item)
    if len(new_cut_query) == 0:
        return []
    logger.debug(f"search_by_keyword_async_with_kgid 过滤停用词 -> cal_query: {new_cut_query}")
    find_num = []
    for query_word in new_cut_query:
        body1 = {
            "query": {
                "multi_match": {
                    "query": query_word,
                    "fields": ["*"],
                    "type": "cross_fields",

                    "operator": "and"
                }
            },
            "size": 10
        }
        logger.info("model query {}".format(body1))
        # {"terms": {"name.keyword": ["客户", "电商","中部大区", "北部大区"]}}
        res = ad_opensearch_with_kgid_connector(kg_id, appid, token, body1, ["*"])
        query_vertice = {}
        hits = res['hits']['hits']

        # logger.info("query result {}".format(hits))
        hits_keys = []
        if hits:
            for hit in hits:
                re = {}
                for key in hit["_source"].keys():
                    if query_word == hit["_source"][key]:
                        re[key] = [hit["_source"][key]]

                    # for q in cal_query:
                    #     if q in hit["_source"][key]:
                    #         re[key] =[hit["_source"][key]]
                    #         break
                if re not in find_num:
                    find_num.append(re)
    return find_num

def search_by_keyword_with_kgid(kg_id, space_name, cal_query, appid="", token="", entity_classes=["*"]):
    logger.debug(f"search_by_keyword_with_kgid -> cal_query: {cal_query}")

    body1 = {
        "query": {
            "terms": {
                "name.keyword": cal_query
            }
        }
    }
    # {"terms": {"name.keyword": ["客户", "电商","中部大区", "北部大区"]}}
    res = ad_opensearch_with_kgid_connector(kg_id, appid, token, body1, entity_classes)
    query_vertice = {}
    hits = res['hits']['hits']
    hits_keys = []
    if hits:
        for hit in hits:
            a = hit["_index"].replace(space_name + '_', '')
            hits_keys.append(a)
            if a in query_vertice.keys():
                query_vertice[a].append(hit['_source']["name"])
            else:
                query_vertice[a] = []
                query_vertice[a].append(hit['_source']["name"])
    query_step_2 = []
    # print('第一次查询结果', json.dumps(query_vertice, ensure_ascii=False, indent=4))
    if len(query_vertice) > 1:
        logger.info("找到多个维度，需要进行维度关联")
        for key, value in query_vertice.items():
            query_vertice = {"terms": {key + '.keyword': value}}
            query_step_2.append(query_vertice)

    elif len(query_vertice) == 0:
        logger.info("没有找到结果")
        return [query_vertice]
    else:
        logger.info("找到1个维度，直接返回结果")
        finally_res = [query_vertice]
        logger.debug(f"知识增强 finally_fun : {finally_res}")
        return finally_res
    body2 = {
        "query": {
            "bool": {
                "should": query_step_2,
                "minimum_should_match": 2
            }
        },
        "size": 5000
    }
    logger.info("查询语句：{}".format(body2))
    # url2 = space_name + '_salesdata' + "/_search"
    # url2 = space_name + '_dimensioncombinations' + "/_search"
    try:
        res = ad_opensearch_with_kgid_connector(kg_id, appid, token, body2, entity_classes=["dimensioncombinations"])
        hits = res['hits']['hits']
    except:
        hits = []
        logger.info('opensearch查询报错')
    find_num = []
    for i, hit in enumerate(hits):
        re = {}
        if hits:
            for value in hits_keys:
                if value in hit["_source"].keys() and hit["_source"][value] in cal_query:
                    re[value] = hit["_source"][value]
        if re not in find_num:
            find_num.append(re)
    return find_num

def search_by_keyword_with_kgid_with_model(kg_id, space_name, cal_query, appid="", token="", entity_classes=["*"]):
    logger.debug(f"search_by_keyword_with_kgid_with_model -> cal_query: {cal_query}")
    stop_words = get_default_stop_words()

    new_cut_query = []
    for item in cal_query:
        if item in stop_words:
            continue
        new_cut_query.append(item)
    if len(new_cut_query) == 0:
        return []
    logger.debug(f"search_by_keyword_with_kgid_with_model 过滤停用词 -> cal_query: {new_cut_query}")

    find_num = []
    for query_word in new_cut_query:
        body1 = {
            "query": {
                "multi_match": {
                    "query": query_word,
                    "fields": ["*"],
                    "type": "cross_fields",

                    "operator": "and"
                }
            },
            "size": 10
        }
        logger.info("model query {}".format(body1))
        # {"terms": {"name.keyword": ["客户", "电商","中部大区", "北部大区"]}}
        res = ad_opensearch_with_kgid_connector(kg_id, appid, token, body1, ["*"])
        query_vertice = {}
        hits = res['hits']['hits']

        logger.info("query result {}".format(hits))
        hits_keys = []
        if hits:
            for hit in hits:
                re = {}
                for key in hit["_source"].keys():
                    if query_word == hit["_source"][key]:
                        re[key] = [hit["_source"][key]]
                    # for q in cal_query:
                    #     if q in hit["_source"][key]:
                    #         re[key] =[hit["_source"][key]]
                    #         break
                if re not in find_num:
                    find_num.append(re)
    return find_num

if __name__ == '__main__':
    tool = KnowledgeEnhancedTool(
        kg_id="605",
        synonym_id="9",
        word_id="8"
    )
    query = "查询证券代码为2790的公司，其曾用名的变更原因是什么？"

    async def amain():
        res = await tool.ainvoke(
            query
        )
        print("异步结果#################################", res)


    def main2():
        import asyncio

        asyncio.run(amain())


    main2()


    def main():
        res = tool.invoke(query)
        print("同步结果#################################3333", res)


    main()
