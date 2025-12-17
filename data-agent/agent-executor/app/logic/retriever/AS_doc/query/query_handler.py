"""
query重写功能已迁移至 app/logic/query_rewite.py
本文件现已无用
"""

from app.common.structs import RetrieverBlock

# from app.logic.retriever.AS_doc.query.query_augment_handler import QueryAugmentHandler
from app.logic.retriever.AS_doc.helper.query_helper import get_md5, Query


class QueryHandler:
    def __init__(self):
        # self.query_augment = QueryAugmentHandler()
        pass

    async def ado_query(self, retrival_config: RetrieverBlock):
        retrival_config.processed_query["origin_query"] = Query(
            retrival_config.input["origin_query"],
            get_md5(retrival_config.input),
            "origin_query",
        )
        if (
            "rewrite_query" in retrival_config.input.keys()
            and len(retrival_config.input["origin_query"]) > 0
        ):
            retrival_config.processed_query["rewrite_query"] = Query(
                retrival_config.input["rewrite_query"],
                get_md5(retrival_config.input["rewrite_query"]),
                "rewrite_query",
            )
        if (
            "augment_query" in retrival_config.input.keys()
            and len(retrival_config.input["origin_query"]) > 0
        ):
            retrival_config.processed_query["augment_query"] = Query(
                retrival_config.input["augment_query"],
                get_md5(retrival_config.input["augment_query"]),
                "augment_query",
            )

        # if len(retrival_config.augment_data_source.keys()) > 0:
        #     augment_query = await self.query_augment.ado_query_augment(retrival_config)
        #     retrival_config.processed_query['augment_query'] = Query(augment_query, get_md5(retrival_config.input), "augment_query")
        return retrival_config
