import json

import aiohttp

from app.common.stand_log import StandLogger
from app.domain.enum.common.user_account_header_key import (
    get_user_account_id,
    get_user_account_type,
    set_user_account_id,
    set_user_account_type,
)


class GraphRetrieveClient:
    def __init__(self, retrieve_source_config):
        self.retrieve_source_config = retrieve_source_config

    def _build_headers(self, retrieve_config):
        """构建请求headers，包含用户账号信息"""
        headers = {}
        if retrieve_config.get("headers"):
            source_headers = retrieve_config["headers"]
            user_id = get_user_account_id(source_headers)
            account_type = get_user_account_type(source_headers)
            set_user_account_id(headers, user_id)
            set_user_account_type(headers, account_type)
            headers.update(retrieve_config["headers"])
        return headers
    async def aunified_search_prod(
        self, query="", vids=[], recall_type="", concept_field=None
    ):
        retrieve_config = self.retrieve_source_config[recall_type]
        if query:
            retrieve_config["payload"]["query"] = query
            retrieve_config["payload"]["kgs"][0]["entities"] = concept_field
        elif vids:
            retrieve_config["payload"]["vids"] = vids

            v_filters = []
            for idx, concept in enumerate(concept_field):
                if idx == 0:
                    v_filters.append(
                        {
                            "relation": "and",
                            "tag": concept,
                            "type": "satisfy_all",
                            "property_filters": [],
                        },
                    )
                else:
                    v_filters.append(
                        {
                            "relation": "or",
                            "tag": concept,
                            "type": "satisfy_all",
                            "property_filters": [],
                        },
                    )

            retrieve_config["payload"]["filters"][0]["v_filters"] = v_filters

        request_url = retrieve_config["url"]
        payload = retrieve_config["payload"]
        headers = self._build_headers(retrieve_config)
        StandLogger.info(f" --------- retrieve config:{retrieve_config} -----------")
        StandLogger.info(f"aunified_search_prod request_url: {request_url}")
        StandLogger.info(f"aunified_search_prod payload: {payload}")
        StandLogger.info(f"aunified_search_prod headers: {headers}")
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=300)
        ) as session:
            async with session.post(
                request_url, json=payload, headers=headers, ssl=False
            ) as response:
                status_code = response.status
                if status_code != 200:
                    response_data = await response.text()
                    raise Exception(
                        f"---- GraphRetrieveClientError: {response_data} ----"
                    )
                else:
                    response_data = await response.text()
                    response_data = json.loads(response_data, strict=False)
                    StandLogger.info("aunified_search_prod 结束")
                    return response_data

    async def aunified_search(
        self, query="", vids=[], recall_type="", concept_field=None, entity_size=None
    ):
        retrieve_config = self.retrieve_source_config[recall_type]

        if query:
            retrieve_config["payload"]["query"] = query
            retrieve_config["payload"]["kgs"][0]["entities"] = concept_field
            if entity_size is not None:
                retrieve_config["payload"]["size"] = entity_size
        elif vids:
            retrieve_config["payload"]["vids"] = vids
            v_filters = []
            for idx, concept in enumerate(concept_field):
                if idx == 0:
                    v_filters.append(
                        {
                            "relation": "and",
                            "tag": concept,
                            "type": "satisfy_all",
                            "property_filters": [],
                        },
                    )
                else:
                    v_filters.append(
                        {
                            "relation": "or",
                            "tag": concept,
                            "type": "satisfy_all",
                            "property_filters": [],
                        },
                    )
            retrieve_config["payload"]["filters"][0]["v_filters"] = v_filters

        request_url = retrieve_config["url"]
        payload = retrieve_config["payload"]
        headers = self._build_headers(retrieve_config)
        StandLogger.info(f"aunified_search request_url: {request_url}")
        StandLogger.info(f"aunified_search payload: {payload}")
        StandLogger.info(f"aunified_search headers: {headers}")
        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=300)
            ) as session:
                async with session.post(
                    request_url, json=payload, headers=headers, ssl=False
                ) as response:
                    status_code = response.status
                    if status_code != 200:
                        response_data = await response.text()
                        raise Exception(f"{response_data}")
                    else:
                        response_data = await response.text()
                        response_data = json.loads(response_data, strict=False)
                        StandLogger.info("aunified_search 结束")
                        return response_data
        except Exception as e:
            raise Exception(f"---- GraphRetrieveClientError: {e} ----")
