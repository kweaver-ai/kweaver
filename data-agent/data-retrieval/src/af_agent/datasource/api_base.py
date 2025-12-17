# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-8-25
from abc import abstractmethod
from typing import Any, Optional, Dict
from af_agent.datasource.base import DataSourceBase


class APIDataSource(DataSourceBase):
    api_url: Optional[str] = ''
    credentials: Optional[Dict] = None

    @abstractmethod
    def test_connection(self) -> bool:
        """Test connection
        """

    @abstractmethod
    def call(self, *args, **kwargs) -> Any:
        """Call API
        """
    @abstractmethod
    async def acall(self, *args, **kwargs) -> Any:
        """Call API async
        """

    def get_description(self, *args, **kwargs) -> Dict[str, Any]:
        """Get description
        """
        return {}

    @abstractmethod
    def get_details(self, *args, **kwargs) -> Dict[str, Any]:
        """Get description
        """

    @abstractmethod
    def params_correction(self, params: Dict[str, Any]) -> dict:
        """Check params
        """
    
    async def params_correction_async(self, *args, **kwargs) -> Dict[str, Any]:
        pass
    
    def set_data_list(self, data_list: list[str]):
        """Set data list
        """
        pass

    def get_data_list(self) -> list[str]:
        return []