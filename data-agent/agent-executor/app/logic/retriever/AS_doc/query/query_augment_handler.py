# from app.logic.retriever.augment.augment_logic import Augment
# from app.common.structs import RetrieverBlock, AugmentBlock
# from app.logic.retriever.AS_doc.helper.query_helper import judge_query_need_history
# class QueryAugmentHandler:
#     def __init__(self):
#         self.augment = Augment()
#         self.augment_block = AugmentBlock()

#     async def ado_query_augment(self, retrival_config:RetrieverBlock):
#         if "rewrite_query" not in retrival_config.input.keys() or len(retrival_config.input['rewrite_query']) == 0:
#             self.augment_block.input = [retrival_config.input['origin_query']]
#         else:
#             if judge_query_need_history(retrival_config.input['origin_query']) and len(retrival_config.input['rewrite_query']) > len(retrival_config.input['origin_query']):
#                 self.augment_block.input = [retrival_config.input['rewrite_query']]
#             else:
#                 jaccard_dis = len(set(retrival_config.input['origin_query']).intersection(set(retrival_config.input['rewrite_query']))) / len(retrival_config.input['rewrite_query'])
#                 res_len = len(retrival_config.input['rewrite_query'])
#                 len_raw = len(retrival_config.input['origin_query'])
#                 if res_len > 1.5 * len_raw or  res_len < 0.5 * len_raw or jaccard_dis < 0.5:
#                     self.augment_block.input = [retrival_config.input['origin_query']]
#                 else:
#                     self.augment_block.input = [retrival_config.input['rewrite_query']]
#         self.augment_block.augment_data_source = retrival_config.augment_data_source
#         self.augment_block.need_augment_content = True
#         augment_response = await self.augment.ado_augment(augment_config=self.augment_block)
#         return augment_response[0][0]
