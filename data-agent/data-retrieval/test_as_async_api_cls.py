#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import json
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.data_retrieval.tools.base_tools.text2dip_metric import Text2DIPMetricTool

async def test_as_async_api_cls():
    """测试 as_async_api_cls 方法的参数获取"""
    
    # 模拟 text2sql 风格的参数
    params = {
        "data_source": {
            "metric_list": ["metric_1", "metric_2"],
            "base_url": "https://example.com",
            "user": "test_user",
            "password": "test_password",
            "token": "",
            "user_id": "123"
        },
        "llm": {
            "model_name": "test_model",
            "openai_api_key": "test_key",
            "openai_api_base": "http://test.com",
            "max_tokens": 4000,
            "temperature": 0.1
        },
        "inner_llm": {
            "model_name": "inner_model",
            "temperature": 0.5
        },
        "config": {
            "background": "测试背景",
            "retry_times": 3,
            "session_type": "in_memory",
            "session_id": "test_session",
            "get_desc_from_datasource": True,
            "return_record_limit": 10,
            "return_data_limit": 1000,
            "rewrite_query": False
        },
        "infos": {
            "knowledge_enhanced_information": {},
            "extra_info": "测试额外信息"
        },
        "input": "查询最近1小时的CPU使用率"
    }
    
    try:
        # 测试参数获取
        print("测试参数获取...")
        print(f"data_source: {params.get('data_source')}")
        print(f"llm: {params.get('llm')}")
        print(f"inner_llm: {params.get('inner_llm')}")
        print(f"config: {params.get('config')}")
        print(f"infos: {params.get('infos')}")
        print(f"input: {params.get('input')}")
        
        # 测试 API Schema
        print("\n测试 API Schema...")
        schema = await Text2DIPMetricTool.get_api_schema()
        print(f"Schema name: {schema.get('name')}")
        print(f"Required fields: {schema.get('parameters', {}).get('required', [])}")
        
        print("\n参数获取测试完成！")
        
    except Exception as e:
        print(f"测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_as_async_api_cls())
