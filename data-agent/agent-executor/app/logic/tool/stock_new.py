import aiohttp


async def get_company_profile(token, stock_codes):
    url = "https://open.lixinger.com/api/cn/company/profile"
    headers = {"Content-Type": "application/json"}
    payload = {"token": token, "stockCodes": stock_codes}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload, headers=headers) as response:
            if response.status == 200:
                return await response.json()
            else:
                response.raise_for_status()


async def stock_new(inputs, props, resource, data_source_config, context=None):
    return await get_company_profile(inputs["token"], inputs["stock_codes"])
