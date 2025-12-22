# -*- coding: utf-8 -*-
"""
检索功能完整测试脚本
测试概念召回和关键词召回的各种参数组合

使用方法:
1. 确保在正确的Python环境中（包含所有依赖）
2. 设置PYTHONPATH: export PYTHONPATH=/path/to/data-retrieval/src
3. 运行: python test_retrieval_scenarios.py
"""

import asyncio
import json
from typing import Dict, Any, List

# 测试配置
TEST_CONFIG = {
    "kn_id": "kn_medical",
    "account_id": "bdb78b62-6c48-11f0-af96-fa8dcc0a06b2",
    "account_type": "user",
    "base_url": "http://192.168.232.11:13018"  # 根据实际情况修改
}


def print_test_case(name: str, params: Dict[str, Any]):
    """打印测试用例"""
    print("\n" + "="*80)
    print(f"测试用例: {name}")
    print("="*80)
    print("\n请求参数:")
    print(json.dumps(params, indent=2, ensure_ascii=False))


def print_test_result(result: Dict[str, Any], execution_time: float = None):
    """打印测试结果"""
    print("\n测试结果:")
    if execution_time:
        print(f"执行时间: {execution_time:.2f}秒")
    
    if "object_types" in result:
        print(f"\n对象类型数量: {len(result.get('object_types', []))}")
        if result.get('object_types'):
            print("\n前3个对象类型:")
            for obj in result['object_types'][:3]:
                print(f"  - {obj.get('concept_name')} ({obj.get('concept_id')})")
                props = obj.get('properties', [])
                if props:
                    print(f"    属性数量: {len(props)}")
    
    if "relation_types" in result:
        print(f"\n关系类型数量: {len(result.get('relation_types', []))}")
        if result.get('relation_types'):
            print("\n前3个关系类型:")
            for rel in result['relation_types'][:3]:
                print(f"  - {rel.get('concept_name')} ({rel.get('concept_id')})")
                print(f"    {rel.get('source_object_type_id')} -> {rel.get('target_object_type_id')}")
    
    if "keyword_context" in result:
        ctx = result['keyword_context']
        print(f"\n关键词: {ctx.get('keyword')}")
        print(f"对象类型ID: {ctx.get('object_type_id')}")
        print(f"匹配字段: {ctx.get('matched_field')}")
        instances = ctx.get('instances', [])
        print(f"实例数量: {len(instances)}")
        stats = ctx.get('statistics', {})
        print(f"总实例数: {stats.get('total_instances', 0)}")
        print(f"总邻居数: {stats.get('total_neighbors', 0)}")
        if instances:
            first = instances[0]
            print(f"\n第一个实例:")
            print(f"  ID: {first.get('instance_id')}")
            print(f"  名称: {first.get('instance_name')}")
            neighbors = first.get('neighbors', [])
            print(f"  邻居数量: {len(neighbors)}")
            if neighbors:
                print(f"  前3个邻居:")
                for n in neighbors[:3]:
                    print(f"    - {n.get('instance_name')} ({n.get('object_type_id')})")
    
    if "objects" in result:
        print(f"\n对象类型YAML长度: {len(result.get('objects', ''))} 字符")
        print(f"关系类型YAML长度: {len(result.get('relations', ''))} 字符")


# ==================== 测试用例定义 ====================

TEST_CASES = {
    # 概念召回测试用例
    "concept_retrieval_basic": {
        "name": "基础概念召回（Schema召回）",
        "description": "测试enable_keyword_context=False的基础概念召回",
        "params": {
            "query": "上气道梗阻有哪些症状",
            "top_k": 10,
            "kn_ids": [{"knowledge_network_id": TEST_CONFIG["kn_id"]}],
            "session_id": "test_session_concept_001",
            "enable_keyword_context": False,
            "compact_format": False,
            "return_union": True,
            "skip_llm": False
        },
        "expected": {
            "has_object_types": True,
            "has_relation_types": True
        }
    },
    
    "concept_retrieval_compact": {
        "name": "概念召回 - 紧凑格式",
        "description": "测试compact_format=True的紧凑格式返回",
        "params": {
            "query": "上气道梗阻有哪些症状",
            "top_k": 10,
            "kn_ids": [{"knowledge_network_id": TEST_CONFIG["kn_id"]}],
            "session_id": "test_session_concept_002",
            "enable_keyword_context": False,
            "compact_format": True,  # 紧凑格式
            "return_union": True,
            "skip_llm": False
        },
        "expected": {
            "has_objects_or_object_types": True
        }
    },
    
    "concept_retrieval_incremental": {
        "name": "概念召回 - 增量结果",
        "description": "测试return_union=False的增量结果",
        "params": {
            "query": "上气道梗阻有哪些症状",
            "top_k": 10,
            "kn_ids": [{"knowledge_network_id": TEST_CONFIG["kn_id"]}],
            "session_id": "test_session_concept_003",
            "enable_keyword_context": False,
            "compact_format": False,
            "return_union": False,  # 增量结果
            "skip_llm": False
        },
        "expected": {
            "has_object_types": True
        }
    },
    
    "concept_retrieval_skip_llm": {
        "name": "概念召回 - 跳过LLM",
        "description": "测试skip_llm=True跳过LLM处理",
        "params": {
            "query": "上气道梗阻有哪些症状",
            "top_k": 10,
            "kn_ids": [{"knowledge_network_id": TEST_CONFIG["kn_id"]}],
            "session_id": "test_session_concept_004",
            "enable_keyword_context": False,
            "compact_format": False,
            "return_union": True,
            "skip_llm": True  # 跳过LLM
        },
        "expected": {
            "has_object_types": True,
            "has_relation_types": True
        }
    },
    
    # 关键词召回测试用例
    "keyword_retrieval_basic": {
        "name": "基础关键词召回",
        "description": "测试enable_keyword_context=True的基础关键词召回",
        "requires_schema": True,  # 需要先召回schema
        "params": {
            "query": "上气道梗阻",  # 关键词
            "top_k": 10,
            "kn_ids": [{"knowledge_network_id": TEST_CONFIG["kn_id"]}],
            "session_id": "test_session_keyword_001",
            "enable_keyword_context": True,
            "object_type_id": "disease",  # 必须提供
            "compact_format": False,
            "return_union": True
        },
        "expected": {
            "has_keyword_context": True,
            "keyword_matches": "上气道梗阻"
        }
    },
    
    "keyword_retrieval_multiple": {
        "name": "多个关键词召回",
        "description": "测试针对不同关键词的多次召回",
        "requires_schema": True,
        "params": [
            {
                "query": "上气道梗阻",
                "top_k": 10,
                "kn_ids": [{"knowledge_network_id": TEST_CONFIG["kn_id"]}],
                "session_id": "test_session_keyword_002",
                "enable_keyword_context": True,
                "object_type_id": "disease"
            },
            {
                "query": "症状",
                "top_k": 10,
                "kn_ids": [{"knowledge_network_id": TEST_CONFIG["kn_id"]}],
                "session_id": "test_session_keyword_002",  # 相同session
                "enable_keyword_context": True,
                "object_type_id": "symptom"
            }
        ],
        "expected": {
            "both_success": True
        }
    },
    
    # 错误场景测试用例
    "error_no_schema": {
        "name": "错误场景 - 没有先召回schema",
        "description": "测试在没有schema的情况下直接调用关键词召回",
        "params": {
            "query": "上气道梗阻",
            "top_k": 10,
            "kn_ids": [{"knowledge_network_id": TEST_CONFIG["kn_id"]}],
            "session_id": "test_session_error_001",
            "enable_keyword_context": True,
            "object_type_id": "disease"
        },
        "expected": {
            "should_fail": True,
            "error_message_contains": "Schema信息不存在"
        }
    },
    
    "error_no_object_type_id": {
        "name": "错误场景 - 缺少object_type_id",
        "description": "测试在启用关键词召回时缺少object_type_id参数",
        "params": {
            "query": "上气道梗阻",
            "top_k": 10,
            "kn_ids": [{"knowledge_network_id": TEST_CONFIG["kn_id"]}],
            "session_id": "test_session_error_002",
            "enable_keyword_context": True,
            "object_type_id": None  # 不提供
        },
        "expected": {
            "should_fail": True,
            "error_message_contains": "object_type_id"
        }
    }
}


def generate_curl_command(test_case: Dict[str, Any], base_url: str = "http://localhost:8000") -> str:
    """生成curl测试命令"""
    params = test_case["params"]
    
    # 构建请求体
    body = {
        "query": params["query"],
        "top_k": params.get("top_k", 10),
        "kn_ids": params["kn_ids"],
    }
    
    if "session_id" in params:
        body["session_id"] = params["session_id"]
    if "enable_keyword_context" in params:
        body["enable_keyword_context"] = params["enable_keyword_context"]
    if "object_type_id" in params and params["object_type_id"]:
        body["object_type_id"] = params["object_type_id"]
    if "compact_format" in params:
        body["compact_format"] = params["compact_format"]
    if "return_union" in params:
        body["return_union"] = params["return_union"]
    if "skip_llm" in params:
        body["skip_llm"] = params["skip_llm"]
    
    curl_cmd = f"""curl -X POST '{base_url}/api/knowledge-retrieve' \\
  -H 'Content-Type: application/json' \\
  -H 'x-account-id: {TEST_CONFIG["account_id"]}' \\
  -H 'x-account-type: {TEST_CONFIG["account_type"]}' \\
  -d '{json.dumps(body, ensure_ascii=False)}'"""
    
    return curl_cmd


def print_all_test_cases():
    """打印所有测试用例"""
    print("="*80)
    print("所有测试用例")
    print("="*80)
    
    for case_id, case in TEST_CASES.items():
        print(f"\n【{case_id}】{case['name']}")
        print(f"描述: {case.get('description', '')}")
        
        if case.get('requires_schema'):
            print("⚠️  注意: 此测试需要先召回schema")
        
        params = case["params"]
        if isinstance(params, list):
            print(f"\n包含 {len(params)} 个子测试:")
            for i, p in enumerate(params, 1):
                print(f"\n  子测试 {i}:")
                print_test_case(f"{case['name']} - 子测试{i}", p)
        else:
            print_test_case(case['name'], params)
        
        print("\n预期结果:")
        print(json.dumps(case.get("expected", {}), indent=2, ensure_ascii=False))
        
        # 生成curl命令
        if isinstance(params, dict):
            print("\nCURL命令:")
            print(generate_curl_command(case))


def main():
    """主函数"""
    print("="*80)
    print("检索功能测试用例文档")
    print("="*80)
    print("\n此脚本包含概念召回和关键词召回的所有测试用例")
    print("可以通过以下方式使用:")
    print("1. 查看所有测试用例: python test_retrieval_scenarios.py")
    print("2. 使用生成的curl命令直接测试API")
    print("3. 在代码中导入TEST_CASES字典进行自动化测试")
    
    print_all_test_cases()
    
    print("\n" + "="*80)
    print("测试执行建议")
    print("="*80)
    print("""
1. 概念召回测试顺序:
   - 先测试基础概念召回（concept_retrieval_basic）
   - 然后测试其他参数组合（compact_format, return_union, skip_llm）

2. 关键词召回测试顺序:
   - 先执行概念召回，获取schema
   - 然后执行关键词召回（使用相同的session_id）

3. 错误场景测试:
   - 测试各种错误情况，确保错误处理正确

4. 测试环境要求:
   - 确保API服务正常运行
   - 确保数据库连接正常
   - 确保有测试数据
    """)


if __name__ == "__main__":
    main()

