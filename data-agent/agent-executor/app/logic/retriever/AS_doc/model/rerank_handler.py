from app.common.structs import RetrieverBlock
from app.driven.external.rerank_client import RerankClient


class RerankHandler:
    def __init__(self):
        self.rerank_client = RerankClient()

    async def ado_rerank(self, retrival_config: RetrieverBlock, slices, query):
        if isinstance(query, str):
            if len(retrival_config.body.get("history", [])) > 1:
                processed_query = await self.query_merge_history(
                    query, retrival_config.body.get("history", [])[:-1]
                )
            else:
                processed_query = query

            scores = await self.rerank_client.ado_rerank(slices, processed_query)
        else:
            if len(retrival_config.body.get("history", [])) > 1:
                processed_query = await self.query_merge_history(
                    query["origin_query"], retrival_config.body.get("history", [])[:-1]
                )
            else:
                processed_query = query["origin_query"]

            scores = await self.rerank_client.ado_rerank(slices, processed_query)
        return scores

    async def query_merge_history(self, query, messages):
        if len(messages) >= 2:
            messages = messages[-2:]
            processed_query = (
                query
                + "\n(上一次问题："
                + messages[0]["content"]
                + "  \n上一次问题的答案："
                + messages[1]["content"]
                + ")"
            )
            return processed_query
        elif len(messages) > 0:
            return query + messages[0]["content"]
        else:
            return query
