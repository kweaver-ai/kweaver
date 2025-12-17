import asyncio

from app.common.stand_log import StandLogger
from app.driven.dip.kn_knowledge_data_service import KnKnowledgeDataService
from app.resources.executors.graph_rag_block import GraphRAGRetrival
from app.utils.text_parser import _get_doc_retriever_output
from app.domain.enum.common.user_account_header_key import (
    get_user_account_id,
    get_user_account_type,
    set_user_account_id,
    set_user_account_type,
    UserAccountHeaderKey,
)


async def graph_qa_tool(query: str, props: dict):
    if not props:
        res = {
            "text": "",
            "references": [],
        }
        return res

    multi_kg_props = await get_multi_kg_props(props)
    headers = {}
    user_id = get_user_account_id(props["headers"])
    account_type = get_user_account_type(props["headers"])
    set_user_account_id(headers, user_id)
    set_user_account_type(headers, account_type)
    kn_knowledge_data_service = KnKnowledgeDataService(headers=headers)

    async def single_kg_rag(props, context):
        # 处理本体信息
        kg_id = props["data_source"]["kg"][0]["kg_id"]
        kg_ontology = await kn_knowledge_data_service.get_kg_ontology(kg_id)
        props["kg_ontology"] = {kg_id: kg_ontology}
        context = {"query_process": {"query": {"origin_query": query}}}
        graph_res = await graph_rag(props, context)
        return graph_res

    tasks = []
    for props in multi_kg_props:
        tasks.append(
            single_kg_rag(props, {"query_process": {"query": {"origin_query": query}}})
        )
    graph_res_list = await asyncio.gather(*tasks)
    graph_res = []
    for res in graph_res_list:
        graph_res.extend(res.get("text", []))

    plain_text, max_length = _get_doc_retriever_output(
        graph_res,
        max_length=int(
            props["data_source"]
            .get("advanced_config", {})
            .get("kg", {})
            .get("retrieval_max_length", 12288)  # 8k token
        ),
    )
    res = {"text": plain_text, "references": graph_res}
    return res


async def get_multi_kg_props(props):
    new_props_list = []
    for kg in props["data_source"]["kg"]:
        new_props = {
            "headers": props["headers"],
            "data_source": {
                "kg": [kg],
                "advanced_config": props["data_source"].get("advanced_config", {}),
            },
        }
        new_props_list.append(new_props)
    return new_props_list


async def graph_rag(props, context):
    StandLogger.info_log("开始执行图谱召回")
    query_name = props.get("input", "query")
    query_process = context["query_process"]
    """
    {
        "input_name": {
            "origin_query": "query",
            "rewrite_query": "rewrite_query",
            "augment_query": "augment_query"
        }
    }
    """
    if query_name in query_process:
        current_query_process = query_process.get(query_name, {})
    else:
        current_query_process = {
            "origin_query": str(context["variables"].get(query_name, "")),
        }
    if current_query_process.get("rewrite_query"):
        query = current_query_process.get("rewrite_query")
    elif current_query_process.get("augment_query"):
        query = current_query_process.get("augment_query")
    else:
        query = current_query_process.get("origin_query")

    data_source = props["data_source"]
    # 处理kg数据源中可能有的字段为空的情况
    # fields output_fields field_properties为空时当作全选
    kg_id = data_source["kg"][0]["kg_id"]

    fields = data_source["kg"][0].get("fields")
    if not fields:
        fields = [entity["name"] for entity in props["kg_ontology"][kg_id]["entity"]]
        data_source["kg"][0]["fields"] = fields

    output_fields = data_source["kg"][0].get("output_fields")
    if not output_fields:
        # output_fields = [entity['name'] for entity in props["kg_ontology"][kg_id]['entity']]
        data_source["kg"][0]["output_fields"] = fields

    field_properties = data_source["kg"][0].get("field_properties")
    if not field_properties:
        field_properties = {}
        for entity in props["kg_ontology"][kg_id]["entity"]:
            if entity["name"] in output_fields:
                field_properties[entity["name"]] = [
                    p["name"] for p in entity["properties"]
                ] + ["※vid"]
        data_source["kg"][0]["field_properties"] = field_properties

    headers = props["headers"]
    knowledge_augment = props.get("knowledge_augment", {})

    advanced_config = props.get("advanced_config", {}).get("kg", {})

    as_datasource = data_source.get("doc", [])

    props = {
        # 1. 基础配置
        "headers": headers,
        "kg": data_source["kg"],
        "kg_ontology": props.get("kg_ontology", {}),
        # 知识增强
        "aug_config": {
            "augmentation_field": (
                knowledge_augment["data_source"]["kg"][0]["fields"]
                if knowledge_augment.get("enable")
                else []
            ),
            "augmentation_kg_id": (
                knowledge_augment["data_source"]["kg"][0]["kg_id"]
                if knowledge_augment.get("enable")
                else ""
            ),
        },
        # AS数据源: 用于权限过滤
        "as_info": {
            "address": (
                as_datasource[0].get("address", "") if len(as_datasource) > 0 else ""
            ),
            "port": as_datasource[0].get("port", "") if len(as_datasource) > 0 else "",
            "as_user_id": (
                props["headers"].get("as-user-id", "")
                if props["headers"].get("as-user-id")
                else (
                    as_datasource[0].get("as_user_id", "")
                    if len(as_datasource) > 0
                    else ""
                )
            ),
        },
        # 高级配置（页面可配置）
        "reranker_thr": advanced_config.get("reranker_sim_threshold", -5.5),
        "text_match_entity_nums": advanced_config.get("text_match_entity_nums", 60),
        "vector_match_entity_nums": advanced_config.get("vector_match_entity_nums", 60),
        "graph_rag_topk": advanced_config.get("graph_rag_topk", 25),
        "long_text_length": advanced_config.get("long_text_length", 256),
        # 其他配置 TODO 干嘛的
        "limit": 1,
        "threshold": 0.7,
        "pre_filter": {"enable": True, "thr": 0.48, "topn": 5},
        "post_filter": {
            "enable": True,
            "llm": {
                "prompt": '判断answer是否能回答query的所有问题。\nquery: {{query}};\nanswer: {{subgraph}};\n如果能找到答案，返回"YES"；如果不能，返回"NO"'
            },
        },
        "llm_config": {
            "llm_id": "1780110534704762881",
            "llm_model_name": "Qwen2-72B-Chat",
            "temperature": 0,
            "top_p": 0.95,
            "top_k": 1,
            "frequency_penalty": 0,
            "presence_penalty": 0,
            "max_tokens": 1500,
        },
        "skip_while_no_entities": True,
        "only2hop": False,
    }

    aug_config = props["aug_config"]
    kg2ontology = props.get("kg_ontology", {})
    prop_emb_desc = {}
    for kg, onto in kg2ontology.items():
        prop_emb_desc[kg] = {}
        for ent in onto["entity"]:
            prop_emb_desc[kg][ent["name"]] = {}
            vec_props = set(ent["properties_index"])
            for prop in ent["properties"]:
                if prop["name"] in vec_props:
                    prop_emb_desc[kg][ent["name"]][prop["alias"]] = {
                        "en_name": prop["name"],
                        "description": prop.get("description", ""),
                    }
    inputs = {"query": query}
    graph_rev = GraphRAGRetrival(inputs, props, aug_config, prop_emb_desc)
    await graph_rev.async_init()
    as_auth_info = props["as_info"]
    response = await graph_rev.ado_graph_rag_retrival(as_auth_info)

    ouputs = {"text": response}

    StandLogger.info_log("图谱召回结束")
    StandLogger.debug("图谱召回结果：{}".format(ouputs))
    return ouputs


if __name__ == "__main__":
    from app.router.startup import load_executors

    load_executors()
    query = "爱数是一家怎样的公司？"
    props = {
        "data_source": {
            "kg": [
                {
                    "kg_id": "1",
                    "fields": [
                        "custom_subject",
                        "tag",
                        "business",
                        "district",
                        "customer",
                        "industry",
                        "person",
                        "orgnization",
                        "project",
                        "document",
                    ],
                    "output_fields": [
                        "custom_subject",
                        "tag",
                        "business",
                        "district",
                        "customer",
                        "industry",
                        "person",
                        "orgnization",
                        "project",
                        "document",
                    ],
                    "field_properties": {
                        "district": ["※vid", "parent", "name"],
                        "document": [
                            "※vid",
                            "abstract",
                            "size",
                            "file_location",
                            "modified_at",
                            "created_at",
                            "version",
                            "name",
                            "doc_id",
                        ],
                        "orgnization": ["※vid", "parent", "id", "name"],
                        "person": [
                            "※vid",
                            "english_name",
                            "is_expert",
                            "university",
                            "email",
                            "contact",
                            "position",
                            "name",
                        ],
                        "business": ["※vid", "name"],
                        "custom_subject": ["※vid", "alias", "description", "name"],
                        "customer": ["※vid", "name", "id"],
                        "industry": ["※vid", "parent", "description", "name", "id"],
                        "project": ["※vid", "name"],
                        "tag": ["※vid", "name", "path", "id"],
                    },
                },
                {
                    "kg_id": "2",
                    "fields": [],
                    "output_fields": [],
                    "field_properties": {},
                },
            ]
        },
        "kg_ontology": {
            "1": {
                "dbname": "uc6748b8cef3011efad8f1694208d2405-4",
                "edge": [
                    {
                        "alias": "相关主题",
                        "colour": "rgba(198,79,88,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_id9ed6b79f-911e-4292-9c20-ba204dc95ba3",
                        "index_default_switch": False,
                        "model": "",
                        "name": "custom_subject_2_custom_subject_releated_manual",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "custom_subject",
                            "custom_subject_2_custom_subject_releated_manual",
                            "custom_subject",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "关联主题",
                        "colour": "rgba(145,192,115,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_id617ad4c9-f0f6-46b6-8cd4-f4eb09fb8125",
                        "index_default_switch": False,
                        "model": "",
                        "name": "person_2_custom_subject_releated_manual",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "person",
                            "person_2_custom_subject_releated_manual",
                            "custom_subject",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "相关",
                        "colour": "rgba(145,192,115,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_idca8708f3-7f41-471e-ae14-d13ece366046",
                        "index_default_switch": False,
                        "model": "",
                        "name": "document_2_custom_subject_releated_manual",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "document",
                            "document_2_custom_subject_releated_manual",
                            "custom_subject",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "提及",
                        "colour": "rgba(42,144,143,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_ide5391bf9-827d-41c5-88e4-12d0d460cbb4",
                        "index_default_switch": False,
                        "model": "",
                        "name": "document_2_custom_subject_mention",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "document",
                            "document_2_custom_subject_mention",
                            "custom_subject",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "下层分类",
                        "colour": "rgba(42,144,143,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_ida8dcba4b-9d6c-427d-849b-9f1e135aa783",
                        "index_default_switch": False,
                        "model": "",
                        "name": "tag_2_tag_child",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": ["tag", "tag_2_tag_child", "tag"],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "关联标签",
                        "colour": "rgba(145,192,115,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_id84a37d0f-4234-4813-91c5-108f0f54733f",
                        "index_default_switch": False,
                        "model": "",
                        "name": "person_2_tag_include",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": ["person", "person_2_tag_include", "tag"],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "提及",
                        "colour": "rgba(42,144,143,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_idc292332f-7d03-4d94-9e67-3a8ff8e90bb2",
                        "index_default_switch": False,
                        "model": "",
                        "name": "document_2_tag_mention",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": ["document", "document_2_tag_mention", "tag"],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "编辑",
                        "colour": "rgba(145,192,115,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_id2ced4ed3-1304-4842-849d-b40d03878f93",
                        "index_default_switch": False,
                        "model": "",
                        "name": "person_2_document_edit",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": ["person", "person_2_document_edit", "document"],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "创建",
                        "colour": "rgba(145,192,115,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_id46c0d868-fe0a-467f-8498-aa5215112b65",
                        "index_default_switch": False,
                        "model": "",
                        "name": "person_2_document_create",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": ["person", "person_2_document_create", "document"],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "擅长领域",
                        "colour": "rgba(145,192,115,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_id4e3c8a35-14dd-479f-8828-877c97f6917e",
                        "index_default_switch": False,
                        "model": "",
                        "name": "person_2_business_belong_to",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "person",
                            "person_2_business_belong_to",
                            "business",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "子行业",
                        "colour": "rgba(217,112,76,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_idd272a25c-a6e3-479c-b6f8-53036dc59dc4",
                        "index_default_switch": False,
                        "model": "",
                        "name": "industry_2_industry",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": ["industry", "industry_2_industry", "industry"],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "下级地区",
                        "colour": "rgba(217,83,76,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_idcfcdc7fd-8acd-4720-9269-ff77b6a069df",
                        "index_default_switch": False,
                        "model": "",
                        "name": "district_2_district_child",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "district",
                            "district_2_district_child",
                            "district",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "提及",
                        "colour": "rgba(42,144,143,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_idacd741c8-ad86-42ed-9758-b5272a3810a8",
                        "index_default_switch": False,
                        "model": "",
                        "name": "document_2_person_mention",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "document",
                            "document_2_person_mention",
                            "person",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "参与项目",
                        "colour": "rgba(145,192,115,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_id0dc8604c-b8d5-4436-8c2d-ee6b04ecea5e",
                        "index_default_switch": False,
                        "model": "",
                        "name": "customer_2_project_join",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": ["customer", "customer_2_project_join", "project"],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "所在地区",
                        "colour": "rgba(145,192,115,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_idc8eb6bc9-cd57-4736-b39f-78fa19c99e18",
                        "index_default_switch": False,
                        "model": "",
                        "name": "customer_2_district_located",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "customer",
                            "customer_2_district_located",
                            "district",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "客户行业",
                        "colour": "rgba(145,192,115,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_id1d4f1ea4-e446-4e3e-a6b1-4a3e1367df52",
                        "index_default_switch": False,
                        "model": "",
                        "name": "customer_2_industry_belong_to",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "customer",
                            "customer_2_industry_belong_to",
                            "industry",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "工作地点",
                        "colour": "rgba(145,192,115,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_idafb7822a-3dfc-4106-8779-9417c3a5ae4d",
                        "index_default_switch": False,
                        "model": "",
                        "name": "person_2_district_work_at",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "person",
                            "person_2_district_work_at",
                            "district",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "专注行业",
                        "colour": "rgba(145,192,115,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_iddab53e61-630d-4ee8-806a-98574a4d6fc2",
                        "index_default_switch": False,
                        "model": "",
                        "name": "person_2_industry_service",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "person",
                            "person_2_industry_service",
                            "industry",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "负责项目",
                        "colour": "rgba(145,192,115,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_ida2396bf8-3924-49c8-8aa7-8ea1fee5aee7",
                        "index_default_switch": False,
                        "model": "",
                        "name": "person_2_project_join",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": ["person", "person_2_project_join", "project"],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "所在部门",
                        "colour": "rgba(145,192,115,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_id52a5fc33-95a6-427c-8955-97ce61bbd154",
                        "index_default_switch": False,
                        "model": "",
                        "name": "person_2_orgnization_belong_to",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "person",
                            "person_2_orgnization_belong_to",
                            "orgnization",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "子部门",
                        "colour": "rgba(216,112,122,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_idad8e298c-c056-4190-aefd-7d00f73c2bd7",
                        "index_default_switch": False,
                        "model": "",
                        "name": "orgnization_2_orgnization_child",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "orgnization",
                            "orgnization_2_orgnization_child",
                            "orgnization",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "提及",
                        "colour": "rgba(42,144,143,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_id18f9698a-f147-4cc2-892c-e36f7d1e9a6e",
                        "index_default_switch": False,
                        "model": "",
                        "name": "document_2_customer_mention",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "document",
                            "document_2_customer_mention",
                            "customer",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "提及",
                        "colour": "rgba(42,144,143,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_id7d29c933-9432-4709-abe5-b84ea537dc12",
                        "index_default_switch": False,
                        "model": "",
                        "name": "document_2_industry_mention",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "document",
                            "document_2_industry_mention",
                            "industry",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                    {
                        "alias": "提及",
                        "colour": "rgba(42,144,143,1)",
                        "default_tag": "",
                        "description": "",
                        "edge_id": "edge_idfbe31cda-edca-4d03-8474-099126aed2d2",
                        "index_default_switch": False,
                        "model": "",
                        "name": "document_2_project_mention",
                        "primary_key": [],
                        "properties": [],
                        "properties_index": [],
                        "relations": [
                            "document",
                            "document_2_project_mention",
                            "project",
                        ],
                        "shape": "line",
                        "source_type": "manual",
                        "width": "0.25x",
                    },
                ],
                "entity": [
                    {
                        "alias": "自定义主题",
                        "default_tag": "name",
                        "description": "",
                        "entity_id": "entity_idc090f331-5c5a-4605-88b4-2b67620285d8",
                        "fill_color": "rgba(198,79,88,1)",
                        "icon": "empty",
                        "icon_color": "#ffffff",
                        "index_default_switch": False,
                        "model": "",
                        "name": "custom_subject",
                        "primary_key": ["name"],
                        "properties": [
                            {
                                "alias": "主题别名",
                                "data_type": "string",
                                "description": "",
                                "name": "alias",
                            },
                            {
                                "alias": "描述",
                                "data_type": "string",
                                "description": "",
                                "name": "description",
                            },
                            {
                                "alias": "名称",
                                "data_type": "string",
                                "description": "",
                                "name": "name",
                            },
                        ],
                        "properties_index": ["alias", "description", "name"],
                        "search_prop": "name",
                        "shape": "circle",
                        "size": "0.5x",
                        "source_type": "manual",
                        "stroke_color": "rgba(198,79,88,1)",
                        "synonym": [],
                        "task_id": "",
                        "text_color": "rgba(0,0,0,1)",
                        "text_position": "top",
                        "text_type": "adaptive",
                        "text_width": 15,
                        "vector_generation": ["alias", "description", "name"],
                        "x": 1925.0973936899863,
                        "y": 322.23508230452666,
                    },
                    {
                        "alias": "标签",
                        "default_tag": "name",
                        "description": "",
                        "entity_id": "entity_idfc058d22-c844-4e4e-9aa4-9bae97a13259",
                        "fill_color": "rgba(42,144,143,1)",
                        "icon": "empty",
                        "icon_color": "#ffffff",
                        "index_default_switch": False,
                        "model": "",
                        "name": "tag",
                        "primary_key": ["id"],
                        "properties": [
                            {
                                "alias": "名称",
                                "data_type": "string",
                                "description": "",
                                "name": "name",
                            },
                            {
                                "alias": "版本",
                                "data_type": "integer",
                                "description": "",
                                "name": "version",
                            },
                            {
                                "alias": "路径",
                                "data_type": "string",
                                "description": "",
                                "name": "path",
                            },
                            {
                                "alias": "id",
                                "data_type": "string",
                                "description": "",
                                "name": "id",
                            },
                        ],
                        "properties_index": ["name", "path", "id"],
                        "search_prop": "name",
                        "shape": "circle",
                        "size": "0.5x",
                        "source_type": "manual",
                        "stroke_color": "rgba(42,144,143,1)",
                        "synonym": [],
                        "task_id": "",
                        "text_color": "rgba(0,0,0,1)",
                        "text_position": "top",
                        "text_type": "adaptive",
                        "text_width": 15,
                        "vector_generation": ["name", "path", "id"],
                        "x": 952.1512160493828,
                        "y": 258.28444787379965,
                    },
                    {
                        "alias": "专业领域",
                        "default_tag": "name",
                        "description": "专业领域是指员工的业务领域，通常与员工的职位和工作职责密切相关。",
                        "entity_id": "entity_id3ee43850-533f-4672-8889-e91fa8eed2b4",
                        "fill_color": "rgba(217,83,76,1)",
                        "icon": "graph-decentralization",
                        "icon_color": "#ffffff",
                        "index_default_switch": False,
                        "model": "",
                        "name": "business",
                        "primary_key": ["name"],
                        "properties": [
                            {
                                "alias": "name",
                                "data_type": "string",
                                "description": "",
                                "name": "name",
                            }
                        ],
                        "properties_index": ["name"],
                        "search_prop": "name",
                        "shape": "circle",
                        "size": "0.5x",
                        "source_type": "manual",
                        "stroke_color": "rgba(217,83,76,1)",
                        "synonym": [],
                        "task_id": "",
                        "text_color": "rgba(0,0,0,1)",
                        "text_position": "top",
                        "text_type": "adaptive",
                        "text_width": 15,
                        "vector_generation": ["name"],
                        "x": 1955.2344269437488,
                        "y": 470.30531269374006,
                    },
                    {
                        "alias": "地区",
                        "default_tag": "name",
                        "description": "行政区划",
                        "entity_id": "entity_ida4c0a656-e77f-4942-9300-615242e84889",
                        "fill_color": "rgba(217,83,76,1)",
                        "icon": "graph-location",
                        "icon_color": "#ffffff",
                        "index_default_switch": False,
                        "model": "",
                        "name": "district",
                        "primary_key": ["code"],
                        "properties": [
                            {
                                "alias": "隶属于",
                                "data_type": "string",
                                "description": "",
                                "name": "parent",
                            },
                            {
                                "alias": "层级",
                                "data_type": "integer",
                                "description": "",
                                "name": "level",
                            },
                            {
                                "alias": "区划代码",
                                "data_type": "string",
                                "description": "",
                                "name": "code",
                            },
                            {
                                "alias": "名称",
                                "data_type": "string",
                                "description": "",
                                "name": "name",
                            },
                        ],
                        "properties_index": ["parent", "name"],
                        "search_prop": "name",
                        "shape": "circle",
                        "size": "0.5x",
                        "source_type": "manual",
                        "stroke_color": "rgba(217,83,76,1)",
                        "synonym": [],
                        "task_id": "",
                        "text_color": "rgba(0,0,0,1)",
                        "text_position": "top",
                        "text_type": "adaptive",
                        "text_width": 15,
                        "vector_generation": ["parent", "name"],
                        "x": 1661.3772290809327,
                        "y": 820.4701646090533,
                    },
                    {
                        "alias": "客户",
                        "default_tag": "id",
                        "description": "企业商品服务的采购者",
                        "entity_id": "entity_id59b0c68b-aac6-43c0-9295-9d88d8fc0041",
                        "fill_color": "rgba(145,192,115,1)",
                        "icon": "graph-customer_service",
                        "icon_color": "#ffffff",
                        "index_default_switch": False,
                        "model": "",
                        "name": "customer",
                        "primary_key": ["id"],
                        "properties": [
                            {
                                "alias": "名称",
                                "data_type": "string",
                                "description": "",
                                "name": "name",
                            },
                            {
                                "alias": "ID",
                                "data_type": "string",
                                "description": "",
                                "name": "id",
                            },
                        ],
                        "properties_index": ["name", "id"],
                        "search_prop": "id",
                        "shape": "circle",
                        "size": "0.5x",
                        "source_type": "manual",
                        "stroke_color": "rgba(145,192,115,1)",
                        "synonym": [],
                        "task_id": "",
                        "text_color": "rgba(0,0,0,1)",
                        "text_position": "top",
                        "text_type": "adaptive",
                        "text_width": 15,
                        "vector_generation": ["name", "id"],
                        "x": 1178.127572016461,
                        "y": 796.278120713306,
                    },
                    {
                        "alias": "行业",
                        "default_tag": "name",
                        "description": "生产同类产品/相同工艺/提供同类劳动服务的企业或组织的集合",
                        "entity_id": "entity_ida8c94541-fca2-4f54-aa8d-40a09e388582",
                        "fill_color": "rgba(217,112,76,1)",
                        "icon": "graph-apps",
                        "icon_color": "#ffffff",
                        "index_default_switch": False,
                        "model": "",
                        "name": "industry",
                        "primary_key": ["id"],
                        "properties": [
                            {
                                "alias": "父级路径",
                                "data_type": "string",
                                "description": "",
                                "name": "parent",
                            },
                            {
                                "alias": "level",
                                "data_type": "integer",
                                "description": "",
                                "name": "level",
                            },
                            {
                                "alias": "描述",
                                "data_type": "string",
                                "description": "",
                                "name": "description",
                            },
                            {
                                "alias": "名称",
                                "data_type": "string",
                                "description": "",
                                "name": "name",
                            },
                            {
                                "alias": "ID",
                                "data_type": "string",
                                "description": "",
                                "name": "id",
                            },
                        ],
                        "properties_index": ["parent", "description", "name", "id"],
                        "search_prop": "name",
                        "shape": "circle",
                        "size": "0.5x",
                        "source_type": "manual",
                        "stroke_color": "rgba(217,112,76,1)",
                        "synonym": [],
                        "task_id": "",
                        "text_color": "rgba(0,0,0,1)",
                        "text_position": "top",
                        "text_type": "adaptive",
                        "text_width": 15,
                        "vector_generation": ["parent", "description", "name", "id"],
                        "x": 967.1111111111111,
                        "y": 577.9722222222222,
                    },
                    {
                        "alias": "人员",
                        "default_tag": "name",
                        "description": "企业组织结构的员工/AnyShare系统中的用户",
                        "entity_id": "entity_id5e09f69b-1da2-47a1-b558-9bb731615aab",
                        "fill_color": "rgba(145,192,115,1)",
                        "icon": "graph-user",
                        "icon_color": "#ffffff",
                        "index_default_switch": False,
                        "model": "",
                        "name": "person",
                        "primary_key": ["id"],
                        "properties": [
                            {
                                "alias": "英文名",
                                "data_type": "string",
                                "description": "",
                                "name": "english_name",
                            },
                            {
                                "alias": "用户状态",
                                "data_type": "string",
                                "description": "",
                                "name": "status",
                            },
                            {
                                "alias": "专家角色",
                                "data_type": "boolean",
                                "description": "",
                                "name": "is_expert",
                            },
                            {
                                "alias": "毕业院校",
                                "data_type": "string",
                                "description": "",
                                "name": "university",
                            },
                            {
                                "alias": "邮箱",
                                "data_type": "string",
                                "description": "",
                                "name": "email",
                            },
                            {
                                "alias": "联系方式",
                                "data_type": "string",
                                "description": "",
                                "name": "contact",
                            },
                            {
                                "alias": "用户密级",
                                "data_type": "integer",
                                "description": "",
                                "name": "user_securtiy_level",
                            },
                            {
                                "alias": "用户角色",
                                "data_type": "string",
                                "description": "",
                                "name": "user_role",
                            },
                            {
                                "alias": "职位",
                                "data_type": "string",
                                "description": "",
                                "name": "position",
                            },
                            {
                                "alias": "id",
                                "data_type": "string",
                                "description": "",
                                "name": "id",
                            },
                            {
                                "alias": "姓名",
                                "data_type": "string",
                                "description": "",
                                "name": "name",
                            },
                        ],
                        "properties_index": [
                            "english_name",
                            "is_expert",
                            "university",
                            "email",
                            "contact",
                            "position",
                            "name",
                        ],
                        "search_prop": "name",
                        "shape": "circle",
                        "size": "0.5x",
                        "source_type": "manual",
                        "stroke_color": "rgba(145,192,115,1)",
                        "synonym": [],
                        "task_id": "",
                        "text_color": "rgba(0,0,0,1)",
                        "text_position": "top",
                        "text_type": "adaptive",
                        "text_width": 15,
                        "vector_generation": [
                            "english_name",
                            "is_expert",
                            "university",
                            "email",
                            "contact",
                            "position",
                            "name",
                        ],
                        "x": 1263.936899862826,
                        "y": 591.1999314128943,
                    },
                    {
                        "alias": "部门",
                        "default_tag": "name",
                        "description": "AnyShare系统中的组织结构及部门",
                        "entity_id": "entity_id24803cd0-9bbd-4108-ab94-6ad47b93c92b",
                        "fill_color": "rgba(216,112,122,1)",
                        "icon": "graph-connections",
                        "icon_color": "#ffffff",
                        "index_default_switch": False,
                        "model": "",
                        "name": "orgnization",
                        "primary_key": ["id"],
                        "properties": [
                            {
                                "alias": "隶属于",
                                "data_type": "string",
                                "description": "",
                                "name": "parent",
                            },
                            {
                                "alias": "邮箱",
                                "data_type": "string",
                                "description": "",
                                "name": "email",
                            },
                            {
                                "alias": "id",
                                "data_type": "string",
                                "description": "",
                                "name": "id",
                            },
                            {
                                "alias": "名称",
                                "data_type": "string",
                                "description": "",
                                "name": "name",
                            },
                        ],
                        "properties_index": ["parent", "id", "name"],
                        "search_prop": "name",
                        "shape": "circle",
                        "size": "0.5x",
                        "source_type": "manual",
                        "stroke_color": "rgba(216,112,122,1)",
                        "synonym": [],
                        "task_id": "",
                        "text_color": "rgba(0,0,0,1)",
                        "text_position": "top",
                        "text_type": "adaptive",
                        "text_width": 15,
                        "vector_generation": ["parent", "id", "name"],
                        "x": 1258.1426611796983,
                        "y": 360.1848422496571,
                    },
                    {
                        "alias": "项目",
                        "default_tag": "name",
                        "description": "企业内部发生的一些重大的/有影响的事情，不同领域有不同含义，如法律领域，会将事件即为案件",
                        "entity_id": "entity_id414676a5-5a4c-4e50-81e4-207045b39d48",
                        "fill_color": "rgba(42,144,143,1)",
                        "icon": "graph-order",
                        "icon_color": "#ffffff",
                        "index_default_switch": False,
                        "model": "",
                        "name": "project",
                        "primary_key": ["name"],
                        "properties": [
                            {
                                "alias": "名称",
                                "data_type": "string",
                                "description": "",
                                "name": "name",
                            }
                        ],
                        "properties_index": ["name"],
                        "search_prop": "name",
                        "shape": "circle",
                        "size": "0.5x",
                        "source_type": "manual",
                        "stroke_color": "rgba(42,144,143,1)",
                        "synonym": [],
                        "task_id": "",
                        "text_color": "rgba(0,0,0,1)",
                        "text_position": "top",
                        "text_type": "adaptive",
                        "text_width": 15,
                        "vector_generation": ["name"],
                        "x": 1854.0973936899863,
                        "y": 613.548353909465,
                    },
                    {
                        "alias": "文档",
                        "default_tag": "name",
                        "description": "由创建者所定义的、具有文件名的一组相关元素的集合",
                        "entity_id": "entity_idc93b0ac1-e9bc-4c35-9fee-e90b8f4a01fd",
                        "fill_color": "rgba(42,144,143,1)",
                        "icon": "graph-document",
                        "icon_color": "#ffffff",
                        "index_default_switch": False,
                        "model": "",
                        "name": "document",
                        "primary_key": ["doc_id"],
                        "properties": [
                            {
                                "alias": "需要预览权限",
                                "data_type": "boolean",
                                "description": "",
                                "name": "need_preview_perm",
                            },
                            {
                                "alias": "摘要",
                                "data_type": "string",
                                "description": "",
                                "name": "abstract",
                            },
                            {
                                "alias": "大小",
                                "data_type": "integer",
                                "description": "",
                                "name": "size",
                            },
                            {
                                "alias": "文档路径",
                                "data_type": "string",
                                "description": "",
                                "name": "file_location",
                            },
                            {
                                "alias": "文档密级",
                                "data_type": "integer",
                                "description": "",
                                "name": "file_security_level",
                            },
                            {
                                "alias": "修改时间",
                                "data_type": "datetime",
                                "description": "",
                                "name": "modified_at",
                            },
                            {
                                "alias": "创建时间",
                                "data_type": "datetime",
                                "description": "",
                                "name": "created_at",
                            },
                            {
                                "alias": "版本",
                                "data_type": "string",
                                "description": "AS文档版本",
                                "name": "version",
                            },
                            {
                                "alias": "文件名",
                                "data_type": "string",
                                "description": "",
                                "name": "name",
                            },
                            {
                                "alias": "文档标识",
                                "data_type": "string",
                                "description": "AS文档ID",
                                "name": "doc_id",
                            },
                        ],
                        "properties_index": [
                            "abstract",
                            "size",
                            "file_location",
                            "modified_at",
                            "created_at",
                            "version",
                            "name",
                            "doc_id",
                        ],
                        "search_prop": "name",
                        "shape": "circle",
                        "size": "0.5x",
                        "source_type": "manual",
                        "stroke_color": "rgba(42,144,143,1)",
                        "synonym": [],
                        "task_id": "",
                        "text_color": "rgba(0,0,0,1)",
                        "text_position": "top",
                        "text_type": "adaptive",
                        "text_width": 15,
                        "vector_generation": ["abstract", "file_location", "name"],
                        "x": 1720.205761316872,
                        "y": 267.6659807956105,
                    },
                ],
                "graph_name": "AS线上图谱20241217",
                "knw_id": 1,
                "quantized_flag": 0,
            }
        },
        "headers": {
            UserAccountHeaderKey.ACCOUNT_ID.value: "9dfb036c-ef2f-11ef-8d94-7615d07873be"
        },
        "knowledge_augment": {"enable": False},
        "llm_config": {
            "id": "1892854317749243904",
            "name": "Tome-Max",
            "temperature": 0,
            "top_p": 0.95,
            "top_k": 1,
            "frequency_penalty": 0,
            "presence_penalty": 0,
            "max_tokens": 600,
            "icon": "",
        },
    }
    res_1 = asyncio.run(graph_qa_tool(query, props))
    print(res_1)
