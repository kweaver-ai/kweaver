from app.common.structs import RetrieverBlock
from app.logic.retriever.AS_doc.rank.character_filter import CharacterFilter
from app.logic.retriever.AS_doc.rank.rerank_filter import RerankFilter
from app.logic.retriever.AS_doc.rank.pre_process import PreProcess


class RankHandler:
    def __init__(self, advanced_config: dict):
        self.pre_process = PreProcess(advanced_config)
        self.character_filter = CharacterFilter(advanced_config)
        self.rerank_filter = RerankFilter(advanced_config)

    async def ado_rank(self, retrival_config: RetrieverBlock):
        retrival_config = await self.pre_process.ado_pre_process(
            retrival_config=retrival_config
        )

        retrival_config = await self.rerank_filter.ado_rerank_filter(
            retrival_config=retrival_config
        )

        retrival_config = await self.character_filter.ado_character_filter(
            retrival_config=retrival_config
        )

        return retrival_config
