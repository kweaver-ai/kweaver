import json
from typing import Any, Dict, List
import requests
import logging

DATA_URL = 'http://flow-automation-private:8680/api/automation/v1/history-dags'
RESOURCE_BIND_URL = 'http://business-system-service:80/internal/api/business-system/v1/resource/batch'
CHUNK_SIZE = 1000
DEFAULT_DOMAIN_ID = 'bd_public'
RESOURCE_TYPE = 'data_flow'

def fetch_dags():
    page = 0
    while True:
        params = {'limit': CHUNK_SIZE, 'page': page}
        try:
            resp = requests.get(url=DATA_URL, params=params, timeout=30)
            resp.raise_for_status()
            result = resp.json()
        except requests.RequestException as e:
            raise

        items = result.get('items')
        if not items:
            break

        batch  = [
            {"bd_id": DEFAULT_DOMAIN_ID, "id": f"{item.get('id')}:{item.get('type')}", "type": RESOURCE_TYPE}
            for item in items
            if item.get('type') != 'combo-operator'
        ]
        yield batch

        page += 1


def biz_domain_resource_bind(datas: List[Dict[str, Any]]):
    """批量绑定业务域资源"""
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
    for batch in fetch_dags():
        biz_domain_resource_bind(batch)
