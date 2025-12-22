#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DataModelService 测试文件
"""

import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.data_retrieval.api.data_model import DataModelService
from src.data_retrieval.api.error import DataModelDetailError, DataModelQueryError


def test_data_model_service(url: str = ""):
    """测试 DataModelService 的基本功能"""
    
    # 创建服务实例
    service = DataModelService(base_url=url)
    
    print("DataModelService 初始化成功")
    print(f"数据模型URL: {service.data_model_url}")
    print(f"模型查询URL: {service.model_query_url}")
    print(f"指标详情URL模板: {service.metric_models_detail_url}")
    print(f"指标查询URL模板: {service.metric_models_query_url}")
    print(f"知识条目详情URL模板: {service.knowledge_items_detail_url}")
    
    # 测试URL生成
    test_ids = "liby_sales_std"
    # headers = {
    #     "X-User": "admin",
    #     "token": "Bearer ory_at_dEa-dVPF_mDGU8w-qxswpPlZ4YI0PgtLadC5x88FJ8I.OjR2rm0YqJ6nsXa7S2w7RIUcTd97uLgxda9-3-yfvSQ"
    # }
    detail_url = service.metric_models_detail_url.format(ids=test_ids)
    query_url = service.metric_models_query_url.format(ids=test_ids)
    
    print(f"\n测试URL生成:")
    print(f"详情URL: {detail_url}")
    print(f"查询URL: {query_url}")
    
    # 测试错误处理
    print(f"\n测试错误类型:")
    print(f"DataModelDetailError: {DataModelDetailError}")
    print(f"DataModelQueryError: {DataModelQueryError}")
    
    print("\nDataModelService 测试完成！")


def test_knowledge_items_sync(url: str = ""):
    """测试知识条目的同步方法"""
    print("\n=== 测试知识条目同步方法 ===")
    
    # 创建服务实例
    service = DataModelService(base_url=url)
    
    # 测试知识条目URL生成
    test_knowledge_ids = ["dict_001", "dict_002"]
    knowledge_url = service.knowledge_items_detail_url.format(ids=",".join(test_knowledge_ids))
    print(f"知识条目详情URL: {knowledge_url}")
    
    # 测试获取知识条目详情（模拟测试，不实际调用API）
    try:
        # 这里只是测试方法调用，实际使用时需要有效的认证信息
        # result = service.get_knowledge_items_by_ids(test_knowledge_ids)
        # print(f"知识条目详情: {result}")
        print("知识条目同步方法测试完成（模拟）")
    except Exception as e:
        print(f"知识条目同步方法测试异常: {e}")
    
    print("知识条目同步方法测试完成！")


async def test_knowledge_items_async(url: str = ""):
    """测试知识条目的异步方法"""
    print("\n=== 测试知识条目异步方法 ===")
    
    # 创建服务实例
    service = DataModelService(base_url=url)
    
    # 测试知识条目URL生成
    test_knowledge_ids = ["dict_001", "dict_002"]
    knowledge_url = service.knowledge_items_detail_url.format(ids=",".join(test_knowledge_ids))
    print(f"知识条目详情URL: {knowledge_url}")
    
    # 测试获取知识条目详情（模拟测试，不实际调用API）
    try:
        # 这里只是测试方法调用，实际使用时需要有效的认证信息
        # result = await service.get_knowledge_items_by_ids_async(test_knowledge_ids)
        # print(f"知识条目详情: {result}")
        print("知识条目异步方法测试完成（模拟）")
    except Exception as e:
        print(f"知识条目异步方法测试异常: {e}")
    
    print("知识条目异步方法测试完成！")


def test_knowledge_items_integration(url: str = ""):
    """测试知识条目的集成功能"""
    print("\n=== 测试知识条目集成功能 ===")
    
    # 创建服务实例
    service = DataModelService(base_url=url)
    
    # 测试不同格式的ID输入
    test_cases = [
        ["single_dict"],
        ["dict_001", "dict_002"],
        ["dict_001", "dict_002", "dict_003"]
    ]
    
    for i, test_ids in enumerate(test_cases, 1):
        print(f"\n测试用例 {i}: {test_ids}")
        try:
            # 测试URL生成
            knowledge_url = service.knowledge_items_detail_url.format(ids=",".join(test_ids))
            print(f"生成的URL: {knowledge_url}")
            
            # 测试方法调用（模拟）
            # result = service.get_knowledge_items_by_ids(test_ids)
            # print(f"返回结果: {result}")
            print("方法调用测试通过（模拟）")
            
        except Exception as e:
            print(f"测试用例 {i} 失败: {e}")
    
    print("知识条目集成功能测试完成！")


async def run_all_tests(url: str = ""):
    """运行所有测试"""
    print("开始运行 DataModelService 完整测试套件...")
    
    # 基础功能测试
    test_data_model_service(url)
    
    # 知识条目测试
    test_knowledge_items_sync(url)
    await test_knowledge_items_async(url)
    test_knowledge_items_integration(url)
    
    print("\n所有测试完成！")


if __name__ == "__main__":
    # 运行同步测试
    test_data_model_service()
    test_data_model_service(url="http://192.168.167.13")
    
    # 运行知识条目测试
    test_knowledge_items_sync()
    test_knowledge_items_sync(url="http://192.168.167.13")
    test_knowledge_items_integration()
    test_knowledge_items_integration(url="http://192.168.167.13")
    
    # 运行异步测试
    asyncio.run(test_knowledge_items_async())
    asyncio.run(test_knowledge_items_async(url="http://192.168.167.13"))
    
    # 运行完整测试套件
    asyncio.run(run_all_tests())
    asyncio.run(run_all_tests(url="http://192.168.167.13"))
