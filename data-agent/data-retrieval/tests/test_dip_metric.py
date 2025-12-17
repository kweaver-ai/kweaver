#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DIPMetric 测试文件
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.af_agent.datasource.dip_metric import DIPMetric, MockDIPMetric


def test_dip_metric_basic():
    """测试 DIPMetric 基本功能"""
    
    # 创建 Mock 实例进行测试
    metric = MockDIPMetric(token="mock_token")
    metric.set_data_list(["metric_1", "metric_2"])
    
    print("DIPMetric 基本功能测试")
    print("=" * 50)
    
    # 测试连接
    print("1. 连接测试:", metric.test_connection())
    
    # 测试描述
    print("2. 描述信息:")
    description = metric.get_description()
    print(f"   - 名称: {description['name']}")
    print(f"   - 类型: {description['type']}")
    print(f"   - 描述: {description['description']}")
    print(f"   - 支持的操作符: {list(description['operators'].keys())[:5]}...")
    
    # 测试详细信息
    print("3. 详细信息:")
    details = metric.get_details()
    print(f"   - 指标数量: {len(details['metrics'])}")
    print(f"   - 时间粒度: {details['time_granularity'][:5]}...")
    
    print("\n基本功能测试完成！")


def test_range_query():
    """测试范围查询"""
    print("\n范围查询测试")
    print("=" * 50)
    
    metric = MockDIPMetric(token="mock_token")
    
    # 范围查询参数
    range_query = {
        "instant": False,
        "start": 1646360670123,
        "end": 1646471470123,
        "step": "1m",
        "filters": [
            {
                "name": "labels.host",
                "value": ["10.2.12.23", "10.21.2.3"],
                "operation": "in"
            },
            {
                "name": "labels.job",
                "value": "prometheus",
                "operation": "="
            }
        ]
    }
    
    try:
        result = metric.call("metric_1", range_query)
        print("范围查询成功:")
        print(f"   - 模型ID: {result['model']['id']}")
        print(f"   - 模型名称: {result['model']['name']}")
        print(f"   - 数据点数量: {len(result['datas'])}")
        print(f"   - 步长: {result['step']}")
        print(f"   - 状态码: {result['status_code']}")
        
        if result['datas']:
            first_data = result['datas'][0]
            print(f"   - 第一个数据点标签: {first_data['labels']}")
            print(f"   - 时间点数量: {len(first_data['times'])}")
            print(f"   - 数值数量: {len(first_data['values'])}")
            
    except Exception as e:
        print(f"范围查询失败: {e}")


def test_instant_query():
    """测试即时查询"""
    print("\n即时查询测试")
    print("=" * 50)
    
    metric = MockDIPMetric(token="mock_token")
    
    # 即时查询参数
    instant_query = {
        "instant": True,
        "time": 1669789900123,
        "look_back_delta": "10m",
        "filters": [
            {
                "name": "labels.host",
                "value": ["10.2.12.23", "10.21.2.3"],
                "operation": "in"
            }
        ]
    }
    
    try:
        result = metric.call("metric_1", instant_query)
        print("即时查询成功:")
        print(f"   - 模型ID: {result['model']['id']}")
        print(f"   - 模型名称: {result['model']['name']}")
        print(f"   - 数据点数量: {len(result['datas'])}")
        print(f"   - 步长: {result['step']}")
        print(f"   - 状态码: {result['status_code']}")
        
        if result['datas']:
            first_data = result['datas'][0]
            print(f"   - 第一个数据点标签: {first_data['labels']}")
            print(f"   - 时间点数量: {len(first_data['times'])}")
            print(f"   - 数值数量: {len(first_data['values'])}")
            
    except Exception as e:
        print(f"即时查询失败: {e}")


def test_multi_metric_query():
    """测试多指标查询"""
    print("\n多指标查询测试")
    print("=" * 50)
    
    metric = MockDIPMetric(token="mock_token")
    
    # 多指标查询参数（数组格式）
    multi_query = [
        {
            "instant": False,
            "start": 1646360670123,
            "end": 1646471470123,
            "step": "1m",
            "filters": [
                {
                    "name": "labels.host",
                    "value": ["10.2.12.23"],
                    "operation": "in"
                }
            ]
        },
        {
            "instant": True,
            "time": 1669789900123,
            "look_back_delta": "30m",
            "filters": [
                {
                    "name": "labels.job",
                    "value": "prometheus",
                    "operation": "="
                }
            ]
        }
    ]
    
    try:
        result = metric.call("metric_1,metric_2", multi_query)
        print("多指标查询成功:")
        print(f"   - 结果类型: {type(result)}")
        if isinstance(result, list):
            print(f"   - 结果数量: {len(result)}")
            for i, res in enumerate(result):
                print(f"   - 指标 {i+1}:")
                print(f"     * 模型ID: {res['model']['id']}")
                print(f"     * 数据点数量: {len(res['datas'])}")
        else:
            print(f"   - 模型ID: {result['model']['id']}")
            print(f"   - 数据点数量: {len(result['datas'])}")
            
    except Exception as e:
        print(f"多指标查询失败: {e}")


def test_params_correction():
    """测试参数校验"""
    print("\n参数校验测试")
    print("=" * 50)
    
    metric = MockDIPMetric(token="mock_token")
    
    # 测试字符串时间转换
    test_params = {
        "instant": False,
        "start": "2022-03-01 10:00:00",
        "end": "2022-03-02 10:00:00",
        "step": "5m",
        "filters": [
            {
                "name": "labels.host",
                "value": ["10.2.12.23"],
                "operation": "in"
            }
        ]
    }
    
    corrected = metric.params_correction(test_params)
    print("参数校验结果:")
    print(f"   - 原始start: {test_params['start']}")
    print(f"   - 转换后start: {corrected['start']}")
    print(f"   - 原始end: {test_params['end']}")
    print(f"   - 转换后end: {corrected['end']}")
    print(f"   - 步长: {corrected['step']}")
    print(f"   - 即时查询: {corrected['instant']}")
    
    # 测试即时查询参数
    instant_params = {
        "instant": True,
        "time": "2022-11-30 10:00:00",
        "look_back_delta": "15m"
    }
    
    corrected_instant = metric.params_correction(instant_params)
    print("\n即时查询参数校验:")
    print(f"   - 原始time: {instant_params['time']}")
    print(f"   - 转换后time: {corrected_instant['time']}")
    print(f"   - look_back_delta: {corrected_instant['look_back_delta']}")


def main():
    """主测试函数"""
    print("DIPMetric 完整测试")
    print("=" * 60)
    
    # 运行所有测试
    test_dip_metric_basic()
    test_range_query()
    test_instant_query()
    test_multi_metric_query()
    test_params_correction()
    
    print("\n" + "=" * 60)
    print("所有测试完成！")


if __name__ == "__main__":
    main()
