import asyncio

from app.common.stand_log import StandLogger
from app.common.structs import RetrieverBlock
from app.driven.anyshare.oauth import OAuthService
from app.driven.dip.dp_data_source_service import DpDataSourceService
from app.logic.retriever.AS_doc.retrival_logic import Retrival
from app.utils.text_parser import _get_doc_retriever_output
from app.domain.enum.common.user_account_header_key import (
    get_user_account_id,
    set_user_account_id,
)


async def doc_qa_tool(query: str, props: dict):
    # props = {
    #     "data_source": {
    #         "doc": [
    #             {
    #                 "file_source": "",
    #                 "ds_id": "3",
    #                 "fields": [
    #                     {
    #                         "name": "agent",
    #                         "source": "gns://93B867D279B84F97AED6A2E30095ADED",
    #                     }
    #                 ],
    #             }
    #         ]
    #     },
    #     "headers": {
    #         "token": "ory_at_LJ9y-IoSTKNaSM-AlWGqx0MUeqtglor-1ui1wMlrqrc.CkW3WWQ3ZSWhlLC0RpFhaAGEOAeD1cjbS8Zk4ckJcjg"
    #     }
    # }
    if (
        not props
        or not props.get("data_source")
        or not props.get("data_source").get("doc")
    ):
        res = {
            "text": "",
            "references": [],
        }
        return res

    multi_doc_props = await get_multi_doc_props(props)

    async def single_doc_rag(props, context):
        # 处理数据源相关信息
        for doc in props["data_source"]["doc"]:
            if doc.get("ds_id") and doc["ds_id"] != "0":
                ds_id = doc["ds_id"]
                ds_headers = {}
                user_id = get_user_account_id(props["headers"])
                set_user_account_id(ds_headers, user_id)

                dp_data_source_service = DpDataSourceService(ds_headers)
                ds_info = await dp_data_source_service.get_datasource_by_id(ds_id)

                doc["address"] = ds_info["bin_data"]["host"]
                doc["port"] = ds_info["bin_data"]["port"]
                doc["as_user_id"] = ds_info["bin_data"]["account"]

                oauth_service = OAuthService(
                    ds_info["bin_data"]["host"], ds_info["bin_data"]["port"]
                )

                props["headers"]["as-token"] = await oauth_service.get_token(
                    ds_info["bin_data"]["account"],
                    await dp_data_source_service.decode_password(
                        ds_info["bin_data"]["password"]
                    ),
                )

            else:
                props["headers"]["as-token"] = props["headers"].get("token", "")
                props["headers"]["as-user-id"] = get_user_account_id(props["headers"])

        context = {"query_process": {"query": {"origin_query": query}}}
        doc_rag_res, doc_retrival_config = await doc_rag(props, context)

        return doc_rag_res

    tasks = []
    for props in multi_doc_props:
        tasks.append(
            single_doc_rag(props, {"query_process": {"query": {"origin_query": query}}})
        )

    doc_rag_res_list = await asyncio.gather(*tasks)

    doc_rag_res = []
    for res in doc_rag_res_list:
        doc_rag_res.extend(res)

    plain_text, max_length = _get_doc_retriever_output(
        doc_rag_res,
        max_length=int(
            props["data_source"]
            .get("advanced_config", {})
            .get("doc", {})
            .get("retrieval_max_length", 12288)  # 8k token
        ),
    )

    res = {
        "text": plain_text,
        "references": doc_rag_res,
    }

    return res


async def get_multi_doc_props(props):
    new_props_list = []

    for doc in props["data_source"]["doc"]:
        new_props = {
            "headers": props["headers"],
            "data_source": {
                "doc": [doc],
                "advanced_config": props["data_source"].get("advanced_config", {}),
            },
        }
        new_props_list.append(new_props)

    return new_props_list


async def doc_rag(props, context):
    """文档问答"""
    StandLogger.info_log("开始执行文档召回")

    data_source = props["data_source"]
    headers = props["headers"]

    advanced_config = props.get("advanced_config", {}).get("doc", {})
    knowledge_augment = props.get("knowledge_augment", {})
    query_name = props.get("input", "query")

    query_process = context["query_process"]
    """
    {
        "input_name": {
            "origin_query": "query",
            "rewrite_query": "rewrite_query",
            "augment_query": "augment_query"
        }
    }
    """

    retrival_config = RetrieverBlock()
    retrival_config.headers_info = headers
    if query_name in query_process:
        retrival_config.input = query_process.get(query_name, {})
    else:
        retrival_config.input = {
            "origin_query": str(context.get("variables", {}).get(query_name, ""))
        }

    retrival_config.body["history"] = context.get("retriever_history", [])
    retrival_config.data_source = data_source

    if knowledge_augment.get("enable"):
        retrival_config.augment_data_source = {
            "concepts": [
                {
                    "kg_id": knowledge_augment["data_source"]["kg"][0]["kg_id"],
                    "entities": knowledge_augment["data_source"]["kg"][0]["fields"],
                }
            ]
        }
    else:
        retrival_config.augment_data_source = {
            "concepts": [{"kg_id": "", "entities": []}]
        }

    StandLogger.debug("retrival_config = {}".format(retrival_config.__dict__))
    StandLogger.debug("advanced_config = {}".format(advanced_config))

    retrival = Retrival(advanced_config)
    response = await retrival.ado_retrival(retrival_config=retrival_config)

    # 删除向量信息
    for text in response:
        if not isinstance(text, dict):
            continue

        meta = text.get("meta", {})

        if "embedding" in meta:
            del meta["embedding"]

        for slice in meta.get("slices", []):
            if "embedding" in slice:
                del slice["embedding"]

    # print(response)
    StandLogger.info_log("文档召回结束")
    StandLogger.debug("文档召回结果：{}".format(response))

    if retrival_config.security_token:
        context["security_token"] = retrival_config.security_token

    return response, retrival_config
