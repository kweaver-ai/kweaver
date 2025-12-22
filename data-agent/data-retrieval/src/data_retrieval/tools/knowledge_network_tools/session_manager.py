# -*- coding: utf-8 -*-
"""
检索会话管理器，用于存储和管理多轮对话的历史召回记录
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

# 导入日志模块
from data_retrieval.logs.logger import logger


class RetrievalSessionManager:
    """
    检索会话管理器，用于存储和管理多轮对话的历史召回记录
    """
    
    # 类变量，用于存储所有会话的召回记录
    # 格式: {session_id: {kn_id: {"retrieval_results": [results], "relation_scores": {relation_id: score}, "property_scores": {property_id: score}}}}
    _session_records: Dict[str, Dict[str, Dict[str, Any]]] = {}
    
    # 类变量，用于存储会话的最后访问时间
    _session_last_access: Dict[str, datetime] = {}
    
    # 会话失效时间（分钟）
    SESSION_EXPIRE_MINUTES = 10
    
    @classmethod
    def _update_session_access_time(cls, session_id: str) -> None:
        """
        更新会话的最后访问时间
        
        Args:
            session_id: 会话ID
        """
        # 检查session_id是否为空，如果为空则不更新
        if not session_id:
            return
            
        cls._session_last_access[session_id] = datetime.now()
    
    @classmethod
    def _clean_expired_sessions(cls) -> None:
        """
        清理过期的会话
        """
        current_time = datetime.now()
        expired_sessions = []
        
        for session_id, last_access in cls._session_last_access.items():
            # 检查会话是否过期
            if current_time - last_access > timedelta(minutes=cls.SESSION_EXPIRE_MINUTES):
                expired_sessions.append(session_id)
        
        # 删除过期会话
        for session_id in expired_sessions:
            if session_id in cls._session_records:
                del cls._session_records[session_id]
            if session_id in cls._session_last_access:
                del cls._session_last_access[session_id]
            logger.info(f"已清理过期会话 {session_id}")
        
        if expired_sessions:
            logger.info(f"共清理了 {len(expired_sessions)} 个过期会话")
    
    @classmethod
    def add_retrieval_record(cls, session_id: str, kn_id: str, retrieval_results: List[Dict[str, Any]]) -> None:
        """
        添加检索记录到会话中
        
        Args:
            session_id: 会话ID
            kn_id: 知识网络ID
            retrieval_results: 检索结果列表
        """
        # 检查session_id是否为空，如果为空则不存储
        if not session_id:
            logger.debug(f"session_id为空，跳过存储 {len(retrieval_results)} 条检索结果")
            return
            
        # 更新会话访问时间
        cls._update_session_access_time(session_id)
        
        if session_id not in cls._session_records:
            cls._session_records[session_id] = {}
            
        if kn_id not in cls._session_records[session_id]:
            # 初始化知识网络记录结构
            cls._session_records[session_id][kn_id] = {
                "retrieval_results": [],
                "relation_scores": {},
                "property_scores": {}
            }
        
        # 计算当前轮次
        current_round = len(cls._get_rounds_for_kn(cls._session_records[session_id][kn_id]["retrieval_results"])) + 1
        
        # 为每个检索结果添加轮次信息
        results_with_round = []
        for result in retrieval_results:
            result_copy = result.copy()
            result_copy["round"] = current_round
            results_with_round.append(result_copy)
            
        # 添加新的检索结果
        cls._session_records[session_id][kn_id]["retrieval_results"].extend(results_with_round)
        
        logger.info(f"会话 {session_id} 的知识网络 {kn_id} 第{current_round}轮添加了 {len(retrieval_results)} 条检索记录")
    
    @classmethod
    def _get_rounds_for_kn(cls, records: List[Dict[str, Any]]) -> set:
        """
        获取知识网络记录中的所有轮次
        
        Args:
            records: 检索记录列表
            
        Returns:
            轮次集合
        """
        rounds = set()
        for record in records:
            if "round" in record:
                rounds.add(record["round"])
        return rounds
    
    @classmethod
    def get_session_count(cls) -> int:
        """
        获取当前活跃会话数量
        
        Returns:
            活跃会话数量
        """
        return len(cls._session_records)
    
    @classmethod
    def get_session_info(cls) -> Dict[str, Any]:
        """
        获取会话统计信息
        
        Returns:
            会话统计信息
        """
        session_count = len(cls._session_records)
        total_records = sum(
            sum(len(kn_data["retrieval_results"]) for kn_data in kn_dict.values())
            for kn_dict in cls._session_records.values()
        )
        total_relation_scores = sum(
            sum(len(kn_data["relation_scores"]) for kn_data in kn_dict.values())
            for kn_dict in cls._session_records.values()
        )
        total_property_scores = sum(
            sum(len(kn_data["property_scores"]) for kn_data in kn_dict.values())
            for kn_dict in cls._session_records.values()
        )
        
        return {
            "active_sessions": session_count,
            "total_records": total_records,
            "total_relation_scores": total_relation_scores,
            "total_property_scores": total_property_scores,
            "expire_minutes": cls.SESSION_EXPIRE_MINUTES
        }
    
    @classmethod
    def get_retrieval_history(cls, session_id: str, kn_id: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
        """
        获取会话的检索历史记录
        
        Args:
            session_id: 会话ID
            kn_id: 可选的知识网络ID，如果指定则只返回该知识网络的记录
            
        Returns:
            检索历史记录，格式为 {kn_id: [retrieval_results]}
        """
        # 检查会话是否存在
        if session_id not in cls._session_records:
            return {}
        
        # 更新会话访问时间
        cls._update_session_access_time(session_id)
            
        if kn_id:
            # 如果指定了知识网络ID，只返回该知识网络的记录
            if kn_id in cls._session_records[session_id]:
                return {kn_id: cls._session_records[session_id][kn_id]["retrieval_results"]}
            else:
                return {kn_id: []}
        else:
            # 返回所有知识网络的记录
            result = {}
            for kn_id, kn_data in cls._session_records[session_id].items():
                result[kn_id] = kn_data["retrieval_results"]
            return result
    
    @classmethod
    def get_all_rounds_union(cls, session_id: str, kn_id: str) -> List[Dict[str, Any]]:
        """
        获取指定知识网络所有轮次检索结果的并集
        
        Args:
            session_id: 会话ID
            kn_id: 知识网络ID
            
        Returns:
            所有轮次检索结果的并集，去重后的列表
        """
        # 检查会话和知识网络是否存在
        if (session_id not in cls._session_records or 
            kn_id not in cls._session_records[session_id]):
            return []
        
        # 更新会话访问时间
        cls._update_session_access_time(session_id)
        
        # 获取所有轮次的记录
        all_records = cls._session_records[session_id][kn_id]["retrieval_results"]
        
        # 用于去重的集合，基于concept_id和concept_type
        seen = set()
        union_result = []
        
        for record in all_records:
            # 创建唯一标识符
            concept_id = record.get("concept_id", "")
            concept_type = record.get("concept_type", "")
            unique_key = (concept_id, concept_type)
            
            # 如果没有见过这个概念，添加到结果中
            if unique_key not in seen:
                seen.add(unique_key)
                # 保留必要的字段，包括properties（对象类型需要）
                result_item = {
                    "concept_type": record.get("concept_type", ""),
                    "concept_id": record.get("concept_id", ""),
                    "concept_name": record.get("concept_name", "")
                }
                # 如果是对象类型，保留properties字段和primary_key_field，不包含source_object_type_id和target_object_type_id
                if concept_type == "object_type":
                    result_item["properties"] = record.get("properties", [])
                    # 保留主键字段信息
                    if "primary_key_field" in record:
                        result_item["primary_key_field"] = record.get("primary_key_field")
                else:
                    # 关系类型包含source_object_type_id和target_object_type_id
                    result_item["source_object_type_id"] = record.get("source_object_type_id")
                    result_item["target_object_type_id"] = record.get("target_object_type_id")
                union_result.append(result_item)
        
        return union_result
    
    @classmethod
    def get_previous_rounds_union(cls, session_id: str, kn_id: str, exclude_current_round: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        获取指定知识网络之前所有轮次检索结果的并集（不包括当前轮次）
        
        Args:
            session_id: 会话ID
            kn_id: 知识网络ID
            exclude_current_round: 要排除的当前轮次号，如果为None则排除最新轮次
            
        Returns:
            之前所有轮次检索结果的并集，去重后的列表
        """
        # 检查会话和知识网络是否存在
        if (session_id not in cls._session_records or 
            kn_id not in cls._session_records[session_id]):
            return []
        
        # 更新会话访问时间
        cls._update_session_access_time(session_id)
        
        # 获取所有轮次的记录
        all_records = cls._session_records[session_id][kn_id]["retrieval_results"]
        
        # 确定要排除的轮次号
        if exclude_current_round is None:
            # 如果没有指定，排除最新轮次
            all_rounds = cls._get_rounds_for_kn(all_records)
            if all_rounds:
                exclude_current_round = max(all_rounds)
            else:
                exclude_current_round = -1  # 如果没有轮次，设为-1表示不排除
        
        # 过滤掉当前轮次的记录
        previous_records = [
            record for record in all_records 
            if record.get("round") != exclude_current_round
        ]
        
        # 用于去重的集合，基于concept_id和concept_type
        seen = set()
        union_result = []
        
        for record in previous_records:
            # 创建唯一标识符
            concept_id = record.get("concept_id", "")
            concept_type = record.get("concept_type", "")
            unique_key = (concept_id, concept_type)
            
            # 如果没有见过这个概念，添加到结果中
            if unique_key not in seen:
                seen.add(unique_key)
                # 保留必要的字段，包括properties（对象类型需要）
                result_item = {
                    "concept_type": record.get("concept_type", ""),
                    "concept_id": record.get("concept_id", ""),
                    "concept_name": record.get("concept_name", "")
                }
                # 如果是对象类型，保留properties字段和primary_key_field，不包含source_object_type_id和target_object_type_id
                if concept_type == "object_type":
                    result_item["properties"] = record.get("properties", [])
                    # 保留主键字段信息
                    if "primary_key_field" in record:
                        result_item["primary_key_field"] = record.get("primary_key_field")
                else:
                    # 关系类型包含source_object_type_id和target_object_type_id
                    result_item["source_object_type_id"] = record.get("source_object_type_id")
                    result_item["target_object_type_id"] = record.get("target_object_type_id")
                union_result.append(result_item)
        
        return union_result
    
    @classmethod
    def get_retrieved_concept_ids(cls, session_id: str, kn_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        获取会话中已检索的概念ID列表
        
        Args:
            session_id: 会话ID
            kn_id: 可选的知识网络ID，如果指定则只返回该知识网络的记录
            
        Returns:
            包含概念ID、名称、类型、知识网络ID和轮次的记录列表
        """
        history = cls.get_retrieval_history(session_id, kn_id)
        result = []
        
        for history_kn_id, records in history.items():
            for record in records:
                # 添加知识网络ID到记录中
                record_with_kn_id = record.copy()
                record_with_kn_id["kn_id"] = history_kn_id
                result.append(record_with_kn_id)
            
        return result
    
    @classmethod
    def clear_session(cls, session_id: str) -> None:
        """
        清除指定会话的所有记录
        
        Args:
            session_id: 会话ID
        """
        if session_id in cls._session_records:
            del cls._session_records[session_id]
        if session_id in cls._session_last_access:
            del cls._session_last_access[session_id]
        logger.info(f"已清除会话 {session_id} 的所有记录")
    
    @classmethod
    def clear_knowledge_network_records(cls, session_id: str, kn_id: str) -> None:
        """
        清除会话中特定知识网络的记录
        
        Args:
            session_id: 会话ID
            kn_id: 知识网络ID
        """
        if session_id in cls._session_records and kn_id in cls._session_records[session_id]:
            del cls._session_records[session_id][kn_id]
            logger.info(f"已清除会话 {session_id} 中知识网络 {kn_id} 的记录")
    
    @classmethod
    def clear_relation_scores(cls, session_id: str, kn_id: str) -> None:
        """
        清除会话中特定知识网络的关系路径分数
        
        Args:
            session_id: 会话ID
            kn_id: 知识网络ID
        """
        if (session_id in cls._session_records and 
            kn_id in cls._session_records[session_id]):
            cls._session_records[session_id][kn_id]["relation_scores"] = {}
            logger.info(f"已清除会话 {session_id} 中知识网络 {kn_id} 的关系路径分数")
    
    @classmethod
    def clear_property_scores(cls, session_id: str, kn_id: str) -> None:
        """
        清除会话中特定知识网络的属性分数
        
        Args:
            session_id: 会话ID
            kn_id: 知识网络ID
        """
        if (session_id in cls._session_records and 
            kn_id in cls._session_records[session_id]):
            cls._session_records[session_id][kn_id]["property_scores"] = {}
            logger.info(f"已清除会话 {session_id} 中知识网络 {kn_id} 的属性分数")
    
    @classmethod
    def extend_session_ttl(cls, session_id: str, extend_minutes: int = 30) -> bool:
        """
        延长会话的有效期
        
        Args:
            session_id: 会话ID
            extend_minutes: 延长的分钟数，默认为30分钟
            
        Returns:
            是否成功延长
        """
        # 检查会话是否存在
        if session_id not in cls._session_records:
            return False
        
        # 更新会话访问时间，相当于延长会话有效期
        cls._update_session_access_time(session_id)
        logger.info(f"已延长会话 {session_id} 的有效期 {extend_minutes} 分钟")
        
        return True
    
    @classmethod
    def add_relation_score(cls, session_id: str, kn_id: str, relation_id: str, score: float) -> None:
        """
        添加关系路径分数到会话中
        
        Args:
            session_id: 会话ID
            kn_id: 知识网络ID
            relation_id: 关系ID
            score: 关系路径分数
        """
        # 检查session_id是否为空，如果为空则不存储
        if not session_id:
            return
            
        # 更新会话访问时间
        cls._update_session_access_time(session_id)
        
        if session_id not in cls._session_records:
            cls._session_records[session_id] = {}
            
        if kn_id not in cls._session_records[session_id]:
            # 初始化知识网络记录结构
            cls._session_records[session_id][kn_id] = {
                "retrieval_results": [],
                "relation_scores": {},
                "property_scores": {}
            }
        
        # 添加关系路径分数
        cls._session_records[session_id][kn_id]["relation_scores"][relation_id] = score
    
    @classmethod
    def add_property_score(cls, session_id: str, kn_id: str, property_id: str, score: float) -> None:
        """
        添加属性分数到会话中
        
        Args:
            session_id: 会话ID
            kn_id: 知识网络ID
            property_id: 属性ID
            score: 属性分数
        """
        # 检查session_id是否为空，如果为空则不存储
        if not session_id:
            return
            
        # 更新会话访问时间
        cls._update_session_access_time(session_id)
        
        if session_id not in cls._session_records:
            cls._session_records[session_id] = {}
            
        if kn_id not in cls._session_records[session_id]:
            # 初始化知识网络记录结构
            cls._session_records[session_id][kn_id] = {
                "retrieval_results": [],
                "relation_scores": {},
                "property_scores": {}
            }
        
        # 添加属性分数
        cls._session_records[session_id][kn_id]["property_scores"][property_id] = score
    
    @classmethod
    def get_relation_score(cls, session_id: str, kn_id: str, relation_id: str) -> Optional[float]:
        """
        获取关系路径分数
        
        Args:
            session_id: 会话ID
            kn_id: 知识网络ID
            relation_id: 关系ID
            
        Returns:
            关系路径分数，如果不存在则返回None
        """
        # 检查会话、知识网络和关系是否存在
        if (session_id not in cls._session_records or 
            kn_id not in cls._session_records[session_id] or
            relation_id not in cls._session_records[session_id][kn_id]["relation_scores"]):
            return None
            
        # 更新会话访问时间
        cls._update_session_access_time(session_id)
        
        return cls._session_records[session_id][kn_id]["relation_scores"][relation_id]
    
    @classmethod
    def get_property_score(cls, session_id: str, kn_id: str, property_id: str) -> Optional[float]:
        """
        获取属性分数
        
        Args:
            session_id: 会话ID
            kn_id: 知识网络ID
            property_id: 属性ID
            
        Returns:
            属性分数，如果不存在则返回None
        """
        # 检查会话、知识网络和属性是否存在
        if (session_id not in cls._session_records or 
            kn_id not in cls._session_records[session_id] or
            property_id not in cls._session_records[session_id][kn_id]["property_scores"]):
            return None
            
        # 更新会话访问时间
        cls._update_session_access_time(session_id)
        
        return cls._session_records[session_id][kn_id]["property_scores"][property_id]
    
    @classmethod
    def get_all_relation_scores(cls, session_id: str, kn_id: str) -> Dict[str, float]:
        """
        获取知识网络的所有关系路径分数
        
        Args:
            session_id: 会话ID
            kn_id: 知识网络ID
            
        Returns:
            关系路径分数字典，格式为 {relation_id: score}
        """
        # 检查会话和知识网络是否存在
        if (session_id not in cls._session_records or 
            kn_id not in cls._session_records[session_id]):
            return {}
            
        # 更新会话访问时间
        cls._update_session_access_time(session_id)
        
        return cls._session_records[session_id][kn_id]["relation_scores"].copy()
    
    @classmethod
    def get_all_property_scores(cls, session_id: str, kn_id: str) -> Dict[str, float]:
        """
        获取知识网络的所有属性分数
        
        Args:
            session_id: 会话ID
            kn_id: 知识网络ID
            
        Returns:
            属性分数字典，格式为 {property_id: score}
        """
        # 检查会话和知识网络是否存在
        if (session_id not in cls._session_records or 
            kn_id not in cls._session_records[session_id]):
            return {}
            
        # 更新会话访问时间
        cls._update_session_access_time(session_id)
        
        return cls._session_records[session_id][kn_id]["property_scores"].copy()
    
    @classmethod
    def get_schema_info(cls, session_id: str, kn_id: str) -> Optional[Dict[str, Any]]:
        """
        获取会话中存储的schema信息（对象类型和关系类型）
        
        Args:
            session_id: 会话ID
            kn_id: 知识网络ID
            
        Returns:
            schema信息字典，包含object_types和relation_types，如果不存在则返回None
        """
        # 检查会话和知识网络是否存在
        if (session_id not in cls._session_records or 
            kn_id not in cls._session_records[session_id]):
            return None
        
        # 更新会话访问时间
        cls._update_session_access_time(session_id)
        
        # 获取所有轮次的并集
        all_rounds_union = cls.get_all_rounds_union(session_id, kn_id)
        
        if not all_rounds_union:
            return None
        
        # 分离对象类型和关系类型
        object_types = []
        relation_types = []
        
        for item in all_rounds_union:
            if item.get("concept_type") == "object_type":
                object_types.append(item)
            elif item.get("concept_type") == "relation_type":
                relation_types.append(item)
        
        return {
            "object_types": object_types,
            "relation_types": relation_types
        }
    
    @classmethod
    def has_schema_info(cls, session_id: str, kn_id: str) -> bool:
        """
        检查会话中是否有schema信息
        
        Args:
            session_id: 会话ID
            kn_id: 知识网络ID
            
        Returns:
            如果有schema信息返回True，否则返回False
        """
        schema_info = cls.get_schema_info(session_id, kn_id)
        return schema_info is not None and (
            len(schema_info.get("object_types", [])) > 0 or 
            len(schema_info.get("relation_types", [])) > 0
        )