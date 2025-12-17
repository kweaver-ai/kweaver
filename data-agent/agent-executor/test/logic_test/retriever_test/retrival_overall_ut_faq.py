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
add_to_sys_path("/root/Young/programs/agent-executor/717677-new/agent-executor")

from app.common.structs import RetrieverBlock
from app.logic.retriever.AS_doc.retrival_logic import Retrival

retrival_config = RetrieverBlock()
# XXX的headers
# retrival_config.headers_info = {
#     'host': 'intelli-qa:8887', 'user-agent': 'Go-http-client/1.1', 'content-length': '3899',
#     'appid': 'Nr9Sb40T3HqpedSPVnl',
#     'appkey': 'YWQ1MzE4YzE5YTA1ZTJiOTc1NzI3ZDkwNTRhMDk5Yjk4MGVkZjExZGVlY2YyNGFhNzVlMTQxMTU4MmIzNDMxZg==',
#     'as-client-id': 'e975d6bb-9b6b-4334-ad6d-62bc489ab81a', 'as-client-type': 'android',
#     'as-user-id': '423f8a16-d793-11ee-90be-be771b953129', 'as-user-ip': 'XXX', 'as-visitor-type': 'realname',
#     'timestamp': '1721613593', 'accept-encoding': 'gzip'
# }

# XXX的headers
retrival_config.headers_info = {
    "host": "agent-executor:30778",
    "user-agent": "Go-http-client/1.1",
    "content-length": "2982",
    "cache-control": "no-cache",
    "connection-type": "keep-alive",
    "token": "ory_at_Svi_ajr6CQ7hnFBdyaOd5scptZfEq3j2Zx-czaU35s8.ZwQaUATxf5jwuxUcCUTFzTuRt7snTJK7A5XqaRR-qtQ",
    "userid": "7a5c9324-44cd-11ef-b4dc-663f094b27c2",
    "x-accel-buffering": "no",
    "accept-encoding": "gzip",
}

retrival_config.body = {
    "messages": [{"content": "新建FAQ2323", "role": "user"}],
    "extra_args": {"times": 1, "as_user_token": ""},
    "response_form": "event_stream",
}  # query 重写需要，需要通过运行接口传入
retrival_config.input = {"origin_query": "新建FAQ2323"}
retrival_config.data_source = {
    "doc": [
        {
            "file_source": "",
            "ds_id": "67",
            "datasets": ["111111"],
            "input_variable": None,
            "address": "https://XXX",
            "port": 443,
            "as_user_id": "3c3f1e10-c5d1-11ef-8e7c-a2171c07f40a",
            "disabled": False,
        }
    ]
}
retrival_config.augment_data_source = {
    "concepts": [{"kg_id": "4", "entities": ["custom_subject"]}]
}

retrival = Retrival()

import asyncio


async def main():
    response = await retrival.ado_retrival(retrival_config=retrival_config)
    print(response)


asyncio.run(main())
