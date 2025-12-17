import re
import asyncio
import requests
import pandas as pd
from app.resources.executors.graph_rag_block import GraphRAGRetrival


def csv_to_excel_and_extract_first_column(csv_file_path):
    df = pd.read_csv(csv_file_path)
    questions = df.iloc[:, 0].astype(str).tolist()
    gold_answers = df.iloc[:, 5].astype(str).tolist()
    gold_scores = df.iloc[:, 8].astype(str).tolist()
    return questions, gold_answers, gold_scores


async def format_retrieval_response(retrieval_response):
    focus_nodes = []
    contents = []
    for idx, item in enumerate(retrieval_response):
        content = item["content"]

        default_property = item["meta"]["sub_graph"]["nodes"][0]["default_property"]
        if "v" in default_property:
            doc_name = default_property["v"]
        else:
            doc_name = default_property["value"]

        focus_nodes.append(doc_name)
        content = f"第{idx + 1}个参考信息--《{doc_name}》:{content}\n---\n"
        contents.append(content)

    content = "".join(contents)
    content = content[: int(8000 * 1.5)]
    return content, focus_nodes


async def ado_llm_ad(question, content):
    base = 8000
    while 1:
        payload = {
            "model_name": "Tome-M-28",  # Tome-M 32k  11_qwen25_72
            "model_para": {
                "temperature": 0.0,
                "top_p": 0.95,
                "stop": None,
                "frequency_penalty": 0.0,
                "presence_penalty": 0.0,
                "max_new_tokens": 2000,
                "max_tokens": 2000,
            },
            "prompt_id": "1857240990809722880",  # 1855450502851072000    1855465712206876672    1855466864470265856  1856278964759302144 1856232712906608640
            "inputs": {"query": question, "content": content},
        }

        # llm_model_api = "https://XXX:8444/api/model-factory/v1/prompt-template-run"
        # headers = {'Content-Type': 'application/json', 'appid': 'Nr9Sb40T3HqpedSPVnl'}

        llm_model_api = (
            "https://XXX:8444/api/model-factory/v1/prompt-template-run"
        )
        headers = {"Content-Type": "application/json", "appid": "O28PdxT1DV0aQnmV4dT"}

        print(f"-----len(content)---------: {len(content)}")

        response = requests.post(
            llm_model_api, headers=headers, json=payload, verify=False
        )
        if response.status_code != 200:
            base -= 1000
            content = content[: int(base * 1.5)]
            print(f"-----base---------: {base}")
            continue

        static_response = ""
        for line in response.iter_lines(decode_unicode=True):
            if line.startswith("data: ") and line != "data: --end--":
                line = line.split("data: ")[-1]
                static_response += line if line != "None" else ""
        return static_response


async def get_hit_nodes(llm_response, focus_nodes):
    hit_nodes = []

    if not llm_response:
        return ["抱歉没有答案"]  # 拒答
    elif any(item in llm_response for item in ["抱歉"]):
        return ["抱歉没有答案"]

    for focus_node in focus_nodes:
        # if focus_node in llm_response and focus_node in gold_answer:
        if focus_node in llm_response:
            hit_nodes.append(focus_node)
    if hit_nodes:
        return list(set(hit_nodes))  # 全对和少答
    else:
        return []  # 全答错了


async def compute_score(hit_nodes, gold_answer, gold_score):
    gold_answer_list = gold_answer.split("**")
    gold_score = int(gold_score)
    assert len(gold_answer_list) == gold_score, (
        f"答案数量{len(gold_answer_list)} 不等于 分数{gold_score}"
    )

    if not hit_nodes:  # 全部答错
        return 0
    elif not all(item in gold_answer for item in hit_nodes):  # 全部答错或者少答
        return 0
    elif "抱歉没有答案" in hit_nodes:  # 拒答
        return -1
    elif set(hit_nodes) == set(gold_answer_list):  # 全对
        return 1
    elif len(hit_nodes) < len(gold_answer_list):  # 少答
        return len(hit_nodes) / len(gold_answer_list)
    else:
        return 0


async def ado_llm_completion(question, content):
    base = 8000
    content = content[: int(base * 1.5)]

    prompt = f"""请从以下人员信息中回答问题，选择符合条件的人员：

问题：{question}
人员信息：{content}
问题：{question}

# 限制
请筛选符合全部条件的人员，但是你惜字如金，只会简要解释选择每个人员的原因。
你需要自己组织语言，回答自然流畅。
"""
    payload = {
        "model": "Tome-L",
        "messages": [
            {"role": "user", "content": question},
            {"role": "assistant", "content": prompt},
        ],
        "temperature": 0,
        "top_p": 0.95,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "max_tokens": 1000,
    }

    llm_model_api = "http://XXX:8303/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    response = requests.post(llm_model_api, headers=headers, json=payload, verify=False)
    response = response.json()
    # breakpoint()
    return response["choices"][0]["message"]["content"].strip()


async def ado_llm_completion(question, content):
    prompt = """你是一个任务规划器，可以将一个复杂的问题拆分为一系列子问题，这些子问题将被送给一个executor去执行。
    executor的能力：xxx
    例子：xxx
    返回格式：xxx
"""

    payload = {
        "model": "Qwen2-72B-Chat",
        "messages": [
            {"role": "user", "content": question},
            {"role": "assistant", "content": prompt},
        ],
        "temperature": 0,
        "top_p": 0.95,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "max_tokens": 600,
    }

    llm_model_api = "http://XXX:8303/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    response = requests.post(llm_model_api, headers=headers, json=payload, verify=False)
    response = response.json()
    return response["choices"][0]["message"]["content"].strip()


# 模拟query增强
async def cur_query_rewrite(query: str) -> str:
    pattern = r"(?:^|[\u4e00-\u9fff])([a-zA-Z]+)"
    query_text = query
    matches = re.findall(pattern, query_text)
    name_map_es = {
        "as": "AnyShare",
        "ab": "AnyBackup",
        "ad": "AnyData",
        "af": "AnyFabric",
        "ar": "AnyRobot",
    }
    for match in matches:
        if match.lower() in ["as", "ab", "af", "ar", "ad"]:
            query_text = query_text.replace(
                match, match + "(" + name_map_es[match.lower()] + ")"
            )  # 更改了这一行
    return query_text


# 全局配置
# XXX
# resource={}
# aug_config={'augmentation_field': [], 'augmentation_kg_id': ''}
# inputs={'query': '金融领域有哪些研究人员', 'entities': [{'graph_id': '34', 'space': 'ube8a07b08c4511ef87d276d1f5ea730b', 'entity': '金融领域', 'type': 'business', 'property': 'name', 'start_idx': 0, 'end_idx': 4, 'vid': '826d0158bca6a981aee3e16f2e6cdf1d'}], 'rule_answers': []}
# props={'nebula_engine': {'ips': ['nebula-graphd-svc.resource'], 'ports': ['9669'], 'user': 'anydata', 'password': '***', 'type': 'nebula'}, 'opensearch_engine': {'ips': ['opensearch-master.resource'], 'ports': ['9200'], 'user': 'admin', 'password': '***', 'type': 'opensearch'}, 'aug_config': {'augmentation_field': [], 'augmentation_kg_id': ''}, 'as_info': {'address': '', 'port': '', 'as_user_id': ''}, 'kg': [{'kg_id': '34', 'fields': ['person', 'business', 'district', 'industry', 'orgnization', 'project'], 'output_fields': ['person']}], 'headers': {'userid': '78fd855c-d082-11ee-aded-ea19b8900da1', 'token': ''}, 'limit': 1, 'threshold': 0.7, 'pre_filter': {'enable': True, 'thr': 0.48, 'topn': 5}, 'post_filter': {'enable': True, 'llm': {'prompt': '判断answer是否能回答query的所有问题。\nquery: {{query}};\nanswer: {{subgraph}};\n如果能找到答案，返回"YES"；如果不能，返回"NO"'}}, 'llm_config': {'temperature': 0, 'top_p': 0.95, 'top_k': 1, 'frequency_penalty': 0, 'presence_penalty': 0, 'max_tokens': 600, 'icon': '', 'llm_id': '', 'llm_model_name': 'Tome-M'}, 'skip_while_no_entities': True, 'only2hop': False, 'reranker_thr': -5.5, 'kg_ontology': {'34': {'dbname': 'ube8a07b08c4511ef87d276d1f5ea730b', 'edge': [{'alias': '相关', 'colour': 'rgba(198,79,88,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id9ed6b79f-911e-4292-9c20-ba204dc95ba3', 'index_default_switch': False, 'model': '', 'name': 'custom_subject_2_custom_subject_releated_manual', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['custom_subject', 'custom_subject_2_custom_subject_releated_manual', 'custom_subject'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '相关', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id617ad4c9-f0f6-46b6-8cd4-f4eb09fb8125', 'index_default_switch': False, 'model': '', 'name': 'person_2_custom_subject_releated_manual', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_custom_subject_releated_manual', 'custom_subject'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '相关', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idca8708f3-7f41-471e-ae14-d13ece366046', 'index_default_switch': False, 'model': '', 'name': 'document_2_custom_subject_releated_manual', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['document', 'document_2_custom_subject_releated_manual', 'custom_subject'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '提及', 'colour': 'rgba(42,144,143,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_ide5391bf9-827d-41c5-88e4-12d0d460cbb4', 'index_default_switch': False, 'model': '', 'name': 'document_2_custom_subject_mention', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['document', 'document_2_custom_subject_mention', 'custom_subject'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '下层分类', 'colour': 'rgba(42,144,143,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_ida8dcba4b-9d6c-427d-849b-9f1e135aa783', 'index_default_switch': False, 'model': '', 'name': 'tag_2_tag_child', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['tag', 'tag_2_tag_child', 'tag'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '包含', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id84a37d0f-4234-4813-91c5-108f0f54733f', 'index_default_switch': False, 'model': '', 'name': 'person_2_tag_include', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_tag_include', 'tag'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '提及', 'colour': 'rgba(42,144,143,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idc292332f-7d03-4d94-9e67-3a8ff8e90bb2', 'index_default_switch': False, 'model': '', 'name': 'document_2_tag_mention', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['document', 'document_2_tag_mention', 'tag'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '编辑', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id2ced4ed3-1304-4842-849d-b40d03878f93', 'index_default_switch': False, 'model': '', 'name': 'person_2_document_edit', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_document_edit', 'document'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '创建', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id46c0d868-fe0a-467f-8498-aa5215112b65', 'index_default_switch': False, 'model': '', 'name': 'person_2_document_create', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_document_create', 'document'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '属于', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id4e3c8a35-14dd-479f-8828-877c97f6917e', 'index_default_switch': False, 'model': '', 'name': 'person_2_business_belong_to', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_business_belong_to', 'business'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '下层分类', 'colour': 'rgba(217,112,76,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idd272a25c-a6e3-479c-b6f8-53036dc59dc4', 'index_default_switch': False, 'model': '', 'name': 'industry_2_industry', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['industry', 'industry_2_industry', 'industry'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '下层分类', 'colour': 'rgba(217,83,76,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idcfcdc7fd-8acd-4720-9269-ff77b6a069df', 'index_default_switch': False, 'model': '', 'name': 'district_2_district_child', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['district', 'district_2_district_child', 'district'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '提及', 'colour': 'rgba(42,144,143,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idacd741c8-ad86-42ed-9758-b5272a3810a8', 'index_default_switch': False, 'model': '', 'name': 'document_2_person_mention', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['document', 'document_2_person_mention', 'person'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '参与', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id0dc8604c-b8d5-4436-8c2d-ee6b04ecea5e', 'index_default_switch': False, 'model': '', 'name': 'customer_2_project_join', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['customer', 'customer_2_project_join', 'project'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '所在', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idc8eb6bc9-cd57-4736-b39f-78fa19c99e18', 'index_default_switch': False, 'model': '', 'name': 'customer_2_district_located', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['customer', 'customer_2_district_located', 'district'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '客户行业', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id1d4f1ea4-e446-4e3e-a6b1-4a3e1367df52', 'index_default_switch': False, 'model': '', 'name': 'customer_2_industry_belong_to', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['customer', 'customer_2_industry_belong_to', 'industry'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '工作地点', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idafb7822a-3dfc-4106-8779-9417c3a5ae4d', 'index_default_switch': False, 'model': '', 'name': 'person_2_district_work_at', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_district_work_at', 'district'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '服务', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_iddab53e61-630d-4ee8-806a-98574a4d6fc2', 'index_default_switch': False, 'model': '', 'name': 'person_2_industry_service', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_industry_service', 'industry'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '负责', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_ida2396bf8-3924-49c8-8aa7-8ea1fee5aee7', 'index_default_switch': False, 'model': '', 'name': 'person_2_project_join', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_project_join', 'project'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '属于', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id52a5fc33-95a6-427c-8955-97ce61bbd154', 'index_default_switch': False, 'model': '', 'name': 'person_2_orgnization_belong_to', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_orgnization_belong_to', 'orgnization'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '下层分类', 'colour': 'rgba(216,112,122,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idad8e298c-c056-4190-aefd-7d00f73c2bd7', 'index_default_switch': False, 'model': '', 'name': 'orgnization_2_orgnization_child', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['orgnization', 'orgnization_2_orgnization_child', 'orgnization'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '提及', 'colour': 'rgba(42,144,143,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id18f9698a-f147-4cc2-892c-e36f7d1e9a6e', 'index_default_switch': False, 'model': '', 'name': 'document_2_customer_mention', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['document', 'document_2_customer_mention', 'customer'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '提及', 'colour': 'rgba(42,144,143,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id7d29c933-9432-4709-abe5-b84ea537dc12', 'index_default_switch': False, 'model': '', 'name': 'document_2_industry_mention', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['document', 'document_2_industry_mention', 'industry'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '提及', 'colour': 'rgba(42,144,143,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idfbe31cda-edca-4d03-8474-099126aed2d2', 'index_default_switch': False, 'model': '', 'name': 'document_2_project_mention', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['document', 'document_2_project_mention', 'project'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}], 'entity': [{'alias': '自定义主题', 'default_tag': 'name', 'description': '', 'entity_id': 'entity_idc090f331-5c5a-4605-88b4-2b67620285d8', 'fill_color': 'rgba(198,79,88,1)', 'icon': 'empty', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'custom_subject', 'primary_key': ['name'], 'properties': [{'alias': '主题别名', 'data_type': 'string', 'description': '', 'name': 'alias'}, {'alias': '描述', 'data_type': 'string', 'description': '', 'name': 'description'}, {'alias': '名称', 'data_type': 'string', 'description': '', 'name': 'name'}], 'properties_index': ['alias', 'description', 'name'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(198,79,88,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['alias', 'description', 'name'], 'x': 1925.0973936899863, 'y': 322.23508230452666}, {'alias': '标签', 'default_tag': 'name', 'description': '', 'entity_id': 'entity_idfc058d22-c844-4e4e-9aa4-9bae97a13259', 'fill_color': 'rgba(42,144,143,1)', 'icon': 'empty', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'tag', 'primary_key': ['id'], 'properties': [{'alias': '名称', 'data_type': 'string', 'description': '', 'name': 'name'}, {'alias': '版本', 'data_type': 'integer', 'description': '', 'name': 'version'}, {'alias': '路径', 'data_type': 'string', 'description': '', 'name': 'path'}, {'alias': 'id', 'data_type': 'string', 'description': '', 'name': 'id'}], 'properties_index': ['name', 'path', 'id'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(42,144,143,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['name', 'path', 'id'], 'x': 952.1512160493828, 'y': 258.28444787379965}, {'alias': '专业领域', 'default_tag': 'name', 'description': '专业领域是指员工的业务领域，通常与员工的职位和工作职责密切相关。', 'entity_id': 'entity_id3ee43850-533f-4672-8889-e91fa8eed2b4', 'fill_color': 'rgba(217,83,76,1)', 'icon': 'graph-decentralization', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'business', 'primary_key': ['name'], 'properties': [{'alias': 'name', 'data_type': 'string', 'description': '', 'name': 'name'}], 'properties_index': ['name'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(217,83,76,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['name'], 'x': 1955.2344269437488, 'y': 470.30531269374006}, {'alias': '地区', 'default_tag': 'name', 'description': '行政区划', 'entity_id': 'entity_ida4c0a656-e77f-4942-9300-615242e84889', 'fill_color': 'rgba(217,83,76,1)', 'icon': 'graph-location', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'district', 'primary_key': ['code'], 'properties': [{'alias': '父级路径', 'data_type': 'string', 'description': '', 'name': 'parent'}, {'alias': '层级', 'data_type': 'integer', 'description': '', 'name': 'level'}, {'alias': '区划代码', 'data_type': 'string', 'description': '', 'name': 'code'}, {'alias': '名称', 'data_type': 'string', 'description': '', 'name': 'name'}], 'properties_index': ['parent', 'name'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(217,83,76,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['parent', 'name'], 'x': 1661.3772290809327, 'y': 820.4701646090533}, {'alias': '客户', 'default_tag': 'id', 'description': '企业商品服务的采购者', 'entity_id': 'entity_id59b0c68b-aac6-43c0-9295-9d88d8fc0041', 'fill_color': 'rgba(145,192,115,1)', 'icon': 'graph-customer_service', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'customer', 'primary_key': ['id'], 'properties': [{'alias': '名称', 'data_type': 'string', 'description': '', 'name': 'name'}, {'alias': 'ID', 'data_type': 'string', 'description': '', 'name': 'id'}], 'properties_index': ['name', 'id'], 'search_prop': 'id', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(145,192,115,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['name', 'id'], 'x': 1178.127572016461, 'y': 796.278120713306}, {'alias': '行业', 'default_tag': 'name', 'description': '生产同类产品/相同工艺/提供同类劳动服务的企业或组织的集合', 'entity_id': 'entity_ida8c94541-fca2-4f54-aa8d-40a09e388582', 'fill_color': 'rgba(217,112,76,1)', 'icon': 'graph-apps', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'industry', 'primary_key': ['id'], 'properties': [{'alias': '父级路径', 'data_type': 'string', 'description': '', 'name': 'parent'}, {'alias': 'level', 'data_type': 'integer', 'description': '', 'name': 'level'}, {'alias': '描述', 'data_type': 'string', 'description': '', 'name': 'description'}, {'alias': '名称', 'data_type': 'string', 'description': '', 'name': 'name'}, {'alias': 'ID', 'data_type': 'string', 'description': '', 'name': 'id'}], 'properties_index': ['parent', 'description', 'name', 'id'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(217,112,76,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['parent', 'description', 'name', 'id'], 'x': 967.1111111111111, 'y': 577.9722222222222}, {'alias': '人员', 'default_tag': 'name', 'description': '企业组织结构的员工/AnyShare系统中的用户', 'entity_id': 'entity_id5e09f69b-1da2-47a1-b558-9bb731615aab', 'fill_color': 'rgba(145,192,115,1)', 'icon': 'graph-user', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'person', 'primary_key': ['id'], 'properties': [{'alias': '英文名', 'data_type': 'string', 'description': '', 'name': 'english_name'}, {'alias': '用户状态', 'data_type': 'string', 'description': '', 'name': 'status'}, {'alias': '专家角色', 'data_type': 'boolean', 'description': '', 'name': 'is_expert'}, {'alias': '毕业院校', 'data_type': 'string', 'description': '', 'name': 'university'}, {'alias': '邮箱', 'data_type': 'string', 'description': '', 'name': 'email'}, {'alias': '联系方式', 'data_type': 'string', 'description': '', 'name': 'contact'}, {'alias': '用户密级', 'data_type': 'integer', 'description': '', 'name': 'user_securtiy_level'}, {'alias': '用户角色', 'data_type': 'string', 'description': '', 'name': 'user_role'}, {'alias': '职位', 'data_type': 'string', 'description': '', 'name': 'position'}, {'alias': 'id', 'data_type': 'string', 'description': '', 'name': 'id'}, {'alias': '姓名', 'data_type': 'string', 'description': '', 'name': 'name'}], 'properties_index': ['english_name', 'university', 'email', 'position', 'name'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(145,192,115,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['english_name', 'university', 'email', 'position', 'name'], 'x': 1263.936899862826, 'y': 591.1999314128943}, {'alias': '组织', 'default_tag': 'name', 'description': 'AnyShare系统中的组织结构及部门', 'entity_id': 'entity_id24803cd0-9bbd-4108-ab94-6ad47b93c92b', 'fill_color': 'rgba(216,112,122,1)', 'icon': 'graph-connections', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'orgnization', 'primary_key': ['id'], 'properties': [{'alias': '父级路径', 'data_type': 'string', 'description': '', 'name': 'parent'}, {'alias': '邮箱', 'data_type': 'string', 'description': '', 'name': 'email'}, {'alias': 'id', 'data_type': 'string', 'description': '', 'name': 'id'}, {'alias': '名称', 'data_type': 'string', 'description': '', 'name': 'name'}], 'properties_index': ['parent', 'id', 'name'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(216,112,122,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['parent', 'id', 'name'], 'x': 1258.1426611796983, 'y': 360.1848422496571}, {'alias': '项目', 'default_tag': 'name', 'description': '企业内部发生的一些重大的/有影响的事情，不同领域有不同含义，如法律领域，会将事件即为案件', 'entity_id': 'entity_id414676a5-5a4c-4e50-81e4-207045b39d48', 'fill_color': 'rgba(42,144,143,1)', 'icon': 'graph-order', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'project', 'primary_key': ['name'], 'properties': [{'alias': '名称', 'data_type': 'string', 'description': '', 'name': 'name'}], 'properties_index': ['name'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(42,144,143,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['name'], 'x': 1854.0973936899863, 'y': 613.548353909465}, {'alias': '文档', 'default_tag': 'name', 'description': '由创建者所定义的、具有文件名的一组相关元素的集合', 'entity_id': 'entity_idc93b0ac1-e9bc-4c35-9fee-e90b8f4a01fd', 'fill_color': 'rgba(42,144,143,1)', 'icon': 'graph-document', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'document', 'primary_key': ['doc_id'], 'properties': [{'alias': '需要预览权限', 'data_type': 'boolean', 'description': '', 'name': 'need_preview_perm'}, {'alias': '摘要', 'data_type': 'string', 'description': '', 'name': 'abstract'}, {'alias': '大小', 'data_type': 'integer', 'description': '', 'name': 'size'}, {'alias': '文档路径', 'data_type': 'string', 'description': '', 'name': 'file_location'}, {'alias': '文档密级', 'data_type': 'integer', 'description': '', 'name': 'file_security_level'}, {'alias': '修改时间', 'data_type': 'datetime', 'description': '', 'name': 'modified_at'}, {'alias': '创建时间', 'data_type': 'datetime', 'description': '', 'name': 'created_at'}, {'alias': '版本', 'data_type': 'string', 'description': 'AS文档版本', 'name': 'version'}, {'alias': '文件名', 'data_type': 'string', 'description': '', 'name': 'name'}, {'alias': '文档ID', 'data_type': 'string', 'description': 'AS文档ID', 'name': 'doc_id'}], 'properties_index': ['abstract', 'size', 'file_location', 'modified_at', 'created_at', 'version', 'name', 'doc_id'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(42,144,143,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['abstract', 'file_location', 'name'], 'x': 1720.205761316872, 'y': 267.6659807956105}], 'graph_name': '知识图谱_214有摘要', 'knw_id': 1, 'quantized_flag': 0}}}
# emb_desc_config={'34': {'custom_subject': {'主题别名': {'en_name': 'alias', 'description': ''}, '描述': {'en_name': 'description', 'description': ''}, '名称': {'en_name': 'name', 'description': ''}}, 'tag': {'名称': {'en_name': 'name', 'description': ''}, '路径': {'en_name': 'path', 'description': ''}, 'id': {'en_name': 'id', 'description': ''}}, 'business': {'name': {'en_name': 'name', 'description': ''}}, 'district': {'父级路径': {'en_name': 'parent', 'description': ''}, '名称': {'en_name': 'name', 'description': ''}}, 'customer': {'名称': {'en_name': 'name', 'description': ''}, 'ID': {'en_name': 'id', 'description': ''}}, 'industry': {'父级路径': {'en_name': 'parent', 'description': ''}, '描述': {'en_name': 'description', 'description': ''}, '名称': {'en_name': 'name', 'description': ''}, 'ID': {'en_name': 'id', 'description': ''}}, 'person': {'英文名': {'en_name': 'english_name', 'description': ''}, '毕业院校': {'en_name': 'university', 'description': ''}, '邮箱': {'en_name': 'email', 'description': ''}, '职位': {'en_name': 'position', 'description': ''}, '姓名': {'en_name': 'name', 'description': ''}}, 'orgnization': {'父级路径': {'en_name': 'parent', 'description': ''}, 'id': {'en_name': 'id', 'description': ''}, '名称': {'en_name': 'name', 'description': ''}}, 'project': {'名称': {'en_name': 'name', 'description': ''}}, 'document': {'摘要': {'en_name': 'abstract', 'description': ''}, '大小': {'en_name': 'size', 'description': ''}, '文档路径': {'en_name': 'file_location', 'description': ''}, '修改时间': {'en_name': 'modified_at', 'description': ''}, '创建时间': {'en_name': 'created_at', 'description': ''}, '版本': {'en_name': 'version', 'description': 'AS文档版本'}, '文件名': {'en_name': 'name', 'description': ''}, '文档ID': {'en_name': 'doc_id', 'description': 'AS文档ID'}}}}

# XXX
# resource={}
# aug_config={'augmentation_field': [], 'augmentation_kg_id': ''}
# inputs={'query': '金融领域有哪些人', 'entities': [{'graph_id': '3', 'space': 'uc692f7dc929911ef821966f202b6c1cd-2', 'entity': '金融领域', 'type': 'business', 'property': 'name', 'start_idx': 0, 'end_idx': 4, 'vid': '826d0158bca6a981aee3e16f2e6cdf1d'}], 'rule_answers': []}
# props={'nebula_engine': {'ips': ['nebula-graphd-svc.resource'], 'ports': ['9669'], 'user': 'anydata', 'password': '***', 'type': 'nebula'}, 'opensearch_engine': {'ips': ['opensearch-master.resource'], 'ports': ['9200'], 'user': 'admin', 'password': '***', 'type': 'opensearch'}, 'aug_config': {'augmentation_field': [], 'augmentation_kg_id': ''}, 'as_info': {'address': '', 'port': '', 'as_user_id': ''}, 'kg': [{'kg_id': '3', 'fields': ['business', 'district', 'industry', 'person', 'orgnization', 'project'], 'output_fields': ['person']}], 'headers': {'userid': 'b2951054-6bab-11ef-a45e-32c4b8a3aee4', 'token': ''}, 'limit': 1, 'threshold': 0.7, 'pre_filter': {'enable': True, 'thr': 0.48, 'topn': 5}, 'post_filter': {'enable': True, 'llm': {'prompt': '判断answer是否能回答query的所有问题。\nquery: {{query}};\nanswer: {{subgraph}};\n如果能找到答案，返回"YES"；如果不能，返回"NO"'}}, 'llm_config': {'temperature': 1, 'top_p': 1, 'top_k': 1, 'frequency_penalty': 0, 'presence_penalty': 0, 'max_tokens': 1000, 'icon': '', 'llm_id': '1831865174118764544', 'llm_model_name': 'L20-qwen2-72b'}, 'skip_while_no_entities': True, 'only2hop': False, 'reranker_thr': -5, 'kg_ontology': {'3': {'dbname': 'uc692f7dc929911ef821966f202b6c1cd-2', 'edge': [{'alias': '相关', 'colour': 'rgba(198,79,88,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_iddb3b1ba6-5fea-4f9b-9dc6-41d43a4cf6a1', 'index_default_switch': False, 'model': '', 'name': 'custom_subject_2_custom_subject_releated_manual', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['custom_subject', 'custom_subject_2_custom_subject_releated_manual', 'custom_subject'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '相关', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idc8b0e064-4ccf-40ba-bbe4-98f5a84424ae', 'index_default_switch': False, 'model': '', 'name': 'person_2_custom_subject_releated_manual', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_custom_subject_releated_manual', 'custom_subject'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '相关', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idd11e17c7-a1c7-4a4a-9937-72e0d6ad489a', 'index_default_switch': False, 'model': '', 'name': 'document_2_custom_subject_releated_manual', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['document', 'document_2_custom_subject_releated_manual', 'custom_subject'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '提及', 'colour': 'rgba(42,144,143,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id09bf25c6-9c7d-4531-b1ff-d108fc767ca6', 'index_default_switch': False, 'model': '', 'name': 'document_2_custom_subject_mention', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['document', 'document_2_custom_subject_mention', 'custom_subject'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '下层分类', 'colour': 'rgba(42,144,143,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id0d1f05ed-98ac-487c-94ed-0225fb84a199', 'index_default_switch': False, 'model': '', 'name': 'tag_2_tag_child', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['tag', 'tag_2_tag_child', 'tag'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '包含', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id4ed35abc-e961-47af-a050-c43d9e837b41', 'index_default_switch': False, 'model': '', 'name': 'person_2_tag_include', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_tag_include', 'tag'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '提及', 'colour': 'rgba(42,144,143,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idb04727d1-bbec-4830-a18c-fbf1513acb67', 'index_default_switch': False, 'model': '', 'name': 'document_2_tag_mention', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['document', 'document_2_tag_mention', 'tag'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '编辑', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idbbb1d916-6fd7-47ed-99c5-cc872c573434', 'index_default_switch': False, 'model': '', 'name': 'person_2_document_edit', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_document_edit', 'document'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '创建', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idaf85d818-c7da-496f-93dd-be87c2f6b8dc', 'index_default_switch': False, 'model': '', 'name': 'person_2_document_create', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_document_create', 'document'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '属于', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id4a640566-5188-4382-b523-a3481ae972d5', 'index_default_switch': False, 'model': '', 'name': 'person_2_business_belong_to', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_business_belong_to', 'business'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '下层分类', 'colour': 'rgba(217,112,76,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id460d39d2-b3f6-4b37-8cfa-0cebfb816091', 'index_default_switch': False, 'model': '', 'name': 'industry_2_industry', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['industry', 'industry_2_industry', 'industry'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '下层分类', 'colour': 'rgba(217,83,76,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idcfae0039-a309-478a-9077-0abc503f51c7', 'index_default_switch': False, 'model': '', 'name': 'district_2_district_child', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['district', 'district_2_district_child', 'district'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '提及', 'colour': 'rgba(42,144,143,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id51edf298-e6e5-468f-a1bc-e27cd91b0919', 'index_default_switch': False, 'model': '', 'name': 'document_2_person_mention', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['document', 'document_2_person_mention', 'person'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '参与', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idecf272ae-e8a8-4a66-867a-4fdbcbff74b3', 'index_default_switch': False, 'model': '', 'name': 'customer_2_project_join', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['customer', 'customer_2_project_join', 'project'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '所在', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id98c81460-6f49-4194-8252-5b8baca253ec', 'index_default_switch': False, 'model': '', 'name': 'customer_2_district_located', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['customer', 'customer_2_district_located', 'district'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '客户行业', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id1ec49ca6-620e-493c-954f-772841270fdf', 'index_default_switch': False, 'model': '', 'name': 'customer_2_industry_belong_to', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['customer', 'customer_2_industry_belong_to', 'industry'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '工作地点', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id974741bf-b4b0-4e17-9860-3dd6dfa7630f', 'index_default_switch': False, 'model': '', 'name': 'person_2_district_work_at', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_district_work_at', 'district'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '服务', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idde243c46-96c7-441f-946f-56748e299edc', 'index_default_switch': False, 'model': '', 'name': 'person_2_industry_service', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_industry_service', 'industry'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '负责', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id81122d1c-6671-4a6f-83dc-9b7ac8683b0e', 'index_default_switch': False, 'model': '', 'name': 'person_2_project_join', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_project_join', 'project'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '属于', 'colour': 'rgba(145,192,115,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id5b5e4c3c-db8a-44cc-ba5b-952c77723f4c', 'index_default_switch': False, 'model': '', 'name': 'person_2_orgnization_belong_to', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['person', 'person_2_orgnization_belong_to', 'orgnization'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '下层分类', 'colour': 'rgba(216,112,122,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_idcc74a78c-f720-4ddf-b176-0454369c5f1e', 'index_default_switch': False, 'model': '', 'name': 'orgnization_2_orgnization_child', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['orgnization', 'orgnization_2_orgnization_child', 'orgnization'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '提及', 'colour': 'rgba(42,144,143,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id8c07d4c2-c1c7-44fe-90ac-f165863408da', 'index_default_switch': False, 'model': '', 'name': 'document_2_customer_mention', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['document', 'document_2_customer_mention', 'customer'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '提及', 'colour': 'rgba(42,144,143,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_id75a4e34e-90de-4224-8f6d-502e39fb95e5', 'index_default_switch': False, 'model': '', 'name': 'document_2_industry_mention', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['document', 'document_2_industry_mention', 'industry'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}, {'alias': '提及', 'colour': 'rgba(42,144,143,1)', 'default_tag': '', 'description': '', 'edge_id': 'edge_ide4a32a61-238b-49a4-9bb1-8e5833f93ab2', 'index_default_switch': False, 'model': '', 'name': 'document_2_project_mention', 'primary_key': [], 'properties': [], 'properties_index': [], 'relations': ['document', 'document_2_project_mention', 'project'], 'shape': 'line', 'source_type': 'manual', 'width': '0.25x'}], 'entity': [{'alias': '自定义主题', 'default_tag': 'name', 'description': '', 'entity_id': 'entity_id251d166e-13f1-4938-aba3-42faf3673e5d', 'fill_color': 'rgba(198,79,88,1)', 'icon': 'empty', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'custom_subject', 'primary_key': ['name'], 'properties': [{'alias': '主题别名', 'data_type': 'string', 'description': '', 'name': 'alias'}, {'alias': '描述', 'data_type': 'string', 'description': '', 'name': 'description'}, {'alias': '名称', 'data_type': 'string', 'description': '', 'name': 'name'}], 'properties_index': ['alias', 'description', 'name'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(198,79,88,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['alias', 'description', 'name'], 'x': 1925.0973936899863, 'y': 322.23508230452666}, {'alias': '标签', 'default_tag': 'name', 'description': '', 'entity_id': 'entity_id133ff2b7-3599-485c-9e01-0efc887212e9', 'fill_color': 'rgba(42,144,143,1)', 'icon': 'empty', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'tag', 'primary_key': ['id'], 'properties': [{'alias': '名称', 'data_type': 'string', 'description': '', 'name': 'name'}, {'alias': '版本', 'data_type': 'integer', 'description': '', 'name': 'version'}, {'alias': '路径', 'data_type': 'string', 'description': '', 'name': 'path'}, {'alias': 'id', 'data_type': 'string', 'description': '', 'name': 'id'}], 'properties_index': ['name', 'path'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(42,144,143,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['name', 'path'], 'x': 952.1512160493828, 'y': 258.28444787379965}, {'alias': '专业领域', 'default_tag': 'name', 'description': '专业领域是指员工的业务领域，通常与员工的职位和工作职责密切相关。', 'entity_id': 'entity_id0f5b2c5a-7306-42d8-bbf7-fdca6f5d4b94', 'fill_color': 'rgba(217,83,76,1)', 'icon': 'graph-decentralization', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'business', 'primary_key': ['name'], 'properties': [{'alias': 'name', 'data_type': 'string', 'description': '', 'name': 'name'}], 'properties_index': ['name'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(217,83,76,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['name'], 'x': 1955.2344269437488, 'y': 470.30531269374006}, {'alias': '地区', 'default_tag': 'name', 'description': '行政区划', 'entity_id': 'entity_id1b7727da-ba8d-4a0e-a10c-d9dcc25c9773', 'fill_color': 'rgba(217,83,76,1)', 'icon': 'graph-location', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'district', 'primary_key': ['code'], 'properties': [{'alias': '父级路径', 'data_type': 'string', 'description': '', 'name': 'parent'}, {'alias': '层级', 'data_type': 'integer', 'description': '', 'name': 'level'}, {'alias': '区划代码', 'data_type': 'string', 'description': '', 'name': 'code'}, {'alias': '名称', 'data_type': 'string', 'description': '', 'name': 'name'}], 'properties_index': ['parent', 'code', 'name'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(217,83,76,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['parent', 'code', 'name'], 'x': 1661.3772290809327, 'y': 820.4701646090533}, {'alias': '客户', 'default_tag': 'id', 'description': '企业商品服务的采购者', 'entity_id': 'entity_id4e732109-6b6b-4ece-94ab-815433ceaacd', 'fill_color': 'rgba(145,192,115,1)', 'icon': 'graph-customer_service', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'customer', 'primary_key': ['id'], 'properties': [{'alias': '名称', 'data_type': 'string', 'description': '', 'name': 'name'}, {'alias': 'ID', 'data_type': 'string', 'description': '', 'name': 'id'}], 'properties_index': ['name', 'id'], 'search_prop': 'id', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(145,192,115,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': [], 'x': 1178.127572016461, 'y': 796.278120713306}, {'alias': '行业', 'default_tag': 'name', 'description': '生产同类产品/相同工艺/提供同类劳动服务的企业或���织的集合', 'entity_id': 'entity_id318ea32f-0e37-4cfd-8fd0-76eed9efec74', 'fill_color': 'rgba(217,112,76,1)', 'icon': 'graph-apps', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'industry', 'primary_key': ['id'], 'properties': [{'alias': '父级路径', 'data_type': 'string', 'description': '', 'name': 'parent'}, {'alias': 'level', 'data_type': 'integer', 'description': '', 'name': 'level'}, {'alias': '描述', 'data_type': 'string', 'description': '', 'name': 'description'}, {'alias': '名称', 'data_type': 'string', 'description': '', 'name': 'name'}, {'alias': 'ID', 'data_type': 'string', 'description': '', 'name': 'id'}], 'properties_index': ['parent', 'description', 'name'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(217,112,76,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['parent', 'description', 'name'], 'x': 967.1111111111111, 'y': 577.9722222222222}, {'alias': '人员', 'default_tag': 'name', 'description': '企业组织结构的员工/AnyShare系统中的用户', 'entity_id': 'entity_idc1d95feb-c84d-4e99-bfbe-326773a24e9e', 'fill_color': 'rgba(145,192,115,1)', 'icon': 'graph-user', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'person', 'primary_key': ['id'], 'properties': [{'alias': '英文名', 'data_type': 'string', 'description': '', 'name': 'english_name'}, {'alias': '用户状态', 'data_type': 'string', 'description': '', 'name': 'status'}, {'alias': '专家角色', 'data_type': 'boolean', 'description': '', 'name': 'is_expert'}, {'alias': '毕业院校', 'data_type': 'string', 'description': '', 'name': 'university'}, {'alias': '邮箱', 'data_type': 'string', 'description': '', 'name': 'email'}, {'alias': '联系方式', 'data_type': 'string', 'description': '', 'name': 'contact'}, {'alias': '用户密级', 'data_type': 'integer', 'description': '', 'name': 'user_securtiy_level'}, {'alias': '用户角色', 'data_type': 'string', 'description': '', 'name': 'user_role'}, {'alias': '职位', 'data_type': 'string', 'description': '', 'name': 'position'}, {'alias': 'id', 'data_type': 'string', 'description': '', 'name': 'id'}, {'alias': '姓名', 'data_type': 'string', 'description': '', 'name': 'name'}], 'properties_index': ['english_name', 'university', 'email', 'contact', 'position', 'name'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(145,192,115,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['english_name', 'university', 'email', 'contact', 'position', 'name'], 'x': 1263.936899862826, 'y': 591.1999314128943}, {'alias': '组织', 'default_tag': 'name', 'description': 'AnyShare系统中的组织结构及部门', 'entity_id': 'entity_id71a6b557-8709-4fbc-8424-d93d6d777c31', 'fill_color': 'rgba(216,112,122,1)', 'icon': 'graph-connections', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'orgnization', 'primary_key': ['id'], 'properties': [{'alias': '父级路径', 'data_type': 'string', 'description': '', 'name': 'parent'}, {'alias': '邮箱', 'data_type': 'string', 'description': '', 'name': 'email'}, {'alias': 'id', 'data_type': 'string', 'description': '', 'name': 'id'}, {'alias': '名称', 'data_type': 'string', 'description': '', 'name': 'name'}], 'properties_index': ['parent', 'name'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(216,112,122,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['parent', 'name'], 'x': 1258.1426611796983, 'y': 360.1848422496571}, {'alias': '项目', 'default_tag': 'name', 'description': '企业内部发生的一些重大的/有影响的事情，不同领域有不同含义，如法律领域，会将事件即为案件', 'entity_id': 'entity_id8ca3a0ee-27df-40ec-a30f-4191ca82f2c9', 'fill_color': 'rgba(42,144,143,1)', 'icon': 'graph-order', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'project', 'primary_key': ['name'], 'properties': [{'alias': '名称', 'data_type': 'string', 'description': '', 'name': 'name'}], 'properties_index': ['name'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(42,144,143,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['name'], 'x': 1854.0973936899863, 'y': 613.548353909465}, {'alias': '文档', 'default_tag': 'name', 'description': '由创建者所定义的、具有文件名的一组相关元素的集合', 'entity_id': 'entity_id435eb7da-7ab0-4b9d-a588-65febeeb6826', 'fill_color': 'rgba(42,144,143,1)', 'icon': 'graph-document', 'icon_color': '#ffffff', 'index_default_switch': False, 'model': '', 'name': 'document', 'primary_key': ['doc_id'], 'properties': [{'alias': 'size', 'data_type': 'integer', 'description': '', 'name': 'size'}, {'alias': '文档路径', 'data_type': 'string', 'description': '', 'name': 'file_location'}, {'alias': '文档密级', 'data_type': 'integer', 'description': '', 'name': 'file_security_level'}, {'alias': '修改时间', 'data_type': 'datetime', 'description': '', 'name': 'modified_at'}, {'alias': '创建时间', 'data_type': 'datetime', 'description': '', 'name': 'created_at'}, {'alias': '版本', 'data_type': 'string', 'description': 'AS文档版本', 'name': 'version'}, {'alias': '文件名', 'data_type': 'string', 'description': '', 'name': 'name'}, {'alias': '文档ID', 'data_type': 'string', 'description': 'AS文档ID', 'name': 'doc_id'}], 'properties_index': ['version', 'name'], 'search_prop': 'name', 'shape': 'circle', 'size': '0.5x', 'source_type': 'manual', 'stroke_color': 'rgba(42,144,143,1)', 'synonym': [], 'task_id': '', 'text_color': 'rgba(0,0,0,1)', 'text_position': 'top', 'text_type': 'adaptive', 'text_width': 15, 'vector_generation': ['version', 'name'], 'x': 1720.205761316872, 'y': 267.6659807956105}], 'graph_name': 'AS专家搜索_离线数据', 'knw_id': 1, 'quantized_flag': 0}}}
# emb_desc_config={'3': {'custom_subject': {'主题别名': {'en_name': 'alias', 'description': ''}, '描述': {'en_name': 'description', 'description': ''}, '名称': {'en_name': 'name', 'description': ''}}, 'tag': {'名称': {'en_name': 'name', 'description': ''}, '路径': {'en_name': 'path', 'description': ''}}, 'business': {'name': {'en_name': 'name', 'description': ''}}, 'district': {'父级路径': {'en_name': 'parent', 'description': ''}, '区划代码': {'en_name': 'code', 'description': ''}, '名称': {'en_name': 'name', 'description': ''}}, 'customer': {'名称': {'en_name': 'name', 'description': ''}, 'ID': {'en_name': 'id', 'description': ''}}, 'industry': {'父级路径': {'en_name': 'parent', 'description': ''}, '描述': {'en_name': 'description', 'description': ''}, '名称': {'en_name': 'name', 'description': ''}}, 'person': {'英文名': {'en_name': 'english_name', 'description': ''}, '毕业院校': {'en_name': 'university', 'description': ''}, '邮箱': {'en_name': 'email', 'description': ''}, '联系方式': {'en_name': 'contact', 'description': ''}, '职位': {'en_name': 'position', 'description': ''}, '姓名': {'en_name': 'name', 'description': ''}}, 'orgnization': {'父级路径': {'en_name': 'parent', 'description': ''}, '名称': {'en_name': 'name', 'description': ''}}, 'project': {'名称': {'en_name': 'name', 'description': ''}}, 'document': {'版本': {'en_name': 'version', 'description': 'AS文档版本'}, '文件名': {'en_name': 'name', 'description': ''}}}}

# XXX
resource = {}
aug_config = {"augmentation_field": [], "augmentation_kg_id": ""}
inputs = {
    "query": "金融领域有哪些人",
    "entities": [
        {
            "graph_id": "20",
            "space": "u259782b49c2411ef8a2116c2d54f5c3b",
            "entity": "金融领域",
            "type": "business",
            "property": "name",
            "start_idx": 0,
            "end_idx": 4,
            "vid": "826d0158bca6a981aee3e16f2e6cdf1d",
        }
    ],
    "rule_answers": [],
}
props = {
    "nebula_engine": {
        "ips": ["nebula-graphd-svc.resource"],
        "ports": ["9669"],
        "user": "anydata",
        "password": "***",
        "type": "nebula",
    },
    "opensearch_engine": {
        "ips": ["opensearch-master.resource"],
        "ports": ["9200"],
        "user": "admin",
        "password": "***",
        "type": "opensearch",
    },
    "aug_config": {"augmentation_field": [], "augmentation_kg_id": ""},
    "as_info": {"address": "", "port": "", "as_user_id": ""},
    "kg": [
        {
            "kg_id": "20",
            "fields": [
                "business",
                "district",
                "industry",
                "person",
                "project",
                "orgnization",
            ],
            "output_fields": ["person"],
        }
    ],
    "headers": {"userid": "7a5c9324-44cd-11ef-b4dc-663f094b27c2", "token": ""},
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
        "temperature": 0,
        "top_p": 0.95,
        "top_k": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "max_tokens": 600,
        "icon": "",
        "llm_id": "1855102927040024576",
        "llm_model_name": "Tome-pro-L20-tmp",
    },
    "skip_while_no_entities": True,
    "only2hop": False,
    "reranker_thr": -5,
    "kg_ontology": {
        "34": {
            "dbname": "u1391bcac9ce111ef80e37e7c7e76b338",
            "edge": [],
            "entity": [
                {
                    "alias": "别名",
                    "default_tag": "name",
                    "description": "",
                    "entity_id": "entity-d2eb6ce4-bc8a-4b30-be22-3c90f58814f4",
                    "fill_color": "rgba(84,99,156,1)",
                    "icon": "empty",
                    "icon_color": "#ffffff",
                    "index_default_switch": False,
                    "model": "",
                    "name": "alias",
                    "primary_key": ["name"],
                    "properties": [
                        {
                            "alias": "名称",
                            "data_type": "string",
                            "description": "",
                            "name": "name",
                        },
                        {
                            "alias": "别名",
                            "data_type": "string",
                            "description": "",
                            "name": "alias",
                        },
                    ],
                    "properties_index": ["name", "alias"],
                    "search_prop": "name",
                    "shape": "circle",
                    "size": "0.5x",
                    "source_type": "automatic",
                    "stroke_color": "rgba(84,99,156,1)",
                    "synonym": [],
                    "task_id": "1",
                    "text_color": "rgba(0,0,0,1)",
                    "text_position": "top",
                    "text_type": "adaptive",
                    "text_width": 15,
                    "vector_generation": [],
                    "x": 1066.5,
                    "y": 484.5,
                }
            ],
            "graph_name": "别名",
            "knw_id": 1,
            "quantized_flag": 0,
        },
        "20": {
            "dbname": "u259782b49c2411ef8a2116c2d54f5c3b",
            "edge": [
                {
                    "alias": "相关",
                    "colour": "rgba(198,79,88,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_iddb3b1ba6-5fea-4f9b-9dc6-41d43a4cf6a1",
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
                    "alias": "相关",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_idc8b0e064-4ccf-40ba-bbe4-98f5a84424ae",
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
                    "edge_id": "edge_idd11e17c7-a1c7-4a4a-9937-72e0d6ad489a",
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
                    "edge_id": "edge_id09bf25c6-9c7d-4531-b1ff-d108fc767ca6",
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
                    "edge_id": "edge_id0d1f05ed-98ac-487c-94ed-0225fb84a199",
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
                    "alias": "包含",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id4ed35abc-e961-47af-a050-c43d9e837b41",
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
                    "edge_id": "edge_idb04727d1-bbec-4830-a18c-fbf1513acb67",
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
                    "edge_id": "edge_idbbb1d916-6fd7-47ed-99c5-cc872c573434",
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
                    "edge_id": "edge_idaf85d818-c7da-496f-93dd-be87c2f6b8dc",
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
                    "alias": "属于",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id4a640566-5188-4382-b523-a3481ae972d5",
                    "index_default_switch": False,
                    "model": "",
                    "name": "person_2_business_belong_to",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["person", "person_2_business_belong_to", "business"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "下层分类",
                    "colour": "rgba(217,112,76,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id460d39d2-b3f6-4b37-8cfa-0cebfb816091",
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
                    "alias": "下层分类",
                    "colour": "rgba(217,83,76,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_idcfae0039-a309-478a-9077-0abc503f51c7",
                    "index_default_switch": False,
                    "model": "",
                    "name": "district_2_district_child",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["district", "district_2_district_child", "district"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "提及",
                    "colour": "rgba(42,144,143,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id51edf298-e6e5-468f-a1bc-e27cd91b0919",
                    "index_default_switch": False,
                    "model": "",
                    "name": "document_2_person_mention",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["document", "document_2_person_mention", "person"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "参与",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_idecf272ae-e8a8-4a66-867a-4fdbcbff74b3",
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
                    "alias": "所在",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id98c81460-6f49-4194-8252-5b8baca253ec",
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
                    "edge_id": "edge_id1ec49ca6-620e-493c-954f-772841270fdf",
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
                    "edge_id": "edge_id974741bf-b4b0-4e17-9860-3dd6dfa7630f",
                    "index_default_switch": False,
                    "model": "",
                    "name": "person_2_district_work_at",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["person", "person_2_district_work_at", "district"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "服务",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_idde243c46-96c7-441f-946f-56748e299edc",
                    "index_default_switch": False,
                    "model": "",
                    "name": "person_2_industry_service",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["person", "person_2_industry_service", "industry"],
                    "shape": "line",
                    "source_type": "manual",
                    "width": "0.25x",
                },
                {
                    "alias": "负责",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id81122d1c-6671-4a6f-83dc-9b7ac8683b0e",
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
                    "alias": "属于",
                    "colour": "rgba(145,192,115,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_id5b5e4c3c-db8a-44cc-ba5b-952c77723f4c",
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
                    "alias": "下层分类",
                    "colour": "rgba(216,112,122,1)",
                    "default_tag": "",
                    "description": "",
                    "edge_id": "edge_idcc74a78c-f720-4ddf-b176-0454369c5f1e",
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
                    "edge_id": "edge_id8c07d4c2-c1c7-44fe-90ac-f165863408da",
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
                    "edge_id": "edge_id75a4e34e-90de-4224-8f6d-502e39fb95e5",
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
                    "edge_id": "edge_ide4a32a61-238b-49a4-9bb1-8e5833f93ab2",
                    "index_default_switch": False,
                    "model": "",
                    "name": "document_2_project_mention",
                    "primary_key": [],
                    "properties": [],
                    "properties_index": [],
                    "relations": ["document", "document_2_project_mention", "project"],
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
                    "entity_id": "entity_id251d166e-13f1-4938-aba3-42faf3673e5d",
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
                    "entity_id": "entity_id133ff2b7-3599-485c-9e01-0efc887212e9",
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
                    "properties_index": ["name", "path"],
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
                    "vector_generation": ["name", "path"],
                    "x": 952.1512160493828,
                    "y": 258.28444787379965,
                },
                {
                    "alias": "专业领域",
                    "default_tag": "name",
                    "description": "专业领域是指员工的业务领域，通常与员工的职位和工作职责密切相关。",
                    "entity_id": "entity_id0f5b2c5a-7306-42d8-bbf7-fdca6f5d4b94",
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
                    "entity_id": "entity_id1b7727da-ba8d-4a0e-a10c-d9dcc25c9773",
                    "fill_color": "rgba(217,83,76,1)",
                    "icon": "graph-location",
                    "icon_color": "#ffffff",
                    "index_default_switch": False,
                    "model": "",
                    "name": "district",
                    "primary_key": ["code"],
                    "properties": [
                        {
                            "alias": "父级路径",
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
                    "properties_index": ["parent", "code", "name"],
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
                    "vector_generation": ["parent", "code", "name"],
                    "x": 1661.3772290809327,
                    "y": 820.4701646090533,
                },
                {
                    "alias": "客户",
                    "default_tag": "id",
                    "description": "企业商品服务的采购者",
                    "entity_id": "entity_id4e732109-6b6b-4ece-94ab-815433ceaacd",
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
                    "vector_generation": [],
                    "x": 1178.127572016461,
                    "y": 796.278120713306,
                },
                {
                    "alias": "行业",
                    "default_tag": "name",
                    "description": "生产同类产品/相同工艺/提供同类劳动服务的企业或组织的集合",
                    "entity_id": "entity_id318ea32f-0e37-4cfd-8fd0-76eed9efec74",
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
                    "properties_index": ["parent", "description", "name"],
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
                    "vector_generation": ["parent", "description", "name"],
                    "x": 967.1111111111111,
                    "y": 577.9722222222222,
                },
                {
                    "alias": "人员",
                    "default_tag": "name",
                    "description": "企业组织结构的员工/AnyShare系统中的用户",
                    "entity_id": "entity_idc1d95feb-c84d-4e99-bfbe-326773a24e9e",
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
                    "alias": "组织",
                    "default_tag": "name",
                    "description": "AnyShare系统中的组织结构及部门",
                    "entity_id": "entity_id71a6b557-8709-4fbc-8424-d93d6d777c31",
                    "fill_color": "rgba(216,112,122,1)",
                    "icon": "graph-connections",
                    "icon_color": "#ffffff",
                    "index_default_switch": False,
                    "model": "",
                    "name": "orgnization",
                    "primary_key": ["id"],
                    "properties": [
                        {
                            "alias": "父级路径",
                            "data_type": "string",
                            "description": "",
                            "name": "parent",
                        },
                        {
                            "alias": "组织邮箱",
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
                    "properties_index": ["parent", "name"],
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
                    "vector_generation": ["parent", "name"],
                    "x": 1258.1426611796983,
                    "y": 360.1848422496571,
                },
                {
                    "alias": "项目",
                    "default_tag": "name",
                    "description": "企业内部发生的一些重大的/有影响的事情，不同领域有不同含义，如法律领域，会将事件即为案件",
                    "entity_id": "entity_id8ca3a0ee-27df-40ec-a30f-4191ca82f2c9",
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
                    "entity_id": "entity_id435eb7da-7ab0-4b9d-a588-65febeeb6826",
                    "fill_color": "rgba(42,144,143,1)",
                    "icon": "graph-document",
                    "icon_color": "#ffffff",
                    "index_default_switch": False,
                    "model": "",
                    "name": "document",
                    "primary_key": ["doc_id"],
                    "properties": [
                        {
                            "alias": "size",
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
                            "alias": "文档ID",
                            "data_type": "string",
                            "description": "AS文档ID",
                            "name": "doc_id",
                        },
                    ],
                    "properties_index": ["version", "name"],
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
                    "vector_generation": ["version", "name"],
                    "x": 1720.205761316872,
                    "y": 267.6659807956105,
                },
            ],
            "graph_name": "AS专家搜索_离线数据",
            "knw_id": 1,
            "quantized_flag": 0,
        },
    },
}
emb_desc_config = {
    "34": {
        "alias": {
            "名称": {"en_name": "name", "description": ""},
            "别名": {"en_name": "alias", "description": ""},
        }
    },
    "20": {
        "custom_subject": {
            "主题别名": {"en_name": "alias", "description": ""},
            "描述": {"en_name": "description", "description": ""},
            "名称": {"en_name": "name", "description": ""},
        },
        "tag": {
            "名称": {"en_name": "name", "description": ""},
            "路径": {"en_name": "path", "description": ""},
        },
        "business": {"name": {"en_name": "name", "description": ""}},
        "district": {
            "父级路径": {"en_name": "parent", "description": ""},
            "区划代码": {"en_name": "code", "description": ""},
            "名称": {"en_name": "name", "description": ""},
        },
        "customer": {
            "名称": {"en_name": "name", "description": ""},
            "ID": {"en_name": "id", "description": ""},
        },
        "industry": {
            "父级路径": {"en_name": "parent", "description": ""},
            "描述": {"en_name": "description", "description": ""},
            "名称": {"en_name": "name", "description": ""},
        },
        "person": {
            "英文名": {"en_name": "english_name", "description": ""},
            "毕业院校": {"en_name": "university", "description": ""},
            "邮箱": {"en_name": "email", "description": ""},
            "联系方式": {"en_name": "contact", "description": ""},
            "职位": {"en_name": "position", "description": ""},
            "姓名": {"en_name": "name", "description": ""},
        },
        "orgnization": {
            "父级路径": {"en_name": "parent", "description": ""},
            "名称": {"en_name": "name", "description": ""},
        },
        "project": {"名称": {"en_name": "name", "description": ""}},
        "document": {
            "版本": {"en_name": "version", "description": "AS文档版本"},
            "文件名": {"en_name": "name", "description": ""},
        },
    },
}

# 定义函数
# questions = ["马超在哪上班", "田春华的工作地点"]
benchmark_path = (
    "/root/workspace/CognitiveAssistant-AT/agent_test/questions_user_110.csv"
)
benchmark_path = (
    "/root/workspace/CognitiveAssistant-AT/agent_test/questions_user_test.csv"
)
# benchmark_path = "/root/workspace/CognitiveAssistant-AT/agent_test/questions_user_test_bad_case.csv"
questions, gold_answers, gold_scores = csv_to_excel_and_extract_first_column(
    benchmark_path
)

# questions、gold_answers、llm_responses、gold_scores、llm_scores
width = 25


async def main():
    llm_responses = []
    llm_scores = []
    entity_queries = []

    for idx, question in enumerate(questions):
        gold_answer = gold_answers[idx]
        gold_score = gold_scores[idx]

        question = await cur_query_rewrite(question)
        inputs["query"] = question

        graph_rev = GraphRAGRetrival(
            inputs, props, resource, aug_config, emb_desc_config
        )
        await graph_rev.async_init()
        retrieval_response = await graph_rev.ado_graph_rag_retrival()

        # print(f"{'retrieval_response:':<{width}}{retrieval_response}\n")
        llm_content, focus_nodes = await format_retrieval_response(
            retrieval_response
        )  # 拼接prompt
        # breakpoint()
        llm_response = await ado_llm_ad(question, llm_content)  # prompt-template-run
        # llm_response = await ado_llm_completion(question, llm_content)  # completion
        llm_responses.append(llm_response)
        hit_nodes = await get_hit_nodes(llm_response, focus_nodes)
        llm_score = await compute_score(hit_nodes, gold_answer, gold_score)
        llm_scores.append(llm_score)

        print(f"\n----------question: {idx + 1}-----------")
        print(f"{'question:':<{width}}{question}")
        print(f"{'gold_answer:':<{width}}{gold_answer}")
        print(f"{'gold_score:':<{width}}{gold_score}")
        # print(f"{'llm_content:':<{width}}{llm_content}")
        print(f"{'llm_response:':<{width}}{llm_response}\n")
        print(f"{'llm_score:':<{width}}{llm_score}\n")

    data = {
        "questions": questions,
        "gold_answers": gold_answers,
        "llm_responses": llm_responses,
        "gold_scores": gold_scores,
        "llm_scores": llm_scores,
    }

    llm_scores = [0 if score == -1 else score for score in llm_scores]
    final_acc = round(sum(llm_scores) / len(questions), 4)
    print(f"final_acc:{final_acc}\n")

    df = pd.DataFrame(data)
    res_csv_file_path = f"/root/workspace/CognitiveAssistant-AT/agent_test/agent_res_{str(final_acc)}.xlsx"
    df.to_excel(res_csv_file_path, index=False)
    print(f"Data has been written to {res_csv_file_path}")


asyncio.run(main())
