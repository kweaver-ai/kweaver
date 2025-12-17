from base64 import b64decode
from typing import Any, Dict, Optional

import aiohttp

from app.common.config import Config
from app.common.stand_log import StandLogger


class DpDataSourceService(object):
    """数据源管理服务调用"""

    def __init__(self, headers: dict = None):
        self._basic_url = "http://{}:{}".format(
            Config.services.dp_data_source.host, Config.services.dp_data_source.port
        )
        self.headers = headers or {}

    async def get_datasource_by_id(self, ds_id: str) -> Optional[Dict[str, Any]]:
        """
        根据ID获取单个数据源信息

        Args:
            ds_id: 数据源ID

        Returns:
            数据源信息，如果不存在返回None
        """
        api = f"{self._basic_url}/api/internal/dp-data-source/v1/catalog/{ds_id}"

        StandLogger.info(f"开始获取数据源信息: {ds_id}")

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(api, headers=self.headers) as response:
                    if response.status == 404:
                        StandLogger.error(f"数据源不存在: {ds_id}")
                        raise Exception(f"数据源不存在: {ds_id}")

                    if response.status != 200:
                        error_str = await response.text()
                        error_msg = f"获取数据源信息失败, API: {api}, 状态码: {response.status}, 错误: {error_str}"
                        StandLogger.error(error_msg)
                        raise Exception(error_msg)

                    res = await response.json()
                    StandLogger.info(f"获取数据源信息: {ds_id} 结束")
                    return res

        except aiohttp.ClientError as e:
            error_msg = f"网络请求失败, API: {api}, 错误: {str(e)}"
            StandLogger.error(error_msg)
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"获取数据源信息时发生异常, API: {api}, 错误: {str(e)}"
            StandLogger.error(error_msg)
            raise Exception(error_msg)

    async def decode_password(self, cipher_text: str) -> str:
        """
        base64解密密码
        """
        return b64decode(cipher_text).decode()
