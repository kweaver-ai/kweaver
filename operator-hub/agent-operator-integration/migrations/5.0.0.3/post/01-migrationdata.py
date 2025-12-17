import json
from typing import Any, Dict, List
import requests
import logging

DATA_URL = 'http://agent-operator-integration:9000/api/agent-operator-integration/internal-v1/upgrade/v5003/migrate-history'
RESOURCE_BIND_URL = 'http://business-system-service:80/internal/api/business-system/v1/resource/batch'
CHUNK_SIZE = 1000
DEFAULT_DOMAIN_ID = 'bd_public'
RESOURCE_TYPE_LIST = ['operator', 'tool_box', 'mcp']

def fetch_dags(resource_type):
    page = 0
    while True:
        params = {'page_size': CHUNK_SIZE, 'page': page, 'resource_type': resource_type}
        try:
            resp = requests.get(url=DATA_URL, params=params, timeout=30)
            resp.raise_for_status()
            result = resp.json()
        except requests.RequestException as e:
            raise

        items = result.get('items')
        if items is None or len(items) == 0:
            break

        batch  = [
            {"bd_id": DEFAULT_DOMAIN_ID, "id": item.get('id'), "type": resource_type}
            for item in items
        ]
        yield batch

        page += 1


def biz_domain_resource_bind(datas: List[Dict[str, Any]]):
    if not datas:
        return

    logging.warning(f"binding {len(datas)} resources...")
    try:
        headers = {"Content-Type": "application/json"}
        resp = requests.post(url=RESOURCE_BIND_URL, headers=headers, data=json.dumps(datas), timeout=30)
        resp.raise_for_status()
    except requests.RequestException as e:
        raise

if __name__ == "__main__":
    for resource_type in RESOURCE_TYPE_LIST:
        for batch in fetch_dags(resource_type):
            biz_domain_resource_bind(batch)
