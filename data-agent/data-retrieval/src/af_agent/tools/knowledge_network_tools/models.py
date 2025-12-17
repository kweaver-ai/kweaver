# -*- coding: utf-8 -*-
"""
知识网络工具的Pydantic数据模型
"""

from typing import List, Optional, Dict, Any
from langchain.pydantic_v1 import BaseModel, Field
from fastapi import Header
import uuid


class KnowledgeNetworkIdConfig(BaseModel):
    """知识网络ID配置"""
    knowledge_network_id: str = Field(description="知识网络ID")


class KnowledgeNetworkRetrievalInput(BaseModel):
    """知识网络检索工具输入参数"""
    query: str = Field(description="用户查询问题")
    top_k: int = Field(default=10, description="返回最相关的关系类型数量。注意：对象类型会根据选中的关系类型自动过滤，所以实际返回的对象类型数量可能小于或等于top_k*2（因为每个关系类型涉及2个对象类型：源对象和目标对象）")
    kn_ids: List[KnowledgeNetworkIdConfig] = Field(description="指定的知识网络配置列表，必须传递，每个配置包含knowledge_network_id字段")
    session_id: Optional[str] = Field(
        default=None, 
        description="会话ID，用于维护多轮对话存储的历史召回记录。如果不提供，将自动生成一个随机ID"
    )
    additional_context: Optional[str] = Field(
        default=None, 
        description="""
        当需要多轮召回使用，当第一轮召回的结果，用于下游任务时，发现错误，或查不到信息，就需要将问题query进行重写，
        然后额外提供对召回有任何帮助的上下文信息，越丰富越好"""
    )
    skip_llm: bool = Field(
        default=True, 
        description="是否跳过LLM检索，直接使用前10个关系类型。设置为True时，将返回前10个关系类型和涉及的对象类型，确保高召回率"
    )
    compact_format: bool = Field(
        default=True,
        description="是否返回紧凑格式。True返回紧凑格式（减少token数），False返回完整格式"
    )
    return_union: bool = Field(
        default=False,
        description="多轮检索时是否返回并集结果。True返回所有轮次的并集（默认），False只返回当前轮次新增的结果（增量结果），用于减少上下文长度"
    )
    enable_keyword_context: bool = Field(
        default=False,
        description="是否启用关键词上下文召回。True：基于关键词召回上下文信息（需要先有schema）；False：只进行schema召回，不进行关键词上下文召回（默认，保持向后兼容）。"
    )
    object_type_id: Optional[str] = Field(
        default=None,
        description="对象类型ID，用于指定关键词所属的对象类型。当enable_keyword_context=True时，此参数必须提供。例如：'person'、'disease'等。"
    )
    
    def __init__(self, **data):
        super().__init__(**data)
        # 如果session_id为空，则生成一个随机ID
        if not self.session_id:
            self.session_id = f"auto_session_{uuid.uuid4().hex[:16]}"
        
        # 验证参数约束
        if self.enable_keyword_context and not self.object_type_id:
            raise ValueError("当enable_keyword_context=True时，object_type_id参数必须提供。因为即使用关键词，但是有很多对象类型，你不知道这个关键词属于哪个对象类型。")


class KnowledgeNetworkInfo(BaseModel):
    """知识网络信息"""
    id: str = Field(description="知识网络ID")
    name: str = Field(description="知识网络名称")
    comment: str = Field(description="知识网络描述")
    tags: List[str] = Field(description="标签")


class ObjectTypeInfo(BaseModel):
    """对象类型信息"""
    id: str = Field(description="对象类型ID")
    name: str = Field(description="对象类型名称")
    comment: str = Field(description="对象类型描述")


class RelationTypeInfo(BaseModel):
    """关系类型信息"""
    id: str = Field(description="关系类型ID")
    name: str = Field(description="关系类型名称")
    comment: str = Field(description="关系类型描述")
    source_object_type_id: str = Field(description="源对象类型ID")
    target_object_type_id: str = Field(description="目标对象类型ID")


class KnowledgeNetworkRetrievalResult(BaseModel):
    """知识网络检索结果"""
    concept_type: str = Field(description="概念类型: object_type 或 relation_type")
    concept_id: str = Field(description="概念ID")
    concept_name: str = Field(description="概念名称")
    source_object_type_id: Optional[str] = Field(default=None, description="源对象类型ID（仅关系类型有）")
    target_object_type_id: Optional[str] = Field(default=None, description="目标对象类型ID（仅关系类型有）")
    properties: Optional[List[Dict[str, Any]]] = Field(default=None, description="对象属性列表（仅对象类型有），对象类型返回列表，关系类型不包含此字段")
    primary_key_field: Optional[str] = Field(default=None, description="主键字段名（仅对象类型有），用于标识对象实例的唯一主键字段")


class KnowledgeNetworkRetrievalResponse(BaseModel):
    """知识网络检索响应"""
    object_types: List[KnowledgeNetworkRetrievalResult] = Field(description="对象类型列表，包含属性信息")
    relation_types: List[KnowledgeNetworkRetrievalResult] = Field(description="关系类型列表")


class CompactRetrievalResponse(BaseModel):
    """紧凑格式的检索响应（紧凑YAML格式，减少token）"""
    objects: str = Field(description="对象类型列表（紧凑YAML格式文本）")
    relations: str = Field(description="关系类型列表（紧凑YAML格式文本）")


class HeaderParams:
    """请求头参数依赖类"""
    
    def __init__(
        self,
        # x_user: str = Header(None, alias="x-user"),
        account_type: str = Header(None, alias="x-account-type"),
        account_id: str = Header(None, alias="x-account-id"),
        content_type: str = Header("application/json"),
        # 如果有其他 headers 参数，可以继续添加在这里
        # authorization: Optional[str] = Header(None),
        # user_agent: Optional[str] = Header(None),
    ):
        # self.x_user = x_user
        self.content_type = content_type
        self.account_type = account_type
        self.account_id = account_id
            # self.authorization = authorization
        # self.user_agent = user_agent


class QueryUnderstanding(BaseModel):
    """查询理解结果"""
    origin_query: str = Field(description="原始查询")
    processed_query: str = Field(description="处理后的查询")
    intent: Optional[List[Dict[str, Any]]] = Field(default=[], description="意图列表")


class RerankInput(BaseModel):
    """重排序输入参数"""
    query_understanding: QueryUnderstanding = Field(description="查询理解结果")
    concepts: List[Dict[str, Any]] = Field(description="需要重排序的概念列表")
    action: str = Field(default="llm", description="重排序方法，可选值: 'llm' 或 'vector'")
    batch_size: Optional[int] = Field(default=128, description="批处理大小，可选")