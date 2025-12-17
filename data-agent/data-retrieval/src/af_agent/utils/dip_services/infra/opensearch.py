# -*- coding: utf-8 -*-
# calling opensearch api
#
# @Time: 2024/01/15
# @Author: Xavier.chen
# @File: infra/opensearch.py
import json
import asyncio
import aiohttp
import requests
from af_agent.utils.dip_services.sdk_error import DIPServiceError, Errno
from af_agent.settings import get_settings

settings = get_settings()


OS_HTTP_MAX_INITIAL_LINE_LENGTH = 16384


class OpenSearch(object):
    """
    OpenSearch Connect and Search API
    """

    def __init__(
        self,
        ip: str = None,
        port: int = None,
        user: str = None,
        password: str = None
    ):
        """
        Initialize a Connector
        :param ips: stand-alone service ip or distributed service ips
        :param ports: stand-alone service port or distributed service ports
        :param user: username to connect the service
        :param password: user password to connect the service
        """
        
        self.ip = settings.AD_OPENSEARCH_HOST if ip is None else ip
        self.port = settings.AD_OPENSEARCH_PORT if port is None else port
        self.user = settings.AD_OPENSEARCH_USER if user is None else user
        self.password = settings.AD_OPENSEARCH_PASS if password is None else password

        self.headers = {
            "Accept-Encoding": "gzip,deflate",
            "Content-Type": "application/json",
            "Connection": "close"
        }

        self.pre_url = 'http://{ip}:{port}/'.format(ip=self.ip, port=self.port)

    async def execute(self, url, body=None, timeout=300.0, verify=False):
        """
        execute a query
        """
        timeout = aiohttp.ClientTimeout(total=timeout)
        auth = aiohttp.BasicAuth(login=self.user, password=self.password)
        async with aiohttp.ClientSession(auth=auth) as session:
            url = self.pre_url + url
            if len(url) > OS_HTTP_MAX_INITIAL_LINE_LENGTH:
                raise Exception("Opensearch supports a maximum URL length of 16k, with too many indexes exceeding the "
                                "maximum length.")
            if '_msearch' in url:
                response = await session.get(url, timeout=timeout, data=body, verify_ssl=verify, headers=self.headers)
            elif body:
                response = await session.get(url, timeout=timeout, json=body, verify_ssl=verify, headers=self.headers)
            else:
                response = await session.get(url, timeout=timeout, verify_ssl=verify, headers=self.headers)
            result = await response.content.read()

            result = json.loads(result.decode(), strict=False)
            
            if int(response.status / 100) != 2:
                raise DIPServiceError(
                    response.status,
                    Errno.OPEN_SEARCH_ERROR,
                    response.reason,
                    url=url,
                    detail=result
                )
        return result

    def naexecute(self, url, body=None, timeout=300.0, verify=False):
        """
        execute a query
        """
        url = self.pre_url + url
        auth = (self.user, self.password)
        if len(url) > OS_HTTP_MAX_INITIAL_LINE_LENGTH:
            raise Exception("Opensearch supports a maximum URL length of 16k, with too many indexes exceeding the "
                            "maximum length.")
        if '_msearch' in url:
            response = requests.get(
                url=url,
                timeout=timeout,
                verify=verify,
                auth=auth,
                headers=self.headers,
                data=body
            )
        elif body:
            response = requests.get(url, auth=auth,timeout=timeout, json=body, verify=verify, headers=self.headers)
        else:
            response = requests.get(url, auth=auth,timeout=timeout, verify=verify, headers=self.headers)
        if int(response.status_code / 100) == 2:
            return response.json()
        try:
            detail = response.json()
        except requests.exceptions.JSONDecodeError:
            detail = {}

        raise DIPServiceError(
                response.status_code,
                Errno.OPEN_SEARCH_ERROR,
                response.reason,
                url=url,
                detail=detail
            )
    async def search(self, query="", page=1, size=10, indexs=None, fields=None, max_return_num=1000):
        outputs = {}
        if indexs is None:
            raise Exception("The opensearch index cannot be empty.")
        if fields is None:
            fields = ["_id"]
        if not indexs:
            outputs["count"] = 0
            outputs["entities"] = []
            return outputs
        url = ",".join(set(indexs)) + "/_search"
        body = {
            "query": {
                "bool": {
                    "must": {
                        "multi_match": {
                            "type": "best_fields",
                            "query": query.strip(),
                            "analyzer": "hanlp",
                            "boost": 0.5
                        }
                    },
                    "should": {
                        "multi_match": {
                            "type": "phrase",
                            "query": query.strip(),
                            "boost": 2,
                            "analyzer": "hanlp"
                        }
                    }
                }
            },
            "from": (page - 1) * size,
            "size": size
        }
        entities = []
        results = await self.execute(url=url, body=body)
        total = min(max_return_num, results.get("hits", {}).get("total", {}).get("value", 0))
        for line in results.get("hits", {}).get("hits", []):
            temp = {}
            temp["vid"] = line["_id"]
            temp["score"] = float('{:.2f}'.format(line["_score"]))
            temp["_index"] = line["_index"]
            entities.append(temp)
        outputs["count"] = total
        outputs["entities"] = entities
        return outputs


if __name__ == "__main__":
    opensearch = OpenSearch(
        ip="10.4.109.199",
        port=9200,
        user="admin",
        password="eisoo.com123"
    )
    # opensearch = OpenSearch()
    
    # body = {
    #     "query": {
    #         "multi_match": {
    #             "type": "best_fields",
    #             "query": "GBT 20010-2005 信息安全技术 包过滤防火端评估准则"
    #         }
    #     },
    #     "_source": ["passage", "doc_name"],
    #     "from": 0,
    #     "size": 10
    # }

    body={
        "query": {
            "bool": {
                "must": [
                    {"terms": {"target_channel.keyword": ["客户", "电商"]}},
                    {"terms": {"area_1_region.keyword": ["中部大区", "北部大区"]}}
                ]
            }
        }
    }
    res = asyncio.run(
        opensearch.aexecute(
            url="udeebb932765511efa0955243e12aba71-9_*/_search",
            body=body
        )
    )
    # res = opensearch.execute(
    #         url="udeebb932765511efa0955243e12aba71-9_*/_search",
    #         body=body,
    #         verify=True
    #     )
    #
    print(res)
