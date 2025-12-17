import re

import jieba.posseg as pseg

nosense_value = [
    "__NULL__",
    "[]",
    "",
    None,
    "无",
    "/",
    "--",
    "——",
]  # 性值为这些时，表示该属性无意义，不参与拼接
# nosense_alias = ["id", "姓名", "用户密级", "专家角色", "用户角色", "用户状态", "区域代码", "区划代码", "层级", "level", "描述"]
# nosense_alias=['层级','ID','id','语言','照片','文件夹路径','编号','编码','案件号','简介','论文','学校编码','区划代码','业绩','描述','image','图片','案件文件目录', '客户类型全路径', '客户行业全路径']


async def score_slices(query, slices):
    query_word = set([word for word, flag in pseg.cut(query)])
    score_list = []
    for ref in slices:
        ref_word = set([word for word, flag in pseg.cut(ref)])
        common_word = query_word.intersection(ref_word)
        score_list.append(len(common_word) / len(query_word) if query_word != [] else 0)
    return score_list


async def split_sentences(text, length):
    sentences = re.findall(r"[^。！？,，]+[。！？,，]*", text)
    combined_sentences = []
    temp_sentence = ""
    for sentence in sentences:
        temp_sentence += sentence
        if len(temp_sentence) >= length:
            combined_sentences.append(temp_sentence)
            temp_sentence = ""
    if temp_sentence:
        combined_sentences.append(temp_sentence)
    return combined_sentences


async def top_n_indices(lst, n):
    sorted_indices = sorted(enumerate(lst), key=lambda x: x[1], reverse=True)
    top_indices = [index for index, value in sorted_indices[:n]]
    return top_indices


async def joint_info(
    entity_dict, query, long_text_length, nosense_alias, output_concept_en
):
    # name_text=entity_dict['default_property']['value']+' '+ entity_dict['alias']
    name_text = entity_dict["alias"] + " " + entity_dict["default_property"]["value"]
    desc_text = ""

    entity_tag = entity_dict["tags"][0]
    entity_nosense_alias = nosense_alias[entity_tag]
    used_alias = [entity_dict["default_property"]["alias"]] + entity_nosense_alias

    if entity_tag in output_concept_en and "※vid" not in entity_nosense_alias:
        name_text += f"(id是:{entity_dict['id']})"

    for prop in entity_dict["properties"][0]["props"]:
        if prop["alias"] not in used_alias and prop["value"] not in nosense_value:
            value_text = prop["value"]
            if len(str(prop["value"])) > long_text_length:
                slices = await split_sentences(prop["value"], 10)
                scores = await score_slices(query, slices)
                index_list = await top_n_indices(scores, 5)
                value_text = "".join([slices[i] for i in index_list])
            prop_text = prop["alias"] + "是" + str(value_text) + "；"
            desc_text += prop_text
    if desc_text != "":
        desc_text = desc_text[:-1] + "。"
    return name_text, desc_text


async def find_edges(all_edges, vid, not_allowed_edge):
    edges_finded = {}
    used_edge = []
    used_entity = []
    source_edge = [d for d in all_edges if d.get("source") == vid]
    target_edge = [d for d in all_edges if d.get("target") == vid]
    for j in range(len(source_edge)):
        if source_edge[j]["alias"] not in not_allowed_edge:
            used_entity.append(source_edge[j]["target"])
            used_edge.append(source_edge[j]["alias"])
            if source_edge[j]["alias"] + "0" not in edges_finded.keys():
                edges_finded[source_edge[j]["alias"] + "0"] = [
                    {source_edge[j]["target"]: []}
                ]
            else:
                edges_finded[source_edge[j]["alias"] + "0"].append(
                    {source_edge[j]["target"]: []}
                )
    for j in range(len(target_edge)):
        if target_edge[j]["alias"] not in not_allowed_edge:
            used_entity.append(target_edge[j]["source"])
            used_edge.append(target_edge[j]["alias"])
            if target_edge[j]["alias"] + "1" not in edges_finded.keys():
                edges_finded[target_edge[j]["alias"] + "1"] = [
                    {target_edge[j]["source"]: []}
                ]
            else:
                edges_finded[target_edge[j]["alias"] + "1"].append(
                    {target_edge[j]["source"]: []}
                )
    return edges_finded, set(used_edge), set(used_entity)


async def aggregation(task, query, output_concept, long_text_length=256):
    entity_recall_vids = task.get_attr("entity_recall_vids")
    neighbor_recall_rels = task.get_attr("neighbor_recall_rels")
    path_sim_answers = task.get_attr("path_sim_answers")
    nosense_alias = task.get_attr("nosense_alias", [])
    output_concept_map = task.get_attr("output_concept_map")

    output_concept_en = output_concept
    output_concept = output_concept_map[output_concept[0]]
    nodes = {item["id"]: item for item in entity_recall_vids}
    edges = [item for sublist in neighbor_recall_rels.values() for item in sublist]
    new_keys = {"src_vid": "source", "dst_vid": "target", "rel_alias": "alias"}
    edges = [
        {
            new_keys[old_key]: value
            for old_key, value in d.items()
            if old_key in new_keys
        }
        for d in edges
    ]
    path_sim_text = []
    if path_sim_answers:
        for i in range(len(path_sim_answers["answers"])):
            path_sim_text.append(path_sim_answers["answers"][i]["answer"])
            subgraph_nodes = path_sim_answers["answers"][i]["subgraph"]["nodes"]
            subgraph_edges = path_sim_answers["answers"][i]["subgraph"]["edges"]
            for j in range(len(subgraph_nodes)):
                nodes[subgraph_nodes[j]["id"]] = subgraph_nodes[j]
            for j in range(len(subgraph_edges)):
                subgraph_edge = subgraph_edges[j]
                edge = {
                    "source": subgraph_edge["source"],
                    "target": subgraph_edge["target"],
                    "alias": subgraph_edge["alias"],
                }
                if edge not in edges:
                    edges.append(edge)
    for index, (key, value) in enumerate(nodes.items()):
        nodes[key]["properties"][0]["props"] = sorted(
            nodes[key]["properties"][0]["props"], key=lambda x: x["name"]
        )
        if list(nodes[key]["default_property"].keys()) != ["name", "value", "alias"]:
            temp = nodes[key]["default_property"]
            nodes[key]["default_property"] = {
                "name": temp["n"],
                "value": temp["v"],
                "alias": temp["a"],
            }

    output_entities = []
    for index, (key, value) in enumerate(nodes.items()):
        if value["alias"] in output_concept:
            # if value['tags'][0] in output_concept:
            output_entities.append(value["id"])

    output_length = len(output_entities)
    output_text_list = [[] for _ in range(output_length)]
    output_edges_list = [[] for _ in range(output_length)]
    output_nodes_list = [[output_entities[i]] for i in range(output_length)]
    output_paths_list = [{} for _ in range(output_length)]

    for i in range(output_length):
        path, used_edge, used_entity = await find_edges(edges, output_entities[i], [])
        output_paths_list[i] = path
        not_allowed_edge = used_edge
        output_nodes_list[i] += used_entity
        for index, (key, value) in enumerate(output_paths_list[i].items()):
            for j in range(len(value)):
                path, used_edge, used_entity = await find_edges(
                    edges, list(value[j].keys())[0], not_allowed_edge
                )
                output_paths_list[i][key][j][list(value[j].keys())[0]] = path
                output_nodes_list[i] += used_entity
        text = ""
        name, desc = await joint_info(
            nodes[output_entities[i]],
            query,
            long_text_length,
            nosense_alias,
            output_concept_en,
        )
        text += name
        text += "："
        text += desc
        for index, (key, value) in enumerate(output_paths_list[i].items()):
            key_text_list = []
            for j in range(len(value)):
                for index0, (key0, value0) in enumerate(value[j].items()):
                    temp0_text = ""
                    for index1, (key1, value1) in enumerate(value0.items()):
                        all_keys = [key for dictionary in value1 for key in dictionary]
                        all_keys_info = [
                            await joint_info(
                                nodes[key],
                                query,
                                long_text_length,
                                nosense_alias,
                                output_concept_en,
                            )
                            for key in all_keys
                        ]
                        all_keys_info_merge = [
                            name0 if desc0 == "" else name0 + "（" + desc0 + "）"
                            for (name0, desc0) in all_keys_info
                        ]
                        all_keys_text = "、".join(all_keys_info_merge)
                        temp1_text = (
                            all_keys_text + " " + key1[:-1]
                            if key1[-1:] == "1"
                            else key1[:-1] + " " + all_keys_text
                        )
                        temp0_text += temp1_text
                        temp0_text += "。"
                    name0, desc0 = await joint_info(
                        nodes[key0],
                        query,
                        long_text_length,
                        nosense_alias,
                        output_concept_en,
                    )
                    value0_text = (
                        name0 + "【" + desc0 + temp0_text + "】"
                        if len(desc0 + temp0_text)
                        else name0
                    )
                    key_text_list.append(value0_text)
            key_text = "、".join(key_text_list)
            key_text = (
                key_text + " " + key[:-1] + "。"
                if key[-1:] == "1"
                else key[:-1] + " " + key_text + "。"
            )
            text += key_text
        output_text_list[i] = text
    return output_text_list, output_nodes_list, path_sim_text, nodes


# path='tests/朱方方代理过哪些案件/'
# path='tests/在杭州上班的律师有谁/'
# path='tests/在上海市工作的代理过反垄断案件的律师有谁（2-hop）/'
# query='在上海市工作的代理过反垄断案件的律师有谁'
# path='tests/朱方方代理过哪些案件/'
# query='朱方方代理过哪些案件'

# path='tests/在杭州上班的律师有谁/'
# path='tests/在上海市工作的代理过反垄断案件的律师有谁（2-hop）/'
# path='tests/属于烟草制品业的案件有哪些（2-hop）/'

# with open(path+'entity_recall_vids.json', 'r') as file:
#     entity_recall_vids = json.load(file)
# with open(path+'neighbor_recall_rels.json', 'r') as file:
#     neighbor_recall_rels = json.load(file)
# with open(path+'path_sim_answers.json', 'r') as file:
#     path_sim_answers = json.load(file)

# output_concept=['律师']#输出的实体类
# long_text_length = 50 # 属性值长度大小在之上则作切分保留操作
# text_list,nodes_list,path_sim_text,nodes=asyncio.run(aggregation(entity_recall_vids,neighbor_recall_rels,path_sim_answers,query))
