# -*- coding: utf-8 -*-
"""
基于知识网络的检索工具
实现五步检索流程：
1. 获取业务知识网络列表
2. 使用LLM判断用户查询相关的知识网络
3. 获取知识网络详情
4. 使用LLM判断相关的对象类型
5. 构建最终的检索结果
"""

import json
import os
import time
import yaml
from typing import List, Dict, Any, Optional, Tuple, Union
from fastapi import Body, HTTPException, Header, Depends
from langchain.pydantic_v1 import BaseModel, Field
import asyncio
from datetime import datetime, timedelta
import numpy as np
from collections import defaultdict

# 导入LLM客户端
from .llm_client import LLMClient
# 导入日志模块
from af_agent.logs.logger import logger
# 导入重排序客户端
from af_agent.tools.graph_tools.driven.external.rerank_client import RerankClient
# 导入标准错误响应类
from af_agent.errors import KnowledgeNetworkRetrievalError, KnowledgeNetworkParamError
# 导入Pydantic模型
from .models import (
    KnowledgeNetworkRetrievalInput,
    KnowledgeNetworkInfo,
    ObjectTypeInfo,
    RelationTypeInfo,
    KnowledgeNetworkRetrievalResult,
    KnowledgeNetworkRetrievalResponse,
    CompactRetrievalResponse,
    HeaderParams
)
# 导入会话管理器
from .session_manager import RetrievalSessionManager
# 导入HTTP客户端
from .http_client import KnowledgeNetworkHTTPClient
# 导入知识网络检索模块
from .network_retrieval import KnowledgeNetworkRetrieval
# 导入概念检索模块
from .concept_retrieval import ConceptRetrieval
# 导入关键词召回模块
from .keyword_retrieval import KeywordRetrieval


class KnowledgeNetworkRetrievalTool:
    """基于知识网络的检索工具"""
    
    def __init__(self):
        pass
    
    @classmethod
    def _filter_properties_mapped_field(cls, properties: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        过滤属性中的mapped_field字段
        
        Args:
            properties: 属性列表
            
        Returns:
            过滤后的属性列表（去掉mapped_field字段）
        """
        if not properties or not isinstance(properties, list):
            return properties if isinstance(properties, list) else []
        
        filtered_properties = []
        for prop in properties:
            if isinstance(prop, dict):
                # 创建属性副本，去掉mapped_field字段
                filtered_prop = {k: v for k, v in prop.items() if k != "mapped_field"}
                filtered_properties.append(filtered_prop)
            else:
                filtered_properties.append(prop)
        
        return filtered_properties
    
    @classmethod
    def _convert_to_compact_format(cls, result: Dict[str, List[Dict[str, Any]]]) -> Dict[str, str]:
        """
        将完整格式转换为标准嵌套YAML格式
        
        格式说明：
        - 对象类型：标准嵌套YAML格式，包含name和properties列表
        - 关系类型：标准嵌套YAML格式，包含name、from、to
        
        Args:
            result: 完整的检索结果，包含object_types和relation_types
            
        Returns:
            紧凑格式的检索结果，格式: {objects: "YAML文本", relations: "YAML文本"}
        """
        # 构建对象类型的嵌套结构
        objects_dict = {}
        for obj in result.get("object_types", []):
            obj_id = obj.get("concept_id", "")
            obj_name = obj.get("concept_name", "")
            
            if not obj_id:
                continue
            
            # 构建属性列表，过滤掉mapped_field字段
            properties_list = []
            for prop in obj.get("properties", []):
                if not isinstance(prop, dict):
                    continue
                
                # 构建属性对象，包含所有字段（排除mapped_field）
                prop_info = {}
                
                # 添加所有字段
                if "name" in prop:
                    prop_info["name"] = prop["name"]
                if "display_name" in prop:
                    prop_info["display_name"] = prop["display_name"]
                if "type" in prop:
                    prop_info["type"] = prop["type"]
                if "comment" in prop:
                    prop_info["comment"] = prop["comment"]
                if "condition_operations" in prop:
                    prop_info["condition_operations"] = prop["condition_operations"]
                # 明确排除mapped_field字段
                
                properties_list.append(prop_info)
            
            # 构建对象类型的嵌套结构
            objects_dict[obj_id] = {
                "name": obj_name,
                "properties": properties_list
            }
        
        # 构建关系类型的嵌套结构
        relations_dict = {}
        for rel in result.get("relation_types", []):
            rel_id = rel.get("concept_id", "")
            rel_name = rel.get("concept_name", "")
            from_id = rel.get("source_object_type_id", "")
            to_id = rel.get("target_object_type_id", "")
            
            if not rel_id or not rel_name:
                continue
            
            # 构建关系类型的嵌套结构
            rel_info = {
                "name": rel_name
            }
            if from_id:
                rel_info["from"] = from_id
            if to_id:
                rel_info["to"] = to_id
            
            relations_dict[rel_id] = rel_info
        
        # 构建最终的嵌套结构
        yaml_structure = {}
        if objects_dict:
            yaml_structure["objects"] = objects_dict
        if relations_dict:
            yaml_structure["relations"] = relations_dict
        
        # 转换为YAML字符串
        yaml_str = yaml.dump(yaml_structure, allow_unicode=True, default_flow_style=False, sort_keys=False)
        
        # 分离objects和relations
        objects_yaml = ""
        relations_yaml = ""
        
        if "objects:" in yaml_str:
            objects_start = yaml_str.find("objects:")
            relations_start = yaml_str.find("relations:")
            
            if relations_start > 0:
                objects_yaml = yaml_str[objects_start:relations_start].strip()
                relations_yaml = yaml_str[relations_start:].strip()
            else:
                objects_yaml = yaml_str[objects_start:].strip()
        elif "relations:" in yaml_str:
            relations_yaml = yaml_str[yaml_str.find("relations:"):].strip()
        
        compact_result = {
            "objects": objects_yaml,
            "relations": relations_yaml
        }
        
        return compact_result
    
    @classmethod
    async def _build_final_result(cls, relevant_concepts: Tuple[Dict, List[Dict[str, Any]]], network_details: Dict[str, Any], session_id: Optional[str] = None, skip_llm: bool = False, return_union: bool = True) -> Dict[str, List[Dict[str, Any]]]:
        """
        构建最终检索结果
        
        Args:
            relevant_concepts: 过滤后的objects_mapping和relations_mapping元组
            network_details: 知识网络详情字典
            session_id: 会话ID，用于保存检索结果到历史记录
            skip_llm: 是否跳过LLM处理，用于决定如何处理历史记录
            return_union: 是否返回并集结果。True返回所有轮次的并集，False只返回当前轮次新增的结果
            
        Returns:
            包含object_types和relation_types的字典
        """
        object_types = []
        relation_types = []
        
        # 获取知识网络ID
        kn_id = network_details.get("id")
        
        # 解构元组，获取过滤后的objects_mapping和relations_mapping
        filtered_objects_mapping, relevant_relations = relevant_concepts
        
        # 添加关系类型
        for rel in relevant_relations:
            # 处理两种可能的数据结构
            if "source" in rel and "target" in rel:
                # 新的数据结构，包含source和target对象
                source_obj_id = rel.get("source", {}).get("id")
                target_obj_id = rel.get("target", {}).get("id")
            else:
                # 原有的数据结构，包含source_object_type_id和target_object_type_id
                source_obj_id = rel.get("source_object_type_id")
                target_obj_id = rel.get("target_object_type_id")
            
            relation_types.append({
                "concept_type": "relation_type",
                "concept_id": rel["id"],
                "concept_name": rel["name"],
                "source_object_type_id": source_obj_id,
                "target_object_type_id": target_obj_id,
                "kn_id": kn_id
            })
        
        # 创建对象类型ID到主键字段的映射（从network_details中获取）
        object_type_primary_keys = {}
        if network_details and isinstance(network_details, dict):
            # network_details应该直接包含object_types字段（根据接口文档）
            object_types_list = network_details.get("object_types", [])
            
            if object_types_list:
                for obj_type in object_types_list:
                    if not isinstance(obj_type, dict):
                        continue
                    obj_type_id = obj_type.get("id")
                    primary_keys = obj_type.get("primary_keys", [])
                    if obj_type_id and primary_keys:
                        # 保存第一个主键字段名（通常只有一个主键）
                        primary_key_value = primary_keys[0] if isinstance(primary_keys, list) and len(primary_keys) > 0 else None
                        if primary_key_value:
                            object_type_primary_keys[obj_type_id] = primary_key_value
            
            # 只在有问题时才记录警告日志
            if not object_type_primary_keys and object_types_list:
                # 如果object_types存在但没有找到主键，记录警告
                logger.warning(f"从network_details中找到 {len(object_types_list)} 个对象类型，但未找到任何主键信息。第一个对象类型的keys: {list(object_types_list[0].keys()) if object_types_list and len(object_types_list) > 0 else 'empty'}")
            elif not object_types_list:
                logger.warning(f"network_details中未找到object_types字段，network_details的keys: {list(network_details.keys())}")
        
        # 添加对象类型（包含属性信息）
        for idx, obj in filtered_objects_mapping.items():
            # 获取属性信息，确保即使为空也返回列表而不是None
            properties = obj.get("properties")
            if properties is None:
                properties = []
            elif not isinstance(properties, list):
                properties = []
            
            # 过滤掉属性中的mapped_field字段
            filtered_properties = cls._filter_properties_mapped_field(properties)
            
            # 获取主键字段名
            primary_key_field = object_type_primary_keys.get(obj["id"])
            
            # 对象类型不包含source_object_type_id和target_object_type_id字段
            object_type_info = {
                "concept_type": "object_type",
                "concept_id": obj["id"],
                "concept_name": obj["name"],
                "kn_id": kn_id,  # 内部使用，返回时会过滤掉
                "properties": filtered_properties,  # 对象类型的属性信息（已过滤mapped_field）
                "primary_key_field": primary_key_field  # 主键字段名（如果有的话，否则为None）
            }
            
            object_types.append(object_type_info)
        
        result = {
            "object_types": object_types,
            "relation_types": relation_types
        }
        
        logger.debug(f"最终检索结果构建完成，对象类型: {len(object_types)} 项，关系类型: {len(relation_types)} 项")
        
        # 如果有会话ID，保存检索结果到会话记录中
        final_result = result
        if session_id and result:
            # 合并对象类型和关系类型用于会话管理（保持向后兼容）
            all_results = result["object_types"] + result["relation_types"]
            
            # 按知识网络ID分组保存检索结果
            results_by_kn = {}
            
            # 为每个检索结果添加知识网络的详细信息
            for res in all_results:
                # 获取结果所属的知识网络ID
                result_kn_id = res.get("kn_id", "unknown")
                
                # 初始化该知识网络的结果列表
                if result_kn_id not in results_by_kn:
                    results_by_kn[result_kn_id] = []
                
                # 创建增强结果
                enhanced_result = res.copy()
                
                # 查找对应的知识网络详情
                kn_detail = None
                if network_details and network_details.get("id") == result_kn_id:
                    kn_detail = network_details
                
                # 添加知识网络信息
                if kn_detail:
                    enhanced_result["kn_name"] = kn_detail.get("name", "")
                    enhanced_result["kn_comment"] = kn_detail.get("comment", "")
                
                results_by_kn[result_kn_id].append(enhanced_result)
            
            # 保存每个知识网络的检索结果
            for save_kn_id, enhanced_results in results_by_kn.items():
                RetrievalSessionManager.add_retrieval_record(session_id, save_kn_id, enhanced_results)
                logger.info(f"已将 {len(enhanced_results)} 条检索结果保存到会话 {session_id} 的知识网络 {save_kn_id} 中")
            
            # 根据return_union参数决定返回并集还是增量结果
            current_kn_id = kn_id  # 统一变量名
            
            if return_union:
                # 返回所有轮次的并集
                all_rounds_union = RetrievalSessionManager.get_all_rounds_union(session_id, current_kn_id)
                logger.info(f"获取知识网络 {current_kn_id} 的所有轮次并集（已包含当前结果），最终结果数量: {len(all_rounds_union)}")
                
                # 将并集结果重新组织为新的结构
                # 注意：session_manager已经确保对象类型不包含source_object_type_id和target_object_type_id
                union_object_types = []
                union_relation_types = []
                for item in all_rounds_union:
                    if item.get("concept_type") == "object_type":
                        # 创建副本避免修改原始数据
                        item_copy = item.copy()
                        # 过滤掉属性中的mapped_field字段
                        if "properties" in item_copy and isinstance(item_copy["properties"], list):
                            item_copy["properties"] = cls._filter_properties_mapped_field(item_copy["properties"])
                        union_object_types.append(item_copy)
                    elif item.get("concept_type") == "relation_type":
                        union_relation_types.append(item)
                
                final_result = {
                    "object_types": union_object_types,
                    "relation_types": union_relation_types
                }
            else:
                # 只返回当前轮次新增的结果（增量结果）
                # 获取当前轮次号（保存后，当前轮次已经存在于记录中）
                current_records = RetrievalSessionManager._session_records[session_id][current_kn_id]["retrieval_results"]
                all_rounds = RetrievalSessionManager._get_rounds_for_kn(current_records)
                current_round = max(all_rounds) if all_rounds else 1
                
                # 获取之前所有轮次的并集（排除当前轮次）
                previous_rounds_union = RetrievalSessionManager.get_previous_rounds_union(
                    session_id, current_kn_id, exclude_current_round=current_round
                )
                
                # 构建之前轮次的唯一标识符集合
                previous_keys = set()
                for item in previous_rounds_union:
                    concept_id = item.get("concept_id", "")
                    concept_type = item.get("concept_type", "")
                    previous_keys.add((concept_id, concept_type))
                
                # 计算当前轮次的增量结果（当前结果 - 之前轮次结果）
                # 使用原始结果，而不是增强后的结果
                current_results = result["object_types"] + result["relation_types"]
                incremental_object_types = []
                incremental_relation_types = []
                
                for item in current_results:
                    concept_id = item.get("concept_id", "")
                    concept_type = item.get("concept_type", "")
                    unique_key = (concept_id, concept_type)
                    
                    # 如果当前结果不在之前轮次中，则是新增的
                    if unique_key not in previous_keys:
                        if concept_type == "object_type":
                            # 过滤掉属性中的mapped_field字段
                            properties = item.get("properties", [])
                            filtered_properties = cls._filter_properties_mapped_field(properties)
                            # 对象类型不包含source_object_type_id和target_object_type_id字段
                            incremental_obj_type = {
                                "concept_type": item.get("concept_type", ""),
                                "concept_id": item.get("concept_id", ""),
                                "concept_name": item.get("concept_name", ""),
                                "properties": filtered_properties
                            }
                            # 保留主键字段信息
                            if "primary_key_field" in item:
                                incremental_obj_type["primary_key_field"] = item.get("primary_key_field")
                            incremental_object_types.append(incremental_obj_type)
                        elif concept_type == "relation_type":
                            incremental_relation_types.append({
                                "concept_type": item.get("concept_type", ""),
                                "concept_id": item.get("concept_id", ""),
                                "concept_name": item.get("concept_name", ""),
                                "source_object_type_id": item.get("source_object_type_id"),
                                "target_object_type_id": item.get("target_object_type_id")
                            })
                
                final_result = {
                    "object_types": incremental_object_types,
                    "relation_types": incremental_relation_types
                }
                logger.info(f"获取知识网络 {current_kn_id} 第{current_round}轮的增量结果，新增对象类型: {len(incremental_object_types)} 项，新增关系类型: {len(incremental_relation_types)} 项")
            
            # 输出会话统计信息
            session_info = RetrievalSessionManager.get_session_info()
            logger.debug(f"当前活跃会话数: {session_info['active_sessions']}, 总记录数: {session_info['total_records']}")
        
        return final_result
    
    
    @classmethod
    async def retrieve(cls, query: str, top_k: int = 10, kn_ids: List[Any] = None, 
                      additional_context: Optional[str] = None, session_id: Optional[str] = None, 
                      headers: Optional[Dict[str, str]] = None, skip_llm: bool = False, 
                      compact_format: bool = True, return_union: bool = True,
                      enable_keyword_context: bool = False, object_type_id: Optional[str] = None) -> tuple[Union[Dict[str, List[Dict[str, Any]]], Dict[str, Any]], float]:
        """
        执行知识网络检索
        
        Args:
            query: 用户查询问题（完整问题或关键词）
            top_k: 返回最相关的关系类型数量。注意：对象类型会根据选中的关系类型自动过滤
            kn_ids: 指定的知识网络配置列表，每个配置包含knowledge_network_id字段，必须传递
            additional_context: 额外的上下文信息，用于二次检索时提供更精确的检索信息
            session_id: 会话ID，用于保存检索结果到历史记录
            headers: HTTP请求头
            skip_llm: 是否跳过LLM处理
            compact_format: 是否返回紧凑格式
            return_union: 多轮检索时是否返回并集结果。True返回所有轮次的并集，False只返回当前轮次新增的结果
            enable_keyword_context: 是否启用关键词上下文召回
            object_type_id: 对象类型ID，当enable_keyword_context=True时，此参数必须提供
            
        Returns:
            包含object_types和relation_types的字典和执行时间，或keyword_context（当enable_keyword_context=True时）
        """
        # 检查kn_ids是否为空
        if not kn_ids:
            raise ValueError("kn_ids参数不能为空，必须提供至少一个知识网络配置")
        
        # 从新格式中提取knowledge_network_id列表（向后兼容：如果是字符串列表，直接使用；如果是配置对象，提取knowledge_network_id）
        kn_id_list = []
        for item in kn_ids:
            if isinstance(item, str):
                # 向后兼容：如果是字符串，直接使用
                kn_id_list.append(item)
            elif isinstance(item, dict):
                # 新格式：从字典中提取knowledge_network_id
                kn_id = item.get("knowledge_network_id")
                if not kn_id:
                    raise ValueError("kn_ids配置中必须包含knowledge_network_id字段")
                kn_id_list.append(kn_id)
            else:
                # 如果是Pydantic模型对象
                kn_id = getattr(item, "knowledge_network_id", None)
                if not kn_id:
                    raise ValueError("kn_ids配置中必须包含knowledge_network_id字段")
                kn_id_list.append(kn_id)
            
        start_time = time.time()
        try:
            logger.info(f"开始执行知识网络检索，查询: {query}, enable_keyword_context: {enable_keyword_context}")
            
            # 在每次请求开始时清理一次过期会话，但排除当前会话
            RetrievalSessionManager._clean_expired_sessions()
            
            # 从 headers 中提取 account_id 和 account_type
            account_id = headers.get("x-account-id") if headers else None
            account_type = headers.get("x-account-type") if headers else None
            
            # 如果启用关键词上下文召回
            if enable_keyword_context:
                # 验证参数
                if not object_type_id:
                    raise ValueError("当enable_keyword_context=True时，object_type_id参数必须提供。因为即使用关键词，但是有很多对象类型，你不知道这个关键词属于哪个对象类型。")
                
                if not session_id:
                    raise ValueError("当enable_keyword_context=True时，session_id参数必须提供，用于检索schema信息。")
                
                # 获取第一个知识网络ID（目前只支持单个知识网络）
                kn_id = kn_id_list[0] if kn_id_list else None
                if not kn_id:
                    raise ValueError("kn_ids参数不能为空，必须提供至少一个知识网络配置")
                
                # 检查session中是否有schema信息
                if not RetrievalSessionManager.has_schema_info(session_id, kn_id):
                    raise ValueError("Schema信息不存在，请先调用enable_keyword_context=False召回schema")
                
                # 获取schema信息
                schema_info = RetrievalSessionManager.get_schema_info(session_id, kn_id)
                if not schema_info:
                    raise ValueError("Schema信息不存在，请先调用enable_keyword_context=False召回schema")
                
                logger.info(f"使用历史schema信息进行关键词召回，关键词: {query}, object_type_id: {object_type_id}")
                
                # 调用关键词召回
                keyword_context = await KeywordRetrieval.retrieve_keyword_context(
                    keyword=query,
                    object_type_id=object_type_id,
                    kn_id=kn_id,
                    schema_info=schema_info,
                    headers=headers
                )
                
                execution_time = time.time() - start_time
                logger.info(f"关键词召回完成，执行时间: {execution_time:.2f}秒")
                
                # 返回关键词上下文（只返回keyword_context，不返回schema信息）
                return {"keyword_context": keyword_context}, execution_time
            
            # 原有的schema召回流程
            # 使用KnowledgeNetworkRetrieval获取相关知识网络和详情，目前只会获取一个知识网络
            network_details = await KnowledgeNetworkRetrieval._rank_knowledge_networks(
                query, top_k, additional_context, headers, session_id, kn_id_list, account_id=account_id, account_type=account_type
            )
            logger.info(f"获取知识网络详情")
            
            
            # 步骤4: 使用LLM判断相关的关系类型
            logger.info(f"跳过关系类型的LLM检索，直接使用前{top_k}个关系类型")
            # 调用ConceptRetrieval.rank_relation_types方法，但跳过LLM处理，直接返回前top_k个关系
            relevant_concepts = await ConceptRetrieval.rank_relation_types(query, network_details, top_k, additional_context, session_id, skip_llm=skip_llm, account_id=account_id, account_type=account_type)
            
            logger.info(f"筛选出相关概念")
            
            # 步骤5: 构建最终的检索结果
            final_result = await cls._build_final_result(relevant_concepts, network_details, session_id, skip_llm, return_union)
            logger.info(f"构建完成，对象类型: {len(final_result.get('object_types', []))} 项，关系类型: {len(final_result.get('relation_types', []))} 项")
            
            execution_time = time.time() - start_time
            logger.info(f"知识网络检索完成，执行时间: {execution_time:.2f}秒")
            return final_result, execution_time
            
        except Exception as e:
            logger.error(f"知识网络检索过程中出现错误: {str(e)}", exc_info=True)
            raise

    @classmethod
    async def as_async_api_cls(cls, params: dict = Body(...), header_params: HeaderParams = Depends()):
        """
        API接口方法
        
        Args:
            params: API请求参数
            header_params: 请求头参数对象
            
        Returns:
            检索结果列表
        """
        try:
            # 参数验证阶段
            try:
                print(params)
                print(header_params)
                # 验证参数  
                input_data = KnowledgeNetworkRetrievalInput(**params)
                logger.debug(f"参数验证通过: {input_data}")
                
                # 构建headers字典
                headers_dict = {
                    "x-account-type": header_params.account_type,
                    "x-account-id": header_params.account_id,
                    "Content-Type": header_params.content_type
                }
                logger.debug("请求头构建完成")
            except Exception as e:
                logger.error(f"参数验证失败: {str(e)}")
                raise KnowledgeNetworkParamError(
                    detail={"error": str(e)},
                    link="https://example.com/api-docs/knowledge-network-retrieval"
                )
            
            # 执行检索阶段
            try:
                # 执行检索
                result, execution_time = await cls.retrieve(
                    query=input_data.query,
                    top_k=input_data.top_k,
                    kn_ids=input_data.kn_ids,
                    additional_context=input_data.additional_context,
                    session_id=input_data.session_id,
                    headers=headers_dict,
                    skip_llm=input_data.skip_llm,
                    compact_format=input_data.compact_format,
                    return_union=input_data.return_union,
                    enable_keyword_context=input_data.enable_keyword_context,
                    object_type_id=input_data.object_type_id
                )
                logger.debug("知识网络检索执行完成")
                
                # 如果启用了关键词上下文召回，直接返回keyword_context
                if input_data.enable_keyword_context:
                    return result  # result已经是 {"keyword_context": {...}} 格式
                
                # 根据compact_format参数决定返回格式
                if input_data.compact_format:
                    # 返回紧凑格式，调用转换方法将完整格式转换为紧凑格式
                    compact_result = cls._convert_to_compact_format(result)
                    return CompactRetrievalResponse(**compact_result)
                else:
                    # 返回完整格式
                    api_result = {
                        "object_types": [],
                        "relation_types": []
                    }
                    
                    # 处理对象类型（包含属性信息）
                    for obj_item in result.get("object_types", []):
                        # 对象类型不包含kn_id、source_object_type_id、target_object_type_id字段
                        api_item = {k: v for k, v in obj_item.items() 
                                   if k not in ["kn_id", "source_object_type_id", "target_object_type_id"]}
                        
                        # 确保properties字段始终是列表（即使为空）
                        properties = api_item.get("properties")
                        if properties is None:
                            api_item["properties"] = []
                        elif not isinstance(properties, list):
                            api_item["properties"] = []
                        else:
                            # 过滤掉属性中的mapped_field字段
                            api_item["properties"] = cls._filter_properties_mapped_field(properties)
                        
                        # 创建Pydantic对象
                        # 注意：api_item已经排除了source_object_type_id和target_object_type_id
                        # 但Pydantic模型定义了这些字段（默认None），所以序列化时会包含
                        # 我们稍后在最终响应中统一清理
                        api_result["object_types"].append(KnowledgeNetworkRetrievalResult(**api_item))
                    
                    # 处理关系类型（不包含属性信息）
                    for rel_item in result.get("relation_types", []):
                        api_item = {k: v for k, v in rel_item.items() if k not in ["kn_id", "properties"]}
                        # 关系类型不包含properties字段，明确设置为None
                        api_item["properties"] = None
                        api_result["relation_types"].append(KnowledgeNetworkRetrievalResult(**api_item))
                    
                    logger.debug(f"结果转换完成，对象类型: {len(api_result['object_types'])} 项，关系类型: {len(api_result['relation_types'])} 项")
                    
                    # 构建响应对象
                    response_obj = KnowledgeNetworkRetrievalResponse(
                        object_types=api_result["object_types"],
                        relation_types=api_result["relation_types"]
                    )
                    
                    # 转换为字典
                    response_dict = response_obj.dict()
                    
                    # 清理对象类型中的source_object_type_id和target_object_type_id字段
                    # 注意：即使这些字段值为None，Pydantic也会在序列化时包含它们
                    # 所以我们需要手动删除对象类型中的这两个字段
                    for obj_type in response_dict.get("object_types", []):
                        # 明确删除这两个字段（对象类型不应该有这些字段）
                        if "source_object_type_id" in obj_type:
                            del obj_type["source_object_type_id"]
                        if "target_object_type_id" in obj_type:
                            del obj_type["target_object_type_id"]
                    
                    # 返回清理后的字典（FastAPI会自动序列化）
                    return response_dict
            except Exception as e:
                logger.error(f"知识网络检索执行失败: {str(e)}", exc_info=True)
                raise KnowledgeNetworkRetrievalError(
                    detail={"error": str(e)},
                    link="https://example.com/api-docs/knowledge-network-retrieval"
                )
        except HTTPException:
            # 重新抛出 HTTPException，保持原有行为
            raise
        except (KnowledgeNetworkRetrievalError, KnowledgeNetworkParamError) as e:
            # 将自定义异常转换为标准化错误响应
            raise HTTPException(
                status_code=400 if isinstance(e, KnowledgeNetworkParamError) else 500,
                detail=e.json()
            )
    
    @classmethod
    async def get_api_schema(cls):
        """获取API schema定义"""
        return {
            "post": {
                "summary": "knowledge_retrieve",
                "description": "基于知识网络的智能检索工具，能够根据用户问题检索相关的知识网络和关系类型",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "query": {
                                        "type": "string",
                                        "description": "用户查询问题"
                                    },
                                    "top_k": {
                                        "type": "integer",
                                        "description": "返回最相关的关系类型数量。注意：对象类型会根据选中的关系类型自动过滤，所以实际返回的对象类型数量可能小于或等于top_k*2（因为每个关系类型涉及2个对象类型：源对象和目标对象）",
                                        "default": 10
                                    },
                                    "kn_ids": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "knowledge_network_id": {
                                                    "type": "string",
                                                    "description": "知识网络ID"
                                                }
                                            },
                                            "required": ["knowledge_network_id"]
                                        },
                                        "description": "指定的知识网络配置列表，必须传递，每个配置包含knowledge_network_id字段"
                                    },
                                    "session_id": {
                                        "type": "string",
                                        "description": "会话ID，用于维护多轮对话存储的历史召回记录",
                                        "nullable": True
                                    },
                                    "additional_context": {
                                        "type": "string",
                                        "description": "额外的上下文信息，用于二次检索时提供更精确的检索信息",
                                        "nullable": True
                                    },
                                    "skip_llm": {
                                        "type": "boolean",
                                        "description": "是否跳过LLM检索，直接使用前10个关系类型。设置为True时，将返回前10个关系类型和涉及的对象类型，确保高召回率",
                                        "default": False
                                    },
                                    "compact_format": {
                                        "type": "boolean",
                                        "description": "是否返回紧凑格式。True返回紧凑格式（减少token数），False返回完整格式",
                                        "default": True
                                    },
                                    "return_union": {
                                        "type": "boolean",
                                        "description": "多轮检索时是否返回并集结果。True返回所有轮次的并集（默认），False只返回当前轮次新增的结果（增量结果），用于减少上下文长度",
                                        "default": True
                                    }
                                },
                                "required": ["query", "kn_ids"]
                            },
                            "examples": {
                                "basic_query": {
                                    "summary": "基本查询示例",
                                    "description": "一个基本的知识网络检索查询示例",
                                    "value": {
                                        "query": "查询化工企业使用的催化剂信息",
                                        "top_k": 10,
                                        "kn_ids": [
                                            {
                                                "knowledge_network_id": "129"
                                            }
                                        ]
                                    }
                                },
                                "query_with_context": {
                                    "summary": "带上下文的查询示例",
                                    "description": "一个带有额外上下文信息的查询示例，用于二次检索",
                                    "value": {
                                        "query": "查询化工企业使用的催化剂信息",
                                        "top_k": 10,
                                        "kn_ids": [
                                            {
                                                "knowledge_network_id": "129"
                                            }
                                        ],
                                        "additional_context": "用户之前查询了关于化工企业的信息，现在想了解相关的催化剂"
                                    }
                                },
                                "query_with_kn_ids": {
                                    "summary": "指定知识网络ID的查询示例",
                                    "description": "一个指定了特定知识网络ID的查询示例",
                                    "value": {
                                        "query": "查询化工企业使用的催化剂信息",
                                        "top_k": 10,
                                        "kn_ids": [
                                            {
                                                "knowledge_network_id": "129"
                                            }
                                        ]
                                    }
                                },
                                "query_with_session": {
                                    "summary": "多轮对话查询示例",
                                    "description": "一个带有会话ID的查询示例，用于多轮对话场景",
                                    "value": {
                                        "query": "查询化工企业使用的催化剂信息",
                                        "top_k": 10,
                                        "kn_ids": [
                                            {
                                                "knowledge_network_id": "129"
                                            }
                                        ],
                                        "session_id": "user_session_123",
                                        "additional_context": "用户之前查询了关于化工企业的信息，现在想了解相关的催化剂"
                                    }
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "name": "x-account-id",
                        "in": "header",
                        "required": False,
                        "schema": {
                            "type": "string"
                        },
                        "description": "账户ID，用于内部服务调用时传递账户信息"
                    },
                    {
                        "name": "x-account-type",
                        "in": "header",
                        "required": False,
                        "schema": {
                            "type": "string",
                            "enum": ["user", "app", "anonymous"],
                            "default": "user"
                        },
                        "description": "账户类型：user(用户), app(应用), anonymous(匿名)"
                    },
                    {
                        "name": "Content-Type",
                        "in": "header",
                        "required": False,
                        "schema": {
                            "type": "string",
                            "default": "application/json"
                        },
                        "description": "内容类型"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful operation",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "description": "检索结果。根据compact_format参数返回不同格式：True返回紧凑格式（objects/relations），False返回完整格式（object_types/relation_types）",
                                    "properties": {
                                        "object_types": {
                                            "type": "array",
                                            "description": "对象类型列表，包含属性信息",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "concept_type": {
                                                        "type": "string",
                                                        "description": "概念类型: object_type"
                                                    },
                                                    "concept_id": {
                                                        "type": "string",
                                                        "description": "概念ID"
                                                    },
                                                    "concept_name": {
                                                        "type": "string",
                                                        "description": "概念名称"
                                                    },
                                                    "source_object_type_id": {
                                                        "type": "string",
                                                        "nullable": True
                                                    },
                                                    "target_object_type_id": {
                                                        "type": "string",
                                                        "nullable": True
                                                    },
                                                    "properties": {
                                                        "type": "array",
                                                        "description": "对象属性列表",
                                                        "items": {
                                                            "type": "object",
                                                            "description": "对象属性",
                                                            "properties": {
                                                                "display_name": {
                                                                    "type": "string",
                                                                    "description": "属性显示名称"
                                                                },
                                                                "comment": {
                                                                    "type": "string",
                                                                    "description": "属性描述"
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "required": [
                                                    "concept_type",
                                                    "concept_id",
                                                    "concept_name"
                                                ]
                                            }
                                        },
                                        "relation_types": {
                                            "type": "array",
                                            "description": "关系类型列表",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "concept_type": {
                                                        "type": "string",
                                                        "description": "概念类型: relation_type"
                                                    },
                                                    "concept_id": {
                                                        "type": "string",
                                                        "description": "概念ID"
                                                    },
                                                    "concept_name": {
                                                        "type": "string",
                                                        "description": "概念名称"
                                                    },
                                                    "source_object_type_id": {
                                                        "type": "string",
                                                        "description": "源对象类型ID"
                                                    },
                                                    "target_object_type_id": {
                                                        "type": "string",
                                                        "description": "目标对象类型ID"
                                                    }
                                                },
                                                "required": [
                                                    "concept_type",
                                                    "concept_id",
                                                    "concept_name",
                                                    "source_object_type_id",
                                                    "target_object_type_id"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                            }
                        }
                    }
                }
            }