import asyncio
import json

import aiohttp

from app.common.stand_log import StandLogger
from app.logic.retriever.AS_doc.helper.retrival_helper import random_uuid


class EcoIndexClient:
    def __init__(self, address, port, headers, advanced_config: dict):
        self.ecoindex_url = f"{address}:{port}/api/ecoindex/v1/index/slicefetch"
        self.head_num = advanced_config.get("slice_head_num", 0)
        self.tail_num = advanced_config.get("slice_tail_num", 2)
        self.headers = headers

    async def make_eco_index_request(self, doc_ids, segment_ids):
        doc_info = []
        for doc_id, segment_id in zip(doc_ids, segment_ids):
            doc_info.append(
                {
                    "docid": doc_id,
                    "segmentid": segment_id,
                    "before_step": self.head_num,
                    "after_step": self.tail_num,
                    "key": "docid",  # 内部接口必需
                }
            )
        body = {"index": "anyshare_bot", "doc_info": doc_info}
        StandLogger.info(f"ecoindex_url: {self.ecoindex_url}")
        StandLogger.info(f"ecoindex_body: {body}")
        StandLogger.info(f"ecoindex_headers: {self.headers}")
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.ecoindex_url, json=body, verify_ssl=False, headers=self.headers
            ) as response:
                status_code = response.status
                # breakpoint()
                if status_code != 200:
                    response_data = await response.text()
                    # print("self.ecoindex_url", self.ecoindex_url)
                    # print("body", body)
                    # print("self.headers", self.headers)
                    raise Exception(
                        f"get response from {self.ecoindex_url}: {status_code}, error: {response_data} !"
                    )
                else:
                    response_data = await response.text()
                    # breakpoint()
                    response_data = json.loads(response_data)
                    all_response_data = response_data["result"]
                    all_next_slices = []
                    for segment_id, response_data in zip(
                        segment_ids, all_response_data
                    ):
                        # breakpoint()
                        cur_slice = []
                        for item in response_data["items"]:
                            if item["segment_id"] < segment_id:
                                continue
                            item["father_segment_id"] = segment_id
                            cur_slice.append(item)
                        # print(segment_id, [item['segment_id'] for item in cur_slice])
                        all_next_slices.extend(cur_slice)
            if len(all_next_slices) > 0:
                StandLogger.info("ecoindex结束")
                return all_next_slices
            else:
                body = {"index": "anyshare_slice_vector", "doc_info": doc_info}
                StandLogger.info(f"ecoindex_body: {body}")
                async with session.post(
                    self.ecoindex_url, json=body, verify_ssl=False, headers=self.headers
                ) as response:
                    status_code = response.status
                    # breakpoint()
                    if status_code != 200:
                        response_data = await response.text()
                        # print("self.ecoindex_url", self.ecoindex_url)
                        # print("body", body)
                        # print("self.headers", self.headers)
                        raise Exception(
                            f"get response from ecoindex: {status_code}, error: {response_data} !"
                        )
                    else:
                        response_data = await response.text()
                        # breakpoint()
                        response_data = json.loads(response_data)
                        all_response_data = response_data["result"]
                        all_next_slices = []
                        for segment_id, response_data in zip(
                            segment_ids, all_response_data
                        ):
                            # breakpoint()
                            cur_slice = []
                            for item in response_data["items"]:
                                if item["segment_id"] < segment_id:
                                    continue
                                item["father_segment_id"] = segment_id
                                cur_slice.append(item)
                            # print(segment_id, [item['segment_id'] for item in cur_slice])
                            all_next_slices.extend(cur_slice)
                        StandLogger.info("ecoindex结束")
                        return all_next_slices

    async def ado_get_next_slice(self, doc_ids, segment_ids):
        task = asyncio.create_task(self.make_eco_index_request(doc_ids, segment_ids))
        tmp_response = await task
        for item in tmp_response:
            cur_uuid = random_uuid()
            item["uuid"] = cur_uuid
        return tmp_response
