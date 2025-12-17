import copy
import json
from typing import Dict, List

import aiohttp

from app.common.stand_log import StandLogger
from app.common.structs import RetrieverBlock
from app.logic.retriever.AS_doc.helper.constant import (
    RetrieveDataGranularity,
    RetrieveDataType,
    RetrieveMethod,
    RetrieveSourceType,
)
from app.logic.retriever.AS_doc.helper.retrival_helper import (
    BaseRetrieveData,
    DocLibOpenSearchRetrieveData,
)
from app.logic.retriever.AS_doc.model.embedding_handler import EmbeddingHandler
from app.domain.enum.common.user_account_header_key import get_user_account_id


class EcoSearchClient:
    def __init__(self, address, port, advanced_config: dict):
        self.embedding_handler = EmbeddingHandler()
        self.ecosearch_url = f"{address}:{port}/api/ecosearch/v1/slice-search"
        self.headers_default = {
            "as-client-id": "34126adb-867b-458f-8b11-aecc771cdc4f",
            "as-client-type": "web",
            "as-user-id": "",
            "as-user-ip": "XXX",
            "as-visitor-type": "realname",
        }
        self.retrieval_slices_num = advanced_config.get("retrieval_slices_num", 150)

    async def mixed_search(self, retrival_config: RetrieverBlock, source_key):
        all_response = {}

        if (
            "augment_query" in retrival_config.processed_query.keys()
            and len(retrival_config.processed_query["augment_query"].get_content()) > 0
        ):
            key = "augment_query"

        elif (
            "rewrite_query" in retrival_config.processed_query.keys()
            and len(retrival_config.processed_query["rewrite_query"].get_content()) > 0
        ):
            key = "rewrite_query"

        else:
            key = "origin_query"

        value = retrival_config.processed_query[key]

        # 处理payload
        payload = {"limit": self.retrieval_slices_num}
        types = retrival_config.headers_info.get(
            "as-item-output-type", "faq,doc,wikidoc"
        )
        payload["item_output_type"] = types.split(",")
        payload["item_output_detail"] = {"field": "title"}
        payload["text"] = value.get_content()
        payload["embedding"] = value.get_embedding()
        payload["ranges"] = []
        payload["faq_article_ids"] = []
        payload["wiki_article_ids"] = []
        payload["bot_rev"] = ""

        StandLogger.info("data_source:", retrival_config.data_source)
        for item in retrival_config.data_source[source_key]:
            # 确定搜索范围
            if item["ds_id"] == "0" and len(item.get("datasets", [])) > 0:
                # 内置数据源使用datasets
                payload["bot_rev"] = item["datasets"][0]
                payload.pop("ranges")
                payload.pop("faq_article_ids")
                payload.pop("wiki_article_ids")
            else:
                if "fields" in item.keys() and item["fields"]:
                    for field in item["fields"]:
                        if not field["source"].startswith("gns://"):
                            field["source"] = "gns://" + field["source"]
                        if not field["source"].endswith("*"):
                            field["source"] = field["source"] + "*"
                        payload["ranges"].append(field["source"])

                if item.get("faq_article_ids"):
                    payload["faq_article_ids"].extend(item.get("faq_article_ids"))
                if item.get("wiki_article_ids"):
                    payload["wiki_article_ids"].extend(item.get("wiki_article_ids"))

                if (
                    len(payload["ranges"]) == 0
                    and len(payload["faq_article_ids"]) == 0
                    and len(payload["wiki_article_ids"]) == 0
                ):
                    # range/faq/doc都没有的情况下才用datasets
                    if "datasets" in item.keys() and item["datasets"]:
                        if item["datasets"][0] == "*":
                            payload["bot_rev"] = ""
                        else:
                            payload["bot_rev"] = item["datasets"][0]
                        payload.pop("ranges")
                        payload.pop("faq_article_ids")
                        payload.pop("wiki_article_ids")

            # 确定用户角色
            if item["ds_id"] == "0":
                # 内容数据湖 普通用户接入
                authorization = retrival_config.headers_info.get(
                    "authorization", ""
                ) or "Bearer " + retrival_config.headers_info.get("token", "")
                as_user_id = get_user_account_id(retrival_config.headers_info) or ""
                as_client_id = retrival_config.headers_info.get(
                    "as-client-id"
                ) or self.headers_default.get("as-client-id")
                as_visitor_type = retrival_config.headers_info.get(
                    "as-visitor-type"
                ) or self.headers_default.get("as-visitor-type")
            else:
                # 外部数据源 应用账户接入
                authorization = "Bearer " + retrival_config.headers_info.get(
                    "as-token", ""
                )
                as_user_id = (
                    retrival_config.headers_info.get("as-user-id")
                    or retrival_config.data_source[source_key][0]["as_user_id"]
                )
                as_client_id = as_user_id
                as_visitor_type = "business"
        # 处理headers
        new_headers = {
            "Authorization": authorization,
            "as-user-id": as_user_id,
            "as-user-ip": retrival_config.headers_info.get("as-user-ip")
            or self.headers_default.get("as-user-ip"),
            "as-client-id": as_client_id,
            "as-client-type": retrival_config.headers_info.get("as-client-type")
            or self.headers_default.get("as-client-type"),
            "as-visitor-type": as_visitor_type,
        }

        # 发送请求
        # logger.info(f"Requesting {search_api}...")
        StandLogger.info(
            "ecosearch payload: {}".format(json.dumps(payload, ensure_ascii=False))
        )
        StandLogger.info("ecosearch url: {}".format(self.ecosearch_url))
        StandLogger.info("ecosearch headers: {}".format(new_headers))
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.ecosearch_url, json=payload, headers=new_headers, ssl=False
            ) as response:
                status_code = response.status

                if status_code != 200:
                    response_data = await response.text()
                    StandLogger.error("ecosearch slice-search error: " + response_data)
                    raise Exception(
                        f"get response from {self.ecosearch_url}: {status_code}, error: {response_data} !"
                    )
                else:
                    response_data = await response.text()
                    response_data = json.loads(response_data, strict=False)
                    response_data["doc"]["dense_results"] = response_data["doc"][
                        "dense_results"
                    ][:150]
                    response_data["doc"]["sparse_results"] = response_data["doc"][
                        "sparse_results"
                    ][:150]

                    do_remove_duplicates = False
                    if do_remove_duplicates:
                        response_data = await self.sizer(
                            response_data, 25, 25, do_remove_duplicates
                        )

                    # logger.info(f"Finished Requesting {search_api}...")
                    all_response[key] = response_data
                    # Feature-736016 百胜召回支持外置后过滤功能&文件安全扫描
                    # 拿到token
                    for doc in response_data.get("doc", {}).get(
                        "dense_results", []
                    ) + response_data.get("doc", {}).get("sparse_results", []):
                        security_token = doc.get("security_token")
                        if security_token:
                            retrival_config.security_token.add(security_token)

        StandLogger.info("ecosearch结束")
        return all_response

    async def ado_mixed_retrival(self, retrival_config: RetrieverBlock, source_key):
        retrival_config = await self.embedding_handler.ado_embedding(retrival_config)

        response_datas = await self.mixed_search(retrival_config, source_key)

        retrieval_content = False

        for key, value in response_datas.items():
            if len(value.get("doc", {}).get("dense_results", [])) != 0:
                retrieval_content = True
            if len(value.get("doc", {}).get("sparse_results", [])) != 0:
                retrieval_content = True
            if len(value.get("faq", [])) != 0:
                retrieval_content = True

        if not retrieval_content:
            StandLogger.info("ecosearch retrieval nothing!")

        all_res = {}
        all_faqs = []

        for key, response_data in response_datas.items():
            response_faqs = response_data.get("faq", None)
            if response_faqs is not None:
                all_faqs.extend(response_faqs)
            else:
                StandLogger.info("retrival without faqs!")

            response_datas = response_data.get("doc", None)
            if response_datas is not None:
                sparse_res, dense_res = await self.process_response(
                    retrival_config, response_datas, key
                )

                res = {}
                if sparse_res != "No doc slices!":
                    res["sparse_res"] = sparse_res
                if dense_res != "No doc slices!":
                    res["dense_res"] = dense_res
                if len(res.keys()) != 0:
                    all_res[key] = res
                else:
                    pass
            else:
                StandLogger.info("retrival without docs!")

        # retrival_config.retrival_slices[key] = {}
        # retrival_config.retrival_slices[key]['sparse_res'] = sparse_res
        # retrival_config.retrival_slices[key]['dense_res'] = dense_res
        return all_res, source_key, all_faqs

    async def process_response(
        self, retrival_config: RetrieverBlock, response_data, key
    ):
        cur_query = retrival_config.processed_query[key].get_content()
        cur_query_md5 = retrival_config.processed_query[key].get_md5()

        sparse_res = {cur_query_md5: []}
        dense_res = {cur_query_md5: []}

        sparse_base_info = BaseRetrieveData(
            retrieve_string=cur_query,
            retrieve_string_md5=cur_query_md5,
            retrieve_source_type=RetrieveSourceType.DOC_LIB,
            retrieve_method=RetrieveMethod.SPARSE_RETRIEVE,
            data_type=RetrieveDataType.COMMON_DOCUMENT,
            data_granularity=RetrieveDataGranularity.SLICE,
            has_score=True,
        )

        _result = await self.parse_response(
            response_data,
            RetrieveMethod.SPARSE_RETRIEVE,
            copy.deepcopy(sparse_base_info),
        )

        if _result == "No doc slices!":
            sparse_res = "No doc slices!"
        else:
            sparse_res[cur_query_md5] = _result

        dense_base_info = BaseRetrieveData(
            retrieve_string=cur_query,
            retrieve_string_md5=cur_query_md5,
            retrieve_source_type=RetrieveSourceType.DOC_LIB,
            retrieve_method=RetrieveMethod.DENSE_RETRIEVE,
            data_type=RetrieveDataType.COMMON_DOCUMENT,
            data_granularity=RetrieveDataGranularity.SLICE,
            has_score=True,
        )

        _result = await self.parse_response(
            response_data, RetrieveMethod.DENSE_RETRIEVE, copy.deepcopy(dense_base_info)
        )

        if _result == "No doc slices!":
            dense_res = "No doc slices!"
        else:
            dense_res[cur_query_md5] = _result

        return sparse_res, dense_res

    async def parse_response(
        self,
        response_data: Dict,
        retrieve_method: RetrieveMethod,
        base_info: BaseRetrieveData,
    ) -> List[BaseRetrieveData]:
        retrieve_datas = []
        hits = []
        if retrieve_method == RetrieveMethod.SPARSE_RETRIEVE:
            hits = response_data.get("sparse_results")
        elif retrieve_method == RetrieveMethod.DENSE_RETRIEVE:
            hits = response_data.get("dense_results")

        # breakpoint()
        if hits is not None:
            for idx, hit in enumerate(hits):
                retrieve_datas.append(
                    DocLibOpenSearchRetrieveData(
                        **base_info.model_dump(),
                        doc_lib_type=hit.get("doc_lib_type", ""),
                        belong_doc_id=hit.get("belong_doc_id"),
                        belong_doc_path=hit.get("belong_doc_path"),
                        belong_doc_name=hit.get("belong_doc_name"),
                        raw_text=hit.get("raw_text"),
                        belong_doc_mimetype=hit.get("belong_doc_mimetype"),
                        belong_doc_ext_type=hit.get("belong_doc_ext_type"),
                        belong_doc_parent_path=hit.get("belong_doc_parent_path"),
                        belong_doc_size=hit.get("belong_doc_size"),
                        belong_doc_md5=hit.get("belong_doc_md5"),
                        belong_doc_page=hit.get("belong_doc_page", 0),
                        embedding=hit.get("embedding"),
                        segment_id=hit.get("segment_id"),
                        md5=hit.get("md5"),
                        score=hit.get("score"),
                        uuid=hit.get("id"),
                        pages=hit.get("pages", []),
                    )
                )
            return retrieve_datas
        else:
            return "No doc slices!"
