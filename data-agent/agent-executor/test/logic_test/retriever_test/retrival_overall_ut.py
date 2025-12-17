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
    "token": "ory_at_xkCvzGJXHBF1NRHvFE3Gao9vcFgoaivJKEhyb8HnF-c.A_GPuXT0MSN5RcS2y43jQCBK_8S5WPQ9GU50BKzFiD4",
    "userid": "7a5c9324-44cd-11ef-b4dc-663f094b27c2",
    "x-accel-buffering": "no",
    "accept-encoding": "gzip",
}

retrival_config.body = {
    "messages": [{"content": "邻苯法货源商谈价格", "role": "user"}],
    "extra_args": {"times": 1, "as_user_token": ""},
    "response_form": "event_stream",
}  # query 重写需要，需要通过运行接口传入
retrival_config.input = {"origin_query": "邻苯法货源商谈"}
retrival_config.data_source = {
    "doc": [
        {
            "address": "https://XXX",
            "port": "443",
            "as_user_id": "7a5c9324-44cd-11ef-b4dc-663f094b27c2",
            "ds_id": 1,
            "ds_name": "部门文档库",  # 保存时不传，返回时返回
            "fields": [
                {
                    "name": "情报分析",
                    "path": "部门文档库test/情报分析",
                    "source": "gns://9E52CC2501B3436FA25A696C38C4470A/69CBF403418545C59CF7B20E5521C06F",
                }
            ],
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
