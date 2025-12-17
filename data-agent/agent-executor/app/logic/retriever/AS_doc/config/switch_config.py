# import os
# import sys
# from yaml import load_all, Loader
# from app.logic.retriever.AS_doc.config.entities import *
# from app.logic.retriever.AS_doc.helper.constant import EnvironmentMode

#
# class SwitchConfig:
#     def __init__(self):
#         self.queryprocessswitchconfig = QueryProcessSwitchConfig()
#         self.embeddingswitchconfig = EmbeddingSwitchConfig()
#         self.rerankswitchconfig = RerankSwitchConfig()
#         self.mode = EnvironmentMode[os.getenv("mode", default="DEV").upper()]
#         if self.mode in [EnvironmentMode.DEV, EnvironmentMode.DEV_TEST]:
#             # 支持 PyInstaller 打包后的环境
#             if getattr(sys, 'frozen', False):
#                 self.config_path = os.path.join(sys._MEIPASS, "app/logic/retriever/AS_doc/config/switch_config.yaml")
#             else:
#                 self.config_path = "/app/logic/retriever/AS_doc/config/switch_config.yaml"
#         else:
#             self.config_path = "/etc/agent_app/config/switch_config.yaml"
#         if os.path.exists(self.config_path):
#             with open(self.config_path, "r") as f:
#                 for config_item in load_all(f, Loader):
#                     if isinstance(config_item, QueryProcessSwitchConfig):
#                         self.queryprocessswitchconfig = config_item
#                     elif isinstance(config_item, EmbeddingSwitchConfig):
#                         self.embeddingswitchconfig = config_item
#                     elif isinstance(config_item, RerankSwitchConfig):
#                         self.rerankswitchconfig = config_item
