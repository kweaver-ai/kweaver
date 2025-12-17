# Text2SQL API Schema 参数校验报告

## 校验概述

本次校验对比了 `Text2SQLTool.as_async_api_cls` 方法和 `get_api_schema` 方法的参数定义，确保两者保持一致。

## 发现的问题及修复

### 1. ✅ 已修复：vega_type 默认值不一致

**问题描述**：
- `as_async_api_cls` 中默认值：`VegaType.DIP.value` ("dip")
- `get_api_schema` 中默认值：`"af"`

**修复方案**：
```python
# 修改前
"default": "af"

# 修改后  
"default": "dip"
```

**影响**：确保 API 文档与实际实现行为一致。

### 2. ✅ 已修复：kg 参数缺少必需字段

**问题描述**：
- `get_api_schema` 中 `kg` 的 `required` 字段只包含 `["kg_id"]`
- 实际使用中 `fields` 也是必需参数

**修复方案**：
```python
# 修改前
"required": ["kg_id"]

# 修改后
"required": ["kg_id", "fields"]
```

**影响**：确保 API 调用时提供所有必需参数。

### 3. ✅ 已修复：data_source 缺少必需字段定义

**问题描述**：
- `get_api_schema` 中 `data_source` 的 `required` 字段为空数组
- 实际使用中 `user_id` 是必需参数

**修复方案**：
```python
# 修改前
"required": []

# 修改后
"required": ["user_id"]
```

**影响**：确保 API 文档准确反映必需参数。

### 4. ✅ 已修复：移除未使用的 only_sql 参数

**问题描述**：
- `get_api_schema` 中定义了 `only_sql` 参数
- `as_async_api_cls` 中没有使用该参数

**修复方案**：
- 从 `inputs` 示例中移除 `only_sql` 字段
- 从 schema 定义中移除 `only_sql` 属性

**影响**：避免 API 文档与实际实现不一致。

## 参数结构对比

### data_source 参数

| 参数名 | 类型 | 必需 | 描述 | 默认值 |
|--------|------|------|------|--------|
| view_list | array[string] | 否 | 逻辑视图ID列表 | [] |
| auth_url | string | 否 | 认证服务URL | - |
| user | string | 否 | 用户名 | - |
| password | string | 否 | 密码 | - |
| token | string | 否 | 认证令牌 | - |
| user_id | string | **是** | 用户ID | - |
| vega_type | string | 否 | Vega类型 | "dip" |
| kg | array[object] | 否 | 知识图谱配置 | [] |

### kg 参数结构

| 参数名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| kg_id | string | **是** | 知识图谱ID |
| fields | array[string] | **是** | 用户选中的实体字段列表 |

### llm 参数

| 参数名 | 类型 | 必需 | 描述 | 默认值 |
|--------|------|------|------|--------|
| model_name | string | 否 | 模型名称 | - |
| openai_api_key | string | 否 | OpenAI API密钥 | - |
| openai_api_base | string | 否 | OpenAI API基础URL | - |
| max_tokens | integer | 否 | 最大生成令牌数 | - |
| temperature | number | 否 | 生成温度参数 | - |

### config 参数

| 参数名 | 类型 | 必需 | 描述 | 默认值 |
|--------|------|------|------|--------|
| background | string | 否 | 背景信息 | "" |
| retry_times | integer | 否 | 重试次数 | 3 |
| session_type | string | 否 | 会话类型 | "in_memory" |
| session_id | string | 否 | 会话ID | "" |
| force_limit | integer | 否 | 返回数据条数限制 | 100 |
| only_essential_dim | boolean | 否 | 是否只展示必要的维度 | true |
| dimension_num_limit | integer | 否 | 维度数量限制 | 10 |
| get_desc_from_datasource | boolean | 否 | 是否从数据源获取描述 | false |
| return_record_limit | integer | 否 | 返回数据条数限制 | 10 |
| return_data_limit | integer | 否 | 返回数据总量限制 | 1000 |
| view_num_limit | integer | 否 | 引用视图数量限制 | 5 |
| rewrite_query | boolean | 否 | 是否重写查询 | false |
| show_sql_graph | boolean | 否 | 是否显示SQL图 | false |

### infos 参数

| 参数名 | 类型 | 必需 | 描述 | 默认值 |
|--------|------|------|------|--------|
| knowledge_enhanced_information | object | 否 | 知识增强信息 | {} |
| extra_info | string | 否 | 额外信息(非知识增强) | "" |
| action | string | 否 | 工具行为类型 | "gen_exec" |

### 根级参数

| 参数名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| data_source | object | **是** | 视图配置信息 |
| llm | object | 否 | 语言模型配置 |
| config | object | 否 | 工具配置参数 |
| infos | object | 否 | 输入参数 |
| input | string | **是** | 用户输入的自然语言查询 |

## 验证建议

### 1. 单元测试
建议为 `get_api_schema` 方法添加单元测试，验证：
- 返回的 schema 结构正确
- 必需字段定义准确
- 默认值与实现一致

### 2. 集成测试
建议添加集成测试，验证：
- API 调用时参数验证正确
- 错误处理机制完善
- 响应格式符合预期

### 3. 文档同步
建议：
- 定期检查 API 文档与实际实现的同步性
- 建立参数变更的审查流程
- 维护参数变更的历史记录

## 总结

通过本次校验和修复，`get_api_schema` 方法的参数定义现在与 `as_async_api_cls` 方法的实现保持一致。主要修复了：

1. ✅ 统一了 `vega_type` 的默认值
2. ✅ 完善了 `kg` 参数的必需字段定义
3. ✅ 添加了 `data_source` 的必需字段定义
4. ✅ 移除了未使用的 `only_sql` 参数

这些修复确保了 API 文档的准确性和一致性，提高了 API 的可用性和可维护性。 