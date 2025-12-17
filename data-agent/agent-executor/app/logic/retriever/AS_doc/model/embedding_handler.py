from app.driven.external.embedding_client import EmbeddingClient
from app.common.structs import RetrieverBlock


class EmbeddingHandler:
    def __init__(self):
        self.embedding_client = EmbeddingClient()

    async def ado_embedding(self, retrival_config: RetrieverBlock):
        for key, value in retrival_config.processed_query.items():
            if len(retrival_config.body.get("history", [])) > 1:
                processed_query = await self.query_merge_history(
                    value.get_content(), retrival_config.body.get("history", [])[:-1]
                )
            else:
                processed_query = value.get_content()
            query_embeddings = await self.embedding_client.ado_embedding(
                [processed_query]
            )
            value.set_embedding(query_embeddings[0])

        return retrival_config

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
