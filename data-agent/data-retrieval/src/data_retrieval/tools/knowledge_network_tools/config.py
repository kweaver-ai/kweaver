# -*- coding: utf-8 -*-
"""
知识网络工具配置文件
统一管理所有 API_BASE 和相关配置
"""

import os


class KnowledgeNetworkConfig:
    """知识网络工具配置类"""
    
    # 知识网络管理接口 API_BASE
    # 用于获取知识网络列表和详情
    KNOWLEDGE_NETWORK_API_BASE = os.getenv(
        "KNOWLEDGE_NETWORK_API_BASE",
        "http://ontology-manager-svc:13014/api/ontology-manager"
        # "http://192.168.232.11:13014/api/ontology-manager"
    )
    
    # 知识网络查询接口 API_BASE
    # 用于对象检索和关系路径检索
    KNOWLEDGE_NETWORK_QUERY_API_BASE = os.getenv(
        "KNOWLEDGE_NETWORK_QUERY_API_BASE",
        "http://ontology-query-svc:13018/api/ontology-query/in/v1"
        # "http://192.168.232.11:13018/api/ontology-query/in/v1"
    )
    
    # 大模型配置
    # 用于知识网络检索相关的 LLM 调用
    KN_RETRIEVAL_LLM_MODEL = os.getenv(
        "RERANK_LLM_MODEL",
        "Tome-pro"
    )


# 创建配置实例
config = KnowledgeNetworkConfig()

