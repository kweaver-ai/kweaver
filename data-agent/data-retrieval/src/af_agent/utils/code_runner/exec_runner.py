# -*- coding: utf-8 -*-
import traceback
import uuid
from typing import Any, Optional, Dict, Union

from af_agent.logs.logger import logger
from af_agent.errors import PythonCodeError
from af_agent.utils.code_runner.base_runner import BaseCodeRunner

class ExecRunner(BaseCodeRunner):
    """基于Python exec的代码执行器"""
    
    def __init__(self, runner_id: Optional[str] = None):
        """
        初始化执行器
        
        Args:
            runner_id: 执行器ID，默认自动生成
        """
        self._id = runner_id or str(uuid.uuid4())
    
    def get_id(self) -> str:
        """获取执行器ID"""
        return self._id
    
    def run(self, code: str, data: Optional[Dict] = None, **globals_kwargs) -> Any:
        """
        使用Python的exec执行代码
        
        Args:
            code: 要执行的Python代码
            data: 传入代码环境的数据
            globals_kwargs: 其他要添加到全局命名空间的变量
            
        Returns:
            代码执行结果，通过'result'变量获取
        """
        try:
            # 准备全局和局部命名空间
            globals_dict = globals().copy()
            globals_dict.update(globals_kwargs)
            locals_dict = {"data": data}
            
            # 执行代码
            exec(code, globals_dict, locals_dict)
            
            # 返回结果
            return locals_dict.get("result", {})
        except Exception as e:
            error_msg = f"代码执行失败: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            raise PythonCodeError(reason="代码执行失败", detail=e)
    
    @staticmethod
    def static_run(code: str, data: Optional[Dict] = None, **globals_kwargs) -> Any:
        """
        静态方法，使用一次性ExecRunner执行代码
        
        Args:
            code: 要执行的Python代码
            data: 传入代码环境的数据
            globals_kwargs: 其他要添加到全局命名空间的变量
            
        Returns:
            代码执行结果，通过'result'变量获取
        """
        runner = ExecRunner()
        return runner.run(code, data, **globals_kwargs) 