import re
import asyncio
import datetime
from typing import List, Dict, Any
from app.common.stand_log import StandLogger
from app.resources.executors.graph_rag_block.strategy import RetrieveStrategy
from app.resources.executors.graph_rag_block.task import Task
from .retrieve_metadata import GraphRAGRetrieveData
from .retrieve_client import GraphRetrieveClient
from .ecoindex_client import EcoIndexClient

EMPTY_LIST = ["", "__NULL__", "[]"]
SELF_CIRCULATION_ENTITYES = ["industry", "tag", "product", "orgnization", "district"]


class RetrieveProcessor:
    def __init__(self, retrieve_strategy: RetrieveStrategy) -> None:
        self.retrieve_source_config = retrieve_strategy.retrieve_source_config
        self.data_sources_field = retrieve_strategy.data_sources_field
        self.long_context_field = retrieve_strategy.long_context_field
        self.output_field = retrieve_strategy.output_field
        self.retrieve_client = GraphRetrieveClient(self.retrieve_source_config)
        self.ecoindex_client = EcoIndexClient()
        self.is_as_data: bool = False
        self.need_ASauth_filter_concepts = []

    async def ajaccard_similarity(self, slices, query):
        jaccard_similarity_scores = []
        set_query = set(query)
        for slice in slices:
            set_slice = set(slice)
            len_intersection = len(set_query.intersection(set_slice))
            len_union = len(set_query.union(set_slice))

            # 计算Jaccard相似度
            similarity_score = len_intersection / len_union
            jaccard_similarity_scores.append(similarity_score)
        return jaccard_similarity_scores

    async def afilter_response_data(
        self, query: str, response_data, entity_num_for_neighbor_search=40
    ) -> Dict:
        vertexs_scores = []
        vertexs = response_data["full_text"]["vertexs"]
        focus_list_indices = []

        # 单独计算属性
        entity_prop_length_map = {}
        sequential_tags = []
        vertexs_prop_collections = []

        for idx, vertex in enumerate(vertexs):
            for focus_on_type in self.output_field:
                if focus_on_type in vertex["tags"]:
                    focus_list_indices.append(idx)

            cur_vertex_tag = vertex["tags"][0]
            if cur_vertex_tag not in entity_prop_length_map:
                entity_prop_length_map[cur_vertex_tag] = len(
                    vertex["properties"][0]["props"]
                )

            sequential_tags.append(cur_vertex_tag)
            for prop in vertex["properties"][0]["props"]:
                vertexs_prop_collections.append(prop["value"])
        assert len(vertexs_prop_collections) == sum(
            entity_prop_length_map[tag] for tag in sequential_tags
        ), "tag_length and vertexs_prop_collections do not match."
        # props_scores = await self.reranker_model.ado(slices=vertexs_prop_collections, query=query)  # reranker模型
        props_scores = await self.ajaccard_similarity(
            slices=vertexs_prop_collections, query=query
        )  # jaccard_similarity
        start_index = 0
        vertexs_scores = []
        for tag in sequential_tags:
            cur_tag_length = entity_prop_length_map[tag]
            cur_tag_scores = max(
                props_scores[start_index : start_index + cur_tag_length]
            )
            vertexs_scores.append(cur_tag_scores)
            start_index += cur_tag_length

        # 计算相似度
        sorted_indices = sorted(
            range(len(vertexs_scores)), key=lambda x: vertexs_scores[x], reverse=True
        )[
            :entity_num_for_neighbor_search
        ]  # entity_num_for_neighbor_search 过滤之后需要保留多少个实体去进行邻居查询
        filtered_response_data = {
            "full_text": {
                "count": response_data["full_text"]["count"],
                "execute_time": "0.0",
                "vertexs": [],
            }
        }
        for idx in sorted_indices:
            if vertexs_scores[idx] >= 0.1:
                filtered_response_data["full_text"]["vertexs"].append(vertexs[idx])
        for indice in focus_list_indices:
            if indice not in sorted_indices and vertexs_scores[indice] >= 0.1:
                filtered_response_data["full_text"]["vertexs"].append(vertexs[indice])
        del response_data
        return filtered_response_data

    async def aupdate_circulation_entity(
        self, hits: List[Dict[int, Any]]
    ) -> List[Dict[int, Any]]:
        hits = hits["full_text"]["vertexs"]
        updates_hits = []

        circulation_entity_vids = set()
        kg_name = ""
        for hit in hits:
            if hit["tags"][0] in SELF_CIRCULATION_ENTITYES:
                if not kg_name:
                    kg_name = hit["kg_name"]
                circulation_entity_vids.add(hit["id"])
            else:
                updates_hits.append(hit)

        # 自循环的实体再去进行一次邻居搜索
        if (
            len(list(circulation_entity_vids)) != 0
        ):  # 模糊搜索匹配到答案，才进行邻居搜索
            circulation_vids = list(circulation_entity_vids)
            response_data = await self.retrieve_client.aunified_search(
                vids=circulation_vids,
                recall_type="neighbor_recall",
                concept_field=self.data_sources_field,
            )  # 获取所有节点的邻居节点和关系
            res = response_data["res"]
            if res["nodes"]:
                for vertice in res["nodes"]:
                    vertice.update({"kg_name": kg_name})
                    updates_hits.append(vertice)
        return updates_hits

    async def afilter_entity_user_disabled(
        self, hits: List[Dict[int, Any]]
    ) -> List[Dict[int, Any]]:
        if not hits:
            return [], [], []
        filtered_hits = []
        filtered_vids = []
        useless_vids = []
        for hit in hits:
            continue_process = True
            for _, prop in enumerate(hit["properties"][0]["props"]):
                if prop.get("name") == "status" and prop.get("value") == "disabled":
                    continue_process = False
                    useless_vids.append(hit["id"])
                    break
            if continue_process:
                filtered_hits.append(hit)
                filtered_vids.append(hit["id"])
        return filtered_hits, filtered_vids, useless_vids

    async def aparse_neighbor_response(self, edges, disabled_vids):
        neighbor_relationships = []
        edges = edges

        for edge_info in edges:  # 整理每一条edge，输出neighbor_relationships
            rel_type = edge_info["class_name"]
            rel_alias = edge_info["alias"]

            src_vid = edge_info["source"]  # source vertex id
            dst_vid = edge_info["target"]  # destination vertex id
            if src_vid in disabled_vids or dst_vid in disabled_vids:
                continue

            neighbor_relationships.append(
                {
                    "src_vid": src_vid,  # source_vid
                    "dst_vid": dst_vid,  # target_vid
                    "rel_type": rel_type,
                    "rel_alias": rel_alias,
                }
            )

        new_neighbor_relationships = {}
        for item in neighbor_relationships:
            if item["src_vid"] not in new_neighbor_relationships:
                new_neighbor_relationships[item["src_vid"]] = []
            new_neighbor_relationships[item["src_vid"]].append(item)
        return new_neighbor_relationships

    async def afilter_response_data_by_output_concept(self, all_hits, output_concept):
        res_vids = []
        for hit in all_hits:
            alias = hit["tags"][0]
            if alias not in output_concept:
                res_vids.append(hit["id"])
        return res_vids

    async def aget_single_entity_text(self, hit):
        formatted_entity_info = {}

        # 获取 vid、hit_value、v_alias、vtag
        vid = hit["id"]
        info = hit["default_property"]
        if "v" in info:
            hit_value = info["v"]
        else:
            hit_value = info["value"]
        v_alias = hit["alias"]  # concept中文名如：行业、人员、地区
        vtag = hit["properties"][0][
            "tag"
        ]  # concept的英文名如：industry、person、district

        # 获取raw_text
        raw_text_prefix = f"{v_alias} {hit_value} 的 "
        raw_text = raw_text_prefix
        extra_props = ""
        props = hit["properties"][0]["props"]
        sorted_props = sorted(props, key=lambda item: item["name"])
        for _, prop in enumerate(sorted_props):
            prop_name = prop["name"]
            prop_value = prop["value"]
            prop_alias = prop["alias"]
            if prop_value in EMPTY_LIST:
                continue
            if prop_name not in [
                "id",
                "name",
                "level",
                "is_expert",
                "user_securtiy_level",
                "status",
                "code",
            ]:
                extra_props += f"{prop_alias} 是 {prop_value}；"
        if extra_props:
            raw_text += extra_props
        else:
            raw_text = ""

        formatted_entity_info = {
            "hit_value": hit_value,
            "vtag": vtag,
            "v_alias": v_alias,
            "prop_info": raw_text,
        }
        return vid, formatted_entity_info

    async def aparse_entity_hits_info(self, all_hits) -> Dict:
        gathered_vid_info = {}
        for hit in all_hits:
            vid, formatted_entity_info = await self.aget_single_entity_text(hit)
            gathered_vid_info[vid] = formatted_entity_info
        return gathered_vid_info

    async def aget_retrieve_datas(
        self, query, neighbor_relationships, gathered_vid_info
    ):
        retrieve_datas = []
        if neighbor_relationships:
            for src_vid, rel_list in neighbor_relationships.items():
                slice_text_info = ""
                src_entity = gathered_vid_info[src_vid]
                src_vid_prop_info = src_entity["prop_info"]
                src_vid_hit_value = src_entity["hit_value"]
                src_vid_tag_cn = src_entity["v_alias"]
                src_vid_tag_en = src_entity["vtag"]

                slice_text_info = src_vid_prop_info
                rel_text_info_list = []
                for rel_item in rel_list:
                    dst_entity_id = rel_item["dst_vid"]
                    dst_entity = gathered_vid_info[dst_entity_id]
                    dst_vid_prop_info = dst_entity["prop_info"]
                    dst_vid_rel_alias = dst_entity["v_alias"]
                    dst_vid_value = dst_entity["hit_value"]

                    rel_alias = rel_item["rel_alias"]
                    if not dst_vid_prop_info:
                        rel_text = f"{src_vid_tag_cn} {src_vid_hit_value} {rel_alias} {dst_vid_rel_alias} {dst_vid_value}。"
                    else:
                        rel_text = f"{src_vid_tag_cn} {src_vid_hit_value} {rel_alias} {dst_vid_rel_alias} {dst_vid_value}，其中，{dst_vid_prop_info}。"
                    rel_text_info_list.append(rel_text)

                slice_text_info += " ".join(sorted(rel_text_info_list, reverse=True))
                slice_text_info = (
                    slice_text_info.replace("的 父级路径 是", "属于")
                    .replace("父级路径 是", "属于")
                    .replace("；。", "。")
                    .replace("；属于", "，属于")
                )

                # print("---"*5)
                # print(slice_text_info)
                # print("---"*5)

                retrieve_data = GraphRAGRetrieveData(
                    retrieve_string=query,
                    src_entity_id=src_vid,
                    dst_entity_id=dst_entity_id,
                    entity_type=src_vid_tag_en,
                    entity_type_zh=src_vid_tag_cn,
                    entity_name=src_vid_hit_value,
                    raw_text=slice_text_info,
                )
                retrieve_datas.append(retrieve_data)
        else:  # 如果没有邻居信息
            for src_vid, src_entity_info in gathered_vid_info.items():
                src_vid_hit_value = src_entity_info["hit_value"]
                slice_text_info = src_entity_info["prop_info"]
                src_vid_tag_en = src_entity_info["vtag"]
                src_vid_tag_cn = src_entity_info["v_alias"]

                retrieve_data = GraphRAGRetrieveData(
                    retrieve_string=query,
                    src_entity_id=src_vid,
                    entity_type=src_vid_tag_en,
                    entity_type_zh=src_vid_tag_cn,
                    entity_name=src_vid_hit_value,
                    raw_text=slice_text_info,
                )
            retrieve_datas.append(retrieve_data)

    async def aadd_extra_time_info(
        self, hits: List[Dict[int, Any]]
    ) -> List[Dict[int, Any]]:
        if not hits:
            return []

        for hit in hits:
            new_props = []
            for _, prop in enumerate(hit["properties"][0]["props"]):
                new_prop = prop
                prop_value = prop.get("value")
                prop_name = prop.get("name")
                date_pattern = r"\b\d{4}-\d{2}-\d{2}\b"
                matches = re.findall(date_pattern, prop_value)
                match_res = []
                for match in matches:
                    match_res.append(match)
                if match_res:  # 对时间做处理
                    now = datetime.now()
                    now_time_str = now.strftime("%Y-%m-%d %H:%M:%S")
                    cur_date_info = now_time_str.strip().split(" ")[0]
                    end_date = datetime.strptime(cur_date_info, "%Y-%m-%d")
                    match_str = match_res[
                        0
                    ]  # 假设只有一个时间，如果有多个时间，需要另外处理
                    start_date = datetime.strptime(match_str, "%Y-%m-%d")
                    years = end_date.year - start_date.year
                    months = end_date.month - start_date.month

                    if months < 0:
                        years -= 1
                        months += 12
                    match_str += f"(距今已有{years}年{months}个月)"
                else:
                    match_str = prop_value
                new_prop[prop_name] = match_str
                new_prop["value"] = match_str
                new_props.append(new_prop)
            hit["properties"][0]["props"] = new_props
        return hits

    async def aauth_filter_for_AS(
        self, hits: List[Dict[int, Any]], as_auth_info: Dict[str, str]
    ):
        if not hits:
            return [], []

        filter_hits = []
        useless_vids = []
        need_filter_docids = {"document": [], "wikidoc": []}
        docids_vid_map = {}  # docid到vid的映射

        for hit in hits:
            if hit["tags"][0] in self.need_ASauth_filter_concepts:
                all_props = hit["properties"][0]["props"]
                hit_doc_id_value = next(
                    (item["value"] for item in all_props if item["name"] == "doc_id"),
                    None,
                )
                if not hit_doc_id_value:
                    StandLogger.error(
                        f"{hit['tags'][0]}:{hit['id']} has not attribute 'doc_id'."
                    )
                need_filter_docids[hit["tags"][0]].append(hit_doc_id_value)
                docids_vid_map[hit_doc_id_value] = hit["id"]

        response = await self.ecoindex_client.auth_filter(
            need_filter_docids["document"],
            need_filter_docids["wikidoc"],
            **as_auth_info,
        )
        useless_vids = [
            docids_vid_map[item["id"]] for item in response if not item["permission"]
        ]
        filter_hits = [hit for hit in hits if hit["id"] not in useless_vids]
        return filter_hits, useless_vids

    async def get_filter_concepts(self, task, props):
        kg_id = task.get_attr("kg_id")
        entities = props["kg_ontology"][kg_id]["entity"]
        need_filter_concepts = []
        for entity in entities:
            if entity["name"] in ["document", "wikidoc"]:
                entity_properties = [item["name"] for item in entity["properties"]]
                if "need_preview_perm" in entity_properties:
                    need_filter_concepts.append(entity["name"])
        return need_filter_concepts

    async def log_info(self, hits):
        log_res = {}
        for hit in hits:
            log_res[hit["id"]] = (
                hit["default_property"]["v"]
                if "v" in hit["default_property"]
                else hit["default_property"]["value"]
            )
        return log_res

    async def ado_retrieve(self, task: Task, props: Dict, as_auth_info: Dict = None):
        # 判断是否是as的数据源，如果是，获取需要权限过滤的concept（目前as中只有wikidoc和document需要，所以直接指定）
        if as_auth_info and all(info for info in as_auth_info.values()):
            self.is_as_data = True
            self.need_ASauth_filter_concepts = await self.get_filter_concepts(
                task, props
            )  # 这里直接指定也和提供的鉴权接口相关，鉴权接口只支持doc和wikidoc

        # 获取用于实际检索的query
        entity_extraction_query = task.get_attr("entity_extraction_query", "")
        query = (
            entity_extraction_query
            if entity_extraction_query
            else task.get_origin_query
        )
        disabled_vids = []

        # step1：实体并行召回
        if self.long_context_field:
            long_context_field_list = [
                key for key, _ in self.long_context_field.items()
            ]
        else:
            long_context_field_list = []
        general_data_sources_field = [
            item
            for item in self.data_sources_field
            if item not in long_context_field_list
        ]
        if not general_data_sources_field:
            long_context_field_list = self.data_sources_field  # output_field=["lawyer"]、field=["lawyer"]、long_text_mark=["case", "lawyer"]
        entity_recall_tasks, entity_recall_results = [], []

        if long_context_field_list:
            if general_data_sources_field:
                entity_recall_tasks.append(
                    asyncio.create_task(
                        self.retrieve_client.aunified_search(
                            query=query,
                            vids="",
                            recall_type="entity_recall",
                            concept_field=general_data_sources_field,
                        )
                    )
                )
            for long_context_field in long_context_field_list:
                entity_size = self.long_context_field[long_context_field]
                entity_recall_tasks.append(
                    asyncio.create_task(
                        self.retrieve_client.aunified_search(
                            query=query,
                            vids="",
                            recall_type="entity_recall",
                            concept_field=[long_context_field],
                            entity_size=entity_size,
                        )
                    )
                )
            retrieve_results = await asyncio.gather(
                *entity_recall_tasks, return_exceptions=True
            )
            for _, entity_recall in enumerate(retrieve_results):  # list
                entity_recall_results.append(entity_recall)
        else:
            entity_recall = await self.retrieve_client.aunified_search(
                query=query,
                vids="",
                recall_type="entity_recall",
                concept_field=general_data_sources_field,
            )
            entity_recall_results.append(entity_recall)

        all_hits = []
        for entity_recall in entity_recall_results:
            if isinstance(entity_recall, dict):
                updated_entity_recall_results = entity_recall
                all_hits.extend(entity_recall["full_text"]["vertexs"])
        if not all_hits:
            task.set_attr("neighbor_recall_rels", {})
            task.set_attr("entity_recall_vids", [])
            return "entity_neighbor_recall"
        else:
            updated_entity_recall_results["full_text"]["vertexs"] = all_hits

        # step2: 过滤【禁用用户】和【document、wikidoc实体】，当前过滤【禁用用户】逻辑只针对as图谱
        if self.is_as_data:
            all_hits, useless_vids = await self.aauth_filter_for_AS(
                all_hits, as_auth_info
            )
            disabled_vids.extend(useless_vids)
        (
            entity_recall_filtered_hits,
            entity_recall_filtered_vids,
            useless_vids,
        ) = await self.afilter_entity_user_disabled(
            hits=all_hits
        )  # step3: 过滤器，过滤掉禁用用户
        # entity_recall_vids_for_neighbor = await self.afilter_response_data_by_output_concept(entity_recall_filtered_hits, self.output_field)   #（jctd场景可以打开这行代码）如果是找律师，则不再查询律师的neighbor
        entity_recall_vids_for_neighbor = entity_recall_filtered_vids
        disabled_vids.extend(useless_vids)

        # step3: 邻居召回
        if not entity_recall_vids_for_neighbor:
            neighbor_recall_filtered_hits = []
            neighbor_relationships = []
        else:
            neighbor_recall = await self.retrieve_client.aunified_search(
                vids=entity_recall_vids_for_neighbor,
                recall_type="neighbor_recall",
                concept_field=self.data_sources_field,
            )
            if (
                not neighbor_recall["res"]["nodes"]
                or not neighbor_recall["res"]["edges"]
            ):
                neighbor_recall_filtered_hits = []
                neighbor_relationships = []
            else:
                neighbor_recall_hits = neighbor_recall["res"]["nodes"]
                if self.is_as_data:
                    neighbor_recall_hits, useless_vids = await self.aauth_filter_for_AS(
                        neighbor_recall_hits, as_auth_info
                    )
                    disabled_vids.extend(useless_vids)
                (
                    neighbor_recall_filtered_hits,
                    _,
                    useless_vids,
                ) = await self.afilter_entity_user_disabled(neighbor_recall_hits)
                disabled_vids.extend(useless_vids)
                neighbor_relationships = neighbor_recall["res"]["edges"]

        # step4: 整理这两个步骤中节点和边的信息
        all_hits = []
        all_hits.extend(entity_recall_filtered_hits)
        all_hits.extend(neighbor_recall_filtered_hits)
        # all_hits = await self.aadd_extra_time_info(all_hits) # 时间信息转换，eg. 结案时间是2018-12-31 (距今已有5年9个月)

        # 打印原始接口日志信息
        full_text_search_entity_log = await self.log_info(entity_recall_filtered_hits)
        neighbors_entity_log = await self.log_info(neighbor_recall_filtered_hits)
        print(f"----full_text_search_entity_log----\n{full_text_search_entity_log}")
        print(f"----neighbors_entity_log----\n{neighbors_entity_log}")

        neighbor_relationships = await self.aparse_neighbor_response(
            edges=neighbor_relationships, disabled_vids=disabled_vids
        )  # 整理邻居节点和关系
        task.set_attr("neighbor_recall_rels", neighbor_relationships)
        task.set_attr("entity_recall_vids", all_hits)
        return "entity_neighbor_recall"
