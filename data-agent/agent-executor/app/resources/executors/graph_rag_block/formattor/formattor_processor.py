from app.resources.executors.graph_rag_block.task import Task
from app.resources.executors.graph_rag_block.strategy import FormattorStrategy


class FormattorProcessor:
    def __init__(self, formattor_strategy: FormattorStrategy) -> None:
        self.formattor_strategy: FormattorStrategy = formattor_strategy
        self.switch = formattor_strategy.switch

    async def ado_formattor(self, task: Task):
        aug_res = task.get_attr("aug_res")
        kg_id = task.get_attr("kg_id")
        ranked_path_sim_texts = task.get_attr("ranked_path_sim_texts")
        ranked_path_sim_avg_score = task.get_attr("ranked_path_sim_avg_score")

        # 处理aug_res, pd.DataFrame
        aug_res.rename(columns={"merge_score": "score"}, inplace=True)
        rows_as_dicts = [row.to_dict() for _, row in aug_res.iterrows()]
        res = []
        for row in rows_as_dicts[: self.formattor_strategy.graph_rag_topk]:
            entity_infos = row["entity_infos"]
            res.append(
                {
                    "content": row["content"],
                    "score": row["score"],
                    "retrieve_source_type": "KG_RAG",
                    "meta": {"sub_graph": {"nodes": entity_infos}, "kg_id": kg_id},
                }
            )
            # # local debug
            # res.append(content)

        # 处理path_sim, List[str]
        path_sim_meta = {}
        path_sim_meta_content = ""
        for i, text in enumerate(ranked_path_sim_texts):
            path_sim_meta_content += text
            path_sim_meta[str(i)] = text
        path_sim_meta["score"] = ranked_path_sim_avg_score

        if path_sim_meta_content:
            res.append({"content": path_sim_meta_content, "meta": path_sim_meta})
        ranked_path_sim_texts = task.set_attr("graph_retrieval_res", res)
