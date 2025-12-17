import time
import pandas as pd
from app.common.structs import RetrieverBlock
from app.logic.retriever.AS_doc.helper.rank_helper import TokenScorer


class CharacterFilter:
    def __init__(self, advanced_config: dict):
        self.acc_ranking_score_threshold: float = advanced_config.get(
            "acc_ranking_score_threshold", 0.85
        )

    async def ado_character_filter(self, retrival_config: RetrieverBlock):
        for data_source, rough_datas in retrival_config.rank_rough_slices.items():
            user_query_rough_ranking_datas = rough_datas
            token_scorer = TokenScorer(
                acc_ranking_score_threshold=self.acc_ranking_score_threshold
            )

            start = time.time()

            if "score" in user_query_rough_ranking_datas.keys():
                user_query_rough_ranking_datas[
                    ["token_score", "weighted_token_score"]
                ] = user_query_rough_ranking_datas.apply(
                    lambda row: pd.Series(
                        token_scorer.do(
                            row["raw_text"],
                            retrival_config.input,
                            row_score=row["score"],
                        )
                    ),
                    axis=1,
                )
            else:
                user_query_rough_ranking_datas[
                    ["token_score", "weighted_token_score"]
                ] = user_query_rough_ranking_datas.apply(
                    lambda row: pd.Series(
                        token_scorer.do(row["raw_text"], retrival_config.input)
                    ),
                    axis=1,
                )
            # logger.info(f"doclib compute token_score and weighted_token_score cost: {time.time() - start}s")

            # 去除 score 为 0 的行
            user_query_rough_ranking_datas = user_query_rough_ranking_datas.dropna(
                subset=["token_score"]
            )
            user_query_accurate_ranking_by_doclib = user_query_rough_ranking_datas.drop(
                index=user_query_rough_ranking_datas[
                    user_query_rough_ranking_datas["token_score"] == 0
                ].index
            )
            if user_query_rough_ranking_datas.shape[0] == 0:
                # 如果score全部是0，就不删了
                user_query_rough_ranking_datas = user_query_rough_ranking_datas

            if user_query_accurate_ranking_by_doclib.shape[0] == 0:
                # 如果score全部是0，就不删了
                user_query_accurate_ranking_by_doclib = user_query_rough_ranking_datas

            retrival_config.rank_accurate_slices_num[data_source] = (
                user_query_accurate_ranking_by_doclib.shape[0]
            )

            # if user_query_accurate_ranking_by_doclib.shape[0] == 0:
            #     return
            retrival_config.rank_accurate_slices[data_source] = (
                user_query_accurate_ranking_by_doclib  # 进入下一步的东西
            )
        return retrival_config
