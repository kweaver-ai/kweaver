import json

import aiohttp
from typing import List

from app.common.config import Config


class GraphAugmentClient:
    def __init__(self):
        self.client_url = f"http://{Config.services.search_engine.host}:{Config.services.search_engine.port}/api/kn-search-engine/v0/full_text_search"
        self.headers = {"isauth": "False"}
        self.body = {
            "query": "",
            "page": 1,
            "size": 100,
            "bm25_weight": "0.05",
            "phrase_match_weight": "1",
            "kgs": [],
        }

    async def ado_client(self, query: str, concepts: List):
        self.body["query"] = query
        self.body["kgs"] = concepts
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.client_url, json=self.body, headers=self.headers
            ) as response:
                entities = await response.text()
                entities = json.loads(entities, strict=False)
                return entities
