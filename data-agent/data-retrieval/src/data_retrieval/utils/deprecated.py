# -*- coding: utf-8 -*-
"""
@File: deprecated.py
@Date: 2024-12-19
@Desc: Deprecated 装饰器实现
"""

import warnings
import functools
from typing import Optional, Callable, Any, Type


def deprecated(
    reason: Optional[str] = None,
    version: Optional[str] = None,
    removal_version: Optional[str] = None,
    category: Type[Warning] = DeprecationWarning
) -> Callable:
    """
    标记函数或方法为已弃用的装饰器
    
    Args:
        reason: 弃用的原因
        version: 当前版本
        removal_version: 计划移除的版本
        category: 警告类别，默认为 DeprecationWarning
    
    Returns:
        装饰器函数
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # 构建警告消息
            message_parts = []
            
            if reason:
                message_parts.append(reason)
            
            if version:
                message_parts.append(f"当前版本: {version}")
            
            if removal_version:
                message_parts.append(f"计划在版本 {removal_version} 中移除")
            
            # 如果没有提供原因，使用默认消息
            if not message_parts:
                message_parts.append("此函数已被弃用")
            
            message = f"{func.__name__}: {' '.join(message_parts)}"
            
            # 发出警告
            warnings.warn(message, category, stacklevel=2)
            
            # 调用原始函数
            return func(*args, **kwargs)
        
        return wrapper
    return decorator


def deprecated_class(
    reason: Optional[str] = None,
    version: Optional[str] = None,
    removal_version: Optional[str] = None,
    category: Type[Warning] = DeprecationWarning
) -> Callable:
    """
    标记类为已弃用的装饰器
    """
    def decorator(cls: type) -> type:
        # 构建警告消息
        message_parts = []
        
        if reason:
            message_parts.append(reason)
        
        if version:
            message_parts.append(f"当前版本: {version}")
        
        if removal_version:
            message_parts.append(f"计划在版本 {removal_version} 中移除")
        
        # 如果没有提供原因，使用默认消息
        if not message_parts:
            message_parts.append("此类已被弃用")
        
        message = f"{cls.__name__}: {' '.join(message_parts)}"
        
        # 保存原始初始化方法
        original_init = cls.__init__
        
        @functools.wraps(original_init)
        def new_init(self, *args, **kwargs):
            warnings.warn(message, category, stacklevel=2)
            return original_init(self, *args, **kwargs)
        
        # 替换初始化方法
        cls.__init__ = new_init
        
        return cls
    return decorator


def deprecated_property(
    reason: Optional[str] = None,
    version: Optional[str] = None,
    removal_version: Optional[str] = None,
    category: Type[Warning] = DeprecationWarning
) -> Callable:
    """
    标记属性为已弃用的装饰器
    """
    def decorator(prop: property) -> property:
        # 获取原始的 getter 和 setter
        original_getter = prop.fget
        original_setter = prop.fset
        original_deleter = prop.fdel
        
        # 构建警告消息
        message_parts = []
        
        if reason:
            message_parts.append(reason)
        
        if version:
            message_parts.append(f"当前版本: {version}")
        
        if removal_version:
            message_parts.append(f"计划在版本 {removal_version} 中移除")
        
        # 如果没有提供原因，使用默认消息
        if not message_parts:
            message_parts.append("此属性已被弃用")
        
        message = f"{original_getter.__name__ if original_getter else 'property'}: {' '.join(message_parts)}"
        
        def deprecated_getter(self):
            warnings.warn(message, category, stacklevel=2)
            if original_getter:
                return original_getter(self)
            raise AttributeError("can't get attribute")
        
        def deprecated_setter(self, value):
            warnings.warn(message, category, stacklevel=2)
            if original_setter:
                return original_setter(self, value)
            raise AttributeError("can't set attribute")
        
        def deprecated_deleter(self):
            warnings.warn(message, category, stacklevel=2)
            if original_deleter:
                return original_deleter(self)
            raise AttributeError("can't delete attribute")
        
        # 创建新的属性
        return property(deprecated_getter, deprecated_setter, deprecated_deleter)
    
    return decorator


__all__ = [
    'deprecated',
    'deprecated_class',
    'deprecated_property'
]
