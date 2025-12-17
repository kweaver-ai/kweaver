import sys


def add_to_sys_path(directory):
    """
    将指定目录添加到系统路径
    """
    if directory not in sys.path:
        sys.path.append(directory)
        print(f"目录已添加到系统路径: {directory}")
    else:
        print(f"目录已存在于系统路径中: {directory}")


# 添加目录到系统路径
add_to_sys_path("/root/Young/programs/agent-executor/3.0.1.1-hotfix/agent-executor")

from app.common.structs import AugmentBlock
from app.logic.retriever.augment.augment_logic import Augment

augment_config = AugmentBlock()
augment_config.input = ["anyshar7描述"]
augment_config.augment_data_source = {
    "concepts": [{"kg_id": "9", "entities": ["custom_subject"]}]
}
augment_config.need_augment_content = True
augment = Augment()

import asyncio


async def main():
    response = await augment.ado_augment(augment_config=augment_config)
    print(response)


asyncio.run(main())
