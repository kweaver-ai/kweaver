import pandas as pd

from app.common.config import Config
from app.common.structs import RetrieverBlock
from app.logic.retriever.AS_doc.model.rerank_handler import RerankHandler
from app.logic.retriever.AS_doc.retrival.eco_index_client import EcoIndexClient
from app.domain.enum.common.user_account_header_key import get_user_account_id


class RerankFilter:
    def __init__(self, advanced_config: dict):
        self.rerank_handler = RerankHandler()
        # self.ecoindex_client = EcoIndexClient(advanced_config.get('ecoindex_config', {}))
        self.doclib_retrieve_datas_df = None
        self.advanced_config = advanced_config
        self.choose_method = advanced_config.get("choose_method", "method7")
        self.rerank_topk = advanced_config.get("rerank_topk", 15)

    async def ado_rerank_filter(self, retrival_config: RetrieverBlock):
        headers_default = {
            "as-client-id": "34126adb-867b-458f-8b11-aecc771cdc4f",
            "as-client-type": "web",
            "as-user-id": "",
            "as-user-ip": "XXX",
            "as-visitor-type": "user",
        }

        if retrival_config.data_source.get("doc")[0]["ds_id"] == "0":
            address = "http://" + Config.services.ecoindex_private.host
            port = Config.services.ecoindex_private.port
            authorization = retrival_config.headers_info.get(
                "authorization", ""
            ) or "Bearer " + retrival_config.headers_info.get("token", "")

            as_user_id = get_user_account_id(retrival_config.headers_info) or ""

            # 内容数据湖 普通用户接入
            as_client_id = retrival_config.headers_info.get(
                "as-client-id"
            ) or headers_default.get("as-client-id")

            as_visitor_type = retrival_config.headers_info.get(
                "as-visitor-type"
            ) or headers_default.get("as-visitor-type")

        else:
            address = retrival_config.data_source.get("doc")[0]["address"]
            if not address.startswith("http"):
                address = "https://" + address

            port = retrival_config.data_source.get("doc")[0]["port"]
            authorization = "Bearer " + retrival_config.headers_info.get("as-token", "")

            as_user_id = (
                retrival_config.headers_info.get("as-user-id")
                or retrival_config.data_source["doc"][0]["as_user_id"]
            )

            # 外部数据源 应用账户接入
            as_client_id = as_user_id
            as_visitor_type = "business"

        # 处理headers

        headers = {
            "Authorization": authorization,
            "as-user-id": as_user_id,
            "as-user-ip": retrival_config.headers_info.get("as-user-ip")
            or headers_default.get("as-user-ip"),
            "as-client-id": as_client_id,
            "as-client-type": retrival_config.headers_info.get("as-client-type")
            or headers_default.get("as-client-type"),
            "as-visitor-type": as_visitor_type,
        }

        self.ecoindex_client = EcoIndexClient(
            address, port, headers, self.advanced_config
        )

        for (
            data_source,
            doclib_retrieve_datas_df,
        ) in retrival_config.rank_slices.items():
            self.doclib_retrieve_datas_df = doclib_retrieve_datas_df

            if (
                self.doclib_retrieve_datas_df is not None
                and not self.doclib_retrieve_datas_df.empty
            ):
                if self.choose_method == "method2":
                    # method2
                    topk_slices = self.rerank_topk
                    all_segment_ids = self.doclib_retrieve_datas_df[
                        "segment_id"
                    ].tolist()

                    topk_segment_ids = all_segment_ids[:topk_slices]
                    # print(self.doclib_retrieve_datas_df.shape[0])
                    # print(all_segment_ids)

                    if self.doclib_retrieve_datas_df.shape[0] > topk_slices:
                        left_index = [i for i in range(topk_slices)]

                        for i in range(
                            topk_slices, self.doclib_retrieve_datas_df.shape[0]
                        ):
                            if all_segment_ids[i] - 1 in topk_segment_ids:
                                left_index.append(i)

                        self.doclib_retrieve_datas_df = (
                            self.doclib_retrieve_datas_df.iloc[left_index]
                        )

                    # print(self.doclib_retrieve_datas_df['segment_id'].tolist())
                    retrival_config.rank_rough_slices[data_source] = (
                        self.doclib_retrieve_datas_df
                    )

                    retrival_config.rank_rough_slices_num[data_source] = (
                        self.doclib_retrieve_datas_df.shape[0]
                    )

                elif self.choose_method == "method7":
                    # 依照切片结构获取下级切片 method7
                    topk_slices = self.rerank_topk
                    topk_get_next_slice = 100

                    self.doclib_retrieve_datas_df = self.doclib_retrieve_datas_df.drop(
                        self.doclib_retrieve_datas_df.index[topk_slices:]
                    )

                    all_segment_ids = self.doclib_retrieve_datas_df[
                        "segment_id"
                    ].tolist()

                    topk_segment_ids = all_segment_ids[:topk_slices]
                    all_belong_doc_ids = self.doclib_retrieve_datas_df[
                        "belong_doc_id"
                    ].tolist()

                    topk_belong_doc_ids = all_belong_doc_ids[:topk_slices]

                    all_next_slice = await self.ecoindex_client.ado_get_next_slice(
                        doc_ids=topk_belong_doc_ids, segment_ids=topk_segment_ids
                    )

                    if len(all_next_slice) != 0:
                        df_nex_slices = pd.DataFrame(all_next_slice)
                        self.doclib_retrieve_datas_df = pd.concat(
                            [self.doclib_retrieve_datas_df, df_nex_slices],
                            ignore_index=True,
                        )

                    retrival_config.rank_rough_slices[data_source] = (
                        self.doclib_retrieve_datas_df
                    )

                    retrival_config.rank_rough_slices_num[data_source] = (
                        self.doclib_retrieve_datas_df.shape[0]
                    )

                else:
                    # method1
                    topk = self.rerank_topk

                    if self.doclib_retrieve_datas_df.shape[0] > topk:
                        retrival_config.rank_rough_slices[data_source] = (
                            self.doclib_retrieve_datas_df
                        )
                        retrival_config.rank_rough_slices_num[data_source] = (
                            self.doclib_retrieve_datas_df.shape[0]
                        )
                    else:
                        retrival_config.rank_rough_slices[data_source] = (
                            self.doclib_retrieve_datas_df
                        )
                        retrival_config.rank_rough_slices_num[data_source] = (
                            self.doclib_retrieve_datas_df.shape[0]
                        )

            else:
                # logger.info("self.doclib_retrieve_datas_df is None.")
                pass

        return retrival_config
