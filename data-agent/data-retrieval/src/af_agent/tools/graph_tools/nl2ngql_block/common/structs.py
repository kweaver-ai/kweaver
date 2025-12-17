# -*- coding:utf-8 -*-
from dataclasses import dataclass, field
from typing import List, Union

from fastapi import Body, Header
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, model_validator

class Text2nGQLRequest(BaseModel):
    query: str = ""
    inner_llm: dict = {}
    inner_kg: dict
    background: str = ""
    rewrite_query: str = ""
    retrieval: bool = True
    retrieval_params: dict = {
        "score": 0.9,  # 相似度阈值
        "select_num": 5,  # 选择数量
        "label_name": "*",  # 标签名称
        "keywords_extract": True
    }
    history: list[dict] = []
    cache_cover: bool = False
    action: str = "nl2ngql"

    def __init__(self, **data):
        # 处理retrieval_params的合并
        if 'retrieval_params' in data:
            default_params = {
                "score": 0.9,
                "select_num": 5,
                "label_name": "*",  
                "keywords_extract": True
            }
            data['retrieval_params'] = {**default_params, **data['retrieval_params']}
        super().__init__(**data)

    @model_validator(mode='after')
    def validate_action_params(self):
        """根据action值验证必传参数"""
        if self.action == "nl2ngql":
            if not self.query:
                raise ValueError("当action为'nl2ngql'时，query为必传参数")
            if not self.inner_llm:
                raise ValueError("当action为'nl2ngql'时，inner_llm为必传参数")
            if not self.inner_kg:
                raise ValueError("当action为'nl2ngql'时，inner_kg为必传参数")
                
        elif self.action == "get_schema":
            if not self.inner_kg:
                raise ValueError("当action为'get_schema'时，inner_kg为必传参数")
                
        elif self.action == "keyword_retrieval":
            if not self.query:
                raise ValueError("当action为'keyword_retrieval'时，query为必传参数")
            if not self.inner_kg:
                raise ValueError("当action为'keyword_retrieval'时，inner_kg为必传参数")
            if not self.inner_llm:
                raise ValueError("当action为'keyword_retrieval'时，inner_llm为必传参数")
                
        else:
            raise ValueError(f"不支持的action值: {self.action}")
            
        return self

class RetrievalResponse(BaseModel):
    keyword_retrieval: Any = ""  # 关键词抽取结果
    template_question_retrieval: str = ""  # 模板召回结果
    value_retrieval: Any = ""  # 属性值检索，用于别名检索
    kg_node_retrieval: Any = ""  # 嵌套节点信息检索


class CandidateGeneratorResponse(BaseModel):
    # nGQL生成器的结果，目前就一种，将来可能扩展多种
    cot_generator: dict = {}


class QueriesFixResponse(BaseModel):
    # nGQL矫正后的结果，可能会有多个结果
    queries: List = []


class Summary(BaseModel):
    response: str = ""


class IntermediateResult(Text2nGQLRequest):

    headers: Dict[str, str] = {}
    schema: dict = {}  # 图谱所有schema节点、关系
    nebula_params: dict = {}  # 用于向量检索、图谱查询用
    redis_params: dict = {}  # 用于中间结果缓存用
    account_id: Optional[str] = None  # 账户ID
    account_type: Optional[str] = None  # 账户类型

    retrieval_values: RetrievalResponse = RetrievalResponse()
    candidate_queries: CandidateGeneratorResponse = CandidateGeneratorResponse()
    fixed_queries: QueriesFixResponse = QueriesFixResponse()


class Text2nGQLResponse(BaseModel):
    result: Dict = {}
    # full_result: Dict = {}


class HeaderParams:
    """请求头参数依赖类"""
    
    def __init__(
        self,
        account_type: str = Header(None, alias="x-account-type"),
        account_id: str = Header(None, alias="x-account-id"),
        content_type: str = Header("application/json"),
    ):
        self.content_type = content_type
        self.account_type = account_type
        self.account_id = account_id