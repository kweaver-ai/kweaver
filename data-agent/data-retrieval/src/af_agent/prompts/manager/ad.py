# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2025-1-10

from af_agent.prompts.manager.base import BasePromptManager
from af_agent.utils.dip_services import Builder

class ADPromptManager(BasePromptManager):

    def save_prompts(self):
        pass

    def load_prompts(self):
        pass

if __name__ == "__main__":
    ad_manager = ADPromptManager()
    ad_manager1 = ADPromptManager()
    base_manager = BasePromptManager()
    print(ad_manager is ad_manager1)
    print(ad_manager is base_manager)

    # print(ad_manager.available_prompts)