#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""临时测试脚本 - 验证 SkillInputVo 模型的字段验证"""

import sys
import json

sys.path.insert(0, "/Users/Zhuanz/Work/as/dip_ws/agent-executor")

from app.domain.vo.agentvo.agent_config_vos.skill_input_vo import SkillInputVo
from pydantic import ValidationError

print("=" * 80)
print("SkillInputVo 模型验证测试")
print("=" * 80)

# 测试1: 不提供 enable 和 map_type 字段（模拟 400.log 中的错误情况）
print("\n【测试1】不提供 enable 和 map_type 字段")
print("-" * 80)
test_data_1 = {
    "input_name": "config",
    "input_type": "object",
    "input_desc": "工具配置参数",
}
print(f"输入数据: {json.dumps(test_data_1, ensure_ascii=False, indent=2)}")
try:
    skill_input = SkillInputVo(**test_data_1)
    print("✅ 验证通过！")
    print("结果:")
    print(f"  - enable: {skill_input.enable}")
    print(f"  - input_name: {skill_input.input_name}")
    print(f"  - input_type: {skill_input.input_type}")
    print(f"  - map_type: {skill_input.map_type}")
    print(f"  - map_value: {skill_input.map_value}")
except ValidationError as e:
    print("❌ 验证失败:")
    for error in e.errors():
        print(f"  - 字段: {error['loc']}, 类型: {error['type']}, 错误: {error['msg']}")

# 测试2: 只提供 enable 字段，不提供 map_type
print("\n【测试2】只提供 enable 字段，不提供 map_type")
print("-" * 80)
test_data_2 = {
    "enable": True,
    "input_name": "data_source",
    "input_type": "object",
    "input_desc": "数据源配置信息",
}
print(f"输入数据: {json.dumps(test_data_2, ensure_ascii=False, indent=2)}")
try:
    skill_input = SkillInputVo(**test_data_2)
    print("✅ 验证通过！")
    print("结果:")
    print(f"  - enable: {skill_input.enable}")
    print(f"  - map_type: {skill_input.map_type}")
except ValidationError as e:
    print("❌ 验证失败:")
    for error in e.errors():
        print(f"  - 字段: {error['loc']}, 类型: {error['type']}, 错误: {error['msg']}")

# 测试3: 只提供 map_type 字段，不提供 enable
print("\n【测试3】只提供 map_type 字段，不提供 enable")
print("-" * 80)
test_data_3 = {
    "input_name": "infos",
    "input_type": "object",
    "map_type": "auto",
    "input_desc": "额外的输入信息",
}
print(f"输入数据: {json.dumps(test_data_3, ensure_ascii=False, indent=2)}")
try:
    skill_input = SkillInputVo(**test_data_3)
    print("✅ 验证通过！")
    print("结果:")
    print(f"  - enable: {skill_input.enable}")
    print(f"  - map_type: {skill_input.map_type}")
except ValidationError as e:
    print("❌ 验证失败:")
    for error in e.errors():
        print(f"  - 字段: {error['loc']}, 类型: {error['type']}, 错误: {error['msg']}")

# 测试4: 提供所有字段
print("\n【测试4】提供所有字段")
print("-" * 80)
test_data_4 = {
    "enable": True,
    "input_name": "llm",
    "input_type": "object",
    "map_type": "auto",
    "map_value": "",
    "input_desc": "语言模型配置",
}
print(f"输入数据: {json.dumps(test_data_4, ensure_ascii=False, indent=2)}")
try:
    skill_input = SkillInputVo(**test_data_4)
    print("✅ 验证通过！")
    print("结果:")
    print(f"  - enable: {skill_input.enable}")
    print(f"  - map_type: {skill_input.map_type}")
    print(f"  - map_value: {skill_input.map_value}")
except ValidationError as e:
    print("❌ 验证失败:")
    for error in e.errors():
        print(f"  - 字段: {error['loc']}, 类型: {error['type']}, 错误: {error['msg']}")

# 测试5: enable 为 false
print("\n【测试5】enable 为 false")
print("-" * 80)
test_data_5 = {
    "enable": False,
    "input_name": "timeout",
    "input_type": "number",
    "map_type": "auto",
    "map_value": "",
}
print(f"输入数据: {json.dumps(test_data_5, ensure_ascii=False, indent=2)}")
try:
    skill_input = SkillInputVo(**test_data_5)
    print("✅ 验证通过！")
    print("结果:")
    print(f"  - enable: {skill_input.enable}")
    print(f"  - map_type: {skill_input.map_type}")
except ValidationError as e:
    print("❌ 验证失败:")
    for error in e.errors():
        print(f"  - 字段: {error['loc']}, 类型: {error['type']}, 错误: {error['msg']}")

# 测试6: 缺少必填字段 input_name（应该失败）
print("\n【测试6】缺少必填字段 input_name（应该失败）")
print("-" * 80)
test_data_6 = {"input_type": "string", "enable": True}
print(f"输入数据: {json.dumps(test_data_6, ensure_ascii=False, indent=2)}")
try:
    skill_input = SkillInputVo(**test_data_6)
    print("✅ 验证通过！")
except ValidationError as e:
    print("❌ 验证失败（预期行为）:")
    for error in e.errors():
        print(f"  - 字段: {error['loc']}, 类型: {error['type']}, 错误: {error['msg']}")

# 测试7: 缺少必填字段 input_type（应该失败）
print("\n【测试7】缺少必填字段 input_type（应该失败）")
print("-" * 80)
test_data_7 = {"input_name": "test", "enable": True}
print(f"输入数据: {json.dumps(test_data_7, ensure_ascii=False, indent=2)}")
try:
    skill_input = SkillInputVo(**test_data_7)
    print("✅ 验证通过！")
except ValidationError as e:
    print("❌ 验证失败（预期行为）:")
    for error in e.errors():
        print(f"  - 字段: {error['loc']}, 类型: {error['type']}, 错误: {error['msg']}")

print("\n" + "=" * 80)
print("测试总结:")
print("- 测试1-5: 验证 enable 和 map_type 为可选字段")
print("- 测试6-7: 验证 input_name 和 input_type 仍为必填字段")
print("=" * 80)
