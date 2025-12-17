import hashlib
import pandas as pd
from app.common.structs import RetrieverBlock
from app.logic.retriever.AS_doc.helper.rank_helper import raw_text_norm
from app.logic.retriever.AS_doc.helper.constant import HitType
from app.logic.retriever.AS_doc.model.rerank_handler import RerankHandler


class PreProcess:
    def __init__(self, advanced_config: dict):
        self.sparse_retrieve_datas_df: pd.DataFrame = None
        self.doclib_retrieve_datas_df: pd.DataFrame = None

        self.max_bm25_score = 0.0
        self.min_bm25_score = 0.0
        self.max_cos_sim_score = 0.0
        self.min_cos_sim_score = 0.0
        self.max_cos_sim_score_rerank = 0.0
        self.min_cos_sim_score_rerank = 0.0

        self.cos_sim_weight = advanced_config.get("cos_sim_weight", 1.3)
        self.bm25_weight = advanced_config.get("bm25_weight", 1.0)
        self.reranker_method = advanced_config.get("reranker_method", "only_reranker")

        self.query = ""
        self.dense_retrieve_datas = None
        self.sparse_retrieve_datas = None
        self.reranker_handler = RerankHandler()

    async def preprocess(
        self, retrival_config: RetrieverBlock, user_query_results, data_source
    ):
        self.query = retrival_config.input
        for key, value in user_query_results.items():
            if key == "dense_res":
                self.dense_retrieve_datas = value
            if key == "sparse_res":
                self.sparse_retrieve_datas = value

        self.dense_retrieve_datas_df = None
        if (
            self.dense_retrieve_datas is not None
            and len(self.dense_retrieve_datas) != 0
        ):
            self.has_dense_retrieve = True

            self.dense_retrieve_datas_df = pd.DataFrame(
                [_item.model_dump() for _item in self.dense_retrieve_datas]
            )

            self.dense_retrieve_datas_df["raw_text_norm"] = (
                self.dense_retrieve_datas_df["raw_text"].apply(
                    lambda x: raw_text_norm(x)
                )
            )  # 去除文本中的空格信息
            self.dense_retrieve_datas_df["raw_text_md5"] = self.dense_retrieve_datas_df[
                "raw_text_norm"
            ].apply(lambda x: hashlib.md5(x.encode("utf-8")).hexdigest())
            # 现替换belong_doc_md5相同的文档信息
            self.dense_retrieve_datas_df[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ] = self.dense_retrieve_datas_df.groupby("belong_doc_md5")[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ].transform("first")
            # 去重
            self.dense_retrieve_datas_df.drop_duplicates(
                subset=["belong_doc_md5", "raw_text_md5"], keep="first", inplace=True
            )
            title_text = []
            for title, text in zip(
                self.dense_retrieve_datas_df["belong_doc_name"].to_list(),
                self.dense_retrieve_datas_df["raw_text"].to_list(),
            ):
                title_text.append(f"《{title}》:{text}")
            scores = await self.reranker_handler.ado_rerank(
                retrival_config=retrival_config, slices=title_text, query=self.query
            )

            self.dense_retrieve_datas_df["reranker_score"] = scores
            # mean_cos_sim_score_rerank = self.dense_retrieve_datas_df["reranker_score"].mean()
            # std_cos_sim_score_rerank = self.dense_retrieve_datas_df["reranker_score"].std()

            mean_cos_sim_score = self.dense_retrieve_datas_df["score"].mean()
            std_cos_sim_score = self.dense_retrieve_datas_df["score"].std()
            sum_cos_sim_score = self.dense_retrieve_datas_df["score"].sum()
            max_cos_sim_score = self.dense_retrieve_datas_df["score"].max()
            min_cos_sim_score = self.dense_retrieve_datas_df["score"].min()

            # 增加 max_cos_sim_score 和 min_cos_sim_score 字段
            self.max_cos_sim_score = max_cos_sim_score
            self.min_cos_sim_score = min_cos_sim_score
            self.dense_retrieve_datas_df["zero_score_norm_cos_sim_score"] = (
                self.dense_retrieve_datas_df["score"].apply(
                    lambda x: (x - mean_cos_sim_score) * 1.0 / std_cos_sim_score
                )
            )
            self.dense_retrieve_datas_df["min_max_norm_cos_sim_score"] = (
                self.dense_retrieve_datas_df["score"].apply(
                    lambda x: (x - min_cos_sim_score)
                    * 1.0
                    / (max_cos_sim_score - min_cos_sim_score)
                )
            )

        self.sparse_retrieve_datas_df = None
        if (
            self.sparse_retrieve_datas is not None
            and len(self.sparse_retrieve_datas) != 0
        ):
            self.has_sparse_retrieve = True

            self.sparse_retrieve_datas_df = pd.DataFrame(
                [_item.model_dump() for _item in self.sparse_retrieve_datas]
            )

            self.sparse_retrieve_datas_df["raw_text_norm"] = (
                self.sparse_retrieve_datas_df["raw_text"].apply(
                    lambda x: raw_text_norm(x)
                )
            )
            self.sparse_retrieve_datas_df["raw_text_md5"] = (
                self.sparse_retrieve_datas_df["raw_text_norm"].apply(
                    lambda x: hashlib.md5(x.encode("utf-8")).hexdigest()
                )
            )
            # TODO 现替换belong_doc_md5相同的文档信息
            self.sparse_retrieve_datas_df[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ] = self.sparse_retrieve_datas_df.groupby("belong_doc_md5")[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ].transform("first")
            # 去重
            self.sparse_retrieve_datas_df.drop_duplicates(
                subset=["belong_doc_md5", "raw_text_md5"], keep="first", inplace=True
            )

            title_text = []
            for title, text in zip(
                self.sparse_retrieve_datas_df["belong_doc_name"].to_list(),
                self.sparse_retrieve_datas_df["raw_text"].to_list(),
            ):
                title_text.append(f"《{title}》:{text}")
            scores = await self.reranker_handler.ado_rerank(
                retrival_config=retrival_config, slices=title_text, query=self.query
            )
            self.sparse_retrieve_datas_df["reranker_score"] = scores
            # mean_cos_sim_score_rerank = self.sparse_retrieve_datas_df["reranker_score"].mean()
            # std_cos_sim_score_rerank = self.sparse_retrieve_datas_df["reranker_score"].std()

            mean_bm25_score = self.sparse_retrieve_datas_df["score"].mean()
            std_bm25_score = self.sparse_retrieve_datas_df["score"].std()
            sum_bm25_score = self.sparse_retrieve_datas_df["score"].sum()
            max_bm25_score = self.sparse_retrieve_datas_df["score"].max()
            min_bm25_score = self.sparse_retrieve_datas_df["score"].min()

            # 增加max_bm25_score 和 min_bm25_score字段
            self.max_bm25_score = max_bm25_score
            self.min_bm25_score = min_bm25_score

            self.sparse_retrieve_datas_df["zero_score_norm_bm25_score"] = (
                self.sparse_retrieve_datas_df["score"].apply(
                    lambda x: (x - mean_bm25_score) * 1.0 / std_bm25_score
                )
            )
            self.sparse_retrieve_datas_df["min_max_norm_bm25_score"] = (
                self.sparse_retrieve_datas_df["score"].apply(
                    lambda x: (x - min_bm25_score)
                    * 1.0
                    / (max_bm25_score - min_bm25_score)
                )
            )

        if (
            self.dense_retrieve_datas_df is not None
            and self.sparse_retrieve_datas_df is not None
        ):
            merge_df = pd.merge(
                self.dense_retrieve_datas_df.rename(columns={"score": "cos_sim_score"}),
                self.sparse_retrieve_datas_df[
                    [
                        "uuid",
                        "score",
                        "zero_score_norm_bm25_score",
                        "min_max_norm_bm25_score",
                    ]
                ].rename(columns={"score": "bm25_score"}),
                on="uuid",
                how="inner",
            )

            merge_df[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ] = merge_df.groupby("belong_doc_md5")[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ].transform("first")

            merge_df.drop_duplicates(
                subset=["belong_doc_md5", "raw_text_md5"], keep="first", inplace=True
            )

            merge_df["hit_type"] = HitType.ALL_HIT

            remain_dense_retrieve_datas_df = pd.merge(
                self.dense_retrieve_datas_df,
                merge_df[["uuid"]],
                on="uuid",
                how="outer",
                indicator=True,
            )

            remain_dense_retrieve_datas_df = remain_dense_retrieve_datas_df.loc[
                remain_dense_retrieve_datas_df["_merge"] == "left_only"
            ].drop(["_merge"], axis=1)

            remain_dense_retrieve_datas_df["cos_sim_score"] = (
                remain_dense_retrieve_datas_df["score"]
            )

            remain_dense_retrieve_datas_df["bm25_score"] = self.min_bm25_score
            remain_dense_retrieve_datas_df["hit_type"] = HitType.ONLY_DENSE

            remain_sparse_retrieve_datas_df = pd.merge(
                self.sparse_retrieve_datas_df,
                merge_df[["uuid"]],
                on="uuid",
                how="outer",
                indicator=True,
            )

            remain_sparse_retrieve_datas_df = remain_sparse_retrieve_datas_df.loc[
                remain_sparse_retrieve_datas_df["_merge"] == "left_only"
            ].drop(["_merge"], axis=1)

            remain_sparse_retrieve_datas_df["bm25_score"] = (
                remain_sparse_retrieve_datas_df["score"]
            )

            remain_sparse_retrieve_datas_df["cos_sim_score"] = self.min_cos_sim_score
            remain_sparse_retrieve_datas_df["hit_type"] = HitType.ONLY_SPARSE

            retrieve_datas_df = pd.concat(
                [
                    merge_df,
                    remain_dense_retrieve_datas_df,
                    remain_sparse_retrieve_datas_df,
                ]
            ).reset_index(drop=True)
            retrieve_datas_df["norm_cos_sim_score"] = retrieve_datas_df[
                "cos_sim_score"
            ].apply(
                lambda x: (
                    (x - (self.min_cos_sim_score + self.max_cos_sim_score) / 2)
                    / (self.max_cos_sim_score - self.min_cos_sim_score)
                )
            )
            retrieve_datas_df["norm_bm25_score"] = retrieve_datas_df[
                "bm25_score"
            ].apply(
                lambda x: (
                    (x - (self.min_bm25_score + self.max_bm25_score) / 2)
                    / (self.max_bm25_score - self.min_bm25_score)
                )
            )

            # 排序策略选择
            if (
                self.reranker_method == "default"
                or self.reranker_method == "cos_and_bm25"
            ):  # 不使用reranker，最原始的方法，只使用norm_cos_sim_score、bm25_score
                # logger.info("use default score method：norm_cos_sim_score、bm25_score.\n")
                retrieve_datas_df["merge_score"] = (
                    self.cos_sim_weight * retrieve_datas_df["norm_cos_sim_score"]
                    + self.bm25_weight * retrieve_datas_df["norm_bm25_score"]
                )
            else:
                self.max_cos_sim_score_rerank = retrieve_datas_df[
                    "reranker_score"
                ].max()

                self.min_cos_sim_score_rerank = retrieve_datas_df[
                    "reranker_score"
                ].min()

                retrieve_datas_df["norm_cos_sim_score_reranker"] = retrieve_datas_df[
                    "reranker_score"
                ].apply(
                    lambda x: (
                        (
                            x
                            - (
                                self.min_cos_sim_score_rerank
                                + self.max_cos_sim_score_rerank
                            )
                            / 2
                        )
                        / (
                            self.max_cos_sim_score_rerank
                            - self.min_cos_sim_score_rerank
                        )
                    )
                )
                if self.reranker_method == "hybrid_reranker":
                    # logger.info("use 3 kind of score：norm_cos_sim_score_rerank、norm_cos_sim_score、bm25_score.\n")
                    retrieve_datas_df["merge_score"] = (
                        (self.cos_sim_weight + self.bm25_weight)
                        * retrieve_datas_df["norm_cos_sim_score_reranker"]
                        + self.cos_sim_weight * retrieve_datas_df["norm_cos_sim_score"]
                        + self.bm25_weight * retrieve_datas_df["norm_bm25_score"]
                    )
                elif self.reranker_method == "only_reranker":  # 只使用rerank的score
                    # logger.info("only use norm_cos_sim_score_rerank.\n")
                    retrieve_datas_df["merge_score"] = retrieve_datas_df[
                        "norm_cos_sim_score_reranker"
                    ]
                else:
                    # logger.info("reranker stategy exec falied!")
                    pass

            self.doclib_retrieve_datas_df = retrieve_datas_df.sort_values(
                by=["merge_score"], ascending=False
            )

            self.doclib_retrieve_datas_df[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ] = self.doclib_retrieve_datas_df.groupby("belong_doc_md5")[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ].transform("first")

            self.doclib_retrieve_datas_df.drop_duplicates(
                subset=["belong_doc_md5", "raw_text_md5"], keep="first", inplace=True
            )

            retrival_config.rank_slices[data_source] = self.doclib_retrieve_datas_df

        elif (
            self.dense_retrieve_datas_df is not None
            and self.sparse_retrieve_datas_df is None
        ):
            merge_df = self.dense_retrieve_datas_df.rename(
                columns={"score": "cos_sim_score"}
            )
            merge_df[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ] = merge_df.groupby("belong_doc_md5")[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ].transform("first")
            # TODO 去重
            merge_df.drop_duplicates(
                subset=["belong_doc_md5", "raw_text_md5"], keep="first", inplace=True
            )
            merge_df["norm_cos_sim_score"] = merge_df["cos_sim_score"].apply(
                lambda x: (
                    (x - (self.min_cos_sim_score + self.max_cos_sim_score) / 2)
                    / (self.max_cos_sim_score - self.min_cos_sim_score)
                )
            )

            # 排序策略选择
            if (
                self.reranker_method == "default"
                or self.reranker_method == "cos_and_bm25"
            ):
                merge_df["merge_score"] = merge_df["norm_cos_sim_score"]

            else:
                self.max_cos_sim_score_rerank = merge_df["reranker_score"].max()
                self.min_cos_sim_score_rerank = merge_df["reranker_score"].min()
                merge_df["norm_cos_sim_score_reranker"] = merge_df[
                    "reranker_score"
                ].apply(
                    lambda x: (
                        (
                            x
                            - (
                                self.min_cos_sim_score_rerank
                                + self.max_cos_sim_score_rerank
                            )
                            / 2
                        )
                        / (
                            self.max_cos_sim_score_rerank
                            - self.min_cos_sim_score_rerank
                        )
                    )
                )
                if self.reranker_method == "hybrid_reranker":
                    # logger.info("use 3 kind of score：norm_cos_sim_score_rerank、norm_cos_sim_score、bm25_score.\n")
                    merge_df["merge_score"] = (
                        merge_df["norm_cos_sim_score_reranker"]
                        + merge_df["norm_cos_sim_score"]
                    )
                elif self.reranker_method == "only_reranker":  # 只使用rerank的score
                    # logger.info("only use norm_cos_sim_score_rerank.\n")
                    merge_df["merge_score"] = merge_df["norm_cos_sim_score_reranker"]
                else:
                    # logger.info("reranker stategy exec falied!")
                    pass

            merge_df = merge_df.assign(bm25_score=-1)
            sorted_merge_df = merge_df.sort_values(
                by=["merge_score"], ascending=False
            )  # 将merge_df这个DataFrame按照merge_score列进行降序排序，并将排序后的结果赋值给sorted_merge_df变量
            sorted_merge_df["hit_type"] = HitType.ONLY_DENSE
            self.doclib_retrieve_datas_df = sorted_merge_df
            self.doclib_retrieve_datas_df[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ] = self.doclib_retrieve_datas_df.groupby("belong_doc_md5")[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ].transform("first")
            # TODO 去重
            self.doclib_retrieve_datas_df.drop_duplicates(
                subset=["belong_doc_md5", "raw_text_md5"], keep="first", inplace=True
            )
            retrival_config.rank_slices[data_source] = self.doclib_retrieve_datas_df

        elif (
            self.dense_retrieve_datas_df is None
            and self.sparse_retrieve_datas_df is not None
        ):
            merge_df = self.sparse_retrieve_datas_df.rename(
                columns={"score": "bm25_score"}
            )
            merge_df[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ] = merge_df.groupby("belong_doc_md5")[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ].transform("first")
            # TODO 去重
            merge_df.drop_duplicates(
                subset=["belong_doc_md5", "raw_text_md5"], keep="first", inplace=True
            )
            merge_df["norm_bm25_score"] = merge_df["bm25_score"].apply(
                lambda x: (
                    (x - (self.min_bm25_score + self.max_bm25_score) / 2)
                    / (self.max_bm25_score - self.min_bm25_score)
                )
            )

            # 排序策略选择
            if (
                self.reranker_method == "default"
                or self.reranker_method == "cos_and_bm25"
            ):
                merge_df["merge_score"] = merge_df["zero_score_norm_bm25_score"]
            else:
                self.max_cos_sim_score_rerank = merge_df["reranker_score"].max()
                self.min_cos_sim_score_rerank = merge_df["reranker_score"].min()
                merge_df["norm_cos_sim_score_reranker"] = merge_df[
                    "reranker_score"
                ].apply(
                    lambda x: (
                        (
                            x
                            - (
                                self.min_cos_sim_score_rerank
                                + self.max_cos_sim_score_rerank
                            )
                            / 2
                        )
                        / (
                            self.max_cos_sim_score_rerank
                            - self.min_cos_sim_score_rerank
                        )
                    )
                )
                if self.reranker_method == "hybrid_reranker":
                    # logger.info("use 3 kind of score：norm_cos_sim_score_rerank、norm_cos_sim_score、bm25_score.\n")
                    merge_df["merge_score"] = (
                        merge_df["norm_cos_sim_score_reranker"]
                        + merge_df["norm_bm25_score"]
                    )
                elif self.reranker_method == "only_reranker":  # 只使用rerank的score
                    # logger.info("only use norm_cos_sim_score_rerank.\n")
                    merge_df["merge_score"] = merge_df["norm_cos_sim_score_reranker"]
                else:
                    # logger.info("reranker stategy exec falied!")
                    pass

            merge_df = merge_df.assign(cos_sim_score=-1)
            sorted_merge_df = merge_df.sort_values(by=["merge_score"], ascending=False)
            sorted_merge_df["hit_type"] = HitType.ONLY_SPARSE

            self.doclib_retrieve_datas_df = sorted_merge_df
            self.doclib_retrieve_datas_df[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ] = self.doclib_retrieve_datas_df.groupby("belong_doc_md5")[
                [
                    "belong_doc_id",
                    "belong_doc_path",
                    "belong_doc_name",
                    "belong_doc_size",
                    "belong_doc_md5",
                    "belong_doc_page",
                    "belong_doc_mimetype",
                    "belong_doc_ext_type",
                    "belong_doc_parent_path",
                ]
            ].transform("first")
            # TODO 去重
            self.doclib_retrieve_datas_df.drop_duplicates(
                subset=["belong_doc_md5", "raw_text_md5"], keep="first", inplace=True
            )
            retrival_config.rank_slices[data_source] = self.doclib_retrieve_datas_df
        else:
            retrival_config.rank_slices[data_source] = None
            pass

        return retrival_config

    async def ado_pre_process(self, retrival_config: RetrieverBlock):
        for data_source, data_sorce_res in retrival_config.retrival_slices.items():
            user_query_results = {"sparse_res": [], "dense_res": []}

            for query_type, query_type_res in data_sorce_res.items():
                sparse_retrieve_results = []
                dense_retrieve_results = []
                cur_query_md5 = retrival_config.processed_query[query_type].get_md5()

                for sparse_dense_type, type_retrival in query_type_res.items():
                    if "sparse_res" == sparse_dense_type:
                        sparse_retrieve_results.extend(type_retrival[cur_query_md5])
                    if "dense_res" == sparse_dense_type:
                        dense_retrieve_results.extend(type_retrival[cur_query_md5])

                if dense_retrieve_results is not None:
                    user_query_results["dense_res"].extend(dense_retrieve_results)

                if sparse_retrieve_results is not None:
                    user_query_results["sparse_res"].extend(sparse_retrieve_results)

            retrival_config = await self.preprocess(
                retrival_config, user_query_results, data_source
            )

        return retrival_config
