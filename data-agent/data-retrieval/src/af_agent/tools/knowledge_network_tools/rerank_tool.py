# -*- coding: utf-8 -*-
# @Author:  AI Assistant
# @Date: 2025-04-05

import json
import os
from typing import Dict, Any, List, Optional
from fastapi import Body, HTTPException
from langchain.pydantic_v1 import BaseModel, Field
import asyncio

# 导入LLM工具
from af_agent.tools.graph_tools.utils.llm import llm_chat, llm_chat_stream
# 导入重排序客户端
from af_agent.tools.graph_tools.driven.external.rerank_client import RerankClient
# 导入日志模块
from af_agent.logs.logger import logger
# 导入标准错误响应类
from af_agent.errors import KnowledgeNetworkRerankError, KnowledgeNetworkLLMError, KnowledgeNetworkParamError
# 导入Pydantic模型
from .models import QueryUnderstanding, RerankInput

rerank_llm_model = os.getenv("RERANK_LLM_MODEL", "Tome-pro")


class KnowledgeNetworkRerankTool:
    """基于大模型的概念重排序工具
    
    支持对概念进行重排序，过滤掉与问题无关的概念。
    """
    
    def __init__(self):
        pass

    @classmethod
    def _format_concept_text(cls, concept: Dict[str, Any]) -> str:
        """将概念格式化为更自然、口语化的文本，用于大模型排序"""
        concept_text = ""
        
        # 获取概念类型和详情
        concept_type = concept.get("concept_type", "")
        concept_detail = concept.get("concept_detail", {})
        concept_name = concept.get("concept_name", "")
        
        # 添加概念基本信息，使用更自然的语言
        if concept_type and concept_name:
            concept_text += f"我们有一个'{concept_name}'的概念"
        else:
            raise Exception(f"概念 {concept} 缺少必要的类型或名称信息")

        
        # 添加概念的详细属性信息
        if concept_detail:
            attr_descriptions = []
            # 处理concept_detail下的描述comment字段
            if "comment" in concept_detail and concept_detail["comment"]:
                attr_descriptions.append(f"描述为{concept_detail['comment']}")
            
            # 处理concept_detail下的其他属性
            # for attr_key, attr_value in concept_detail.items():
            #     # 跳过name和detail属性，因为已经处理过了
            #     if attr_key not in ["name", "detail"] and attr_value:
            #         attr_descriptions.append(f"{attr_key}为{attr_value}")
            
            # 处理数据属性（data_properties）下的comment字段
            if "data_properties" in concept_detail and concept_detail["data_properties"]:
                for prop in concept_detail["data_properties"]:
                    if "comment" in prop and prop["comment"]:
                        attr_descriptions.append(prop["comment"])
            
            if attr_descriptions:
                concept_text += "，具有" + "，".join(attr_descriptions)
        
        concept_text += "。"
        return concept_text

    @classmethod
    def _format_intent_text(cls, intent: List[Dict[str, Any]]) -> str:
        """将intent信息格式化为更自然、口语化的文本，用于大模型排序"""
        if not intent:
            return ""
        
        intent_texts = []
        for idx, intent_item in enumerate(intent):
            query_segment = intent_item.get("query_segment", "")
            confidence = intent_item.get("confidence", 0)
            reasoning = intent_item.get("reasoning", "")
            related_concepts = intent_item.get("related_concepts", [])
            
            if query_segment:
                # 构建意图描述
                intent_text = f"意图{idx+1}是关于'{query_segment}'"
                
                # 添加置信度
                if confidence:
                    intent_text += f"，置信度为{confidence}"
                
                # 添加推理信息
                if reasoning:
                    intent_text += f"，推理说明：{reasoning}"
                
                # 添加相关概念信息
                if related_concepts:
                    concept_names = [concept.get("concept_name", concept.get("concept_id", "")) for concept in related_concepts]
                    # 过滤掉空的概念名称
                    concept_names = [name for name in concept_names if name]
                    if concept_names:
                        intent_text += f"，相关概念包括：{', '.join(concept_names)}"
                
                intent_texts.append(intent_text)
        
        return "；".join(intent_texts) + "。" if intent_texts else ""

    @classmethod
    def _build_rerank_prompt(cls, question: str, concepts: List[Dict[str, Any]], intents: List[Dict[str, Any]] = None) -> str:
        """构建重排序的提示词
        Args:
            question: 问题文本
            concepts: 概念列表
            batch_start_index: 批次起始索引，用于批次处理时调整概念编号
            intents: 意图列表，可选
        """
        # 添加意图信息到提示词开头
        if intents:
            intent_text = cls._format_intent_text(intents)
            if intent_text:
                prompt = f"""用户的意图是：{intent_text}
问题: {question}
请仔细分析以下概念列表，只返回与上述问题相关的概念编号。
对于与问题无关的概念，请完全忽略，不要在输出中包含它们。请按照与问题相关性从高到低的顺序返回概念编号。
概念列表:"""    
            else:
                prompt = f"""问题: {question}
请仔细分析以下概念列表，只返回与上述问题相关的概念编号。对于与问题无关的概念，请完全忽略，不要在输出中包含它们。
请按照与问题相关性从高到低的顺序返回概念编号。
概念列表:"""
        else:
            prompt = f"""问题: {question}
请仔细分析以下概念列表，只返回与上述问题相关的概念编号。对于与问题无关的概念，请完全忽略，不要在输出中包含它们。
请按照与问题相关性从高到低的顺序返回概念编号。
概念列表:"""
        
        for idx, concept in enumerate(concepts):
            global_idx = idx + 1  # 全局编号（从1开始）
            prompt += f"\n[{global_idx}] {cls._format_concept_text(concept)}"
        
        prompt += """
请只返回与问题相关的概念编号，按照相关性排序，以列表形式返回，例如：[3, 1, 5]，都不相关，返回[]"""
        logger.debug(f"构建的重排序提示词: {prompt}")
        return prompt

    @classmethod
    async def _call_llm_for_rerank(cls, question: str, concepts: List[Dict[str, Any]], intents: List[Dict[str, Any]] = None, batch_size: int = 128, account_id: str = None, account_type: str = None) -> tuple:
        """调用大模型进行重排序，支持分批处理大量概念，返回(索引列表, 分数列表)"""
        logger.info(f"开始使用LLM进行概念重排序，问题: {question}, 概念数量: {len(concepts)}")
        
        
        # 统一处理逻辑，无论概念数量多少
        all_results = []
        batch_count = (len(concepts) + batch_size - 1) // batch_size
        logger.debug(f"需要分{batch_count}批处理，概念数量: {len(concepts)}")
        
        # 按批次处理概念
        for i in range(0, len(concepts), batch_size):
            batch_concepts = concepts[i:i + batch_size]
            batch_start_index = i
            batch_num = i // batch_size + 1
            
            try:
                logger.debug(f"处理第{batch_num}/{batch_count}批次，概念数量: {len(batch_concepts)}")
                # 构建当前批次的提示词，传入intents参数
                prompt = cls._build_rerank_prompt(question, batch_concepts, intents)
                # 处理当前批次
                batch_results = await cls._process_single_batch(prompt, batch_concepts, account_id=account_id, account_type=account_type)
                logger.debug(f"第{batch_num}批次处理完成，返回索引数量: {len(batch_results)}")
                # 调整索引以反映全局位置
                adjusted_results = [idx+batch_start_index for idx in batch_results if isinstance(idx, (int, float)) and not isinstance(idx, bool)]
                all_results.extend(adjusted_results)
            except Exception as e:
                logger.error(f"大模型处理第{batch_num}批次时出错: {str(e)}", exc_info=True)
                # 出错时，为当前批次的所有概念分配默认顺序
                default_indices = list(range(batch_start_index, batch_start_index + len(batch_concepts)))
                all_results.extend(default_indices)
        
        # 去重并保持顺序
        seen = set()
        unique_results = []
        for idx in all_results:
            if idx not in seen and 0 <= idx < len(concepts):
                unique_results.append(int(idx))
                seen.add(idx)
        
        # 记录LLM返回的相关概念索引
        llm_returned_indices = set(unique_results[:len(seen)])
        
        # 如果某些概念未被包含，添加到结果末尾
        remaining_indices = [i for i in range(len(concepts)) if i not in seen]
        unique_results.extend(remaining_indices)
        
        # 为每个概念分配分数：LLM返回的相关概念分数为1，末尾补充的概念分数为0
        scores = []
        for idx in unique_results:
            if idx in llm_returned_indices:
                scores.append(1.0)  # LLM返回的相关概念分数为1
            else:
                scores.append(0.0)  # 末尾补充的概念分数为0
        
        logger.info(f"LLM重排序全部批次完成，最终返回索引数量: {len(unique_results)}")
        return unique_results, scores

    @classmethod
    async def _process_single_batch(cls, prompt: str, concepts: List[Dict[str, Any]], account_id: str = None, account_type: str = None) -> List[int]:
        """处理单个批次的提示词，使用流式调用大模型"""
        logger.debug(f"开始处理单个批次，概念数量: {len(concepts)}")
        
        # 构建消息
        messages = [
            {
                "role": "system",
                "content": "你是一个智能概念筛选和排序助手。你能够根据用户提出的问题，从概念列表中筛选出相关的概念，并按照相关性进行排序，只返回相关概念的编号。"
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
        
        # 大模型参数，默认值
        default_llm_params = {
            "name": rerank_llm_model,
            "temperature": 0,
            "top_k": 2,
            "top_p": 0.5,
            "frequency_penalty": 0.5,
            "max_tokens": 5000,
            "presence_penalty": 0.5
        }
        
        # 将 account_id 和 account_type 添加到参数中
        if account_id:
            default_llm_params["account_id"] = account_id
        if account_type:
            default_llm_params["account_type"] = account_type
        
        # 使用默认参数
        inner_llm = default_llm_params
        logger.debug(f"LLM参数: {inner_llm}")
        
        try:
            # 流式调用大模型
            logger.debug("开始流式调用LLM")
            content = ""
            async for chunk in llm_chat_stream(inner_llm, messages):
                # 收集流式响应的内容
                if isinstance(chunk, dict) and "content" in chunk:
                    content += chunk["content"]
                elif isinstance(chunk, str):
                    content += chunk
            logger.debug("LLM流式调用完成")
            logger.debug(f"LLM响应内容: {content}")
            
            # 提取索引列表
            import re
            # 匹配类似 [1, 2, 3] 的列表
            match = re.search(r'\[([0-9,\s]+)\]', content)
            if match:
                indices_str = match.group(1)
                indices = [int(i.strip()) for i in indices_str.split(',') if i.strip().isdigit()]
                # 转换为0基索引并验证范围
                zero_based_indices = [i-1 for i in indices]
                logger.debug(f"从响应中提取到索引: {zero_based_indices}")
                return zero_based_indices
            else:
                # 如果没有找到明确的列表，尝试提取数字
                numbers = re.findall(r'\d+', content)
                indices = [int(i) - 1 for i in numbers]
                logger.debug(f"从响应中提取到数字: {indices}")
                return indices if indices else []
                
        except KnowledgeNetworkLLMError:
            # 重新抛出已定义的异常
            raise
        except Exception as e:
            # 如果大模型调用失败，抛出错误
            logger.error(f"大模型调用失败: {str(e)}", exc_info=True)
            raise KnowledgeNetworkLLMError(
                detail={"error": str(e)},
                link="https://example.com/api-docs/rerank"
            )
            raise error_response

    @classmethod
    async def _call_vector_for_rerank(cls, question: str, concepts: List[Dict[str, Any]], batch_size: int = 128) -> List[tuple]:
        """调用向量重排序模型进行重排序，支持分批处理大量概念，返回(索引, 分数)元组列表"""
        logger.info(f"开始使用向量模型进行概念重排序，问题: {question}, 概念数量: {len(concepts)}")
        
        # 统一处理逻辑，无论概念数量多少
        all_scores = []
        batch_count = (len(concepts) + batch_size - 1) // batch_size
        logger.debug(f"需要分{batch_count}批处理，概念数量: {len(concepts)}")
        
        # 按批次处理概念
        for i in range(0, len(concepts), batch_size):
            batch_concepts = concepts[i:i + batch_size]
            batch_start_index = i
            batch_num = i // batch_size + 1

            try:
                logger.debug(f"处理第{batch_num}/{batch_count}批次，概念数量: {len(batch_concepts)}")
                # 处理当前批次
                batch_scores = await cls._process_vector_single_batch(question, batch_concepts)
                # 添加索引信息
                if batch_scores and len(batch_scores) > 0:
                    indexed_scores = [(int(idx + batch_start_index), float(score)) for idx, score in enumerate(batch_scores) 
                                    if isinstance(idx, (int, float)) and not isinstance(idx, bool) and isinstance(score, (int, float))]
                    all_scores.extend(indexed_scores)
                    logger.debug(f"第{batch_num}批次处理完成，返回分数数量: {len(batch_scores)}")
                else:
                    logger.warning(f"第{batch_num}批次未返回分数，为所有概念分配默认得分(0.0)")
                    # 如果当前批次没有返回分数，为所有概念分配默认得分（0分）
                    indexed_scores = [(int(idx + batch_start_index), 0.0) for idx in range(len(batch_concepts))]
                    all_scores.extend(indexed_scores)
            except Exception as e:
                logger.error(f"向量重排序处理第{batch_num}批次时出错: {str(e)}", exc_info=True)
                # 出错时，为当前批次的所有概念分配默认得分（0分）
                indexed_scores = [(int(idx + batch_start_index), 0.0) for idx in range(len(batch_concepts))]
                all_scores.extend(indexed_scores)
        
        # 如果没有任何分数，返回默认顺序
        if not all_scores:
            logger.warning("向量重排序未返回任何分数，返回默认顺序")
            return [(i, 0.0) for i in range(len(concepts))]
        
        # 根据得分排序，得分高的在前面
        sorted_indexed_scores = sorted(all_scores, key=lambda x: x[1], reverse=True)
        # 确保返回有效的索引列表
        valid_indexed_scores = [(int(i), float(score)) for i, score in sorted_indexed_scores 
                               if isinstance(i, (int, float)) and not isinstance(i, bool) and 0 <= i < len(concepts)]
        
        # 如果没有有效索引，返回默认顺序
        if not valid_indexed_scores:
            logger.warning("向量重排序未返回有效索引，返回默认顺序")
            return [(i, 0.0) for i in range(len(concepts))]
            
        logger.info(f"向量重排序全部批次完成，最终返回索引分数对数量: {len(valid_indexed_scores)}")
        return valid_indexed_scores

    @classmethod
    async def _process_vector_single_batch(cls, question: str, batch_concepts: List[Dict[str, Any]]) -> List[float]:
        """处理单个批次的向量重排序，返回实际的排序分数而不是索引"""
        logger.debug(f"开始处理向量重排序单个批次，概念数量: {len(batch_concepts)}")
        
        # 构造slices数据
        slices = []
        for concept in batch_concepts:
            concept_text = cls._format_concept_text(concept)
            slices.append(concept_text)
        
        # 创建重排序客户端实例
        rerank_client = RerankClient()
        
        try:
            # 调用重排序服务
            logger.debug(f"开始调用向量重排序服务，问题: {question}")
            # 使用更清晰的格式打印slices数据
            logger.debug(f"slices数据为:\n" + "\n".join([f"  [{i}]: {slice}" for i, slice in enumerate(slices)]))
            rerank_scores = await rerank_client.ado_rerank(slices, question)
            logger.debug(f"向量重排序服务调用完成，返回分数数量: {len(rerank_scores) if rerank_scores else 0}")
            
            # 确保返回有效的分数列表
            if rerank_scores and len(rerank_scores) > 0:
                # 新格式: [{"relevance_score": 0.985, "index": 1, "document": null}, ...]
                # 需要根据index重新排序并提取分数
                sorted_scores = sorted(rerank_scores, key=lambda x: x["index"])
                validated_scores = [float(item["relevance_score"]) for item in sorted_scores 
                                  if isinstance(item["relevance_score"], (int, float))]
                logger.debug(f"返回验证后的分数列表: {validated_scores}")
                return validated_scores
            else:
                logger.warning("向量重排序服务未返回分数，返回默认分数(0.0)")
                # 如果没有返回分数，返回默认分数列表
                return [0.0] * len(batch_concepts)
        except Exception as e:
            # 如果向量重排序调用失败，为所有概念分配默认分数
            logger.error(f"向量重排序调用失败: {str(e)}", exc_info=True)
            return [0.0] * len(batch_concepts)

    @classmethod
    async def rerank_concepts(cls, question: str, concepts: List[Dict[str, Any]], action: str = "llm", intents: List[Dict[str, Any]] = None, batch_size: int = None, account_id: str = None, account_type: str = None) -> tuple:
        """对概念进行重排序，返回(重排序的概念列表, 排序分数列表)"""
        logger.info(f"开始概念重排序，问题: {question}, 概念数量: {len(concepts)}, 方法: {action}")
        
        # 确保输入的概念列表不为空
        if not concepts or len(concepts) == 0:
            logger.warning("输入的概念列表为空，直接返回空列表")
            return [], []
            
        try:
            if action == "vector":
                # 调用向量重排序，返回(索引, 分数)元组列表
                indexed_scores = await cls._call_vector_for_rerank(question, concepts, batch_size)
                # 提取索引和分数
                sorted_indices = [idx for idx, score in indexed_scores]
                scores = [score for idx, score in indexed_scores]
            else:
                # 调用LLM重排序，传入intents参数
                sorted_indices, scores = await cls._call_llm_for_rerank(question, concepts, intents, batch_size, account_id=account_id, account_type=account_type)
            
            # 确保所有索引都是整数类型，过滤掉无效索引
            valid_data = [(int(i), score) for i, score in zip(sorted_indices, scores) 
                         if isinstance(i, (int, float)) and not isinstance(i, bool)]
            valid_indices = [i for i, score in valid_data]
            valid_scores = [score for i, score in valid_data]
            logger.debug(f"过滤后有效索引数量: {len(valid_indices)}")
            
            # 如果没有有效索引，返回原始概念列表
            if not valid_indices:
                logger.warning("没有有效的排序索引，返回原始概念列表")
                return concepts, [0.0] * len(concepts)
                
            # 根据排序索引重新排列概念
            reranked_concepts = [concepts[i] for i in valid_indices if 0 <= i < len(concepts)]
            
            # 如果重排序后的概念列表为空，返回原始概念列表
            if not reranked_concepts:
                logger.warning("重排序后的概念列表为空，返回原始概念列表")
                return concepts, [0.0] * len(concepts)
                
            logger.info(f"概念重排序完成，返回概念数量: {len(reranked_concepts)}")
            # 确保分数列表与概念列表长度一致
            if len(valid_scores) < len(reranked_concepts):
                valid_scores.extend([0.0] * (len(reranked_concepts) - len(valid_scores)))
            elif len(valid_scores) > len(reranked_concepts):
                valid_scores = valid_scores[:len(reranked_concepts)]
                
            return reranked_concepts, valid_scores
            
        except Exception as e:
            # 如果出现任何错误，返回原始概念列表
            logger.error(f"重排序过程中出现错误: {str(e)}", exc_info=True)
            return concepts, [0.0] * len(concepts)

    @classmethod
    async def as_async_api_cls(
        cls,
        params: dict = Body(...),
        stream: bool = False,
        mode: str = "http"
    ):
        """API接口方法"""
        # logger.info(f"收到重排序API请求，参数: {params}")
        
        try:
            # 验证参数
            try:
                input_data = RerankInput(**params)
                # 从query_understanding中提取question
                question = input_data.query_understanding.origin_query
                # 从query_understanding中提取intent
                intents = input_data.query_understanding.intent
                # 获取batch_size参数
                batch_size = input_data.batch_size
                logger.debug("参数验证通过")
            except Exception as e:
                logger.error(f"参数验证失败: {str(e)}")
                raise KnowledgeNetworkParamError(
                    detail={"error": str(e)},
                    link="https://example.com/api-docs/rerank"
                )
            
            # 执行重排序
            try:
                reranked_concepts, scores = await cls.rerank_concepts(
                    question=question,
                    concepts=input_data.concepts,
                    action=input_data.action,
                    intents=intents,  # 传入intents参数
                    batch_size=batch_size  # 传入batch_size参数
                )
                logger.info(f"重排序执行完成，返回概念数量: {len(reranked_concepts)}")
            except Exception as e:
                logger.error(f"重排序执行失败: {str(e)}", exc_info=True)
                raise KnowledgeNetworkRerankError(
                    detail={"error": str(e)},
                    link="https://example.com/api-docs/rerank"
                )
            
            # 修改返回结构：根据排序方法设置rerank_score字段
            result_concepts = []
            for i, (concept, score) in enumerate(zip(reranked_concepts, scores)):
                # 复制原始concept结构
                new_concept = concept.copy()
                # 根据排序方法设置rerank_score
                if input_data.action == "vector":
                    # 向量排序：使用实际的排序分数
                    new_concept["rerank_score"] = float(score)
                else:
                    # 大模型排序：使用实际的排序分数（1表示相关概念，0表示末尾补充的概念）
                    new_concept["rerank_score"] = float(score)
                result_concepts.append(new_concept)
            
            # 按照用户要求，直接返回概念列表
            # logger.debug(f"返回结果: {result_concepts}")
            return result_concepts
        
        except HTTPException:
            # 重新抛出 HTTPException，保持原有行为
            raise
        except (KnowledgeNetworkParamError, KnowledgeNetworkRerankError, KnowledgeNetworkLLMError) as e:
            # 将自定义异常转换为标准化错误响应
            raise HTTPException(
                status_code=400 if isinstance(e, KnowledgeNetworkParamError) else 500,
                detail=e.json()
            )

    @classmethod
    async def get_api_schema(cls):
        """获取API schema定义"""
        inputs = {
            'query_understanding': {
                'origin_query': '分析销售数据中的趋势',
                'processed_query': '分析销售数据中的趋势',
                'intent': [
                    {
                        'type': 'analysis',
                        'description': '数据分析意图',
                        'confidence': 0.9
                    }
                ]
            },
            'concepts': [
                {
                    'id': 'concept_1',
                    'name': '销售额',
                    'description': '产品的销售金额',
                    'type': 'metric',
                    'properties': {}
                }
            ],
            'action': 'llm',
            'batch_size': 128
        }

        outputs = [
            {
                'id': 'concept_1',
                'name': '销售额',
                'description': '产品的销售金额',
                'type': 'metric',
                'properties': {},
                'rerank_score': 0.95
            }
        ]

        return {
            "post": {
                "summary": "knowledge_rerank",
                "description": "概念重排序工具，根据查询意图对概念列表进行重排序",
                "parameters": [
                    {
                        "name": "stream",
                        "in": "query",
                        "description": "是否流式返回",
                        "schema": {
                            "type": "boolean",
                            "default": False
                        },
                    },
                    {
                        "name": "mode",
                        "in": "query",
                        "description": "请求模式",
                        "schema": {
                            "type": "string",
                            "enum": ["http", "sse"],
                            "default": "http"
                        },
                    }
                ],
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "query_understanding": {
                                        "type": "object",
                                        "description": "查询理解结果",
                                        "properties": {
                                            "origin_query": {
                                                "type": "string",
                                                "description": "原始查询文本"
                                            },
                                            "processed_query": {
                                                "type": "string",
                                                "description": "处理后的查询文本"
                                            },
                                            "intent": {
                                                "type": "array",
                                                "description": "意图列表",
                                                "items": {
                                                    "type": "object",
                                                    "properties": {
                                                        "type": {"type": "string"},
                                                        "description": {"type": "string"},
                                                        "confidence": {"type": "number"}
                                                    }
                                                }
                                            }
                                        },
                                        "required": ["origin_query"]
                                    },
                                    "concepts": {
                                        "type": "array",
                                        "description": "需要重排序的概念列表",
                                        "items": {
                                            "type": "object",
                                            # "properties": {
                                            #     "id": {"type": "string"},
                                            #     "name": {"type": "string"},
                                            #     "description": {"type": "string"},
                                            #     "type": {"type": "string"},
                                            #     "properties": {"type": "object"}
                                            # }
                                        },
                                        # "minItems": 1
                                    },
                                    "action": {
                                        "type": "string",
                                        "description": "重排序方法",
                                        "enum": ["llm", "vector"],
                                        "default": "llm"
                                    },
                                    "batch_size": {
                                        "type": "integer",
                                        "description": "批处理大小",
                                        "default": 128
                                    }
                                },
                                "required": ["query_understanding", "concepts"]
                            },
                            "example": inputs
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful operation",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "array",
                                    "description": "重排序后的概念列表",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "id": {"type": "string"},
                                            "name": {"type": "string"},
                                            "description": {"type": "string"},
                                            "type": {"type": "string"},
                                            "properties": {"type": "object"},
                                            "rerank_score": {"type": "number"}
                                        }
                                    }
                                },
                                "example": outputs
                            }
                        }
                    }
                }
            }
        }