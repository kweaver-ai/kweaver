# -*- coding: utf-8 -*-
import sys

import aiohttp

import af_agent.tools.graph_tools.common.stand_log as log_oper
from af_agent.tools.graph_tools.common import errors
from af_agent.tools.graph_tools.common.errors import CodeException
from af_agent.tools.graph_tools.common.stand_log import StandLogger


class OpenDocService(object):
    def __init__(self, address, port):
        # self._host = Config.HOST_Open_Doc
        # self._port = '30998'
        self._basic_url = '{}:{}'.format(address, port)
        self.headers = {}

    async def get_full_text(self, doc_id):
        '''
        https://confluence.aishu.cn/pages/viewpage.action?pageId=230670884
        '''
        url = self._basic_url + "/api/open-doc/v1/subdoc/full_text"
        body = {
            "doc_id": doc_id
        }
        async with aiohttp.ClientSession() as session:
            StandLogger.info("get_full_text url: {}".format(url))
            StandLogger.info("get_full_text body: {}".format(body))
            StandLogger.info("get_full_text headers: {}".format(self.headers))
            async with session.post(url, json=body, headers=self.headers, ssl=False) as response:
                if response.status != 200:
                    err = self._basic_url + " get_full_text error: {}".format(await response.text())
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise Exception(err)
                    # return ''
                    # return err
                resp = await response.json()
                '''
                {
                    "doc_id": "525F15FAA5A14428B43D40DC9FFD5E23",
                    "version": "897981BF180B4C419D6A49E0C05F0350",
                    "status": "completed",
                    "url": "https://10.4.131.229:443/Miachen/0606f1b1-78d9-4828-9ac2-5aedc032e90c/897981BF180B4C419D6A49E0C05F0350/sub/66e9f87602d31d3e70618182f246325c?AWSAccessKeyId=Miachen&Expires=1726881780&Signature=blygHGniqQ14%2fj1oczctSdLxMJA%3d"
                }
                '''
                if resp['status'] != 'completed':
                    err = self._basic_url + " get_full_text error: {}".format('file is not ready.')
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise Exception(err)
                    # return ''
                    # return err
                download_url = resp['url']
            async with session.get(download_url, ssl=False) as response:
                if response.status != 200:
                    err = self._basic_url + " get_full_text error: {}".format('download file error')
                    error_log = log_oper.get_error_log(err, sys._getframe())
                    StandLogger.error(error_log, log_oper.SYSTEM_LOG)
                    raise Exception(err)
                    # return ''
                    # return err
                return await response.text()
