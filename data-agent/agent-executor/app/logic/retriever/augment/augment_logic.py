from app.common.structs import AugmentBlock
from app.logic.retriever.augment.graph_augment.graph_augment_handler import (
    GraphAugmentHandler,
)


class Augment:
    def __init__(self):
        self.graph_augment_handler = GraphAugmentHandler()

    async def ado_augment(self, augment_config: AugmentBlock):
        response_lists = await self.graph_augment_handler.ado_handler(augment_config)
        return response_lists
