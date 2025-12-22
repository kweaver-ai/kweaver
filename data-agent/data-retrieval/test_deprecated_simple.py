#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试 deprecated 装饰器功能
"""

import warnings
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.data_retrieval.utils import deprecated, deprecated_class, deprecated_property

def test_deprecated_function():
    """测试函数弃用装饰器"""
    print("=== 测试函数弃用装饰器 ===")
    
    @deprecated("此函数已被弃用")
    def old_function():
        return "old function result"
    
    @deprecated("使用 new_function 替代", version="1.0.0", removal_version="2.0.0")
    def deprecated_function():
        return "deprecated function result"
    
    print("调用 old_function:")
    result1 = old_function()
    print(f"结果: {result1}")
    
    print("\n调用 deprecated_function:")
    result2 = deprecated_function()
    print(f"结果: {result2}")


def test_deprecated_class():
    """测试类弃用装饰器"""
    print("\n=== 测试类弃用装饰器 ===")
    
    @deprecated_class("此类将在下一个版本中移除")
    class OldClass:
        def __init__(self, value):
            self.value = value
        
        def get_value(self):
            return self.value
    
    print("创建 OldClass 实例:")
    obj = OldClass("test value")
    print(f"获取值: {obj.get_value()}")


def test_deprecated_property():
    """测试属性弃用装饰器"""
    print("\n=== 测试属性弃用装饰器 ===")
    
    class TestClass:
        def __init__(self, value):
            self._value = value
        
        @deprecated_property("使用 new_value 替代")
        @property
        def old_value(self):
            return self._value
    
    print("创建 TestClass 实例:")
    obj = TestClass("test value")
    
    print("访问 old_value 属性:")
    value1 = obj.old_value
    print(f"值: {value1}")


if __name__ == "__main__":
    # 运行所有测试
    test_deprecated_function()
    test_deprecated_class()
    test_deprecated_property()
    
    print("\n=== 所有测试完成 ===")
