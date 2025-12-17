import sys

import aiohttp

import af_agent.tools.graph_tools.common.stand_log as log_oper
from af_agent.tools.graph_tools.common.stand_log import StandLogger


class EcoIndexClient:
    """for wikidoc and docs auth filter
    """

    def __init__(self, address, port, as_user_id, token):
        self.base_url = f"{address}:{port}"
        self.headers = {
            "Content-Type": "application/json",
            "as-user-id": as_user_id,
            "as-user-ip": "10.4.35.242",
            "as-client-type": "web",
            "as-visitor-type": "realname",
            "as-client-id": "34126adb-867b-458f-8b11-aecc771cdc4f",
            "Authorization": 'Bearer ' + token
        }

    async def get_full_text(self, doc_id):
        request_url = f"{self.base_url}/api/ecoindex/v1/subdocfetch/full_text"
        payload = {
            "doc_id": doc_id,
            "external": True
        }
        StandLogger.info_log(f'subdocfetch request_url: {request_url}')
        StandLogger.info_log(f'subdocfetch payload: {payload}')
        StandLogger.info_log(f'subdocfetch headers: {self.headers}')
        async with aiohttp.ClientSession() as session:
            async with session.post(request_url, json=payload, headers=self.headers, verify_ssl=False) as response:
                status_code = response.status
                if status_code != 200:
                    err = request_url + " get_full_text error: {}".format(await response.text())
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise Exception(err)
                    # return ''
                    # return err
                resp = await response.json()
                '''
                {
                    "doc_id": "525F15FAA5A14428B43D40DC9FFD5E23",
                    "security_mark": "officia et ea minim",
                    "version": "897981BF180B4C419D6A49E0C05F0350",
                    "status": "completed",
                    "url": "https://10.4.131.229:443/Miachen/0606f1b1-78d9-4828-9ac2-5aedc032e90c/897981BF180B4C419D6A49E0C05F0350/sub/66e9f87602d31d3e70618182f246325c?AWSAccessKeyId=Miachen&Expires=1726881780&Signature=blygHGniqQ14%2fj1oczctSdLxMJA%3d"
                }
                '''
                if resp['status'] != 'completed':
                    err = request_url + " get_full_text error: {}".format('file is not ready.')
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise Exception(err)
                    # return ''
                    # return err
                download_url = resp['url']
                security_token = resp.get('security_mark', '')
            async with session.get(download_url, ssl=False) as response:
                if response.status != 200:
                    err = request_url + " get_full_text error: {}".format('download file error')
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise Exception(err)
                    # return ''
                    # return err
                return await response.text(), security_token
