import pandas as pd

from app.driven.external.rerank_client import RerankClient
from app.resources.executors.graph_rag_block.task import Task
from app.resources.executors.graph_rag_block.strategy import RankingStrategy


class RankingProcessor:
    def __init__(self, ranking_strategy: RankingStrategy) -> None:
        self.reranker_cossim_threshold = ranking_strategy.reranker_cossim_threshold
        self.reranker_client = RerankClient()

        self.ranked_res = None
        self.ranked_agg_path_sim_texts = None

    async def rough_ranking(self, query, agg_res):
        # char_filter = CharacterFilter()
        # rough_ranked_data = await char_filter.ado_character_filter(query, agg_res)
        rough_ranked_data = agg_res
        return rough_ranked_data

    async def accuracy_ranking(self, query, rough_ranked_data):
        if isinstance(rough_ranked_data, list):
            scores = await self.reranker_client.ado_rerank(rough_ranked_data, query)
            accuracy_ranked_data = [
                x
                for _, x in sorted(
                    zip(scores, rough_ranked_data),
                    key=lambda item: item[0],
                    reverse=True,
                )
            ]

        elif (
            isinstance(rough_ranked_data, pd.DataFrame)
            and rough_ranked_data is not None
            and not rough_ranked_data.empty
        ):
            slices = rough_ranked_data["content"].to_list()
            chunk_slices = [slices[i : i + 400] for i in range(0, len(slices), 400)]
            scores = []
            for chunk_slice in chunk_slices:
                sub_score = await self.reranker_client.ado_rerank(chunk_slice, query)
                scores.extend(sub_score)
            rough_ranked_data["merge_score"] = scores
            accuracy_ranked_data = rough_ranked_data[
                rough_ranked_data["merge_score"] > self.reranker_cossim_threshold
            ].sort_values(by=["merge_score"], ascending=False)
        # rouph_ranked_data为空DataFrame时
        elif isinstance(rough_ranked_data, pd.DataFrame) and (
            rough_ranked_data is None or rough_ranked_data.empty
        ):
            scores = []
            accuracy_ranked_data = rough_ranked_data
        average_score = sum(scores) / len(scores) if scores else 0
        return accuracy_ranked_data, average_score

    async def process_entity_infos(self, agg_res: pd.DataFrame):
        result = []
        for _, row in agg_res.iterrows():
            entity_infos = row["entity_infos"]
            if entity_infos:
                entity_info = entity_infos[0]
                entity_id = entity_info.get("id")
                default_property = entity_info.get("default_property")
                default_property_alias = (
                    default_property["v"]
                    if "v" in default_property
                    else default_property["value"]
                )
                result.append(
                    {
                        "order": len(result) + 1,  # 使用结果列表的长度来生成顺序编号
                        "id": entity_id,
                        "info": default_property_alias,
                    }
                )
        return result

    async def ado_ranking(self, task: Task):
        query = task.get_origin_query  # 先不考虑query增强的部分
        agg_res = task.get_attr("agg_res")
        agg_path_sim_texts = task.get_attr("agg_path_sim_texts")  # list格式
        ranked_path_sim_texts, average_score = await self.accuracy_ranking(
            query, agg_path_sim_texts
        )

        # add log
        before_rerank_log = await self.process_entity_infos(agg_res)
        print(f"----before_rerank_log----\n{before_rerank_log}")

        rough_ranked_data = await self.rough_ranking(
            query, agg_res
        )  # 直接将agg_res转换为pd.DataFrame对象，需要有一个format的操作
        accuracy_ranked_data, _ = await self.accuracy_ranking(query, rough_ranked_data)

        # add log
        after_rerank_log = await self.process_entity_infos(accuracy_ranked_data)
        print(f"----after_rerank_log----\n{after_rerank_log}")

        task.set_attr("rough_ranked_data", rough_ranked_data)
        task.set_attr("accuracy_ranked_data", accuracy_ranked_data)
        task.set_attr("ranked_path_sim_texts", ranked_path_sim_texts)
        task.set_attr("ranked_path_sim_avg_score", average_score)
