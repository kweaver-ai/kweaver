import os
import re
import pandas as pd
import numpy as np
import jieba.posseg as pseg

from app.common.config import Config
from app.resources.executors.graph_rag_block.task import Task
from app.resources.executors.graph_rag_block.strategy import AggregationStrategy
from .aggregation import aggregation


class AggregationProcessor:
    def __init__(self, aggregation_strategy: AggregationStrategy) -> None:
        self.aggregation_strategy: AggregationStrategy = aggregation_strategy
        self.long_text_length = aggregation_strategy.long_text_length
        self.output_field = aggregation_strategy.output_field

    async def cur_query_rewrite(self, query: str) -> str:
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
                query_text = query_text.replace(match, name_map_es[match.lower()])
        return query_text

    async def filter_agg_texts_for_as(self, query: str, agg_text_list, agg_vids_list):
        query_words = pseg.cut(query)
        query_noun = ""
        for word in query_words:
            if word.word.lower() in [
                "anyshare",
                "anydata",
                "anyfabric",
                "anyrobot",
                "anybackup",
            ]:
                query_noun = word.word.lower()
                break
        filter_agg_text_list = []
        filter_agg_vids_list = []
        for idx, agg_text in enumerate(agg_text_list):
            if query_noun in agg_text.lower():
                filter_agg_text_list.append(agg_text)
                filter_agg_vids_list.append(agg_vids_list[idx])
        return filter_agg_text_list, filter_agg_vids_list

    async def filter_agg_texts_for_entity(
        self, task: Task, agg_text_list, agg_vids_list
    ):
        entity_extraction_query = task.get_attr("entity_extraction_query", "")
        if not entity_extraction_query:
            return agg_text_list, agg_vids_list

        origin_query = task.get_origin_query
        if any(
            [entity_extraction_query[-1] == punctuation for punctuation in ["?", "？"]]
        ):
            entity_extraction_query = entity_extraction_query[:-1]
        if any([origin_query[-1] == punctuation for punctuation in ["?", "？"]]):
            origin_query = origin_query[:-1]
        if origin_query == entity_extraction_query:
            entity_extraction_query = []
        else:
            entity_extraction_query = [
                s for s in entity_extraction_query.split() if len(s) <= 10
            ]

        entity_extraction_query = list(set(entity_extraction_query))
        res, vid_res = [], []
        # STOP_WORDS_FILE = "app/resources/executors/graph_rag_block/stop_words.txt"  # 去除停用词
        STOP_WORDS_FILE = os.path.join(
            Config.app.app_root, "resources/executors/graph_rag_block/stop_words.txt"
        )
        stop_words_list = []
        with open(STOP_WORDS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                stop_words_list.append(line.strip())
        entity_extraction_query = [
            item for item in entity_extraction_query if item not in stop_words_list
        ]

        print(
            f"----------entity_extraction_query: {entity_extraction_query}-----------"
        )
        if entity_extraction_query:
            for idx, agg_text in enumerate(agg_text_list):
                entity_extraction_query = list("".join(entity_extraction_query))
                total_chars = len(entity_extraction_query)
                matched_chars = sum(
                    1 for char in entity_extraction_query if char in agg_text
                )

                if matched_chars / total_chars <= 0.7:
                    continue

                # if not all(item in agg_text for item in entity_extraction_query):  # 只有包含了全部信息的slice才会进行下一步的处理
                #     continue

                if len(agg_text) <= 500:
                    res.append(agg_text)
                    vid_res.append(agg_vids_list[idx])
                else:
                    sub_res = []
                    texts = agg_text.split("、")

                    # 计算jaccard分数，得分最高的slice在前面
                    text_scores = []
                    for text in texts:
                        text_score = []
                        for query in entity_extraction_query:
                            set1 = set(text)
                            set2 = set(query)
                            intersection = set1.intersection(set2)
                            union = set1.union(set2)
                            sub_score = (
                                len(intersection) / len(union) if len(union) else 0.0
                            )
                            text_score.append(sub_score)
                        text_scores.append(sum(text_score))
                    text_scores[0] = len(entity_extraction_query)

                    indices = np.arange(len(text_scores))
                    sorted_indices = np.lexsort((indices, -np.array(text_scores)))

                    for index in sorted_indices:
                        if not text_scores[index]:
                            break
                        sub_res.append(texts[index])
                    new_text = "、".join(sub_res)
                    res.append(new_text[:500])  # 在这里进行截断
                    vid_res.append(agg_vids_list[idx])
            return res, vid_res
        else:
            return agg_text_list, agg_vids_list

    async def ado_aggregation(self, task: Task):
        query = task.get_origin_query
        agg_text_list, agg_vids_list, path_sim_texts, vids_pool = await aggregation(
            task, query, self.output_field, self.long_text_length
        )

        updated_output_field_2th = task.get_attr("updated_output_field_2th", "")
        if updated_output_field_2th and not agg_text_list:
            self.output_field = updated_output_field_2th
            agg_text_list, agg_vids_list, path_sim_texts, vids_pool = await aggregation(
                task, query, self.output_field, self.long_text_length
            )

        cur_query = await self.cur_query_rewrite(
            query
        )  # 针对as场景，对as,ad,af, ar, ab进行重写和过滤
        agg_text_list, agg_vids_list = await self.filter_agg_texts_for_as(
            query=cur_query, agg_text_list=agg_text_list, agg_vids_list=agg_vids_list
        )
        agg_text_list, agg_vids_list = await self.filter_agg_texts_for_entity(
            task=task, agg_text_list=agg_text_list, agg_vids_list=agg_vids_list
        )

        aggregation_res_list = []
        for idx, raw_text in enumerate(agg_text_list):
            if raw_text:
                entity_infos = []
                for agg_vid in agg_vids_list[idx]:
                    entity_info = vids_pool[agg_vid]
                    if "class_name" not in entity_info:
                        entity_info["class_name"] = entity_info["tags"][0]
                    entity_infos.append(entity_info)
                agg_text_item = {"content": raw_text, "entity_infos": entity_infos}
                # agg_text_item = {
                #         "object_id": entity_info["id"],
                #         "doc_name": entity_info["default_property"]["value"] if "value" in entity_info["default_property"] else entity_info["default_property"]["v"],
                #         "ext_type": entity_info["tags"][0],
                #         "parent_path": entity_info.get("kg_name", "") ,
                #         "size": 0,
                #         "doc_id": entity_info["id"],
                #         "content": raw_text,
                #         "retrieve_source_type": "KG",
                #         "embedding": [],
                #         "slices": [
                #             {
                #                 "id": entity_info["id"],
                #                 "no": idx,
                #                 "content": raw_text,
                #                 "embedding": [],
                #                 "pages": []
                #             }
                #         ]
                #     }

                aggregation_res_list.append(agg_text_item)

        aggregation_res = pd.DataFrame(aggregation_res_list)
        task.set_attr("agg_res", aggregation_res)
        task.set_attr("agg_path_sim_texts", path_sim_texts)
