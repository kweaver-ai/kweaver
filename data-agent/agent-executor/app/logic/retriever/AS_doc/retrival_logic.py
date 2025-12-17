from app.common.structs import RetrieverBlock
from app.logic.retriever.AS_doc.cites.cites_handler import CitesHandler
from app.logic.retriever.AS_doc.format_out.format_out import FormatOutHandler
from app.logic.retriever.AS_doc.query.query_handler import QueryHandler
from app.logic.retriever.AS_doc.rank.rank_handler import RankHandler

# from app.logic.retriever.AS_doc.query.query_handler import QueryHandler
from app.logic.retriever.AS_doc.retrival.retrival_handler import RetrivalHandler
from app.logic.retriever.AS_doc.faq.faq_format_out import FAQFormatOut
from app.logic.retriever.AS_doc.faq.faq_rank import FAQRank
from app.common.stand_log import StandLogger


class Retrival:
    def __init__(self, advanced_config: dict = None):
        if advanced_config is None:
            advanced_config = {}

        self.query_handler = QueryHandler()
        self.retrival_handler = RetrivalHandler(advanced_config)
        self.rank_handler = RankHandler(advanced_config)
        self.cites_handler = CitesHandler(advanced_config)
        self.format_out_handler = FormatOutHandler(advanced_config)

        self.faq_rank = FAQRank()
        self.faq_format_out = FAQFormatOut()

    async def ado_retrival(self, retrival_config: RetrieverBlock):
        retrival_config = await self.query_handler.ado_query(
            retrival_config=retrival_config
        )
        retrival_config = await self.retrival_handler.ado_retrival(
            retrival_config=retrival_config
        )

        if (
            retrival_config.faq_retrival_qas is not None
            and len(retrival_config.faq_retrival_qas) > 0
        ):
            retrival_config = await self.faq_rank.ado_rank(
                retrival_config=retrival_config
            )
            retrival_config = await self.faq_format_out.ado_format_out(
                retrival_config=retrival_config
            )
            if retrival_config.faq_find_answer == True:
                return retrival_config.faq_format_out_qas

        if retrival_config.retrival_slices is not None:
            retrival_config = await self.rank_handler.ado_rank(
                retrival_config=retrival_config
            )

            retrival_config = await self.cites_handler.ado_cites(
                retrival_config=retrival_config
            )

            retrival_config = await self.format_out_handler.ado_format_out(
                retrival_config=retrival_config
            )

        retrival_slices = []
        if retrival_config.format_out is not None:
            retrival_slices.extend(retrival_config.format_out)

        if retrival_config.faq_format_out_qas is not None:
            retrival_slices.extend(retrival_config.faq_format_out_qas)

        if len(retrival_slices) == 0:
            StandLogger.info("retrieval nothing!")
            return []
        else:
            retrival_slices_sorted = sorted(
                retrival_slices, key=lambda x: x["score"], reverse=True
            )
            return retrival_slices_sorted
