import asyncio
from app.common.structs import AugmentBlock
from app.logic.retriever.augment.graph_augment.graph_augment_client import (
    GraphAugmentClient,
)
from app.logic.retriever.augment.graph_augment.augment_content import AugmentContent


class GraphAugmentHandler:
    def __init__(self):
        self.graph_augment_client = GraphAugmentClient()
        self.augment_content = AugmentContent()

    async def ado_handler(self, augment_config: AugmentBlock):
        response_list = []
        response_dict = {}
        tasks = []
        for i in range(len(augment_config.input)):
            tasks.append(
                asyncio.create_task(self.ado_handler_subprocess(i, augment_config))
            )
        for task in tasks:
            index, augment_entities, augmented_content = await task
            response_dict[index] = (augmented_content, augment_entities)
        for i in range(len(response_dict.keys())):
            response_list.append(response_dict[i])
        return response_list

    async def ado_handler_subprocess(self, index, augment_config: AugmentBlock):
        query = augment_config.input[index]
        concepts = augment_config.augment_data_source["concepts"]
        augment_entities = await self.graph_augment_client.ado_client(
            query=query, concepts=concepts
        )
        if augment_config.need_augment_content:
            augmented_content = await self.augment_content.ado_augment(
                query=query, entities=augment_entities
            )
            return index, augment_entities, augmented_content
        else:
            return index, augment_entities, ""
