# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-5-21
from abc import abstractmethod
from typing import Any, Union, List, Optional, Dict

from langchain.pydantic_v1 import BaseModel

from data_retrieval.datasource.base import DataSourceBase


class FieldDescription(BaseModel):
    """Field description
    """
    name: str
    description: str
    language: Optional[str] = "cn"


class DataDescription(BaseModel):
    """Data description
    """
    name: str
    type: str
    description: Optional[str]
    language: Optional[str] = "cn"
    fields: Optional[List[FieldDescription]]


class DataSource(DataSourceBase):
    """DataSource base class for different data sources
    """
    data_description: Optional[List[DataDescription]]

    def __del__(self):
        self.close()

    @abstractmethod
    def test_connection(self) -> bool:
        """Test connection
        """

    @abstractmethod
    def query(self, query: str, as_gen=True, as_dict=True) -> dict:
        """Get data from data source
        """

    @abstractmethod
    def query_async(self, query: str, as_gen=True, as_dict=True) -> dict:
        """Get data from data source
        """

    @abstractmethod
    def get_metadata(self, identities: Union[List, str] = None) -> List[Any]:
        """Get meta information

        Output must be like:
        [{
            "id": some id,
            "name": some name,
            "description": some description,
            "ddl": some ddl,
        }]
        """

    @abstractmethod
    def get_metadata_async(self, identities: Union[List, str] = None) -> List[Any]:
        """Get meta information
        """

    @abstractmethod
    def get_rule_base_params(self):
        """Get rule base
        """

    @abstractmethod
    def get_sample(
        self,
        identities: Union[List, str] = None,
        num: int = 5,
        as_dict: bool = False
    ) -> List[dict]:
        """Get sample data
        """

    @abstractmethod
    def query_correction(self, query: str) -> str:
        """Query correction
        """

    @abstractmethod
    def close(self):
        """Clear connection
        """

    def get_description(self) -> Dict[str, Any]:
        return {}
    
    def set_tables(self, tables: List[str]):
        pass

    def get_tables(self) -> List[str]:
        return []