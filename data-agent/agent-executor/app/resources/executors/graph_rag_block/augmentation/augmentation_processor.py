import pandas as pd
from app.common.structs import AugmentBlock
from app.logic.retriever.augment.augment_logic import Augment
from app.resources.executors.graph_rag_block.task import Task
from app.resources.executors.graph_rag_block.strategy import AugmentationStrategy


class AugmentationProcessor:
    def __init__(self, augmentation_strategy: AugmentationStrategy) -> None:
        self.augmentation_strategy: AugmentationStrategy = augmentation_strategy
        self.augmentation_field = augmentation_strategy.augmentation_field
        self.augmentation_kg_id = augmentation_strategy.augmentation_kg_id
        self.output_field = augmentation_strategy.output_field
        self.aug_top_k = augmentation_strategy.aug_top_k
        self.augmentor = Augment()

    async def augmentation_func(
        self, ranked_res: pd.DataFrame, augmentation_field, augmentation_kg_id
    ):
        # ranked_res 是pandas对象
        texts = ranked_res["content"].to_list()
        need_aug_texts = texts[: self.aug_top_k]

        augment_config = AugmentBlock()
        augment_config.inputs = (need_aug_texts,)
        augment_config.augment_data_source = {
            "concepts": [{"kg_id": augmentation_kg_id, "entities": augmentation_field}]
        }

        aug_texts = await self.augmentor.ado_augment(augment_config)
        if aug_texts:
            ranked_res.loc[: self.aug_top_k, "content"] = (
                aug_texts  # 使用增强后aug_text替换原有的texts
            )
        return ranked_res

    async def ado_augmentation(self, task: Task):
        ranked_res = task.get_attr("accuracy_ranked_data")
        if ranked_res is not None and not ranked_res.empty:
            augmentation_res = await self.augmentation_func(
                ranked_res,
                augmentation_field=self.augmentation_field,
                augmentation_kg_id=self.augmentation_kg_id,
            )
        else:
            augmentation_res = ranked_res
        task.set_attr("aug_res", augmentation_res)
