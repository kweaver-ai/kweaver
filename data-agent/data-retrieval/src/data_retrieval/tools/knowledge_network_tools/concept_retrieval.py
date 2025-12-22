# -*- coding: utf-8 -*-
"""
基于知识网络的概念检索模块
专注于关系类型和对象类型的检索逻辑
"""

import json
import os
import time
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
from data_retrieval.logs.logger import logger
# 导入重排序客户端
from data_retrieval.tools.graph_tools.driven.external.rerank_client import RerankClient
# 导入标准错误响应类
from data_retrieval.errors import ErrorResponse
# 导入会话管理器
from .session_manager import RetrievalSessionManager


class ConceptRetrieval:
    """基于知识网络的概念检索工具"""
    
    def __init__(self):
        pass

    @classmethod
    def _build_network_info_prompt(cls, network_details: Dict[str, Any]) -> str:
        """
        构建提示词的网络信息部分
        
        Args:
            network_details: 知识网络详情字典
            
        Returns:
            str: 网络信息提示词
        """
        prompt = ""
        
        # 在提示词开头添加当前知识网络的名称和描述
        if network_details:
            prompt += "当前知识网络信息:\n"
            kn_id = network_details.get("id")
            kn_name = network_details.get("name", "")
            kn_comment = network_details.get("comment", "")
            prompt += f"- ID: {kn_id}, 名称: {kn_name}, 描述: {kn_comment}\n"
            prompt += "\n"
        
        return prompt
    
    @classmethod
    def _collect_relation_and_object_types(cls, network_details: Dict[str, Any], session_id: Optional[str] = None, top_k: int = 10) -> Tuple[List, List, Dict, List]:
        """
        收集所有关系类型和对象类型
        
        Args:
            network_details: 知识网络详情字典
            session_id: 会话ID，用于缓存管理
            
        Returns:
            tuple: (all_relation_types, all_object_types, objects_mapping, relations_mapping)
        """
        # 从network_details中获取kn_id
        kn_id = network_details.get("id")
        
        # 收集所有关系类型
        all_relation_types = []
        if "relation_types" in network_details:
            all_relation_types.extend(network_details["relation_types"])
        
        if not all_relation_types:
            # 如果没有关系类型，直接收集所有对象类型
            all_object_types = []
            objects_mapping = {}
            obj_idx = 1
            if "object_types" in network_details:
                for obj_type in network_details["object_types"]:
                    all_object_types.append(obj_type)
                    # 获取data_properties，确保是列表
                    data_properties = obj_type.get("data_properties", [])
                    if not isinstance(data_properties, list):
                        data_properties = []
                    objects_mapping[obj_idx] = {
                        "id": obj_type["id"],
                        "name": obj_type["name"],
                        "comment": obj_type.get("comment", ""),
                        "kn_id": obj_type.get("kn_id", ""),
                        "properties": data_properties  # 添加属性信息
                    }
                    obj_idx += 1
            relations_mapping = []
        else:
            # 创建对象类型ID到名称的映射
            obj_id_to_name = {}
            if "object_types" in network_details:
                for obj_type in network_details["object_types"]:
                    obj_id_to_name[obj_type.get('id')] = obj_type.get('name', obj_type.get('id'))
            
            # 从会话管理器中获取所有关系路径的分数，并取前top_k个
            # 分数结果已经在 _filter_relation_paths_with_rerank 方法中保存到会话管理器中
            scored_relations = []
            for rel_type in all_relation_types:
                relation_id = rel_type.get('id')
                score = 0.0  # 默认分数
                if session_id and kn_id and relation_id:
                    cached_score = RetrievalSessionManager.get_relation_score(session_id, kn_id, relation_id)
                    if cached_score is not None:
                        score = cached_score
                scored_relations.append((score, rel_type))
            
            # 按分数降序排序并取前top_k个
            sorted_relations = cls._sort_by_score_desc(scored_relations, score_field=0)
            relations_mapping = [rel_type for score, rel_type in sorted_relations[:top_k]]
            
            # 根据这top_k条关系的源对象和目标对象，过滤掉无关的对象类型
            # 收集相关的对象类型ID
            relevant_object_type_ids = set()
            for rel_type in relations_mapping:
                relevant_object_type_ids.add(rel_type.get("source_object_type_id"))
                relevant_object_type_ids.add(rel_type.get("target_object_type_id"))
            
            # 收集过滤后的对象类型
            all_object_types = []
            objects_mapping = {}
            obj_idx = 1
            if "object_types" in network_details:
                for obj_type in network_details["object_types"]:
                    # 只保留与关系类型相关的对象类型
                    if obj_type["id"] in relevant_object_type_ids:
                        all_object_types.append(obj_type)
                        # 获取data_properties，确保是列表
                        data_properties = obj_type.get("data_properties", [])
                        if not isinstance(data_properties, list):
                            data_properties = []
                        objects_mapping[obj_idx] = {
                            "id": obj_type["id"],
                            "name": obj_type["name"],
                            "comment": obj_type.get("comment", ""),
                            "kn_id": obj_type.get("kn_id", ""),
                            "properties": data_properties  # 添加属性信息
                        }
                        obj_idx += 1
        
        return objects_mapping, relations_mapping
    
    @classmethod
    def _build_relation_paths_prompt(cls, relations_mapping: List, objects_mapping: Dict) -> str:
        """
        构建提示词的关系路径部分，现在将关系作为编号，对象类型作为提示信息
        
        Args:
            relations_mapping: 关系类型列表
            objects_mapping: 对象映射
            
        Returns:
            str: 关系路径提示词
        """
        # 创建从对象类型ID到名称的映射
        obj_id_to_name = {obj_info['id']: obj_info['name'] for _, obj_info in objects_mapping.items()}
        
        # 构建关系编号提示词
        prompt = "关系类型编号:\n"
        for idx, rel_type in enumerate(relations_mapping, 1):
            source_obj_name = obj_id_to_name.get(rel_type.get('source_object_type_id', ''), '未知对象')
            target_obj_name = obj_id_to_name.get(rel_type.get('target_object_type_id', ''), '未知对象')
            rel_name = rel_type.get('name', '未知关系')
            prompt += f"{idx}. {source_obj_name} -> {rel_name} -> {target_obj_name}\n"
        
        prompt += "\n"
        return prompt
    
    @classmethod
    async def _call_llm_and_process_results(cls, prompt: str, query: str, objects_mapping: Dict, top_k: int, relations_mapping: List[Dict[str, Any]], account_id: str = None, account_type: str = None) -> Tuple[Dict, List[Dict[str, Any]]]:
        """
        调用LLM并处理结果，现在处理关系编号而非对象类型编号
        
        Args:
            prompt: 提示词
            query: 用户查询
            objects_mapping: 对象映射
            top_k: 返回前K个相关关系类型
            relations_mapping: 关系类型列表
            
        Returns:
            过滤后的objects_mapping和relations_mapping
        """
        try:
            # 调用LLM并获取结果
            system_message = "你是一个智能关系类型筛选助手。你能够根据用户提出的问题，从关系类型列表中筛选出相关的类型，返回相关关系类型的编号，不确定的关系务必返回，要求很高的召回率，遗漏后果很严重。"
            error_context = "上一次的回答为空或格式不正确，请重新分析问题并严格按照要求返回关系类型编号列表，例如：[2, 1, 3]。"
            
            content = await LLMClient.call_llm_with_retry(prompt, system_message, query, error_context, account_id=account_id, account_type=account_type)
            logger.info(f"LLM返回原始结果: {content}")
            
            # 解析LLM返回的结果
            import re
            match = re.search(r'\[([0-9,\s]+)\]', content)
            if match:
                indices_str = match.group(1)
                indices = [int(i.strip()) for i in indices_str.split(',') if i.strip().isdigit()]
                # 返回相关的关系类型信息
                relevant_relations = []
                for idx in indices:
                    # 检查是否为有效的关系索引（1-10）
                    if 1 <= idx <= len(relations_mapping):
                        relevant_relations.append(relations_mapping[idx-1])
                # 应用top_k切片过滤
                if relevant_relations:  # 确保不是空列表
                    relevant_relations = relevant_relations[:top_k]
            else:
                # 如果没有找到明确的列表或结果为空，返回所有关系类型（应用top_k限制）
                logger.debug(f"LLM返回结果无效，返回所有关系类型")
                relevant_relations = relations_mapping[:top_k]
                
        except Exception as e:
            logger.error(f"关系类型排序失败: {str(e)}")
            # 出错时返回所有关系类型（应用top_k限制）
            relevant_relations = relations_mapping[:top_k]
        
        # 根据过滤后的关系类型，过滤objects_mapping
        filtered_objects_mapping = {}
        relevant_obj_ids = set()
        
        # 收集相关关系中涉及的对象类型ID
        for rel in relevant_relations:
            source_id = rel.get('source_object_type_id')
            target_id = rel.get('target_object_type_id')
            if source_id:
                relevant_obj_ids.add(source_id)
            if target_id:
                relevant_obj_ids.add(target_id)
        
        # 过滤objects_mapping，只保留相关的对象类型
        for idx, obj_info in objects_mapping.items():
            if obj_info.get('id') in relevant_obj_ids:
                filtered_objects_mapping[idx] = obj_info
        
        return filtered_objects_mapping, relevant_relations
    
    @classmethod
    async def _process_object_properties(cls, objects_mapping: Dict[int, Dict[str, Any]], query: str = "", session_id: Optional[str] = None, kn_id: Optional[str] = None) -> Dict[int, Dict[str, Any]]:
        """
        处理对象属性信息，计算属性相关性分数
        
        Args:
            objects_mapping: 对象类型映射
            query: 用户查询，用于计算属性相关性分数
            session_id: 会话ID，用于缓存管理
            kn_id: 知识网络ID，用于缓存管理
            
        Returns:
            property_mapping: 属性到对象类型的映射，包含分数信息
        """
        all_properties = []  # 存储所有属性信息
        property_mapping = {}  # 映射属性到对象类型
        cached_scores = {}      # 存储从缓存中获取的分数
        prop_idx = 0
        
        # 首先收集所有属性信息
        for idx, obj_info in objects_mapping.items():
            obj_name = obj_info.get("name", "")  # 获取对象名称
            if obj_info.get("properties"):
                for prop in obj_info["properties"]:
                    prop_comment = prop.get("comment", "")
                    prop_name = prop.get("display_name", "")
                    # 构建属性文本，同时保留属性名称和描述，使用更自然、语义化的语言
                    property_text = f"{obj_name}的{prop_name}，{prop_comment}"
                    
                    all_properties.append(property_text)
                    
                    # 记录属性与对象类型的映射关系
                    property_mapping[prop_idx] = {
                        "obj_idx": idx,
                        "prop_name": prop_name,
                        "prop_comment": prop_comment,
                        "obj_id": obj_info.get("id"),  # 添加对象ID用于缓存键
                        "score": 0.0  # 添加默认分数
                    }
                    
                    # 检查是否有缓存的分数结果
                    if session_id and kn_id:
                        obj_id = obj_info.get('id')
                        if obj_id and prop_name:
                            cached_score = RetrievalSessionManager.get_property_score(session_id, kn_id, f"{obj_id}_{prop_name}")
                            if cached_score is not None:
                                cached_scores[prop_idx] = cached_score
                                property_mapping[prop_idx]["score"] = cached_score  # 直接将缓存分数添加到property_mapping中
                    
                    prop_idx += 1
        
        # 如果有查询且存在未缓存的属性，使用向量重排序计算属性相关性分数
        if query and all_properties:
            # 找出需要计算分数的属性索引
            uncached_indices = [i for i in range(len(all_properties)) if i not in cached_scores]
            
            if uncached_indices:
                try:
                    # 使用RerankClient进行向量重排序
                    rerank_client = RerankClient()
                    rerank_scores = await rerank_client.ado_rerank(all_properties, query)
                    
                    # 确保返回有效的分数列表
                    if rerank_scores and len(rerank_scores) > 0:
                        # 新格式: [{"relevance_score": 0.985, "index": 1, "document": null}, ...]
                        # 需要根据index重新排序并提取分数
                        sorted_scores = sorted(rerank_scores, key=lambda x: x["index"])
                        validated_scores = [float(item["relevance_score"]) for item in sorted_scores 
                                          if isinstance(item["relevance_score"], (int, float))]
                        
                        # 更新缓存和分数
                        for i, score in enumerate(validated_scores):
                            if i < len(all_properties) and i in property_mapping:
                                prop_info = property_mapping[i]
                                if session_id and kn_id:
                                    obj_id = prop_info['obj_id']
                                    prop_name = prop_info['prop_name']
                                    if obj_id and prop_name:
                                        prop_key = f"{obj_id}_{prop_name}"
                                        RetrievalSessionManager.add_property_score(session_id, kn_id, prop_key, score)
                                cached_scores[i] = score
                                property_mapping[i]["score"] = score  # 直接将计算出的分数添加到property_mapping中
                    else:
                        logger.warning("属性重排序未返回分数，使用默认分数")
                except Exception as e:
                    logger.error(f"属性重排序调用失败: {str(e)}", exc_info=True)
                
        logger.debug(f"对象属性处理完成，共处理 {len(all_properties)} 个属性")
        return property_mapping
    
    @classmethod
    def _filter_and_group_properties(cls, property_mapping: Dict[int, Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[int, List[Dict[str, Any]]]]:
        """
        按对象类型分组并筛选属性
        
        Args:
            property_mapping: 属性到对象类型的映射，包含分数信息
            objects_mapping: 对象类型映射
            
        Returns:
            final_candidate_props: 最终候选属性列表
            obj_type_props: 按对象类型分组的属性
        """
        # 首先，为所有属性获取分数
        all_props_with_scores = []
        for prop_idx, mapping_info in property_mapping.items():
            score = mapping_info.get("score", 0.0)
            obj_idx = mapping_info["obj_idx"]
            prop_info = {
                "name": mapping_info["prop_name"],
                "comment": mapping_info["prop_comment"],
                "score": score,
                "obj_idx": obj_idx
            }
            all_props_with_scores.append(prop_info)
        
        # 按对象类型分组并为每个对象类型取前3个属性
        obj_type_props = {}
        for prop_info in all_props_with_scores:
            obj_idx = prop_info["obj_idx"]
            if obj_idx not in obj_type_props:
                obj_type_props[obj_idx] = []
            obj_type_props[obj_idx].append(prop_info)
        
        # 对每个对象类型的属性按分数排序，并取前3个
        for obj_idx, props in obj_type_props.items():
            props.sort(key=lambda x: x["score"], reverse=True)
            # 每个对象类型只保留前3个属性
            obj_type_props[obj_idx] = props[:3]
        
        # 将所有对象类型的前3个属性合并到一个列表中
        all_top_props = []
        for obj_idx, props in obj_type_props.items():
            all_top_props.extend(props)
        
        # 对合并后的属性按分数排序
        all_top_props.sort(key=lambda x: x["score"], reverse=True)
        
        # 取前10个作为最终的候选属性
        final_candidate_props = all_top_props[:10]
        
        # 改进错误处理和日志记录
        logger.debug(f"属性处理完成，共处理 {len(all_props_with_scores)} 个属性，最终候选属性数量: {len(final_candidate_props)}")
        
        return final_candidate_props, obj_type_props
    
    @classmethod
    def _build_object_types_detail_prompt(cls, objects_mapping: Dict[int, Dict[str, Any]], 
                                        obj_type_props: Dict[int, List[Dict[str, Any]]], 
                                        final_candidate_props: List[Dict[str, Any]]) -> str:
        """
        构建对象类型详细信息提示词部分
        
        Args:
            objects_mapping: 对象类型映射
            obj_type_props: 按对象类型分组的属性
            final_candidate_props: 最终候选属性列表
            
        Returns:
            prompt: 对象类型详细信息提示词部分
        """
        if not objects_mapping:
            logger.debug("对象类型映射为空，返回空字符串")
            return ""
        
        prompt = "对象类型详细信息:\n"
        for idx, obj_info in objects_mapping.items():
            # 去掉编号，只显示名称
            prompt += f"{obj_info['name']}\n"
            # 添加属性信息，只显示最终候选属性中的属性
            if idx in obj_type_props:
                props = obj_type_props[idx]
                # 过滤出在最终候选属性中的属性
                filtered_props = [prop for prop in props if prop in final_candidate_props]
                # 添加该对象类型的属性到提示词中
                if filtered_props:
                    prompt += "   属性:\n"
                    for prop in filtered_props:
                        if prop["comment"]:
                            prompt += f"     - {prop['comment']}\n"
                        else:
                            prompt += f"     - {prop['name']}\n"
            prompt += "\n"
            
        logger.debug(f"构建对象类型详细信息提示词完成，共 {len(objects_mapping)} 个对象类型")
        return prompt
    
    @classmethod
    def _build_context_and_finalize_prompt(cls, prompt: str, query: str, additional_context: Optional[str], 
                                         session_id: Optional[str], objects_mapping: Dict[int, Dict[str, Any]], 
                                         current_kn_id: Optional[str] = None) -> str:
        """
        构建上下文和历史记录信息并完善提示词
        
        Args:
            prompt: 当前提示词
            query: 用户查询
            additional_context: 额外上下文信息
            session_id: 会话ID
            objects_mapping: 对象类型映射
            current_kn_id: 当前知识网络ID
            
        Returns:
            完整的提示词
        """
        context_info = ""
        history_info = ""
        
        # 处理额外上下文信息
        if additional_context:
            context_info += f"\n额外上下文信息: {additional_context}"
            logger.debug("添加额外的上下文信息")
            
        # 添加历史召回记录信息（如果有会话ID）
        if session_id and current_kn_id:
            retrieved_concept_ids = RetrievalSessionManager.get_retrieved_concept_ids(session_id, current_kn_id)
            if retrieved_concept_ids:
                history_info = "\n历史召回记录（请避免重复召回这些已召回的概念）:\n"
                
                # 按轮次组织记录
                round_records = {}
                for record in retrieved_concept_ids:
                    concept_id = record.get("concept_id", "")
                    concept_name = record.get("concept_name", "")
                    concept_type = record.get("concept_type", "")
                    
                    # 记录信息（简化显示格式）
                    # 由于对象类型不再有编号，所以不再显示编号
                    record_info = f"{concept_name}"
                    
                    # 添加到轮次记录中
                    if "round" not in record:
                        # 如果没有轮次信息，按顺序分配轮次
                        round_num = len(round_records) + 1
                    else:
                        round_num = record["round"]
                    
                    if round_num not in round_records:
                        round_records[round_num] = []
                    round_records[round_num].append(record_info)
                
                # 按轮次显示记录，最多只显示最近5轮
                sorted_rounds = sorted(round_records.keys(), reverse=True)
                displayed_rounds = sorted_rounds[:5]  # 只显示最近5轮
                
                for round_num in sorted(displayed_rounds):
                    history_info += f"  第{round_num}轮: {', '.join(round_records[round_num])}\n"
                
                if len(sorted_rounds) > 5:
                    history_info += f"  ... (还有{len(sorted_rounds) - 5}轮记录)\n"
                
                if history_info != "\n历史召回记录（请避免重复召回这些已召回的概念）:\n":  # 确保有实际内容
                    context_info += history_info
                    logger.debug(f"添加历史记录信息，共 {len(displayed_rounds)} 条记录")
                else:
                    logger.debug("历史记录信息为空")
            else:
                logger.debug("上下文信息为空")
        
        # 完善提示词，现在要求返回相关的关系编号而非对象类型编号
        if history_info:
            prompt += f"\n请根据以下问题、对象类型信息和关系类型编号{context_info}\n根据以上信息判断还有哪些关系类型编号和问题相关，却没有召回，不要解释，以列表形式返回，例如：[2, 1, 3]，之前召回的概念有缺失，请务必召回新的关系类型编号，只要有一点点可能相关即可。\n\n问题: {query}"
        else:
            prompt += f"\n请根据以下问题，并结合对象类型信息和关系类型编号{context_info}\n，判断问题涉及的子图信息，并只返回子图涉及的关系类型编号，不要解释，以列表形式返回，例如：[2, 1, 3]，都不相关则返回[]，如果不确定或只要一点点相关，就返回，不要遗漏任何关系类型\n\n问题: {query}"
            
        logger.debug("提示词完善完成")
        return prompt

    @classmethod
    def _sort_by_score_desc(cls, items: List[Any], score_field: Union[str, int] = "score") -> List[Any]:
        """
        按分数降序排列对象列表
        
        Args:
            items: 包含分数字段的对象列表，可以是字典列表或元组列表
            score_field: 分数字段名（字典）或索引（元组），默认为"score"
            
        Returns:
            按分数降序排列的对象列表
        """
        if not items:
            return items
            
        # 判断是字典列表还是元组列表
        if isinstance(items[0], dict):
            # 字典列表情况
            return sorted(items, key=lambda x: x.get(score_field, 0), reverse=True)
        elif isinstance(items[0], (tuple, list)):
            # 元组或列表情况，假设分数在指定索引位置
            return sorted(items, key=lambda x: x[score_field] if len(x) > score_field else 0, reverse=True)
        else:
            # 其他情况，尝试直接访问属性
            return sorted(items, key=lambda x: getattr(x, score_field, 0), reverse=True)
    
    @classmethod
    async def rank_relation_types(cls, query: str, network_details: Dict[str, Any], top_k: int = 10, additional_context: Optional[str] = None, session_id: Optional[str] = None, skip_llm: bool = False, account_id: str = None, account_type: str = None) -> Tuple[Dict, List[Dict[str, Any]]]:
        """
        使用LLM对关系类型进行相关性排序
        
        Args:
            query: 用户查询
            network_details: 知识网络详情字典
            top_k: 返回前K个相关关系类型，默认为10
            additional_context: 额外的上下文信息，用于二次检索时提供更精确的检索信息
            session_id: 会话ID，用于获取历史召回记录
            skip_llm: 是否跳过LLM处理，直接返回前top_k个关系类型，默认为False
            
        Returns:
            过滤后的objects_mapping和relations_mapping
        """
        if not network_details:
            return {}, []
            
        # 1. 初始化和数据收集
        current_kn_id = network_details.get('id')
        # 收集top_k个关系类型和对象类型
        objects_mapping, relations_mapping = cls._collect_relation_and_object_types(
            network_details, session_id, top_k)
        
        if not relations_mapping:
            return {}, []
        
        # 如果跳过LLM处理，直接返回前top_k个关系类型
        if skip_llm:
            logger.debug(f"跳过LLM处理，直接返回前{top_k}个关系类型（当前relations_mapping有{len(relations_mapping)}个）")
            # 确保返回的数量不超过top_k
            if len(relations_mapping) > top_k:
                relations_mapping = relations_mapping[:top_k]
            return objects_mapping, relations_mapping
            
        
        
        # 3. 处理对象属性信息
        # 计算属性相关性分数
        property_mapping = await cls._process_object_properties(objects_mapping, query, session_id, current_kn_id)
        
        # 按对象类型分组并筛选属性
        final_candidate_props, obj_type_props = cls._filter_and_group_properties(
            property_mapping)
            
        # 2. 构建基础提示词
        prompt = cls._build_network_info_prompt(network_details)
        # 4. 构建对象类型详细信息（放在关系类型编号之前）
        prompt += cls._build_object_types_detail_prompt(objects_mapping, obj_type_props, final_candidate_props)
        
        # 5. 构建关系类型编号信息
        prompt += cls._build_relation_paths_prompt(relations_mapping, objects_mapping)
        
        # 6. 添加上下文和历史记录信息并完善提示词
        prompt = cls._build_context_and_finalize_prompt(prompt, query, additional_context, session_id, objects_mapping, current_kn_id)
        
        # 美化prompt并打印
        formatted_prompt = "\n" + "="*50 + "\n" + "关系类型排序提示词" + "\n" + "="*50 + "\n" + prompt + "\n" + "="*50 + "\n"
        logger.debug(formatted_prompt)
        
        # 调用LLM并处理结果
        try:
            filtered_objects_mapping, relevant_relations = await cls._call_llm_and_process_results(prompt, query, objects_mapping, top_k, relations_mapping, account_id=account_id, account_type=account_type)
            logger.debug(f"成功排序关系类型，返回 {len(relevant_relations)} 个结果")
            return filtered_objects_mapping, relevant_relations
        except Exception as e:
            logger.error(f"关系类型排序失败: {str(e)}", exc_info=True)
            raise