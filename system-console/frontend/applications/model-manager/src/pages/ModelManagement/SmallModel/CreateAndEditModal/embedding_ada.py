"""
1.入口函数必须是main
2.函数仅接受一个参数，参数类型为list[str]
3.函数必须写异步函数async，避免阻塞，调用向量模型服务需要使用aiohttp发送http请求
"""
import time
import aiohttp
import json
import uuid

async def main(texts: list[str]):
    # 调用embedding服务
    url = "http://127.0.0.1:8316/v1/embeddings"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer **************************"
    }
    payload = {"texts": texts}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload, headers=headers) as resp:
            if resp.status != 200:
                raise Exception(f"Embedding API failed with status {resp.status}")
            embeddings = await resp.json()
    # 构建标准openai风格响应体
    response = {
        "object": "list",
        "data": [{
            "object": "embedding",
            "embedding": emb,
            "index": i
        } for i, emb in enumerate(embeddings)],
        "model": "custom",
        "usage": {
            "prompt_tokens": len(texts),
            "total_tokens": len(texts)
        },
        "id": f"infinity-{str(uuid.uuid4())}",
        "created": int(time.time())
    }
    return response

