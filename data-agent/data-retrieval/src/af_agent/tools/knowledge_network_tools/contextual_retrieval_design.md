# 细粒度上下文召回设计方案

## 一、方案概述

### 1.1 背景
当前检索工具已完成第一步：召回schema（对象类型、对象属性、关系类型）。现在需要在schema召回的基础上，增加第二步：细粒度的上下文召回，为下游任务提供必要的预备知识。

### 1.2 核心目标
**不是为了召回答案，而是召回预备知识**，帮助下游任务：
- 理解问题中的关键词在数据库中的实际存储形式
- 了解属性值的存储格式和查询模式
- 掌握关系路径上的典型值模式
- 识别关键词到对象类型/属性的映射关系

### 1.3 核心问题
用户问题中的关键词可能与数据库存储形式不一致：
- 用户问："上气道梗阻"
- 数据库存储："上、下气道梗阻"
- 问题：直接匹配可能查不到数据，需要提前召回映射关系

## 二、需要召回的预备知识类型

### 2.1 关键词的数据库存储形式映射（核心）

**目的**：让下游任务知道用户问题中的关键词在数据库中实际存储为什么形式

**召回内容**：
1. **精确匹配形式**：关键词的完全匹配结果
   - 示例："上气道梗阻" → 精确匹配到 "上气道梗阻"
   
2. **包含匹配形式**：关键词作为子串的匹配结果
   - 示例："上气道梗阻" → 包含在 "上、下气道梗阻" 中
   
3. **模糊匹配形式**：关键词的部分匹配或变体
   - 示例："上气道梗阻" → "上气道阻塞"、"上呼吸道梗阻" 等变体

**使用接口**：接口1（对象检索）

**召回策略**：
- 对每个关键词，在相关对象类型中尝试多种匹配方式
- 每种匹配方式只召回少量示例（3-5个），了解存储形式即可

### 2.2 属性值的实际存储格式和模式

**目的**：让下游任务知道属性值在数据库中的存储格式（字符串、数字、日期格式等）

**召回内容**：
1. **数据类型**：属性值的实际数据类型（字符串、数字、日期等）
2. **格式模式**：属性值的常见格式（如："30岁" vs 数字30 vs "30-40岁"）
3. **取值范围示例**：该属性的典型值范围

**使用接口**：接口1（对象检索）

**召回策略**：
- 对问题中的属性值条件，召回该属性的示例值
- 分析实际存储格式和模式
- 识别值的单位、范围等特征

### 2.3 关系路径上的典型值模式

**目的**：让下游任务了解关系路径上源对象和目标对象的典型值，帮助构建查询

**召回内容**：
1. **源对象典型值**：关系路径上源对象的典型值示例
2. **目标对象典型值**：关系路径上目标对象的典型值示例
3. **字段映射**：源对象和目标对象的主字段名称

**使用接口**：接口2（关系路径检索）

**召回策略**：
- 对召回的关系类型，检索少量典型实例（limit=3-5）
- 提取源对象和目标对象的典型值
- 识别主字段名称（通常是*_name、name等字段）

### 2.4 对象类型的主标识字段

**目的**：让下游任务知道每个对象类型的主要查询字段是什么

**召回内容**：
1. **主名字段**：每个对象类型的主名字段（如：disease的disease_name，person的name）
2. **ID字段**：每个对象类型的唯一标识字段
3. **字段示例值**：主字段的典型值示例

**使用接口**：接口1（对象检索）

**召回策略**：
- 对每个相关对象类型，召回少量示例（limit=3-5）
- 从返回结果中识别主字段（通常是name、*_name等字段）
- 识别ID字段（通常是*_id、id等字段）

### 2.5 关键词到对象类型/属性的映射关系

**目的**：让下游任务知道问题中的关键词应该查询哪些对象类型和属性

**召回内容**：
1. **对象类型映射**：关键词可能匹配的对象类型列表
2. **属性字段映射**：关键词可能匹配的属性字段列表
3. **匹配置信度**：映射关系的置信度分数

**实现方式**：
- 基于第一步召回的schema信息
- 结合关键词的语义匹配
- 使用向量相似度或LLM判断

## 三、整体实现流程

### 3.1 流程概览

```
用户问题
    ↓
[步骤1] Schema召回（已有）
    ├─ 对象类型召回
    ├─ 对象属性召回
    └─ 关系类型召回
    ↓
[步骤2] 关键词提取与分类（新增）
    ├─ 提取实体关键词
    ├─ 提取属性值条件
    └─ 识别关系词
    ↓
[步骤3] 关键词到对象类型映射（新增）
    ├─ 基于schema判断关键词可能匹配的对象类型
    └─ 识别关键词可能匹配的属性字段
    ↓
[步骤4] 关键词存储形式召回（新增，使用接口1）
    ├─ 精确匹配召回
    ├─ 包含匹配召回
    └─ 模糊匹配召回
    ↓
[步骤5] 属性格式召回（新增，使用接口1）
    ├─ 召回属性示例值
    ├─ 分析存储格式
    └─ 识别值模式
    ↓
[步骤6] 关系路径模式召回（新增，使用接口2）
    ├─ 召回典型关系实例
    ├─ 提取源对象典型值
    └─ 提取目标对象典型值
    ↓
[步骤7] 主字段识别（新增，使用接口1）
    ├─ 识别主名字段
    └─ 识别ID字段
    ↓
[步骤8] 构建上下文知识（新增）
    ├─ 整合所有召回结果
    └─ 构建结构化知识
    ↓
最终结果 = Schema信息 + 上下文知识
```

### 3.2 详细流程说明

#### 阶段1：关键词提取与分类

**输入**：用户问题、已召回的schema信息

**处理**：
1. 使用LLM或NER从问题中提取：
   - **实体关键词**：疾病名、人名、公司名等（如："上气道梗阻"、"张三"）
   - **属性值条件**：年龄、价格、日期等（如："30岁"、">30"）
   - **关系词**：症状、治疗、关联等（如："症状"、"有哪些"）

2. 对每个关键词进行分类：
   - 判断是否为实体词
   - 判断是否为属性值
   - 判断是否为关系词

**输出**：
```python
{
    "entities": [
        {"text": "上气道梗阻", "type": "entity", "confidence": 0.9}
    ],
    "attribute_values": [
        {"text": "30岁", "attribute": "age", "operation": ">"}
    ],
    "relation_words": [
        {"text": "症状", "type": "relation", "confidence": 0.95}
    ]
}
```

#### 阶段2：关键词到对象类型映射

**输入**：提取的关键词、已召回的schema信息（object_types、relation_types）

**处理**：
1. 对每个实体关键词：
   - 遍历已召回的对象类型
   - 计算关键词与对象类型名称、描述的相似度
   - 计算关键词与对象属性名称、描述的相似度
   - 选择相似度最高的对象类型和属性

2. 对每个属性值：
   - 识别属性值对应的属性字段
   - 匹配到对应的对象类型

3. 对每个关系词：
   - 匹配到对应的关系类型

**输出**：
```python
{
    "keyword_mappings": [
        {
            "keyword": "上气道梗阻",
            "object_type_id": "disease",
            "match_fields": ["disease_name"],
            "match_confidence": 0.9
        }
    ],
    "attribute_mappings": [
        {
            "attribute_value": "30岁",
            "object_type_id": "person",
            "attribute": "age",
            "operation": ">"
        }
    ]
}
```

#### 阶段3：关键词存储形式召回（使用接口1）

**输入**：关键词映射结果

**处理**：
对每个关键词和对象类型组合，使用接口1进行多策略召回：

1. **精确匹配召回**：
   ```json
   {
       "field": "disease_name",
       "operation": "==",
       "value": "上气道梗阻"
   }
   ```
   - limit: 3-5
   - 目的：找到完全匹配的实例

2. **包含匹配召回**：
   ```json
   {
       "field": "disease_name",
       "operation": "contains",  // 或使用模糊匹配
       "value": "上气道梗阻"
   }
   ```
   - limit: 3-5
   - 目的：找到包含关键词的实例（如"上、下气道梗阻"）

3. **模糊匹配召回**（如果接口支持）：
   ```json
   {
       "field": "disease_name",
       "operation": "like",
       "value": "%上气道%"
   }
   ```
   - limit: 3-5
   - 目的：找到可能的变体形式

**输出**：
```python
{
    "keyword": "上气道梗阻",
    "object_type_id": "disease",
    "primary_field": "disease_name",
    "storage_forms": [
        {
            "form": "上气道梗阻",
            "match_type": "exact",
            "sample_instance_id": "disease_004790",
            "sample_instance_name": "上气道梗阻"
        },
        {
            "form": "上、下气道梗阻",
            "match_type": "contains",
            "sample_instance_id": "disease_xxx",
            "sample_instance_name": "上、下气道梗阻"
        }
    ]
}
```

#### 阶段4：属性格式召回（使用接口1）

**输入**：属性值映射结果

**处理**：
对每个属性值条件，使用接口1召回属性示例值：

1. **存在性查询**（召回示例值）：
   ```json
   {
       "field": "age",
       "operation": "exist",
       "value_from": "const"
   }
   ```
   - limit: 5-10
   - 目的：了解age属性的实际存储格式

2. **范围查询**（如果属性值有条件）：
   ```json
   {
       "field": "age",
       "operation": ">",
       "value": 0
   }
   ```
   - limit: 5-10
   - 目的：了解age属性的取值范围和格式

**分析**：
- 从返回结果中分析：
  - 数据类型：数字、字符串、日期等
  - 格式模式：是否有单位（"30岁"）、是否为范围（"30-40岁"）等
  - 典型值：常见的值示例

**输出**：
```python
{
    "object_type_id": "person",
    "attribute": "age",
    "storage_format": "number",  // 或 "string", "range_string"
    "value_samples": [30, 35, 40, 25],
    "value_pattern": "integer",  // 或 "string_with_unit", "range"
    "query_operation": ">",
    "has_unit": false,
    "is_range": false
}
```

#### 阶段5：关系路径模式召回（使用接口2）

**输入**：已召回的关系类型、关键词映射结果

**处理**：
对每个相关的关系类型，使用接口2召回典型实例：

1. **构建关系路径查询**：
   ```json
   {
       "relation_type_paths": [
           {
               "object_types": [
                   {
                       "id": "disease",
                       "condition": {
                           "operation": "exist",
                           "field": "disease_name"
                       },
                       "limit": 3  // 只召回少量示例
                   },
                   {
                       "id": "symptom",
                       "condition": {
                           "operation": "exist",
                           "field": "symptom_name"
                       },
                       "limit": 3
                   }
               ],
               "relation_types": [
                   {
                       "relation_type_id": "has_symptom",
                       "source_object_type_id": "disease",
                       "target_object_type_id": "symptom"
                   }
               ],
               "limit": 3
           }
       ]
   }
   ```

2. **如果有关键词匹配，添加条件**：
   ```json
   {
       "id": "disease",
       "condition": {
           "operation": "contains",
           "field": "disease_name",
           "value": "上气道梗阻"
       },
       "limit": 3
   }
   ```

**分析**：
- 从返回结果中提取：
  - 源对象的典型值（从objects中提取source对象的display或主字段值）
  - 目标对象的典型值（从objects中提取target对象的display或主字段值）
  - 主字段名称（通常是*_name、name等）

**输出**：
```python
{
    "relation_type_id": "has_symptom",
    "source_object_type_id": "disease",
    "target_object_type_id": "symptom",
    "source_field": "disease_name",
    "target_field": "symptom_name",
    "typical_source_values": ["上气道梗阻", "感冒", "肺炎"],
    "typical_target_values": ["咳嗽", "呼吸困难", "发烧"],
    "relation_pattern": "one_to_many"  // 或 "one_to_one", "many_to_many"
}
```

#### 阶段6：主字段识别（使用接口1）

**输入**：已召回的对象类型

**处理**：
对每个相关对象类型，使用接口1召回少量示例：

1. **存在性查询**：
   ```json
   {
       "field": "*",  // 或使用exist操作
       "operation": "exist"
   }
   ```
   - limit: 3-5
   - 目的：获取对象实例的完整属性信息

2. **分析返回结果**：
   - 识别主名字段（通常是name、*_name等，包含"名称"、"名字"等语义）
   - 识别ID字段（通常是*_id、id等）
   - 识别其他重要字段

**输出**：
```python
{
    "object_type_id": "disease",
    "primary_name_field": "disease_name",
    "primary_id_field": "disease_id",
    "field_samples": {
        "disease_name": ["上气道梗阻", "感冒", "肺炎"],
        "disease_id": ["disease_004790", "disease_xxx"]
    }
}
```

#### 阶段7：构建上下文知识

**输入**：所有阶段的召回结果

**处理**：
1. 整合所有召回结果
2. 去重和合并相同关键词的映射结果
3. 构建结构化的上下文知识对象

**输出**：见"数据结构设计"章节

## 四、数据结构设计

### 4.1 最终返回结构

在现有返回结果中增加 `contextual_knowledge` 字段：

```python
{
    "object_types": [...],  # 现有的schema信息
    "relation_types": [...],  # 现有的schema信息
    "contextual_knowledge": {  # 新增：上下文预备知识
        "keyword_mappings": [...],  # 关键词存储形式映射
        "attribute_formats": [...],  # 属性值格式信息
        "relation_patterns": [...],  # 关系路径模式
        "object_type_primary_fields": [...]  # 对象类型主字段
    }
}
```

### 4.2 详细数据结构

#### 4.2.1 keyword_mappings（关键词映射）

```python
[
    {
        "keyword": "上气道梗阻",  # 用户问题中的关键词
        "object_type_id": "disease",  # 匹配的对象类型
        "primary_field": "disease_name",  # 主要匹配字段
        "storage_forms": [  # 存储形式列表
            {
                "form": "上气道梗阻",  # 数据库中的实际存储形式
                "match_type": "exact",  # 匹配类型：exact/contains/fuzzy
                "sample_instance_id": "disease_004790",  # 示例实例ID
                "sample_instance_name": "上气道梗阻"  # 示例实例名称
            },
            {
                "form": "上、下气道梗阻",
                "match_type": "contains",
                "sample_instance_id": "disease_xxx",
                "sample_instance_name": "上、下气道梗阻"
            }
        ],
        "match_confidence": 0.9  # 匹配置信度
    }
]
```

#### 4.2.2 attribute_formats（属性格式）

```python
[
    {
        "object_type_id": "person",  # 对象类型ID
        "attribute": "age",  # 属性名称
        "storage_format": "number",  # 存储格式：number/string/date/range_string
        "value_samples": [30, 35, 40, 25],  # 值示例
        "value_pattern": "integer",  # 值模式：integer/float/string_with_unit/range
        "query_operation": ">",  # 查询操作符：>/</==/>=/<=
        "has_unit": false,  # 是否有单位
        "is_range": false,  # 是否为范围值
        "unit": null  # 单位（如果有）
    }
]
```

#### 4.2.3 relation_patterns（关系模式）

```python
[
    {
        "relation_type_id": "has_symptom",  # 关系类型ID
        "source_object_type_id": "disease",  # 源对象类型ID
        "target_object_type_id": "symptom",  # 目标对象类型ID
        "source_field": "disease_name",  # 源对象主字段
        "target_field": "symptom_name",  # 目标对象主字段
        "typical_source_values": [  # 源对象典型值
            "上气道梗阻",
            "感冒",
            "肺炎"
        ],
        "typical_target_values": [  # 目标对象典型值
            "咳嗽",
            "呼吸困难",
            "发烧"
        ],
        "relation_pattern": "one_to_many"  # 关系模式：one_to_one/one_to_many/many_to_many
    }
]
```

#### 4.2.4 object_type_primary_fields（主字段）

```python
[
    {
        "object_type_id": "disease",  # 对象类型ID
        "primary_name_field": "disease_name",  # 主名字段
        "primary_id_field": "disease_id",  # 主ID字段
        "field_samples": {  # 字段示例值
            "disease_name": ["上气道梗阻", "感冒", "肺炎"],
            "disease_id": ["disease_004790", "disease_xxx"]
        }
    }
]
```

## 五、接口使用策略

### 5.1 接口1（对象检索）使用策略

#### 5.1.1 关键词存储形式召回

**场景1：精确匹配**
- 操作：`operation: "=="`
- 字段：主名字段（如disease_name）
- 值：关键词
- limit: 3-5

**场景2：包含匹配**
- 操作：`operation: "contains"`（如果支持）或模糊匹配
- 字段：主名字段
- 值：关键词
- limit: 3-5

**场景3：模糊匹配**
- 操作：`operation: "like"`（如果支持）
- 字段：主名字段
- 值：`"%关键词%"` 或部分匹配
- limit: 3-5

#### 5.1.2 属性格式召回

**场景1：存在性查询**
- 操作：`operation: "exist"`
- 字段：目标属性字段
- limit: 5-10

**场景2：范围查询**
- 操作：`operation: ">"` 或 `"<"` 等
- 字段：目标属性字段
- 值：根据用户问题中的条件
- limit: 5-10

#### 5.1.3 主字段识别

**场景：获取示例实例**
- 操作：`operation: "exist"`
- 字段：`"*"` 或任意字段
- limit: 3-5

### 5.2 接口2（关系路径检索）使用策略

#### 5.2.1 关系路径模式召回

**场景1：无关键词条件**
- 源对象：`condition: {"operation": "exist", "field": "主字段"}`
- 目标对象：`condition: {"operation": "exist", "field": "主字段"}`
- limit: 3-5（每个对象类型）

**场景2：有关键词条件**
- 源对象：`condition: {"operation": "contains", "field": "主字段", "value": "关键词"}`
- 目标对象：`condition: {"operation": "exist", "field": "主字段"}`
- limit: 3-5（每个对象类型）

## 六、优化策略

### 6.1 性能优化

1. **并行召回**
   - 多个关键词的召回可以并行执行
   - 多个对象类型的召回可以并行执行
   - 使用asyncio.gather实现并行

2. **限制召回数量**
   - 每种匹配方式只召回3-5个示例
   - 避免召回过多数据影响性能

3. **缓存机制**
   - 相同关键词在同一会话中复用结果
   - 使用session_id进行缓存管理

4. **智能匹配顺序**
   - 优先精确匹配，再包含匹配，最后模糊匹配
   - 如果精确匹配有结果，可以跳过其他匹配方式

### 6.2 准确性优化

1. **多策略召回**
   - 使用多种匹配策略确保不遗漏
   - 精确匹配 + 包含匹配 + 模糊匹配

2. **置信度评分**
   - 为每个映射结果计算置信度
   - 过滤低置信度结果

3. **去重和合并**
   - 合并相同关键词的不同匹配结果
   - 去重相同的存储形式

### 6.3 增量召回

1. **多轮对话支持**
   - 只召回新增关键词的知识
   - 复用已召回的关键词映射结果

2. **会话管理**
   - 使用session_id管理召回历史
   - 避免重复召回相同内容

## 七、实施建议

### 7.1 分阶段实施

**第一阶段：基础实现**
1. 关键词提取与分类
2. 关键词到对象类型映射
3. 关键词存储形式召回（精确匹配 + 包含匹配）

**第二阶段：增强功能**
1. 属性格式召回
2. 关系路径模式召回
3. 主字段识别

**第三阶段：优化完善**
1. 缓存机制
2. 并行召回
3. 增量召回

### 7.2 关键注意事项

1. **接口限制**
   - 注意接口1可能不支持所有operation类型（contains、like等）
   - 需要根据实际接口能力调整策略

2. **字段识别**
   - 主字段识别需要基于schema信息和实际数据
   - 可能需要LLM辅助判断

3. **错误处理**
   - 接口调用失败时的降级策略
   - 部分召回失败时的处理方式

4. **数据量控制**
   - 严格控制召回数量，避免数据过多
   - 优先召回最相关的信息

## 八、示例场景

### 8.1 场景1：简单实体查询

**问题**："上气道梗阻有哪些症状"

**召回流程**：
1. 提取关键词："上气道梗阻"（实体）、"症状"（关系词）
2. 映射到对象类型：disease（"上气道梗阻"）、has_symptom关系（"症状"）
3. 关键词存储形式召回：
   - 精确匹配："上气道梗阻" → "上气道梗阻"（disease_004790）
   - 包含匹配："上气道梗阻" → "上、下气道梗阻"（disease_xxx）
4. 关系路径模式召回：
   - 通过has_symptom关系，召回典型疾病和症状实例
5. 构建上下文知识

**输出**：
- Schema：disease对象类型、symptom对象类型、has_symptom关系类型
- 上下文知识：
  - "上气道梗阻"在数据库中可能存储为"上气道梗阻"或"上、下气道梗阻"
  - has_symptom关系的典型模式：disease_name → symptom_name

### 8.2 场景2：属性条件查询

**问题**："年龄大于30岁的男性"

**召回流程**：
1. 提取关键词："30岁"（属性值）、"男性"（属性值）
2. 映射到对象类型：person
3. 属性格式召回：
   - age属性：召回示例值，发现存储为数字30而非"30岁"
   - p_gender属性：召回示例值，发现存储为"male"而非"男性"
4. 构建上下文知识

**输出**：
- Schema：person对象类型及其属性
- 上下文知识：
  - age属性存储为数字，查询时使用数字30而非"30岁"
  - p_gender属性存储为"male"，查询时使用"male"而非"男性"

## 九、总结

本方案在现有schema召回的基础上，增加了细粒度的上下文召回，为下游任务提供必要的预备知识：

1. **关键词存储形式映射**：帮助理解用户关键词在数据库中的实际存储形式
2. **属性格式信息**：帮助理解属性值的存储格式和查询方式
3. **关系路径模式**：帮助理解关系路径上的典型值模式
4. **主字段识别**：帮助识别每个对象类型的主要查询字段

这些预备知识将帮助下游任务：
- 正确构建数据库查询条件
- 理解用户问题与数据库存储的映射关系
- 处理同义词、变体等复杂情况
- 提高查询的准确性和召回率

