import aiohttp
import json
from typing import List


# TODO: 需要迁移到ecoindex-service
class EcoIndexClient:
    """for wikidoc and docs auth filter"""

    def __init__(self):
        self.base_url = "/api/ecoindex/v1/file-perm-check?perm=preview"
        self.headers = {
            "Content-Type": "application/json",
            "as-user-id": "",
            "as-user-ip": "XXX",
            "as-client-type": "web",
            "as-visitor-type": "realname",
            "as-client-id": "34126adb-867b-458f-8b11-aecc771cdc4f",
        }

    async def auth_filter(
        self, object_ids: List[str] = [], wikidoc_ids: List[str] = [], **kwargs
    ):
        self.request_url = f"{kwargs['address']}:{kwargs['port']}{self.base_url}"
        self.headers["as-user-id"] = kwargs["as_user_id"]
        payload = {}
        if object_ids:
            payload["object_ids"] = object_ids
        if wikidoc_ids:
            payload["wikidoc_ids"] = wikidoc_ids

        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=300)
        ) as session:
            async with session.post(
                self.request_url, json=payload, headers=self.headers, verify_ssl=False
            ) as response:
                status_code = response.status
                if status_code != 200:
                    response_data = await response.text()
                    raise Exception(
                        f"get response from ecoindex:{self.request_url}, status_code:{status_code}, error: {response_data} !"
                    )
                else:
                    response_data = await response.text()
                    response_data = json.loads(response_data)
                    return response_data
