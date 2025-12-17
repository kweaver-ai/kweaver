import uuid
import aiohttp


async def zhipu_search_tool(inputs, props, resource, data_source_config, context=None):
    tool = "web-search-pro"
    url = "https://open.bigmodel.cn/api/paas/v4/tools"
    request_id = str(uuid.uuid4())
    data = {
        "request_id": request_id,
        "tool": tool,
        "stream": False,
        "messages": [{"role": "user", "content": inputs["query"]}],
    }
    headers = {"Authorization": props.get("api_key")}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=data, headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                return result
            else:
                return {"error": f"Request failed with status {response.status}"}
