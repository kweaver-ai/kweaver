from app.common.config import Config
from app.resources.executors.graph_rag_block.task import Task

from .strategy_model import DefaultStrategy
from app.domain.enum.common.user_account_header_key import (
    get_user_account_id,
    get_user_account_type,
    set_user_account_id,
    set_user_account_type,
)


class StrategyProcessor:
    def __init__(self) -> None:
        """load config"""
        pass

    def get_props_filter_list(self, kg_id, data_sources_field, props, emb_desc_config):
        # 获取勾选了向量的属性的中文名称
        entities = props["kg_ontology"][kg_id]["entity"]
        field_properties = props["kg"][0].get("field_properties", {}) or {}
        all_entity_props = {}
        props_en_zh = {}
        output_concept_map = {}

        for entity in entities:
            all_entity_props[entity["name"]] = [
                prop["alias"] for prop in entity["properties"]
            ]
            props_en_zh[entity["name"]] = {
                prop["name"]: prop["alias"] for prop in entity["properties"]
            }
            output_concept_map[entity["name"]] = entity["alias"]
        nosense_alias = {}
        for ds_field in data_sources_field:
            all_props = all_entity_props[ds_field]
            # output_properties: 需要输出哪些属性。如果包含※vid，则需要输出vid
            output_properties = field_properties.get(ds_field, [])
            if output_properties:
                nosense_alias[ds_field] = []
                if "※vid" not in output_properties:
                    nosense_alias[ds_field].append("※vid")
                for prop_en, prop_zh in props_en_zh[ds_field].items():
                    if prop_en not in output_properties:
                        nosense_alias[ds_field].append(prop_zh)
            else:
                # 默认需要输出vid和全文索引的属性
                index_props = list(emb_desc_config[kg_id][ds_field].keys())
                nosense_alias[ds_field] = list(set(all_props) - set(index_props))
        return nosense_alias, output_concept_map

    def get_query_entity_map(self, kg_id, data_sources_field, props):
        query_entity_map = {}
        entities = props["kg_ontology"][kg_id]["entity"]
        for entity in entities:
            if entity["name"] in data_sources_field:
                entity_name = entity["name"]
                for prop in entity["properties"]:
                    prop_name = prop["name"]
                    prop_desc = prop.get("description", "")
                    if prop_desc:
                        key_name = f"{entity_name}_{prop_name}"
                        query_entity_map[key_name] = prop_desc

        # # XXX for debug
        # query_entity_map = {
        #     "person_position": "人员的职位信息，例如xxx经理、xxx工程师、算法、前端、测试等",
        #     "person_name": "人员的姓名",
        #     "orgnization_name":"组织名称，例如xxx部、xxx组、xxx线等",
        #     "industry_name":"行业名称，例如xxx业等",
        #     "business_name":"专业领域名称，例如xxx领域等",
        #     "district_name":"地区名称，例如xxx县、xxx区、xxx市等"
        # }

        # if len(query_entity_map) >= 4:  # 属性描述太少，设为无效
        #     return query_entity_map
        # else:

        return {}

    def get_query_entity_remove_list(self, kg_id, data_sources_field, props):
        query_entity_remove_list = []
        entities = props["kg_ontology"][kg_id]["entity"]

        for entity in entities:
            if entity["name"] in data_sources_field:
                entity_zh_name = entity["alias"]
                query_entity_remove_list.append(entity_zh_name)
                query_entity_remove_list.append(f"的{entity_zh_name}")
        return query_entity_remove_list

    def load_strategy(
        self, task: Task, props, config, long_context_concepts, emb_desc_config
    ):
        """add strategy value for every step"""
        strategy = DefaultStrategy()
        output_field = props["kg"][0]["output_fields"]
        data_sources_field = props["kg"][0]["fields"]
        kg_id = props["kg"][0]["kg_id"]

        nosense_alias, output_concept_map = self.get_props_filter_list(
            kg_id, data_sources_field, props, emb_desc_config
        )
        query_entity_remove_list = self.get_query_entity_remove_list(
            kg_id, data_sources_field, props
        )
        query_entity_map = self.get_query_entity_map(kg_id, data_sources_field, props)

        task.set_attr("query_entity_remove_list", query_entity_remove_list)
        task.set_attr("query_entity_map", query_entity_map)
        task.set_attr("nosense_alias", nosense_alias)
        task.set_attr("output_concept_map", output_concept_map)
        task.set_attr("kg_id", kg_id)

        # query
        strategy.query_strategy.query_rewriting_strategies = "as_query_rewrite"

        # retrieval
        strategy.retrieve_strategy.data_sources_field = data_sources_field
        strategy.retrieve_strategy.long_context_field = long_context_concepts
        strategy.retrieve_strategy.output_field = output_field

        # debug: retrieve_source_config

        # 融合部署之后: retrieve_source_config
        strategy.retrieve_strategy.retrieve_source_config = {
            "entity_recall": {
                "url": f"http://{Config.services.search_engine.host}:{Config.services.search_engine.port}/api/kn-search-engine/v0/full_text_search",
                "payload": {
                    "query": "",
                    "page": 1,
                    "size": props["text_match_entity_nums"],
                    "bm25_weight": "0",
                    "phrase_match_weight": "1",
                    "kgs": [{"kg_id": kg_id, "entities": []}],
                },
                "headers": self._build_headers(props["headers"]),
            },
            "neighbor_recall": {
                "url": f"http://{Config.services.kn_data_query.host}:{Config.services.kn_data_query.port}/api/kn-data-query/v0/graph-explore/kgs/{kg_id}/neighbors",
                "payload": {
                    "id": kg_id,
                    "steps": 1,
                    "final_step": False,
                    "direction": "bidirect",
                    "filters": [{"e_filters": [], "v_filters": []}],
                    "page": 1,
                    "size": -1,
                    "vids": [],
                },
                "headers": self._build_headers(props["headers"]),
            },
        }

        # aggregation
        strategy.aggregation_strategy.output_field = output_field
        strategy.aggregation_strategy.long_text_length = props.get(
            "long_text_length", 256
        )

        # ranking
        strategy.ranking_strategy.reranker_cossim_threshold = props.get(
            "reranker_thr", -5.5
        )

        # augmentation
        if config:
            strategy.augmentation_strategy.augmentation_field = config.get(
                "augmentation_field", []
            )
            strategy.augmentation_strategy.augmentation_kg_id = config.get(
                "augmentation_kg_id", ""
            )
        else:
            strategy.augmentation_strategy.augmentation_field = []
            strategy.augmentation_strategy.augmentation_kg_id = ""

        strategy.augmentation_strategy.output_field = output_field

        # formattor
        strategy.formattor_strategy.graph_rag_topk = props.get("graph_rag_topk", 25)

        return strategy

    def _build_headers(self, source_headers):
        """构建请求头"""
        headers = {"Content-Type": "application/json"}

        user_id = get_user_account_id(source_headers) or ""
        account_type = get_user_account_type(source_headers) or ""

        set_user_account_id(headers, user_id)
        set_user_account_type(headers, account_type)

        return headers
