import aiohttp


async def generate_image(inputs, props, resource, data_source_config, context=None):
    url = "https://open.bigmodel.cn/api/paas/v4/images/generations"
    data = {
        "model": inputs["model"],
        "prompt": inputs["prompt"],
        "size": inputs.get("size", "1024x1024"),
    }

    if "user_id" in inputs.keys():
        data["user_id"] = inputs["user_id"]
    headers = {"Authorization": props.get("api_key")}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=data, headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                return result
            elif response.status == 400:
                return {"error": "Invalid request parameters"}
            else:
                return {"error": "Internal server error"}
