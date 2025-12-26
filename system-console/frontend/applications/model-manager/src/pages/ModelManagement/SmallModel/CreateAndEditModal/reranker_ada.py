"""
1.入口函数必须是main
2.函数接受两个参数，第一个参数为query字符串，数据类型：str,第二个参数为文档列表，参数类型为list[str]
3.函数必须写异步函数async，避免阻塞，调用向量模型服务需要使用aiohttp发送http请求
"""
import time
import aiohttp
import json
import uuid


async def main(query: str, documents: list[str]):
    # 调用reranker服务
    url = "http://127.0.0.1:8343/v1/reranker"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer **************************"
    }
    payload = {
        "query": query,
        "slices": documents
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload, headers=headers) as resp:
            if resp.status != 200:
                raise Exception(f"Reranker API failed with status {resp.status}")
            scores = await resp.json()
    # 构建标准openai风格响应体
    response = {
        "object": "rerank",
        "results": sorted([
            {
                "relevance_score": score,
                "index": idx,
                "document": None
            } for idx, score in enumerate(scores)
        ], key=lambda x: x["relevance_score"], reverse=True),
        "model": "custom",
        "usage": {
            "prompt_tokens": len(query) + sum(len(d) for d in documents),
            "total_tokens": len(query) + sum(len(d) for d in documents)
        },
        "id": f"infinity-{str(uuid.uuid4())}",
        "created": int(time.time())
    }
    return response
