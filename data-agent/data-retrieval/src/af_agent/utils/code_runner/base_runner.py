# -*- coding: utf-8 -*-
from abc import ABC, abstractmethod
from typing import Any, Optional, Dict, Union

class BaseCodeRunner(ABC):
    """代码执行器的基类，定义通用接口"""
    
    @abstractmethod
    def run(self, code: str, data: Optional[Dict] = None, **kwargs) -> Union[Any, Dict[str, Any]]:
        """
        执行代码并返回结果
        
        Args:
            code: 要执行的Python代码
            data: 传入代码环境的数据
            kwargs: 其他参数
            
        Returns:
            代码执行结果
        """
        pass
    
    @abstractmethod
    def get_id(self) -> str:
        """
        获取执行器的唯一标识符
        
        Returns:
            执行器ID
        """
        pass 
    
    def get_working_context(self, context_size: int = -1) -> str:
        """
        获取上下文
        """
        return ""