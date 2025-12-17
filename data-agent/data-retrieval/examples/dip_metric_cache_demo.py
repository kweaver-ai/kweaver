# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-08-26

"""
DIP Metric 缓存和精简功能演示脚本
参考 text2metric.py 的实现方式
"""

import sys
import os
import json
import asyncio
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.af_agent.tools.base_tools.text2dip_metric import Text2DIPMetricTool
from src.af_agent.datasource.dip_metric import DIPMetric
from src.af_agent.utils.llm import CustomChatOpenAI

def get_test_llm():
    """获取测试用的 LLM"""
    return CustomChatOpenAI(
        model_name="Qwen-72B-Chat",
        openai_api_base="http://192.168.173.19:8304/v1",
        openai_api_key="EMPTY",
        temperature=0.5,
    )

async def demo_cache_and_limit():
    """演示缓存和精简功能"""
    print("=== DIP Metric 缓存和精简功能演示 ===\n")
    
    # 配置参数
    test_url = "http://192.168.167.13"
    test_token = "Bearer ory_at_D4E2xXgodDa_g8hEzwG1uZ42e2NgHz6PLmm9gIu8WEs.efvhq64LQvIOGDpjaBol6jNVExkRW_dTdJNnFHX_910"
    test_user_id = "1234567890"
    test_ids = ["liby_sales_std"]
    session_id = "demo_session"
    
    try:
        # 创建 DIP Metric 实例
        dip_metric = DIPMetric(
            base_url=test_url, 
            token=test_token, 
            user_id=test_user_id, 
            metric_list=test_ids
        )
        
        # 创建工具实例，设置数据限制
        tool = Text2DIPMetricTool.from_dip_metric(
            dip_metric,
            llm=get_test_llm(),
            api_mode=True,
            session_id=session_id,
            with_execution=True,
            return_record_limit=5,  # 限制返回记录数
            return_data_limit=1000   # 限制数据总量
        )
        
        print("✅ 工具初始化成功")
        print(f"📊 返回记录数限制: {tool.return_record_limit}")
        print(f"📊 数据总量限制: {tool.return_data_limit}")
        print(f"💾 会话类型: {tool.session_type}")
        print(f"🆔 会话ID: {tool.session_id}")
        
        # 测试查询
        query = "去年西部大区每个月的销量"
        print(f"\n🔍 执行查询: {query}")
        
        # 异步执行查询
        result = await tool.ainvoke({"input": query})
        
        print("\n📋 查询结果:")
        print(f"标题: {result.get('title', 'N/A')}")
        print(f"指标ID: {result.get('metric_id', 'N/A')}")
        print(f"缓存键: {result.get('result_cache_key', 'N/A')}")
        
        # 检查执行结果
        if 'execution_result' in result:
            exec_result = result['execution_result']
            print(f"\n📊 执行结果:")
            print(f"成功: {exec_result.get('success', False)}")
            print(f"数据描述: {exec_result.get('data_desc', {})}")
            
            # 显示数据摘要
            data_summary = exec_result.get('data_summary', {})
            print(f"总数据点: {data_summary.get('total_data_points', 0)}")
            print(f"步长: {data_summary.get('step', 'N/A')}")
            
            # 显示样例数据
            sample_data = exec_result.get('sample_data', [])
            print(f"样例数据数量: {len(sample_data)}")
            
        print("\n🎉 演示完成！")
        print("\n主要特性:")
        print("1. ✅ 自动缓存查询结果")
        print("2. ✅ 数据精简，限制返回记录数")
        print("3. ✅ 通过缓存键获取完整数据")
        print("4. ✅ 标准化的结果格式")
        
    except Exception as e:
        print(f"\n❌ 演示失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(demo_cache_and_limit())
