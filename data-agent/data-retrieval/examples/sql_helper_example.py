# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-5-23
"""
SQL Helper 工具使用示例

演示如何使用 SQL Helper 工具，包括新的 data_title 参数功能
"""

import asyncio
from langchain_openai import ChatOpenAI
from data_retrieval.tools.base_tools.sql_helper import SQLHelperTool
from data_retrieval.datasource.vega_datasource import VegaDataSource
from data_retrieval.api.auth import get_authorization


async def main():
    """主函数 - 演示 SQL Helper 工具的使用"""
    
    print("=== SQL Helper 工具使用示例 ===\n")
    
    # 1. 初始化 LLM
    print("1. 初始化语言模型...")
    llm = ChatOpenAI(
        model_name='Qwen-72B-Chat',
        openai_api_key="EMPTY",
        openai_api_base="http://192.168.173.19:8304/v1",
        max_tokens=2000,
        temperature=0.01,
    )
    
    # 2. 获取认证令牌
    print("2. 获取认证令牌...")
    try:
        token = get_authorization("https://10.4.110.170", "xia", "111111")
        print("✓ 认证成功")
    except Exception as e:
        print(f"✗ 认证失败: {e}")
        return
    
    # 3. 创建数据源
    print("3. 创建数据源...")
    datasource = VegaDataSource(
        view_list=[
            "330755ad-6126-415e-adb5-79adb12a0455",
            "ee4aaa09-498c-4126-ae29-8a8590c2d1f0",
        ],
        token=token,
        user_id="fa1ee91a-643d-11ef-8405-a214ef0d99c8"
    )
    
    # 4. 创建 SQL Helper 工具
    print("4. 创建 SQL Helper 工具...")
    tool = SQLHelperTool.from_data_source(
        language="cn",
        data_source=datasource,
        llm=llm,
        get_desc_from_datasource=True
    )
    
    print("✓ 工具初始化完成\n")
    
    # 5. 测试获取元数据
    print("5. 测试获取元数据信息...")
    try:
        metadata_result = tool.invoke({"command": "get_metadata"})
        print("✓ 元数据获取成功")
        print(f"   找到 {len(metadata_result.get('metadata', []))} 个数据视图")
        for item in metadata_result.get('metadata', [])[:3]:  # 只显示前3个
            print(f"   - {item.get('name', 'Unknown')} ({item.get('id', 'Unknown')})")
    except Exception as e:
        print(f"✗ 元数据获取失败: {e}")
    
    print()
    
    # 6. 测试执行 SQL（不带 data_title）
    print("6. 测试执行 SQL（不带 data_title）...")
    try:
        sql_result = tool.invoke({
            "command": "execute_sql", 
            "sql": "SELECT * FROM table LIMIT 5"
        })
        print("✓ SQL 执行成功")
        print(f"   返回 {sql_result.get('data_desc', {}).get('return_records_num', 0)} 条记录")
    except Exception as e:
        print(f"✗ SQL 执行失败: {e}")
    
    print()
    
    # 7. 测试执行 SQL（带 data_title）
    print("7. 测试执行 SQL（带 data_title）...")
    try:
        sql_result_with_title = tool.invoke({
            "command": "execute_sql", 
            "sql": "SELECT * FROM table LIMIT 5",
            "data_title": "用户查询结果"
        })
        print("✓ SQL 执行成功（带标题）")
        print(f"   数据标题: {sql_result_with_title.get('data_title', 'N/A')}")
        print(f"   返回 {sql_result_with_title.get('data_desc', {}).get('return_records_num', 0)} 条记录")
    except Exception as e:
        print(f"✗ SQL 执行失败: {e}")
    
    print()
    
    # 8. 演示 API 调用方式
    print("8. 演示 API 调用方式...")
    try:
        api_params = {
            'data_source': {
                'view_list': ['330755ad-6126-415e-adb5-79adb12a0455'],
                'base_url': 'https://10.4.110.170',
                'user': 'xia',
                'password': '111111',
                'vega_type': 'dip'
            },
            'llm': {
                'model_name': 'Qwen-72B-Chat',
                'openai_api_key': 'EMPTY',
                'openai_api_base': 'http://192.168.173.19:8304/v1'
            },
            'config': {
                'return_record_limit': 5,
                'return_data_limit': 1000
            },
            'command': 'execute_sql',
            'sql': 'SELECT * FROM table LIMIT 3',
            'data_title': 'API调用测试结果'
        }
        
        api_result = await SQLHelperTool.as_async_api_cls(api_params)
        print("✓ API 调用成功")
        print(f"   数据标题: {api_result.get('data_title', 'N/A')}")
        print(f"   返回 {api_result.get('data_desc', {}).get('return_records_num', 0)} 条记录")
    except Exception as e:
        print(f"✗ API 调用失败: {e}")
    
    print("\n=== 示例演示完成 ===")


if __name__ == "__main__":
    # 运行示例
    asyncio.run(main())

