import asyncio
from app.resources.executors.graph_rag_block import GraphRAGRetrival

# inputs = {
#   "query": "在杭州市上班的律师有谁",   # query
#   "entities": [{"graph_id": "16", "space": "ubf9f258a45a611efa52e0eb36619d58b-27",  # 路径相似度实体召回结果
#   "entity": "杭州市", "type": "district", "property": "name", "start_idx": 1, "end_idx": 4, "vid": "7ff96c48f0468ec93a3d2ece7b0d67a4"}],   # path_sim 匹配到的实体名
#   "rule_answers": []
# }

# inputs = {
#   "query": "反垄断的案件有哪些",   # query
#   "entities": [{"graph_id": "16", "space": "ubf9f258a45a611efa52e0eb36619d58b-27",  # 路径相似度实体召回结果
#   "entity": "反垄断", "type": "performance_catetory", "property": "name", "start_idx": 0, "end_idx": 3, "vid": "13069db85f10dfe59707723496726fdc"}],   # path_sim 匹配到的实体名
#   "rule_answers": []
# }

# inputs = {
#   "query": "国企改制相关的案件有哪些",   # query
#   "entities": [{"graph_id": "16", "space": "ubf9f258a45a611efa52e0eb36619d58b-27",  # 路径相似度实体召回结果
#   "entity": "反垄断", "type": "performance_catetory", "property": "name", "start_idx": 0, "end_idx": 3, "vid": "13069db85f10dfe59707723496726fdc"}],   # path_sim 匹配到的实体名
#   "rule_answers": []
# }

# inputs = {
#   "query": "朱方方代理过哪些案件",   # query
#   "entities": [{"graph_id": "16", "space": "ubf9f258a45a611efa52e0eb36619d58b-27",  # 路径相似度实体召回结果
#   "entity": "朱方方", "type": "lawyer", "property": "name", "start_idx": 0, "end_idx": 3, "vid": "7f910d09843d06f37ab07cdf611aa77d"}],   # path_sim 匹配到的实体名
#   "rule_answers": []
# }

# inputs = {
#   "query": "在上海市工作的代理过反垄断案件的律师有谁",   # query
#   "entities": [
#         {
#           "graph_id": "16",
#           "space": "ubf9f258a45a611efa52e0eb36619d58b-27",
#           "entity": "上海市",
#           "type": "district",
#           "property": "name",
#           "start_idx": 1,
#           "end_idx": 4,
#           "vid": "83e7b6c3ff8adb36a6c5f49c88fa0dc7"
#         },
#         {
#           "graph_id": "16",
#           "space": "ubf9f258a45a611efa52e0eb36619d58b-27",
#           "entity": "反垄断",
#           "type": "performance_catetory",
#           "property": "name",
#           "start_idx": 10,
#           "end_idx": 13,
#           "vid": "13069db85f10dfe59707723496726fdc"
#         }
#     ],   # path_sim 匹配到的实体名
#   "rule_answers": []
# }

inputs = {
    "query": "金融领域有哪些人",  # query
    "entities": [
        {
            "graph_id": "16",
            "space": "ubf9f258a45a611efa52e0eb36619d58b-27",
            "entity": "烟草制品业",
            "type": "industry",
            "property": "name",
            "start_idx": 2,
            "end_idx": 7,
            "vid": "37c26e7f9b3da1f1b7a997cb70cb95fd",
        }
    ],  # path_sim 匹配到的实体名
    "rule_answers": [],
}

aug_config = {
    "augmentation_field": ["documents", "person"],
    "augmentation_kg_id": "",
}

# props = {
#     "kg": [
#         {
#             "kg_id": "16",
#             "kg_name": "",
#             "fields": ["lawyer", "case", "district", "court", "customer", "industry", "case_category"],
#             "output_fields": ["lawyer", "case"]
#         }
#     ],
#     "nebula_engine": {
#         "ips": ["XXX"],
#         "ports": ["9669"],
#         "user": "root",
#         "password": "***",
#         "type": "nebula"
#     },
#     "opensearch_engine": {
#         "ips":["XXX"],
#         "ports": ["9200"],
#         "user": "admin",
#         "password": "***",
#         "type": "opensearch"
#     },
#     "headers":{
#         "userid": "d127f32a-f48b-11ee-a408-c6ecd87c3bb1"
#     },

#     "limit": 5,
#     "threshold": 0.5,
#     "pre_filter": {
#         "enable": True,
#         "thr": 0.48,
#         "topn": 5
#     },
#     "post_filter": {
#         "enable": False,
#         "llm": {
#         "prompt": "判断answer是否能回答query的所有问题。\nquery: {{query}};\nanswer: {{subgraph}};\n如果能找到答案，返回\"YES\"；如果不能，返回\"NO\""
#         }
#     },
#     "llm_config": {
#         "llm_id": "1780110534704762881",
#         "llm_model_name": "Qwen2-72B-Chat",
#         "temperature": 0,
#         "top_p": 0.95,
#         "top_k": 1,
#         "frequency_penalty": 0,
#         "presence_penalty": 0,
#         "max_tokens": 1500
#     },
#     "skip_while_no_entities": True,
#     "only2hop": False
# }

props = {
    "kg": [
        {
            "kg_id": "1",
            "kg_name": "",
            "fields": ["person", "orgnization", "district", "business", "industry"],
            "output_fields": ["person", "orgnization"],
        }
    ],
    "nebula_engine": {
        "ips": ["XXX"],
        "ports": ["9669"],
        "user": "anydata",
        "password": "***",
        "type": "nebula",
    },
    "opensearch_engine": {
        "ips": ["XXX"],
        "ports": ["9200"],
        "user": "admin",
        "password": "***",
        "type": "opensearch",
    },
    "headers": {"userid": "d127f32a-f48b-11ee-a408-c6ecd87c3bb1"},
    "limit": 5,
    "threshold": 0.5,
    "pre_filter": {"enable": True, "thr": 0.48, "topn": 5},
    "post_filter": {
        "enable": False,
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

resource = {}


async def main():
    graph_rev = GraphRAGRetrival(inputs, props, resource, aug_config)
    await graph_rev.async_init()
    response = await graph_rev.ado_graph_rag_retrival()
    print(response)


asyncio.run(main())
