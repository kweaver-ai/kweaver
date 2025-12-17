from app.common.structs import RetrieverBlock
from app.logic.retriever.AS_doc.cites.cite_process import CitesProcess


class CitesHandler:
    def __init__(self, advanced_config: dict):
        self.cites_processor = CitesProcess(advanced_config)

    async def ado_cites(self, retrival_config: RetrieverBlock):
        retrival_config = await self.cites_processor.ado_cites_process(
            retrival_config=retrival_config
        )
        return retrival_config
