# 基于关键词的召回策略文档

## 一、概述

### 1.1 背景
检索工具采用两步召回策略：
1. **第一步：基于完整问题召回schema**（已有功能）
   - 必须基于完整的用户问题召回schema
   - 召回对象类型、对象属性、关系类型
   - 这是基础，不能跳过

2. **第二步：基于关键词的细粒度上下文召回**（新增功能）
   - 在第一步schema召回的基础上，针对关键词进行细粒度召回
   - query必须是单个关键词（因为召回工具可以重复调用）
   - **必须提供object_type_id参数**：指定关键词所属的对象类型
   - 不负责召回schema，只负责召回关键词相关的实例和上下文信息

### 1.2 核心目标
**关键词召回是为了召回预备知识**，帮助下游任务：
- 了解关键词匹配的对象实例及其所有属性
- 掌握关键词的一度邻居信息（通过关系路径关联的对象）

### 1.3 核心问题
用户问题中的关键词可能与数据库存储形式不一致：
- 用户问："上气道梗阻"
- 数据库存储："上、下气道梗阻"
- 问题：直接匹配可能查不到数据，需要提前召回映射关系

### 1.4 工具设计

**工具名称**：`knowledge_network_retrieval`（统一的检索工具）

**核心参数**：
- `enable_keyword_context`：控制是否启用关键词上下文召回
- `object_type_id`：**当enable_keyword_context=True时，此参数必须提供**，用于指定关键词所属的对象类型

**重要说明**：
- **关键词识别由Agent负责**：工具内部不做问题拆分和关键词提取
- **query是完整问题时**：只能使用 `enable_keyword_context=False` 召回schema
- **query是关键词时**：才能使用 `enable_keyword_context=True` 召回关键词上下文
- **必须提供object_type_id**：因为即使用关键词，但是有很多对象类型，你不知道这个关键词属于哪个对象类型

**工作流程**：
- `enable_keyword_context=False`（默认）：
  - **适用场景**：query是完整问题（如："上气道梗阻有哪些症状"）
  - **执行操作**：基于完整问题召回schema
  - **保存到session**：将schema信息保存到session中（用于后续关键词召回）
  - **返回**：object_types、relation_types
  
- `enable_keyword_context=True`：
  - **适用场景**：query是关键词（如："上气道梗阻"、"症状"）
  - **必须提供object_type_id**：指定关键词所属的对象类型（如："disease"、"symptom"）
  - **检查session**：检查session中是否已存储历史schema信息
  - **如果有历史schema**：
    - 跳过schema召回，直接使用历史schema
    - 基于关键词（query）和object_type_id进行上下文召回
    - 返回：keyword_context（只返回关键词上下文，不返回schema信息）
  - **如果没有历史schema**：
    - **报错返回**：提示Agent需要先调用 `enable_keyword_context=False` 召回schema
    - 错误信息：`"Schema信息不存在，请先调用enable_keyword_context=False召回schema"`

## 二、参数设计

### 2.1 参数定义

在 `KnowledgeNetworkRetrievalInput` 模型中新增参数：

```python
enable_keyword_context: bool = Field(
    default=False,
    description="是否启用关键词上下文召回。True：基于关键词召回上下文信息（需要先有schema）；False：只进行schema召回，不进行关键词上下文召回（默认，保持向后兼容）。"
)

object_type_id: Optional[str] = Field(
    default=None,
    description="对象类型ID，用于指定关键词所属的对象类型。当enable_keyword_context=True时，此参数必须提供。例如：'person'、'disease'等。"
)
```

### 2.2 参数说明

#### enable_keyword_context

- **类型**：`bool`
- **默认值**：`False`
- **说明**：
  - `False`（默认）：执行第一步，基于完整问题召回schema
    - **query要求**：必须是完整问题（如："上气道梗阻有哪些症状"）
    - **召回schema**：object_types、relation_types
    - **保存到session**：将schema信息保存到session中（用于后续关键词召回）
    - **返回**：object_types + relation_types
  
  - `True`：执行第二步，基于关键词召回上下文（需要先有schema）
    - **query要求**：必须是关键词（如："张三"、"上气道梗阻"），不能是完整问题
    - **object_type_id要求**：**必须提供**对象类型ID（如："person"、"disease"）
      - 原因：即使用关键词，但是有很多对象类型，你不知道这个关键词属于哪个对象类型
      - 必须明确指定对象类型，才能遍历该对象类型的所有属性进行匹配
    - **检查session**：检查session中是否已存储历史schema信息
    - **如果有历史schema**：跳过schema召回，直接使用历史schema，进行关键词上下文召回
    - **如果没有历史schema**：报错返回

#### object_type_id

- **类型**：`Optional[str]`
- **默认值**：`None`
- **必须提供条件**：当 `enable_keyword_context=True` 时，此参数**必须提供**
- **说明**：
  - 用于指定关键词所属的对象类型
  - 例如："person"、"disease"、"symptom"等
  - **为什么必须提供**：因为即使用关键词，但是有很多对象类型，你不知道这个关键词属于哪个对象类型
  - 必须明确指定对象类型，才能遍历该对象类型的所有属性进行匹配

### 2.3 参数约束

**重要约束**：
- **query是完整问题时**：只能使用 `enable_keyword_context=False`
- **query是关键词时**：才能使用 `enable_keyword_context=True`，且**必须提供 `object_type_id`**
- **关键词识别由Agent负责**：工具内部不做问题拆分和关键词提取
- **必须指定object_type_id**：因为即使用关键词，但是有很多对象类型，你不知道这个关键词属于哪个对象类型
- **多轮关键词召回**：需要保存到session中，并且多轮的结果也需要进行去重，使用instance_id作为唯一标识

## 三、使用方式

### 3.1 完整流程（推荐）

```python
# 第一步：召回schema（必须首先调用）
# Agent传入完整问题
result1 = await knowledge_network_retrieval(
    query="上气道梗阻有哪些症状",  # 完整问题
    kn_ids=[...],
    session_id="session_123",  # 必须提供session_id
    enable_keyword_context=False  # 召回schema
)
# 返回：{object_types: [...], relation_types: [...]}
# 内部：将schema信息保存到session中

# 第二步：Agent识别关键词（Agent负责，工具不负责）
# Agent从问题中提取关键词：["上气道梗阻", "症状"]

# 第三步：召回关键词上下文（可以多次调用，针对不同关键词）
# Agent针对每个关键词分别调用，必须提供object_type_id
result2 = await knowledge_network_retrieval(
    query="上气道梗阻",  # 关键词（Agent传入）
    kn_ids=[...],
    session_id="session_123",  # 使用相同的session_id
    enable_keyword_context=True,  # 召回关键词上下文
    object_type_id="disease"  # 必须提供：指定关键词所属的对象类型
)
# 返回：{keyword_context: {...}}（只返回关键词上下文，不返回schema信息）

# 可以针对不同关键词重复调用，每次都需要提供对应的object_type_id
result3 = await knowledge_network_retrieval(
    query="症状",  # 另一个关键词（Agent传入）
    kn_ids=[...],
    session_id="session_123",
    enable_keyword_context=True,
    object_type_id="symptom"  # 必须提供：指定关键词所属的对象类型
)
```

### 3.2 只召回schema（默认）

```python
# 只召回schema，不进行关键词上下文召回
# query必须是完整问题
result = await knowledge_network_retrieval(
    query="上气道梗阻有哪些症状",  # 完整问题
    kn_ids=[...],
    session_id="session_123",
    enable_keyword_context=False  # 默认值
)
# 返回：{object_types: [...], relation_types: [...]}
```

## 四、实现流程

### 4.1 整体流程

**流程1：召回Schema（enable_keyword_context=False）**
```
Agent调用：knowledge_network_retrieval(query="完整问题", enable_keyword_context=False)
    ↓
[工具内部] 基于完整问题召回Schema
    ├─ 输入：完整用户问题（如："上气道梗阻有哪些症状"）
    ├─ 召回：对象类型、对象属性、关系类型
    ├─ 保存到session：将schema信息保存到session中
    └─ 输出：Schema信息（object_types、relation_types）
```

**流程2：召回关键词上下文（enable_keyword_context=True）**
```
Agent识别关键词（Agent负责，工具不负责）
    ├─ Agent从问题中提取关键词：["上气道梗阻", "症状"]
    └─ Agent决定针对哪些关键词进行召回
    ↓
Agent调用：knowledge_network_retrieval(
    query="关键词", 
    enable_keyword_context=True,
    object_type_id="disease"  # 必须提供
)
    ↓
[工具内部] 检查session中是否有历史schema
    ├─ 如果有历史schema：
    │   ├─ 跳过schema召回，直接使用历史schema
    │   ├─ 验证参数：检查object_type_id是否提供（必须）
    │   ├─ 使用query作为关键词（不进行关键词提取）
    │   ├─ 遍历指定对象类型（object_type_id）的所有属性，尝试匹配关键词
    │   ├─ 基于关键词和schema信息召回上下文
    │   └─ 输出：keyword_context（只返回关键词上下文，不返回schema信息）
    │
    └─ 如果没有历史schema：
        ├─ 报错返回
        └─ 错误信息："Schema信息不存在，请先调用enable_keyword_context=False召回schema"
```

### 4.2 详细步骤说明

#### 步骤1：接收关键词和object_type_id

**输入**：
- 关键词（由Agent传入的query参数）
- 对象类型ID（由Agent传入的object_type_id参数，**必须提供**）

**处理**：
- **工具不进行关键词提取**：直接使用Agent传入的query作为关键词
- **Agent负责**：从完整问题中识别和提取关键词，并判断关键词所属的对象类型
- **工具职责**：基于关键词和object_type_id进行召回，不负责关键词识别

**输入格式**：
- query参数直接是关键词（如："上气道梗阻"）
- object_type_id参数指定对象类型（如："disease"）
- 工具直接使用query作为关键词，不进行任何提取或拆分

**注意**：
- 如果query是完整问题，应该使用 `enable_keyword_context=False` 召回schema
- 如果query是关键词，才能使用 `enable_keyword_context=True` 召回关键词上下文
- **必须提供object_type_id参数**：因为即使用关键词，但是有很多对象类型，你不知道这个关键词属于哪个对象类型

#### 步骤2：遍历对象类型属性，匹配关键词

**输入**：
- 关键词（Agent传入的query）
- 对象类型ID（Agent传入的object_type_id，**必须提供**）
- 第一步召回的schema信息（object_types、relation_types）

**处理**：
1. **必须依赖第一步的Schema信息**：
   - 使用第一步召回的对象类型列表（object_types）
   - 使用第一步召回的关系类型列表（relation_types）
   - 如果没有Schema信息，无法进行关键词匹配

2. **遍历指定对象类型的所有属性，使用or操作符一次性查询**：
   - **核心思路**：你不知道张三是name还是person_name，还是其他的属性，你需要遍历每个属性，看看是否能匹配到张三
   - 获取指定对象类型（object_type_id）的所有属性列表
   - **使用or操作符一次性查询所有属性**：将所有属性的查询条件用`operation: "or"`连接，一次性查询所有属性
   - 查询条件格式：
     ```json
     {
         "condition": {
             "operation": "or",
             "sub_conditions": [
                 {
                     "field": "disease_name",
                     "operation": "==",
                     "value": "上气道梗阻",
                     "value_from": "const"
                 },
                 {
                     "field": "insurance",
                     "operation": "==",
                     "value": "上气道梗阻",
                     "value_from": "const"
                 }
                 // ... 所有属性的查询条件
             ]
         },
         "need_total": true,
         "limit": 10
     }
     ```
   - **优点**：一次性查询所有属性，比分别查询每个属性更高效
   - **如果没有任何属性匹配成功**：返回空结果（datas为空数组）

**输出**：
- 直接调用接口1，返回匹配的对象实例列表
- 从返回结果中可以知道哪些字段匹配成功（通过返回的实例属性判断）

**重要**：
- **必须指定object_type_id参数**：因为即使用关键词，但是有很多对象类型，你不知道这个关键词属于哪个对象类型
- **使用or操作符一次性查询所有属性**：将所有属性的查询条件用`or`连接，一次性查询，提高效率
- **如果没有任何属性匹配成功**：返回空结果（datas为空数组）

#### 步骤3：获取对象实例信息（使用接口1）

**输入**：步骤2构建的查询条件（使用or操作符连接所有属性的查询）

**处理**：
1. **构建查询条件**（使用or操作符连接所有属性的查询条件）：
   - 获取指定对象类型（object_type_id）的所有属性列表
   - 为每个属性构建一个查询条件（`field`、`operation: "=="`、`value: 关键词`、`value_from: "const"`）
   - 将所有属性的查询条件放入`sub_conditions`数组
   - 使用`operation: "or"`连接所有查询条件

2. **调用接口1获取对象实例**：
   - URL: `POST /api/ontology-query/in/v1/knowledge-networks/{kn_id}/object-types/{object_type_id}`
   - Headers: 
     - `X-HTTP-Method-Override: GET`
     - `x-account-id: {account_id}`
     - `x-account-type: {account_type}`
     - `Content-Type: application/json`

3. **处理接口1返回结果**：
   - **实例ID**：从`datas`数组中每个对象的`*_id`字段提取（如`disease_id: "disease_004790"`）
   - **实例名称**：从`datas`数组中每个对象的`*_name`字段提取（如`disease_name: "上气道梗阻"`）
   - **所有属性**：`datas`数组中每个对象的所有字段（完整的properties字典）
   - **总数**：`total_count`字段

4. **处理多个匹配字段**：
   - 如果多个字段都匹配成功，分别查询并合并结果
   - 对结果进行去重（基于instance_id，即`*_id`字段）

**注意**：
- 设置limit阈值，避免返回过多数据（如：limit=10）
- 如果多个字段匹配成功，需要合并结果并去重
- 返回对象实例的所有属性信息（完整的properties字典）

#### 步骤4：获取一度邻居信息（使用接口2）

**输入**：步骤3的对象实例信息、第一步召回的关系类型（relation_types）

**处理**：
1. **必须依赖第一步的Schema信息**：
   - 使用第一步召回的关系类型列表（relation_types）
   - 只对第一步召回的关系类型进行查询
   - 如果没有第一步的关系类型信息，无法构建关系路径查询

2. **构建关系路径查询（方向不限定）**：
   - **核心思路**：拿到张三的对象实例信息后，你需要继续拿张三的一度邻居信息，方向不限定，可以根据上一个的schema概念召回
   - 遍历第一步召回的所有关系类型
   - 对于每个关系类型，构建双向查询：
     - 作为源对象：查询目标对象
     - 作为目标对象：查询源对象
   - **方向不限定**：既查询作为源对象的邻居，也查询作为目标对象的邻居

3. **调用接口2**：
   - URL: `POST /api/ontology-query/in/v1/knowledge-networks/{kn_id}/subgraph?query_type=relation_path`
   - Headers: 
     - `X-HTTP-Method-Override: GET`
     - `x-account-id: {account_id}`
     - `x-account-type: {account_type}`
     - `Content-Type: application/json`

4. **处理接口2返回结果**：
   - **源对象实例**：从`objects`字典中提取源对象（key格式：`{object_type_id}-{instance_id}`）
   - **目标对象实例（邻居）**：从`objects`字典中提取所有目标对象
   - **关系路径信息**：从`relation_paths`数组中提取关系信息
   - **对象属性**：从`objects`字典中每个对象的`properties`字段提取所有属性
   - **实例ID**：从`objects`字典中每个对象的`unique_identities`字段提取
   - **实例名称**：从`objects`字典中每个对象的`display`字段或`properties`中的`*_name`字段提取

**注意**：
- **方向不限定**：既查询作为源对象的邻居，也查询作为目标对象的邻居
- **必须依赖第一步的关系类型信息**
- 只对第一步召回的关系类型进行查询
- 限制召回数量（每个关系类型最多10个邻居，设置阈值）

#### 步骤5：聚合信息并去重

**输入**：步骤3的对象实例信息、步骤4的一度邻居信息

**处理**：
1. **聚合信息**：
   - 整合对象实例信息
   - 整合一度邻居信息
   - 构建结构化的关键词知识对象
   - **用紧凑格式返回**：使用紧凑的格式，减少token数量

2. **去重处理**（重要，因为可能有多轮关键词召回）：
   - **去重标识**：使用 `instance_id` 作为唯一标识
   - **去重策略**：
     - 检查session中是否已存在该instance_id
     - 如果存在，跳过或合并（保留更完整的信息）
     - 如果不存在，添加到结果中
   - **多轮召回去重**：
     - 每次召回结果保存到session中
     - 下次召回时，检查session中的历史结果
     - 基于instance_id进行去重

3. **设置阈值**：
   - 对象实例数量：最多返回10个
   - 一度邻居数量：每个关系类型最多10个
   - 总邻居数量：最多返回50个

4. **保存到session**：
   - 将召回结果保存到session中
   - 用于后续多轮关键词召回的去重

## 五、数据结构设计

### 5.1 最终返回结构

当 `enable_keyword_context=True` 时，只返回 `keyword_context` 字段（不返回schema信息）：

```python
{
    "keyword_context": {  # 关键词上下文（只返回关键词上下文，不返回schema信息）
        "keyword": "上气道梗阻",
        "object_type_id": "disease",  # Agent指定的对象类型
        "matched_field": "disease_name",  # 匹配成功的字段
        "instances": [...],  # 匹配的对象实例列表
        "statistics": {...}  # 统计信息
    }
}
```

**重要说明**：
- 当 `enable_keyword_context=True` 时，**只返回 `keyword_context`**，不返回 `object_types` 和 `relation_types`
- schema信息已经在第一步调用 `enable_keyword_context=False` 时返回，不需要重复返回
- 这样可以减少返回数据量，提高效率

### 5.2 详细数据结构

**keyword_context（关键词上下文）**：

```python
{
    "keyword": "上气道梗阻",  # 用户问题中的关键词（Agent传入）
    "object_type_id": "disease",  # Agent指定的对象类型
    "matched_field": "disease_name",  # 匹配成功的字段
    "instances": [  # 匹配的对象实例（去重后，最多10个）
        {
            "instance_id": "disease_004790",  # 唯一标识，用于去重
            "object_type_id": "disease",
            "instance_name": "上气道梗阻",  # 从接口1返回的datas[0]["disease_name"]提取
            "properties": {  # 对象实例的所有属性（完整的接口1返回的datas[0]对象）
                "disease_id": "disease_004790",
                "disease_name": "上气道梗阻",
                "age": "儿童",
                "treatment": "手术治疗、药物治疗",
                # ... 所有属性
            },
            "neighbors": [  # 一度邻居信息（去重后，每个关系类型最多10个）
                {
                    "instance_id": "symptom_000020",  # 唯一标识，用于去重
                    "object_type_id": "symptom",
                    "instance_name": "呼吸困难",
                    "relation_type_id": "has_symptom",
                    "relation_type_name": "疾病症状",
                    "relation_direction": "outgoing",  # outgoing/incoming
                    "properties": {  # 邻居的所有属性
                        "symptom_id": "symptom_000020",
                        "symptom_name": "呼吸困难"
                        # ... 所有属性
                    }
                }
                # ... 更多邻居
            ]
        }
    ],
    "statistics": {  # 统计信息
        "total_instances": 1,  # 从接口1返回的total_count提取
        "total_neighbors": 5,  # 统计所有邻居数量
        "matched_fields": ["disease_name"]  # 匹配成功的字段列表
    }
}
```

**数据提取说明**：
- **实例ID提取**：
  - 接口1：从`datas[i]["*_id"]`字段提取（如`datas[0]["disease_id"]`）
  - 接口2：从`objects["{object_type_id}-{instance_id}"]["unique_identities"]["*_id"]`提取
- **实例名称提取**：
  - 接口1：从`datas[i]["*_name"]`字段提取（如`datas[0]["disease_name"]`）
  - 接口2：从`objects["{object_type_id}-{instance_id}"]["display"]`或`properties["*_name"]`提取
- **属性提取**：
  - 接口1：完整的`datas[i]`对象（所有字段）
  - 接口2：从`objects["{object_type_id}-{instance_id}"]["properties"]`提取
- **关系信息提取**：
  - 从`relation_paths`数组中提取`relation_type_id`、`relation_type_name`、`source_object_id`、`target_object_id`
  - 根据`source_object_id`和`target_object_id`确定关系方向

## 六、接口使用策略

### 6.1 接口1（对象检索）

**URL**：`POST /api/ontology-query/in/v1/knowledge-networks/{kn_id}/object-types/{object_type_id}`

**Headers**：
- `X-HTTP-Method-Override: GET`
- `x-account-id: {account_id}`
- `x-account-type: {account_type}`
- `Content-Type: application/json`

**请求体示例**（使用or操作符连接所有属性的查询条件）：
```json
{
    "condition": {
        "operation": "or",
        "sub_conditions": [
            {
                "field": "disease_name",
                "operation": "==",
                "value": "上气道梗阻",
                "value_from": "const"
            },
            {
                "field": "insurance",
                "operation": "==",
                "value": "上气道梗阻",
                "value_from": "const"
            }
            // ... 所有属性的查询条件
        ]
    },
    "need_total": true,
    "limit": 10
}
```

**返回结果处理**：
- **实例ID**：从`datas[0]["disease_id"]`提取
- **实例名称**：从`datas[0]["disease_name"]`提取
- **所有属性**：完整的`datas[0]`对象（所有字段）
- **总数**：从`total_count`字段提取

### 6.2 接口2（关系路径检索）

**URL**：`POST /api/ontology-query/in/v1/knowledge-networks/{kn_id}/subgraph?query_type=relation_path`

**Headers**：
- `X-HTTP-Method-Override: GET`
- `x-account-id: {account_id}`
- `x-account-type: {account_type}`
- `Content-Type: application/json`

**请求体示例**（基于关键词实例的关系路径查询）：
```json
{
    "relation_type_paths": [
        {
            "object_types": [
                {
                    "id": "disease",
                    "condition": {
                        "operation": "==",
                        "field": "disease_id",
                        "value": "disease_004790",
                        "value_from": "const"
                    },
                    "limit": 1
                },
                {
                    "id": "symptom",
                    "condition": {
                        "operation": "exist",
                        "field": "symptom_name",
                        "value_from": "const"
                    },
                    "limit": 10
                }
            ],
            "relation_types": [
                {
                    "relation_type_id": "has_symptom",
                    "source_object_type_id": "disease",
                    "target_object_type_id": "symptom"
                }
            ],
            "limit": 10
        }
    ]
}
```

**返回结果处理**：
1. **提取对象信息**：遍历`entries[0]["objects"]`字典
2. **提取关系路径信息**：遍历`entries[0]["relation_paths"]`数组
3. **匹配对象和关系**：根据`source_object_id`和`target_object_id`，从`objects`字典中查找对应的对象
4. **确定关系方向**：根据源对象和目标对象确定关系方向

**注意**：
- 只对已召回的关系类型进行查询（依赖第一步的schema信息）
- 限制召回数量（每个关系类型最多10个相关对象，设置阈值）
- 方向不限定：需要构建双向查询（既查询作为源对象的邻居，也查询作为目标对象的邻居）

## 七、使用场景示例

### 7.1 场景1：完整流程（先召回schema，再召回关键词上下文）

**问题**："上气道梗阻有哪些症状"

**步骤1：召回schema**
```python
result1 = await knowledge_network_retrieval(
    query="上气道梗阻有哪些症状",  # 完整问题
    kn_ids=[...],
    session_id="session_123",
    enable_keyword_context=False  # 召回schema
)
```

**步骤2：Agent识别关键词（Agent负责）**
- Agent从问题中提取关键词：["上气道梗阻", "症状"]
- Agent决定针对哪些关键词进行召回

**步骤3：召回关键词上下文**
```python
result2 = await knowledge_network_retrieval(
    query="上气道梗阻",  # 关键词（Agent传入）
    kn_ids=[...],
    session_id="session_123",  # 使用相同session_id
    enable_keyword_context=True,  # 召回关键词上下文
    object_type_id="disease"  # 必须提供：指定关键词所属的对象类型
)
```

**工具内部执行**：
1. 检查session：发现session_123中有历史schema信息
2. 使用历史schema：跳过schema召回，直接使用历史schema
3. 验证参数：检查object_type_id是否提供（必须）
4. 直接使用query作为关键词：不进行关键词提取，直接使用"上气道梗阻"作为关键词
5. 遍历disease对象类型的所有属性，尝试匹配关键词
6. 如果匹配成功，通过接口1获取对象实例的所有信息
7. 获取对象实例的一度邻居信息（方向不限定，使用接口2）
8. 聚合信息并去重

**返回结果**：
```python
{
    "keyword_context": {
        "keyword": "上气道梗阻",
        "object_type_id": "disease",
        "matched_field": "disease_name",
        "instances": [...],
        "statistics": {...}
    }
}
```

### 7.2 场景2：针对多个关键词分别召回

**步骤1：召回schema**（同上）

**步骤2：针对不同关键词分别召回**
```python
# 召回"上气道梗阻"的上下文
result2 = await knowledge_network_retrieval(
    query="上气道梗阻",
    kn_ids=[...],
    session_id="session_123",
    enable_keyword_context=True,
    object_type_id="disease"  # 必须提供：指定关键词所属的对象类型
)

# 召回"症状"的上下文
result3 = await knowledge_network_retrieval(
    query="症状",
    kn_ids=[...],
    session_id="session_123",
    enable_keyword_context=True,
    object_type_id="symptom"  # 必须提供：指定关键词所属的对象类型
)
```

**优点**：
- 可以针对不同关键词分别召回
- 复用同一个session中的schema信息
- 避免重复召回schema

### 7.3 错误场景1：没有先召回schema

**Agent调用**：
```python
result = await knowledge_network_retrieval(
    query="上气道梗阻",
    kn_ids=[...],
    session_id="session_123",
    enable_keyword_context=True  # 直接调用关键词上下文召回
)
```

**返回错误**：
```python
{
    "error": "Schema信息不存在，请先调用enable_keyword_context=False召回schema",
    "status_code": 400,
    "detail": {
        "message": "请先调用knowledge_network_retrieval工具，设置enable_keyword_context=False召回schema",
        "session_id": "session_123"
    }
}
```

**Agent处理**：
- Agent收到错误后，应该先调用 `enable_keyword_context=False` 召回schema
- 然后再调用 `enable_keyword_context=True` 召回关键词上下文

### 7.4 错误场景2：缺少object_type_id参数

**Agent调用**：
```python
result = await knowledge_network_retrieval(
    query="张三",  # 关键词
    kn_ids=[...],
    session_id="session_123",
    enable_keyword_context=True,  # 错误：缺少object_type_id参数
    # object_type_id未提供
)
```

**返回错误**：
```python
{
    "error": "object_type_id参数必须提供，用于指定关键词所属的对象类型",
    "status_code": 400,
    "detail": {
        "message": "当enable_keyword_context=True时，object_type_id参数必须提供。因为即使用关键词，但是有很多对象类型，你不知道这个关键词属于哪个对象类型。",
        "suggestion": "请提供object_type_id参数，例如：object_type_id='person'"
    }
}
```

**Agent处理**：
- Agent收到错误后，应该提供object_type_id参数
- 例如：object_type_id="person"（如果关键词"张三"属于person对象类型）

## 八、错误处理

### 8.1 Schema信息不存在错误

**场景**：`enable_keyword_context=True` 但session中没有schema信息

**处理**：
- 返回错误：`"Schema信息不存在，请先调用enable_keyword_context=False召回schema"`
- 状态码：400 Bad Request

**Agent处理建议**：
- Agent收到此错误后，应该先调用 `enable_keyword_context=False` 召回schema
- 然后再调用 `enable_keyword_context=True` 召回关键词上下文

### 8.2 object_type_id参数缺失

**场景**：`enable_keyword_context=True` 但没有提供object_type_id参数

**处理**：
- 返回错误：`"object_type_id参数必须提供，用于指定关键词所属的对象类型"`
- 状态码：400 Bad Request

**Agent处理建议**：
- Agent收到此错误后，应该提供object_type_id参数
- Agent需要根据关键词判断其所属的对象类型

### 8.3 Session ID不存在

**场景**：`enable_keyword_context=True` 但没有提供session_id

**处理**：
- 返回错误：`"session_id参数必须提供，用于存储和检索schema信息"`
- 状态码：400 Bad Request

### 8.4 接口调用失败

1. **接口1调用失败**：
   - 记录错误日志
   - 跳过该关键词的存储形式召回
   - 继续处理其他关键词

2. **接口2调用失败**：
   - 记录错误日志
   - 跳过该关键词的关系路径召回
   - 继续处理其他关键词

### 8.5 降级策略

1. **部分召回失败**：
   - 返回已成功召回的部分结果
   - 在错误日志中记录失败的关键词

2. **全部召回失败**：
   - 返回空的 `keyword_context`
   - 在错误日志中记录失败原因
   - 不影响schema召回的返回（如果schema召回成功）

## 九、关键注意事项

1. **必须依赖第一步的Schema信息**
   - 关键词召回必须基于第一步召回的Schema信息
   - 如果没有Schema信息，无法进行关键词映射和关系路径查询
   - 第一步必须基于完整问题召回schema，不能跳过

2. **query必须是关键词（当enable_keyword_context=True时）**
   - 关键词由Agent识别和传入，工具不进行关键词提取
   - query必须是关键词（如："上气道梗阻"），不能是完整问题
   - 可以重复调用，每次针对不同的关键词
   - Agent负责从完整问题中识别关键词，工具只负责基于关键词进行召回

3. **必须提供object_type_id参数（当enable_keyword_context=True时）**
   - 因为即使用关键词，但是有很多对象类型，你不知道这个关键词属于哪个对象类型
   - 必须明确指定对象类型，才能遍历该对象类型的所有属性进行匹配
   - 遍历对象类型的所有属性，看看是否能匹配到关键词
   - 如果没有任何属性匹配成功，返回空结果或提示

4. **接口限制**
   - 注意接口1可能不支持所有operation类型（contains、like等）
   - 需要根据实际接口能力调整策略

5. **性能考虑**
   - 严格控制召回数量，避免数据过多
   - 优先召回最相关的信息
   - 使用并行和缓存优化性能

6. **多轮关键词召回去重**
   - 注意，可能会有多轮关键词召回，所以你需要保存session中，并且多轮的结果也需要进行去重
   - 使用instance_id作为唯一标识，设计一种格式可以很方便去重
   - 每次召回结果保存到session中，下次召回时检查session中的历史结果

7. **向后兼容**
   - 默认 `enable_keyword_context=False`，保持向后兼容
   - 不影响现有的schema召回功能

## 十、总结

### 10.1 核心要点

1. **组合工具设计**：
   - **工具名称**：`knowledge_network_retrieval`（统一的检索工具）
   - **参数控制**：`enable_keyword_context` 控制是否启用关键词上下文召回
   - **必须参数**：当 `enable_keyword_context=True` 时，`object_type_id` 参数**必须提供**

2. **两步召回流程**：
   - **第一步**：必须基于完整问题召回schema（`enable_keyword_context=False`）
   - **第二步**：基于关键词的细粒度上下文召回（`enable_keyword_context=True`，需要先有schema）

3. **关键词召回的内容**：
   - **匹配实例信息**：获取关键词匹配的对象实例及其所有属性
   - **一度邻居信息**：获取关键词匹配对象的一度邻居信息（方向不限定）

### 10.2 Agent使用方式

**步骤1：召回schema（必须首先调用）**
```python
result1 = await knowledge_network_retrieval(
    query="上气道梗阻有哪些症状",  # 完整问题
    kn_ids=[...],
    session_id="session_123",  # 必须提供
    enable_keyword_context=False  # 召回schema
)
```

**步骤2：Agent识别关键词（Agent负责，工具不负责）**
- Agent从问题中提取关键词：["上气道梗阻", "症状"]
- Agent决定针对哪些关键词进行召回

**步骤3：召回关键词上下文（可以多次调用）**
```python
result2 = await knowledge_network_retrieval(
    query="上气道梗阻",  # 关键词（Agent传入）
    kn_ids=[...],
    session_id="session_123",  # 使用相同session_id
    enable_keyword_context=True,  # 召回关键词上下文
    object_type_id="disease"  # 必须提供：指定关键词所属的对象类型
)
```

**Agent注意事项**：
- 必须先调用 `enable_keyword_context=False` 召回schema（query必须是完整问题）
- 必须提供 `session_id` 参数
- Agent负责从问题中识别和提取关键词
- 调用 `enable_keyword_context=True` 时，query必须是关键词，不能是完整问题
- **必须提供 `object_type_id` 参数**：因为即使用关键词，但是有很多对象类型，你不知道这个关键词属于哪个对象类型
- 如果直接调用 `enable_keyword_context=True` 但没有schema，会收到明确错误提示
- 如果调用 `enable_keyword_context=True` 但没有提供 `object_type_id`，会收到明确错误提示

### 10.3 价值

1. **对Agent的价值**：
   - **职责清晰**：Agent负责关键词识别，工具只负责召回
   - **分步调用**：可以灵活控制召回流程
   - **错误提示明确**：如果没有schema或缺少object_type_id会收到明确错误，指导正确调用
   - **利用session缓存**：避免重复召回schema，提高效率
   - **可以针对不同关键词分别召回**：支持多次调用，每次针对不同关键词

2. **对下游任务的价值**：
   - 获取关键词匹配的对象实例及其所有属性
   - 获取关键词的一度邻居信息，了解关联关系
   - 正确构建数据库查询条件

3. **性能优势**：
   - 避免重复召回schema：利用session缓存
   - 支持多次关键词召回：复用同一个session中的schema信息
   - 提高效率：减少不必要的API调用

4. **架构优势**：
   - **职责分离**：关键词识别由Agent负责，工具只负责召回
   - **工具简化**：工具不需要实现复杂的关键词提取逻辑
   - **灵活扩展**：Agent可以根据需要选择不同的关键词识别策略
