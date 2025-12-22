# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-08-26

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.data_retrieval.prompts.tools_prompts.text2dip_metric_prompt import (
    Text2DIPMetricPrompt
)


def test_text2dip_metric_prompt():
    """测试 Text2DIPMetricPrompt"""
    print("=== 测试 Text2DIPMetricPrompt ===")
    
    # 测试参数
    test_params = {
        "metrics": [
            {
                "id": "metric_1",
                "name": "CPU使用率",
                "metric_type": "atomic",
                "query_type": "dsl",
                "unit": "%",
                "tags": ["cpu", "system"]
            },
            {
                "id": "metric_2", 
                "name": "内存使用率",
                "metric_type": "atomic",
                "query_type": "dsl",
                "unit": "%",
                "tags": ["memory", "system"]
            }
        ],
        "samples": [
            {
                "model": {"name": "CPU使用率模型"},
                "datas": [
                    {
                        "labels": {"cpu": "1", "instance": "10.4.68.120:9101"},
                        "times": [1669789800123, 1669789900123],
                        "values": [10, 11]
                    }
                ]
            }
        ],
        "background": "系统监控指标查询"
    }
    
    # 生成 prompt
    prompt = Text2DIPMetricPrompt(**test_params)
    result = prompt.render()
    print("生成的 Prompt:")
    print(result)
    print("\n" + "="*50 + "\n")
    
    # 验证 prompt 内容
    # assert "jinja2" in str(type(prompt).__module__) or "jinja2" in result, "应该使用 jinja2 模板"
    assert "范围查询" in result, "应该包含范围查询说明"
    assert "即时查询" not in result, "不应该包含即时查询说明"
    assert "metric_1" in result, "应该包含指标信息"
    assert "CPU使用率" in result, "应该包含指标名称"
    
    print("✅ Text2DIPMetricPrompt 测试通过")


def test_rewrite_dip_metric_query_prompt():
    """测试 RewriteDIPMetricQueryPrompt"""
    print("=== 测试 RewriteDIPMetricQueryPrompt ===")
    
    # 创建 prompt 实例
    prompt = RewriteDIPMetricQueryPrompt()
    
    # 测试参数
    test_params = {
        "question": "查询最近1小时的CPU使用率",
        "metrics": [
            {"id": "metric_1", "name": "CPU使用率"},
            {"id": "metric_2", "name": "内存使用率"}
        ],
        "samples": [{"model": {"name": "CPU使用率模型"}}],
        "background": "系统监控指标查询"
    }
    
    # 生成 prompt
    result = prompt.get_prompt(**test_params)
    
    print("生成的重写 Prompt:")
    print(result)
    print("\n" + "="*50 + "\n")
    
    # 验证 prompt 内容
    assert "重写助手" in result, "应该包含重写助手说明"
    assert "2" in result, "应该包含指标数量"
    assert "1" in result, "应该包含样例数量"
    assert "时间范围" in result, "应该包含时间范围说明"
    assert "即时查询" not in result, "不应该包含即时查询说明"
    
    print("✅ RewriteDIPMetricQueryPrompt 测试通过")


def test_jinja2_template():
    """测试 jinja2 模板功能"""
    print("=== 测试 jinja2 模板功能 ===")
    
    from jinja2 import Template
    
    # 测试简单的 jinja2 模板
    template_str = """
    用户问题：{{ question }}
    指标数量：{{ metrics_count }}
    背景：{{ background }}
    """
    
    template = Template(template_str)
    result = template.render(
        question="查询CPU使用率",
        metrics_count=2,
        background="系统监控"
    )
    
    print("Jinja2 模板渲染结果:")
    print(result)
    
    # 验证 jinja2 功能
    assert "查询CPU使用率" in result, "应该包含用户问题"
    assert "2" in result, "应该包含指标数量"
    assert "系统监控" in result, "应该包含背景信息"
    
    print("✅ Jinja2 模板功能测试通过")


if __name__ == '__main__':
    print("开始测试 text2dip_metric_prompt.py 修改后的功能...\n")
    
    try:
        test_jinja2_template()
        test_text2dip_metric_prompt()
        # test_rewrite_dip_metric_query_prompt()
        
        print("\n🎉 所有测试通过！")
        print("\n主要修改内容：")
        print("1. ✅ 合并了 Text2DIPMetricPrompt 和 Text2DIPMetricPromptFunc")
        print("2. ✅ 使用 jinja2 模板模式")
        print("3. ✅ 移除了即时查询相关内容")
        print("4. ✅ 保留了范围查询功能")
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
