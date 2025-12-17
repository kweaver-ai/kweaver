import asyncio
from app.common.config import Config
from app.common.structs import RetrieverBlock
from app.logic.retriever.AS_doc.retrival.ecosearch_client import EcoSearchClient


class RetrivalHandler:
    def __init__(self, advanced_config: dict):
        self.advanced_config = advanced_config

    async def ado_retrival(self, retrival_config: RetrieverBlock):
        retrival_tasks = []
        retrival_res = {}
        retrival_faqs = []

        for key in retrival_config.data_source.keys():
            if key == "doc":
                if retrival_config.data_source["doc"][0]["ds_id"] != "0":
                    address = retrival_config.data_source["doc"][0]["address"]
                    if not address.startswith("http"):
                        address = "https://" + address
                    port = retrival_config.data_source["doc"][0]["port"]
                else:
                    address = "http://" + Config.services.ecosearch.host
                    port = Config.services.ecosearch.port
                self.ecosearch_client = EcoSearchClient(
                    address, port, self.advanced_config
                )
                retrival_tasks.append(
                    asyncio.create_task(
                        self.ecosearch_client.ado_mixed_retrival(retrival_config, key)
                    )
                )
            else:
                pass

        for task in retrival_tasks:
            response, data_source_flag, response_faqs = await task

            if data_source_flag == "doc":
                if len(response.keys()) != 0:
                    retrival_res[data_source_flag] = response
                else:
                    pass

                if len(response_faqs) > 0:
                    retrival_faqs.extend(response_faqs)
            else:
                pass

        retrival_config.retrival_slices = retrival_res
        retrival_config.faq_retrival_qas = retrival_faqs

        return retrival_config
