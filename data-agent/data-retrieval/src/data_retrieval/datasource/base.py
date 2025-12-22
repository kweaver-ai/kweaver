# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-8-28
from abc import ABC, abstractmethod
from typing import Any, Dict

from langchain.pydantic_v1 import BaseModel


class DataSourceBase(BaseModel, ABC):
    """DataSource base class for different data sources
    """
    @abstractmethod
    def test_connection(self) -> bool:
        """Test connection
        """

    @abstractmethod
    def get_description(self) -> Dict[str, Any]:
        """Get description
        """