# 检索功能测试指南

## 概述

本文档提供了概念召回和关键词召回的完整测试指南，包括所有测试用例和测试方法。

## 测试用例列表

### 概念召回测试（Schema召回）

#### 1. 基础概念召回
- **测试ID**: `concept_retrieval_basic`
- **参数**: `enable_keyword_context=False`
- **目的**: 测试基础的schema召回功能
- **预期结果**: 返回object_types和relation_types

#### 2. 紧凑格式召回
- **测试ID**: `concept_retrieval_compact`
- **参数**: `compact_format=True`
- **目的**: 测试紧凑格式返回（减少token）
- **预期结果**: 返回YAML格式的objects和relations字符串

#### 3. 增量结果召回
- **测试ID**: `concept_retrieval_incremental`
- **参数**: `return_union=False`
- **目的**: 测试增量结果返回（只返回新增的）
- **预期结果**: 返回当前轮次新增的对象类型和关系类型

#### 4. 跳过LLM召回
- **测试ID**: `concept_retrieval_skip_llm`
- **参数**: `skip_llm=True`
- **目的**: 测试跳过LLM处理，直接返回前top_k个关系类型
- **预期结果**: 返回对象类型和关系类型（不经过LLM筛选）

### 关键词召回测试

#### 5. 基础关键词召回
- **测试ID**: `keyword_retrieval_basic`
- **参数**: `enable_keyword_context=True`, `object_type_id="disease"`
- **前提**: 需要先执行概念召回获取schema
- **目的**: 测试基础的关键词上下文召回
- **预期结果**: 返回keyword_context，包含匹配的实例和一度邻居

#### 6. 多个关键词召回
- **测试ID**: `keyword_retrieval_multiple`
- **参数**: 针对不同关键词多次调用
- **前提**: 需要先执行概念召回获取schema
- **目的**: 测试针对不同关键词的多次召回
- **预期结果**: 每次召回都成功，复用同一个session中的schema

### 错误场景测试

#### 7. 没有先召回schema
- **测试ID**: `error_no_schema`
- **参数**: `enable_keyword_context=True`，但没有先召回schema
- **目的**: 测试错误处理
- **预期结果**: 抛出错误 "Schema信息不存在，请先调用enable_keyword_context=False召回schema"

#### 8. 缺少object_type_id
- **测试ID**: `error_no_object_type_id`
- **参数**: `enable_keyword_context=True`，但不提供object_type_id
- **目的**: 测试参数验证
- **预期结果**: 抛出错误，提示必须提供object_type_id

## 测试方法

### 方法1: 使用Python脚本测试

```bash
# 查看所有测试用例
python src/data_retrieval/tools/knowledge_network_tools/test_retrieval_scenarios.py

# 运行完整测试（需要完整环境）
python src/data_retrieval/tools/knowledge_network_tools/test_full_retrieval.py
```

### 方法2: 使用curl命令测试

#### 测试1: 基础概念召回

```bash
curl -X POST 'http://localhost:8000/api/knowledge-retrieve' \
  -H 'Content-Type: application/json' \
  -H 'x-account-id: bdb78b62-6c48-11f0-af96-fa8dcc0a06b2' \
  -H 'x-account-type: user' \
  -d '{
    "query": "上气道梗阻有哪些症状",
    "top_k": 10,
    "kn_ids": [{"knowledge_network_id": "kn_medical"}],
    "session_id": "test_session_001",
    "enable_keyword_context": false,
    "compact_format": false,
    "return_union": true
  }'
```

#### 测试2: 基础关键词召回（需要先执行测试1）

```bash
# 第一步：召回schema（使用测试1的curl命令）

# 第二步：召回关键词上下文
curl -X POST 'http://localhost:8000/api/knowledge-retrieve' \
  -H 'Content-Type: application/json' \
  -H 'x-account-id: bdb78b62-6c48-11f0-af96-fa8dcc0a06b2' \
  -H 'x-account-type: user' \
  -d '{
    "query": "上气道梗阻",
    "top_k": 10,
    "kn_ids": [{"knowledge_network_id": "kn_medical"}],
    "session_id": "test_session_001",
    "enable_keyword_context": true,
    "object_type_id": "disease"
  }'
```

#### 测试3: 紧凑格式召回

```bash
curl -X POST 'http://localhost:8000/api/knowledge-retrieve' \
  -H 'Content-Type: application/json' \
  -H 'x-account-id: bdb78b62-6c48-11f0-af96-fa8dcc0a06b2' \
  -H 'x-account-type: user' \
  -d '{
    "query": "上气道梗阻有哪些症状",
    "top_k": 10,
    "kn_ids": [{"knowledge_network_id": "kn_medical"}],
    "session_id": "test_session_002",
    "enable_keyword_context": false,
    "compact_format": true
  }'
```

#### 测试4: 增量结果召回

```bash
# 第一次召回
curl -X POST 'http://localhost:8000/api/knowledge-retrieve' \
  -H 'Content-Type: application/json' \
  -H 'x-account-id: bdb78b62-6c48-11f0-af96-fa8dcc0a06b2' \
  -H 'x-account-type: user' \
  -d '{
    "query": "上气道梗阻有哪些症状",
    "top_k": 10,
    "kn_ids": [{"knowledge_network_id": "kn_medical"}],
    "session_id": "test_session_003",
    "enable_keyword_context": false,
    "return_union": true
  }'

# 第二次召回（增量）
curl -X POST 'http://localhost:8000/api/knowledge-retrieve' \
  -H 'Content-Type: application/json' \
  -H 'x-account-id: bdb78b62-6c48-11f0-af96-fa8dcc0a06b2' \
  -H 'x-account-type: user' \
  -d '{
    "query": "上气道梗阻有哪些症状",
    "top_k": 10,
    "kn_ids": [{"knowledge_network_id": "kn_medical"}],
    "session_id": "test_session_003",
    "enable_keyword_context": false,
    "return_union": false
  }'
```

#### 测试5: 错误场景 - 没有schema

```bash
curl -X POST 'http://localhost:8000/api/knowledge-retrieve' \
  -H 'Content-Type: application/json' \
  -H 'x-account-id: bdb78b62-6c48-11f0-af96-fa8dcc0a06b2' \
  -H 'x-account-type: user' \
  -d '{
    "query": "上气道梗阻",
    "top_k": 10,
    "kn_ids": [{"knowledge_network_id": "kn_medical"}],
    "session_id": "test_session_error",
    "enable_keyword_context": true,
    "object_type_id": "disease"
  }'
```

**预期**: 返回400错误，错误信息包含 "Schema信息不存在"

### 方法3: 使用Postman或类似工具

1. 导入测试用例文档中的JSON参数
2. 设置正确的请求头
3. 执行请求并验证结果

## 测试检查清单

### 概念召回测试检查项

- [ ] 返回结果包含object_types字段
- [ ] 返回结果包含relation_types字段
- [ ] object_types包含properties字段（对象属性）
- [ ] relation_types包含source_object_type_id和target_object_type_id
- [ ] 紧凑格式返回objects和relations字符串（YAML格式）
- [ ] 增量结果只返回新增的概念
- [ ] 跳过LLM时仍然返回结果

### 关键词召回测试检查项

- [ ] 返回结果包含keyword_context字段
- [ ] keyword_context包含keyword字段
- [ ] keyword_context包含object_type_id字段
- [ ] keyword_context包含instances数组
- [ ] instances中的每个实例包含instance_id、instance_name、properties
- [ ] instances中的每个实例包含neighbors数组（一度邻居）
- [ ] neighbors中的每个邻居包含relation_type_id、relation_direction
- [ ] 多个关键词召回可以复用同一个session中的schema

### 错误处理检查项

- [ ] 没有schema时正确报错
- [ ] 缺少object_type_id时正确报错
- [ ] 错误信息清晰明确
- [ ] 错误状态码正确（400）

## 测试数据

### 测试知识网络
- **ID**: `kn_medical`
- **类型**: 医疗知识网络

### 测试关键词
- **疾病**: "上气道梗阻"
- **对象类型**: "disease"
- **症状**: "症状"（如果存在symptom对象类型）

### 测试账户信息
- **account_id**: `bdb78b62-6c48-11f0-af96-fa8dcc0a06b2`
- **account_type**: `user`

## 注意事项

1. **测试顺序**: 关键词召回测试必须先执行概念召回获取schema
2. **Session管理**: 使用相同的session_id可以复用schema信息
3. **环境要求**: 确保API服务正常运行，数据库连接正常
4. **数据依赖**: 确保测试数据存在（如"上气道梗阻"疾病数据）

## 测试结果记录

建议记录以下信息：
- 测试用例ID
- 测试时间
- 请求参数
- 响应结果
- 执行时间
- 是否通过
- 备注

## 问题排查

### 如果测试失败

1. **检查API服务**: 确保服务正常运行
2. **检查数据库**: 确保数据库连接正常
3. **检查参数**: 确保参数格式正确
4. **查看日志**: 检查服务日志了解详细错误信息
5. **验证数据**: 确保测试数据存在

### 常见问题

1. **Schema信息不存在**: 确保先执行概念召回
2. **object_type_id错误**: 确保提供的object_type_id存在于schema中
3. **关键词无匹配**: 确保关键词在数据库中存在
4. **Session过期**: 默认10分钟过期，需要重新召回schema

