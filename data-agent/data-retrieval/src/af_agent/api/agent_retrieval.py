from typing import Any
from urllib.parse import urljoin

import urllib3
import os
import traceback

from af_agent.api.error import (
    AfDataSourceError, AgentRetrievalError
)
from af_agent.api.base import API, HTTPMethod
from af_agent.logs.logger import logger

from af_agent.settings import get_settings

import json
import os
from datetime import datetime

urllib3.disable_warnings()

settings = get_settings()


class AgentRetrievalService:

    def __init__(self, base_url: str = "", headers: dict = {}):
        self.base_url: str = settings.DIP_AGENT_RETRIEVAL_URL
        self.outer_dip: bool = False
        self.headers: dict = headers

        if base_url:
            self.base_url: str = base_url
            self.outer_dip = True
        else:
            self.base_url = settings.DIP_AGENT_RETRIEVAL_URL

        self._gen_api_url()

    def _gen_api_url(self):
        if self.outer_dip:
            self.semantic_search_url = urljoin(
                self.base_url,
                "/api/agent-retrieval/v1/kn/semantic-search"
            )
        else:
            self.semantic_search_url = urljoin(
                self.base_url,
                "/api/agent-retrieval/in/v1/kn/semantic-search"
            )

    def semantic_search(self, params: dict = {}, headers: dict = {}) -> dict:
        """语义检索"""
        headers.update(self.headers)
        api = API(
            url=self.semantic_search_url,
            headers=headers,
            method=HTTPMethod.POST,
            payload=params
        )
        try:
            result =  api.call()
            return result
        except AfDataSourceError as e:
            raise AgentRetrievalError(e) from e

    async def semantic_search_async(self, params: dict = {}, headers: dict = {}) -> dict:
        """语义检索"""
        headers.update(self.headers)
        mode = params.pop("mode", "")
        api = API(
            url=self.semantic_search_url,
            headers=headers,
            method=HTTPMethod.POST,
            payload=params,
            params={"mode": mode}
        )
        try:
            result = await api.call_async()
            return result
        except AfDataSourceError as e:
            raise AgentRetrievalError(e) from e


async def get_datasource_from_agent_retrieval_async(
    kn_id: str,
    query: str,
    search_scope: dict = [],
    prev_queries: list = [],
    headers: dict = {},
    base_url: str = "",
    max_concepts: int = 5,
    mode: str = ""
) -> tuple[list, list, list]:
    """
    解析 Agent Retrieval 参数
    """
    # example:
    # {
    #     "kn_id": "129",
    #     "query": "query",
    #     "prev_queries": ["prev_query"]
    # }

    # result
    # {
    #     "query_understanding": {...},
    #     "concepts": [{
    #         "concept_type": "some_type",
    #         "concept_id": "some_id",
    #         "concept_name": "concept_name",
    #         "concept_detail": {
    #             "name": "catalyzer",
    #             "detail": "some_detail",
    #             "data_properties": [...],
    #             "logic_properties": [...],
    #             "data_source": {
    #                  "type": "data_view",
    #                  "id": "d36ig7kinoi9a884un8g",
    #                  "name": "catalyzer"
    #           },
    #         }
    #     }]
    # }
    
    logger.info(f"get_datasource_from_agent_retrieval_async kn_id: {kn_id}, query: {query}, prev_queries: {prev_queries}, headers: {headers}, base_url: {base_url}, max_concepts: {max_concepts}")
    
    if not kn_id:
        return [], [], []
    
    if max_concepts <= 0:
        max_concepts = 10

    search_scope_params = {
        "include_object_types": False,
        "include_relation_types": False,
        "include_action_types": False
    }

    if isinstance(search_scope, str):
        search_scope = search_scope.split(",")

    if search_scope:
        if "object_types" in search_scope:
            search_scope_params["include_object_types"] = True
        if "relation_types" in search_scope:
            search_scope_params["include_relation_types"] = True
        if "action_types" in search_scope:
            search_scope_params["include_action_types"] = True

    # 如果条件无任何包含，则默认包含 object_types
    if list(search_scope_params.values()) == [False, False, False]:
        search_scope_params["include_object_types"] = True

    try:
        agent_retrieval_service = AgentRetrievalService(base_url=base_url, headers=headers)
        params={
            "kn_id": kn_id, 
            "query": query if query else "所有数据",
            "prev_queries": prev_queries,
            "max_concepts": max_concepts,
            "mode": mode,
            "search_scope": search_scope_params
        }
        logger.info(f"semantic_search_async params: {params}")
        result = await agent_retrieval_service.semantic_search_async(params=params)
        
        logger.info(f"semantic_search_async result: {json.dumps(result, indent=2, ensure_ascii=False)}")

        data_views = []
        metrics = []
        relations = []
        concept_data_view_mapping = {}
        
        concept_map = {}
        concepts = result.get("concepts", [])
        if not isinstance(concepts, list):
            concepts = []

        for concept in concepts:
            concept_type = concept.get("concept_type")
            if concept_type and concept_type not in concept_map:
                concept_map[concept_type] = []
            concept_map[concept_type].append(concept)

        # TODO: 目前只保留 object_types 和 relation_types 类型的概念
        for concept in concept_map.get("object_type", []):
            concept_detail = concept.get("concept_detail", {})
            ds = concept_detail.get("data_source", {})
            if ds.get("type") == "data_view":
                data_views.append({
                    "id": ds.get("id"),
                    "view_name": ds.get("name", ""),
                    "concept_detail": concept_detail
                })
                concept_data_view_mapping[concept.get("concept_id")] = ds.get("id")
            
            # 处理逻辑属性(指标)
            logic_properties = concept_detail.get("logic_properties", [])
            for logic_property in logic_properties:
                if logic_property.get("type", "").lower() == "metric":
                    metric_obj = {
                        "id": logic_property.get("data_source", {}).get("id"),
                        "name": logic_property.get("name", ""),
                        "display_name": logic_property.get("display_name", ""),
                        "comment": logic_property.get("comment", ""),
                    }
                    metrics.append(metric_obj)

        relations = []
        for concept in concept_map.get("relation_type", []):
            concept_detail = concept.get("concept_detail", {})
            relation_type = concept_detail.get("type", "")
            if relation_type == "data_view":
                mapping_rules = concept_detail.get("mapping_rules", {})
                data_source = mapping_rules.get("backing_data_source", {})
                if data_source.get("type") == "data_view":
                    data_views.append({
                        "id": data_source.get("id"),
                        "view_name": data_source.get("name", ""),
                        "concept_detail": concept_detail
                    })

        return data_views, metrics, relations
    except AfDataSourceError as e:
        traceback.print_exc()
        raise
    except Exception as e:
        traceback.print_exc()
        raise
