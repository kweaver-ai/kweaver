# -*- coding: utf-8 -*-
import traceback
import importlib.util
import uuid
from typing import Any, Optional, Dict, Union

from af_agent.logs.logger import logger
from af_agent.errors import PythonCodeError
from af_agent.utils.code_runner.base_runner import BaseCodeRunner
from af_agent.utils.code_runner.exec_runner import ExecRunner

class IPythonRunner(BaseCodeRunner):
    """基于IPython的代码执行器"""
    
    # 存储shell实例的字典，键为shell_id
    _shells = {}
    
    def __init__(self, shell_id: Optional[str] = None):
        """
        初始化IPython执行器
        
        Args:
            shell_id: shell实例的ID，如果为None则创建新的实例
        """
        self.shell, self._id = self._get_or_create_shell(shell_id)
    
    @staticmethod
    def is_ipython_available() -> bool:
        """检查IPython是否可用"""
        return importlib.util.find_spec("IPython") is not None
    
    def get_id(self) -> str:
        """获取执行器ID"""
        return self._id if self._id else ""
    
    def _get_or_create_shell(self, shell_id: Optional[str] = None):
        """
        获取指定ID的shell实例，如果不存在则创建新的
        
        Args:
            shell_id: shell实例的ID，如果为None则创建新的实例
            
        Returns:
            shell实例和shell_id
        """
        if not IPythonRunner.is_ipython_available():
            logger.warning("IPython未安装，无法创建IPython shell实例")
            return None, None
            
        # 动态导入IPython
        from IPython.core.interactiveshell import InteractiveShell
        
        # 如果指定了ID但实例不存在，或者没有指定ID，创建新的实例
        if shell_id is None or shell_id not in IPythonRunner._shells:
            if shell_id is None:
                shell_id = str(uuid.uuid4())
            IPythonRunner._shells[shell_id] = InteractiveShell.instance()
            logger.debug(f"创建了新的IPython shell实例，ID: {shell_id}")
            
        return IPythonRunner._shells[shell_id], shell_id
    
    def run(self, code: str, data: Optional[Dict] = None, **namespace_kwargs) -> Dict[str, Any]:
        """
        使用IPython执行代码
        
        Args:
            code: 要执行的Python代码
            data: 传入代码环境的数据
            namespace_kwargs: 其他要添加到IPython命名空间的变量
            
        Returns:
            包含代码执行结果和shell_id的字典
        """
        try:
            # 检查IPython是否可用
            if not self.shell or not IPythonRunner.is_ipython_available():
                logger.warning("IPython未安装或shell不可用，回退到ExecRunner")
                result = ExecRunner.static_run(code, data, **namespace_kwargs)
                return {"result": result, "shell_id": None}
            
            # 导入需要的模块
            import pandas as pd
            import numpy as np
            
            # 注入数据和其他变量到shell环境中
            self.shell.user_ns['data'] = data
            self.shell.user_ns['pd'] = pd
            self.shell.user_ns['np'] = np
            
            # 添加其他参数到命名空间
            for key, value in namespace_kwargs.items():
                self.shell.user_ns[key] = value
            
            # 执行代码
            execution_result = self.shell.run_cell(code)
            
            # 检查执行是否成功
            if execution_result.error_before_exec or execution_result.error_in_exec:
                if execution_result.error_in_exec:
                    raise execution_result.error_in_exec
                if execution_result.error_before_exec:
                    raise execution_result.error_before_exec
            
            # 获取结果
            result = self.shell.user_ns.get('result', {})
            
            return {"result": result, "shell_id": self._id}
            
        except Exception as e:
            error_msg = f"IPython执行错误: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            raise PythonCodeError(reason="IPython代码执行失败", detail=e)
    
    def close(self) -> bool:
        """
        关闭当前shell实例
        
        Returns:
            是否成功关闭
        """
        if self._id in IPythonRunner._shells:
            del IPythonRunner._shells[self._id]
            logger.debug(f"关闭了IPython shell实例，ID: {self._id}")
            self.shell = None
            return True
        return False
    
    @staticmethod
    def static_run(code: str, data: Optional[Dict] = None, shell_id: Optional[str] = None, **namespace_kwargs) -> Dict[str, Any]:
        """
        静态方法，使用IPython执行代码
        
        Args:
            code: 要执行的Python代码
            data: 传入代码环境的数据
            shell_id: 指定要使用的shell实例ID，如果为None则使用新的实例
            namespace_kwargs: 其他要添加到IPython命名空间的变量
            
        Returns:
            包含代码执行结果和shell_id的字典
        """
        runner = IPythonRunner(shell_id=shell_id)
        return runner.run(code, data, **namespace_kwargs)
            
    @staticmethod
    def close_shell(shell_id: str) -> bool:
        """
        关闭并删除指定ID的shell实例
        
        Args:
            shell_id: 要关闭的shell实例ID
            
        Returns:
            是否成功关闭
        """
        if shell_id in IPythonRunner._shells:
            del IPythonRunner._shells[shell_id]
            logger.debug(f"关闭了IPython shell实例，ID: {shell_id}")
            return True
        return False
        
    @staticmethod
    def close_all_shells() -> int:
        """
        关闭所有shell实例
        
        Returns:
            关闭的实例数量
        """
        count = len(IPythonRunner._shells)
        IPythonRunner._shells.clear()
        logger.debug(f"关闭了所有IPython shell实例，共{count}个")
        return count 