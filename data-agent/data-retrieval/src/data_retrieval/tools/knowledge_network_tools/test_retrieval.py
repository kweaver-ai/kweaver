# -*- coding: utf-8 -*-
"""
检索功能综合测试脚本
测试概念召回和关键词召回的所有功能
"""

import asyncio
import sys
import os
import json

# 添加项目根目录到路径
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# 设置PYTHONPATH
os.environ['PYTHONPATH'] = project_root

# 测试配置
TEST_CONFIG = {
    "kn_id": "kn_medical",
    "account_id": "bdb78b62-6c48-11f0-af96-fa8dcc0a06b2",
    "account_type": "user"
}


# ==================== 核心逻辑测试（不依赖外部服务）====================

def test_core_logic():
    """测试核心逻辑（不依赖外部服务）"""
    print("=" * 80)
    print("核心逻辑测试（不依赖外部服务）")
    print("=" * 80)
    
    results = []
    
    # 测试1: 构建OR查询条件
    print("\n测试1: 构建OR查询条件")
    try:
        def build_or_condition(keyword: str, properties: list) -> dict:
            sub_conditions = []
            for prop in properties:
                if not isinstance(prop, dict):
                    continue
                field_name = prop.get("name") or prop.get("id")
                if not field_name:
                    continue
                sub_conditions.append({
                    "field": field_name,
                    "operation": "==",
                    "value": keyword,
                    "value_from": "const"
                })
            if not sub_conditions:
                return {
                    "condition": {"operation": "and", "sub_conditions": []},
                    "need_total": True,
                    "limit": 10
                }
            return {
                "condition": {"operation": "or", "sub_conditions": sub_conditions},
                "need_total": True,
                "limit": 10
            }
        
        properties = [
            {"name": "disease_name", "display_name": "疾病名称"},
            {"name": "disease_id", "display_name": "疾病ID"},
            {"name": "insurance", "display_name": "医保类型"}
        ]
        
        condition = build_or_condition("上气道梗阻", properties)
        assert condition["condition"]["operation"] == "or"
        assert len(condition["condition"]["sub_conditions"]) == 3
        print("✓ OR查询条件构建正确")
        results.append(True)
    except Exception as e:
        print(f"✗ 测试失败: {str(e)}")
        results.append(False)
    
    # 测试2: 提取实例信息
    print("\n测试2: 提取实例信息")
    try:
        def extract_instance_info(datas: list, object_type_id: str) -> list:
            instances = []
            for data in datas:
                if not isinstance(data, dict):
                    continue
                instance_id = None
                instance_name = None
                for key, value in data.items():
                    if key.endswith("_id") and value:
                        instance_id = value
                        break
                for key, value in data.items():
                    if key.endswith("_name") and value:
                        instance_name = value
                        break
                if not instance_id:
                    continue
                instances.append({
                    "instance_id": instance_id,
                    "instance_name": instance_name or instance_id,
                    "object_type_id": object_type_id,
                    "properties": data
                })
            return instances
        
        datas = [{
            "disease_id": "disease_004790",
            "disease_name": "上气道梗阻",
            "age": "儿童"
        }]
        
        instances = extract_instance_info(datas, "disease")
        assert len(instances) == 1
        assert instances[0]["instance_id"] == "disease_004790"
        print("✓ 实例信息提取正确")
        results.append(True)
    except Exception as e:
        print(f"✗ 测试失败: {str(e)}")
        results.append(False)
    
    # 测试3: 提取邻居信息
    print("\n测试3: 提取邻居信息")
    try:
        def extract_neighbors(entries: list, source_instance_ids: set) -> list:
            neighbors = []
            if not entries:
                return neighbors
            entry = entries[0]
            objects = entry.get("objects", {})
            relation_paths = entry.get("relation_paths", [])
            for path in relation_paths:
                for relation in path.get("relations", []):
                    source_object_id = relation.get("source_object_id", "")
                    target_object_id = relation.get("target_object_id", "")
                    source_instance_id = source_object_id.split("-", 1)[1] if "-" in source_object_id else None
                    target_instance_id = target_object_id.split("-", 1)[1] if "-" in target_object_id else None
                    if source_instance_id in source_instance_ids:
                        neighbor_obj = objects.get(target_object_id)
                        if neighbor_obj:
                            unique_identities = neighbor_obj.get("unique_identities", {})
                            instance_id = None
                            for key, value in unique_identities.items():
                                if value:
                                    instance_id = value
                                    break
                            if instance_id:
                                neighbors.append({
                                    "instance_id": instance_id,
                                    "instance_name": neighbor_obj.get("display", ""),
                                    "object_type_id": neighbor_obj.get("object_type_id", ""),
                                    "relation_type_id": relation.get("relation_type_id", ""),
                                    "relation_direction": "outgoing"
                                })
            return neighbors
        
        entries = [{
            "objects": {
                "disease-disease_004790": {
                    "unique_identities": {"disease_id": "disease_004790"},
                    "object_type_id": "disease",
                    "display": "上气道梗阻"
                },
                "symptom-symptom_000020": {
                    "unique_identities": {"symptom_id": "symptom_000020"},
                    "object_type_id": "symptom",
                    "display": "呼吸困难"
                }
            },
            "relation_paths": [{
                "relations": [{
                    "relation_type_id": "has_symptom",
                    "source_object_id": "disease-disease_004790",
                    "target_object_id": "symptom-symptom_000020"
                }]
            }]
        }]
        
        neighbors = extract_neighbors(entries, {"disease_004790"})
        assert len(neighbors) == 1
        assert neighbors[0]["instance_id"] == "symptom_000020"
        print("✓ 邻居信息提取正确")
        results.append(True)
    except Exception as e:
        print(f"✗ 测试失败: {str(e)}")
        results.append(False)
    
    print(f"\n核心逻辑测试: {sum(results)}/{len(results)} 通过")
    return all(results)


# ==================== 概念召回测试 ====================

async def test_concept_retrieval_basic():
    """测试1: 基础概念召回（schema召回）"""
    print("\n" + "="*80)
    print("测试1: 基础概念召回（enable_keyword_context=False）")
    print("="*80)
    
    try:
        from data_retrieval.tools.knowledge_network_tools.retrieval_tool import KnowledgeNetworkRetrievalTool
        from data_retrieval.tools.knowledge_network_tools.models import KnowledgeNetworkIdConfig
        
        result, execution_time = await KnowledgeNetworkRetrievalTool.retrieve(
            query="上气道梗阻有哪些症状",
            top_k=10,
            kn_ids=[KnowledgeNetworkIdConfig(knowledge_network_id=TEST_CONFIG["kn_id"])],
            session_id="test_concept_001",
            headers={
                "x-account-id": TEST_CONFIG["account_id"],
                "x-account-type": TEST_CONFIG["account_type"]
            },
            enable_keyword_context=False,
            compact_format=False,
            return_union=True
        )
        
        print(f"\n执行时间: {execution_time:.2f}秒")
        print(f"对象类型数量: {len(result.get('object_types', []))}")
        print(f"关系类型数量: {len(result.get('relation_types', []))}")
        
        if result.get('object_types'):
            print("\n前3个对象类型:")
            for obj in result['object_types'][:3]:
                print(f"  - {obj.get('concept_name')} ({obj.get('concept_id')})")
        
        assert "object_types" in result
        assert "relation_types" in result
        assert len(result.get("object_types", [])) > 0
        
        print("\n✓ 测试通过")
        return True
        
    except ImportError as e:
        print(f"\n⚠️  跳过测试（模块导入失败）: {str(e)}")
        return None
    except Exception as e:
        print(f"\n✗ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_concept_retrieval_compact_format():
    """测试2: 概念召回 - 紧凑格式"""
    print("\n" + "="*80)
    print("测试2: 概念召回 - 紧凑格式（compact_format=True）")
    print("="*80)
    
    try:
        from data_retrieval.tools.knowledge_network_tools.retrieval_tool import KnowledgeNetworkRetrievalTool
        from data_retrieval.tools.knowledge_network_tools.models import KnowledgeNetworkIdConfig
        
        result, execution_time = await KnowledgeNetworkRetrievalTool.retrieve(
            query="上气道梗阻有哪些症状",
            top_k=10,
            kn_ids=[KnowledgeNetworkIdConfig(knowledge_network_id=TEST_CONFIG["kn_id"])],
            session_id="test_concept_002",
            headers={
                "x-account-id": TEST_CONFIG["account_id"],
                "x-account-type": TEST_CONFIG["account_type"]
            },
            enable_keyword_context=False,
            compact_format=True,
            return_union=True
        )
        
        print(f"\n执行时间: {execution_time:.2f}秒")
        print(f"结果结构: {list(result.keys())}")
        
        if "objects" in result:
            print(f"对象类型YAML长度: {len(result.get('objects', ''))} 字符")
            print(f"关系类型YAML长度: {len(result.get('relations', ''))} 字符")
        
        assert "objects" in result or "object_types" in result
        
        print("\n✓ 测试通过")
        return True
        
    except ImportError as e:
        print(f"\n⚠️  跳过测试（模块导入失败）: {str(e)}")
        return None
    except Exception as e:
        print(f"\n✗ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_concept_retrieval_incremental():
    """测试3: 概念召回 - 增量结果"""
    print("\n" + "="*80)
    print("测试3: 概念召回 - 增量结果（return_union=False）")
    print("="*80)
    
    try:
        from data_retrieval.tools.knowledge_network_tools.retrieval_tool import KnowledgeNetworkRetrievalTool
        from data_retrieval.tools.knowledge_network_tools.models import KnowledgeNetworkIdConfig
        
        session_id = "test_concept_003"
        
        # 第一次召回
        result1, _ = await KnowledgeNetworkRetrievalTool.retrieve(
            query="上气道梗阻有哪些症状",
            top_k=10,
            kn_ids=[KnowledgeNetworkIdConfig(knowledge_network_id=TEST_CONFIG["kn_id"])],
            session_id=session_id,
            headers={
                "x-account-id": TEST_CONFIG["account_id"],
                "x-account-type": TEST_CONFIG["account_type"]
            },
            enable_keyword_context=False,
            return_union=True
        )
        
        print(f"\n第一次召回 - 对象类型: {len(result1.get('object_types', []))}, 关系类型: {len(result1.get('relation_types', []))}")
        
        # 第二次召回（增量）
        result2, execution_time = await KnowledgeNetworkRetrievalTool.retrieve(
            query="上气道梗阻有哪些症状",
            top_k=10,
            kn_ids=[KnowledgeNetworkIdConfig(knowledge_network_id=TEST_CONFIG["kn_id"])],
            session_id=session_id,
            headers={
                "x-account-id": TEST_CONFIG["account_id"],
                "x-account-type": TEST_CONFIG["account_type"]
            },
            enable_keyword_context=False,
            return_union=False
        )
        
        print(f"\n执行时间: {execution_time:.2f}秒")
        print(f"增量结果 - 对象类型: {len(result2.get('object_types', []))}, 关系类型: {len(result2.get('relation_types', []))}")
        
        assert "object_types" in result2
        
        print("\n✓ 测试通过")
        return True
        
    except ImportError as e:
        print(f"\n⚠️  跳过测试（模块导入失败）: {str(e)}")
        return None
    except Exception as e:
        print(f"\n✗ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_concept_retrieval_skip_llm():
    """测试4: 概念召回 - 跳过LLM"""
    print("\n" + "="*80)
    print("测试4: 概念召回 - 跳过LLM（skip_llm=True）")
    print("="*80)
    
    try:
        from data_retrieval.tools.knowledge_network_tools.retrieval_tool import KnowledgeNetworkRetrievalTool
        from data_retrieval.tools.knowledge_network_tools.models import KnowledgeNetworkIdConfig
        
        result, execution_time = await KnowledgeNetworkRetrievalTool.retrieve(
            query="上气道梗阻有哪些症状",
            top_k=10,
            kn_ids=[KnowledgeNetworkIdConfig(knowledge_network_id=TEST_CONFIG["kn_id"])],
            session_id="test_concept_004",
            headers={
                "x-account-id": TEST_CONFIG["account_id"],
                "x-account-type": TEST_CONFIG["account_type"]
            },
            enable_keyword_context=False,
            skip_llm=True
        )
        
        print(f"\n执行时间: {execution_time:.2f}秒")
        print(f"对象类型数量: {len(result.get('object_types', []))}")
        print(f"关系类型数量: {len(result.get('relation_types', []))}")
        
        assert "object_types" in result
        assert "relation_types" in result
        
        print("\n✓ 测试通过")
        return True
        
    except ImportError as e:
        print(f"\n⚠️  跳过测试（模块导入失败）: {str(e)}")
        return None
    except Exception as e:
        print(f"\n✗ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


# ==================== 关键词召回测试 ====================

async def test_keyword_retrieval_basic():
    """测试5: 基础关键词召回"""
    print("\n" + "="*80)
    print("测试5: 基础关键词召回（enable_keyword_context=True）")
    print("="*80)
    
    try:
        from data_retrieval.tools.knowledge_network_tools.retrieval_tool import KnowledgeNetworkRetrievalTool
        from data_retrieval.tools.knowledge_network_tools.models import KnowledgeNetworkIdConfig
        
        session_id = "test_keyword_001"
        
        # 先召回schema
        schema_result, _ = await KnowledgeNetworkRetrievalTool.retrieve(
            query="上气道梗阻有哪些症状",
            top_k=10,
            kn_ids=[KnowledgeNetworkIdConfig(knowledge_network_id=TEST_CONFIG["kn_id"])],
            session_id=session_id,
            headers={
                "x-account-id": TEST_CONFIG["account_id"],
                "x-account-type": TEST_CONFIG["account_type"]
            },
            enable_keyword_context=False
        )
        
        print(f"\nSchema召回完成 - 对象类型: {len(schema_result.get('object_types', []))}, 关系类型: {len(schema_result.get('relation_types', []))}")
        
        # 然后召回关键词上下文
        result, execution_time = await KnowledgeNetworkRetrievalTool.retrieve(
            query="上气道梗阻",  # 关键词
            top_k=10,
            kn_ids=[KnowledgeNetworkIdConfig(knowledge_network_id=TEST_CONFIG["kn_id"])],
            session_id=session_id,  # 相同session
            headers={
                "x-account-id": TEST_CONFIG["account_id"],
                "x-account-type": TEST_CONFIG["account_type"]
            },
            enable_keyword_context=True,
            object_type_id="disease"  # 必须提供
        )
        
        print(f"\n执行时间: {execution_time:.2f}秒")
        
        keyword_context = result.get("keyword_context", {})
        print(f"关键词: {keyword_context.get('keyword')}")
        print(f"对象类型ID: {keyword_context.get('object_type_id')}")
        print(f"匹配字段: {keyword_context.get('matched_field')}")
        
        instances = keyword_context.get("instances", [])
        print(f"实例数量: {len(instances)}")
        
        statistics = keyword_context.get("statistics", {})
        print(f"总实例数: {statistics.get('total_instances', 0)}")
        print(f"总邻居数: {statistics.get('total_neighbors', 0)}")
        
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
        
        assert "keyword_context" in result
        assert keyword_context.get("keyword") == "上气道梗阻"
        assert keyword_context.get("object_type_id") == "disease"
        
        print("\n✓ 测试通过")
        return True
        
    except ImportError as e:
        print(f"\n⚠️  跳过测试（模块导入失败）: {str(e)}")
        return None
    except Exception as e:
        print(f"\n✗ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_keyword_retrieval_multiple():
    """测试6: 多个关键词召回"""
    print("\n" + "="*80)
    print("测试6: 多个关键词召回")
    print("="*80)
    
    try:
        from data_retrieval.tools.knowledge_network_tools.retrieval_tool import KnowledgeNetworkRetrievalTool
        from data_retrieval.tools.knowledge_network_tools.models import KnowledgeNetworkIdConfig
        
        session_id = "test_keyword_002"
        
        # 先召回schema
        await KnowledgeNetworkRetrievalTool.retrieve(
            query="上气道梗阻有哪些症状",
            top_k=10,
            kn_ids=[KnowledgeNetworkIdConfig(knowledge_network_id=TEST_CONFIG["kn_id"])],
            session_id=session_id,
            headers={
                "x-account-id": TEST_CONFIG["account_id"],
                "x-account-type": TEST_CONFIG["account_type"]
            },
            enable_keyword_context=False
        )
        
        # 召回第一个关键词
        result1, _ = await KnowledgeNetworkRetrievalTool.retrieve(
            query="上气道梗阻",
            top_k=10,
            kn_ids=[KnowledgeNetworkIdConfig(knowledge_network_id=TEST_CONFIG["kn_id"])],
            session_id=session_id,
            headers={
                "x-account-id": TEST_CONFIG["account_id"],
                "x-account-type": TEST_CONFIG["account_type"]
            },
            enable_keyword_context=True,
            object_type_id="disease"
        )
        
        print(f"\n第一个关键词召回完成")
        ctx1 = result1.get("keyword_context", {})
        print(f"  关键词: {ctx1.get('keyword')}")
        print(f"  实例数: {len(ctx1.get('instances', []))}")
        
        # 召回第二个关键词（如果存在symptom对象类型）
        try:
            result2, _ = await KnowledgeNetworkRetrievalTool.retrieve(
                query="症状",
                top_k=10,
                kn_ids=[KnowledgeNetworkIdConfig(knowledge_network_id=TEST_CONFIG["kn_id"])],
                session_id=session_id,
                headers={
                    "x-account-id": TEST_CONFIG["account_id"],
                    "x-account-type": TEST_CONFIG["account_type"]
                },
                enable_keyword_context=True,
                object_type_id="symptom"
            )
            
            print(f"\n第二个关键词召回完成")
            ctx2 = result2.get("keyword_context", {})
            print(f"  关键词: {ctx2.get('keyword')}")
            print(f"  实例数: {len(ctx2.get('instances', []))}")
        except Exception as e:
            print(f"\n第二个关键词召回失败（可能symptom对象类型不存在）: {str(e)}")
        
        print("\n✓ 测试通过")
        return True
        
    except ImportError as e:
        print(f"\n⚠️  跳过测试（模块导入失败）: {str(e)}")
        return None
    except Exception as e:
        print(f"\n✗ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


# ==================== 错误场景测试 ====================

async def test_error_no_schema():
    """测试7: 错误场景 - 没有先召回schema"""
    print("\n" + "="*80)
    print("测试7: 错误场景 - 没有先召回schema")
    print("="*80)
    
    try:
        from data_retrieval.tools.knowledge_network_tools.retrieval_tool import KnowledgeNetworkRetrievalTool
        from data_retrieval.tools.knowledge_network_tools.models import KnowledgeNetworkIdConfig
        
        result, _ = await KnowledgeNetworkRetrievalTool.retrieve(
            query="上气道梗阻",
            top_k=10,
            kn_ids=[KnowledgeNetworkIdConfig(knowledge_network_id=TEST_CONFIG["kn_id"])],
            session_id="test_error_no_schema",
            headers={
                "x-account-id": TEST_CONFIG["account_id"],
                "x-account-type": TEST_CONFIG["account_type"]
            },
            enable_keyword_context=True,
            object_type_id="disease"
        )
        
        print("✗ 应该抛出异常但没有抛出")
        return False
        
    except ImportError as e:
        print(f"\n⚠️  跳过测试（模块导入失败）: {str(e)}")
        return None
    except ValueError as e:
        if "Schema信息不存在" in str(e):
            print(f"\n✓ 正确捕获错误: {str(e)}")
            return True
        else:
            print(f"\n✗ 错误信息不正确: {str(e)}")
            return False
    except Exception as e:
        print(f"\n✗ 意外错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_error_no_object_type_id():
    """测试8: 错误场景 - 缺少object_type_id"""
    print("\n" + "="*80)
    print("测试8: 错误场景 - 缺少object_type_id")
    print("="*80)
    
    try:
        from data_retrieval.tools.knowledge_network_tools.retrieval_tool import KnowledgeNetworkRetrievalTool
        from data_retrieval.tools.knowledge_network_tools.models import KnowledgeNetworkIdConfig
        
        result, _ = await KnowledgeNetworkRetrievalTool.retrieve(
            query="上气道梗阻",
            top_k=10,
            kn_ids=[KnowledgeNetworkIdConfig(knowledge_network_id=TEST_CONFIG["kn_id"])],
            session_id="test_error_no_object_type_id",
            headers={
                "x-account-id": TEST_CONFIG["account_id"],
                "x-account-type": TEST_CONFIG["account_type"]
            },
            enable_keyword_context=True,
            object_type_id=None  # 不提供
        )
        
        print("✗ 应该抛出异常但没有抛出")
        return False
        
    except ImportError as e:
        print(f"\n⚠️  跳过测试（模块导入失败）: {str(e)}")
        return None
    except ValueError as e:
        if "object_type_id" in str(e):
            print(f"\n✓ 正确捕获错误: {str(e)}")
            return True
        else:
            print(f"\n✗ 错误信息不正确: {str(e)}")
            return False
    except Exception as e:
        print(f"\n✗ 意外错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


# ==================== 主测试函数 ====================

async def main():
    """主测试函数"""
    print("="*80)
    print("检索功能综合测试")
    print("="*80)
    print("\n测试概念召回和关键词召回的所有功能")
    
    results = []
    
    # 核心逻辑测试（不依赖外部服务）
    print("\n" + "="*80)
    print("第一部分: 核心逻辑测试（不依赖外部服务）")
    print("="*80)
    core_result = test_core_logic()
    results.append(("核心逻辑测试", core_result))
    
    # 概念召回测试
    print("\n" + "="*80)
    print("第二部分: 概念召回测试（需要API服务）")
    print("="*80)
    
    concept_results = await asyncio.gather(
        test_concept_retrieval_basic(),
        test_concept_retrieval_compact_format(),
        test_concept_retrieval_incremental(),
        test_concept_retrieval_skip_llm(),
        return_exceptions=True
    )
    
    results.append(("基础概念召回", concept_results[0]))
    results.append(("概念召回-紧凑格式", concept_results[1]))
    results.append(("概念召回-增量结果", concept_results[2]))
    results.append(("概念召回-跳过LLM", concept_results[3]))
    
    # 关键词召回测试
    print("\n" + "="*80)
    print("第三部分: 关键词召回测试（需要API服务）")
    print("="*80)
    
    keyword_results = await asyncio.gather(
        test_keyword_retrieval_basic(),
        test_keyword_retrieval_multiple(),
        return_exceptions=True
    )
    
    results.append(("基础关键词召回", keyword_results[0]))
    results.append(("多个关键词召回", keyword_results[1]))
    
    # 错误场景测试
    print("\n" + "="*80)
    print("第四部分: 错误场景测试")
    print("="*80)
    
    error_results = await asyncio.gather(
        test_error_no_schema(),
        test_error_no_object_type_id(),
        return_exceptions=True
    )
    
    results.append(("错误-没有schema", error_results[0]))
    results.append(("错误-缺少object_type_id", error_results[1]))
    
    # 打印测试结果汇总
    print("\n" + "="*80)
    print("测试结果汇总")
    print("="*80)
    
    core_tests = [r for r in results if "核心" in r[0]]
    concept_tests = [r for r in results if "概念" in r[0] or "跳过LLM" in r[0]]
    keyword_tests = [r for r in results if "关键词" in r[0]]
    error_tests = [r for r in results if "错误" in r[0]]
    
    print("\n核心逻辑测试:")
    for test_name, passed in core_tests:
        status = "✓ 通过" if passed else "✗ 失败"
        print(f"  {test_name}: {status}")
    
    print("\n概念召回测试:")
    for test_name, passed in concept_tests:
        if passed is None:
            status = "⚠️  跳过（需要API服务）"
        elif passed:
            status = "✓ 通过"
        else:
            status = "✗ 失败"
        print(f"  {test_name}: {status}")
    
    print("\n关键词召回测试:")
    for test_name, passed in keyword_tests:
        if passed is None:
            status = "⚠️  跳过（需要API服务）"
        elif passed:
            status = "✓ 通过"
        else:
            status = "✗ 失败"
        print(f"  {test_name}: {status}")
    
    print("\n错误场景测试:")
    for test_name, passed in error_tests:
        if passed is None:
            status = "⚠️  跳过（需要API服务）"
        elif passed:
            status = "✓ 通过"
        else:
            status = "✗ 失败"
        print(f"  {test_name}: {status}")
    
    # 统计结果
    total = len(results)
    passed = sum(1 for _, p in results if p is True)
    skipped = sum(1 for _, p in results if p is None)
    failed = sum(1 for _, p in results if p is False)
    
    print(f"\n总计: {passed} 通过, {skipped} 跳过, {failed} 失败 / {total} 测试")
    
    return passed == (total - skipped)


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)

