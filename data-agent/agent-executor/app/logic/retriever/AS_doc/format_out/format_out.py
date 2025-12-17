from app.common.stand_log import StandLogger
from app.common.structs import RetrieverBlock


class FormatOutHandler:
    def __init__(self, advanced_config: dict):
        self.documents_num = advanced_config.get("documents_num", 8)
        self.document_threshold = advanced_config.get("document_threshold", -5.5)

    async def ado_format_out(self, retrival_config: RetrieverBlock):
        all_response = []
        threshlold = -100  # 第一篇文档一定要保留

        for data_source, source_cites in retrival_config.cites_slices.items():
            for cite in source_cites[: self.documents_num]:
                cur_cite_format_out = {}
                cur_cite_format_out["content"] = cite.content.replace("|None", "|")

                meta_data = cite.model_dump()
                meta_data["data_source"] = data_source
                StandLogger.info([slice["score"] for slice in meta_data["slices"]])
                meta_data["score"] = max(
                    [slice["score"] for slice in meta_data["slices"]]
                )

                if meta_data["score"] <= threshlold and len(all_response) != 0:
                    break

                del meta_data["content"]

                cur_cite_format_out["retrieve_source_type"] = meta_data[
                    "retrieve_source_type"
                ]

                cur_cite_format_out["score"] = meta_data["score"]
                del meta_data["score"]
                del meta_data["retrieve_source_type"]

                cur_cite_format_out["meta"] = meta_data
                threshlold = self.document_threshold  # 后续文档的阈值

                all_response.append(cur_cite_format_out)

        retrival_config.format_out = all_response
        return retrival_config
