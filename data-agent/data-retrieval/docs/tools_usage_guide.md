# 工具使用指南

本文档介绍 Data Retrieval 中包含的所有工具的用法、参数说明和实现原理。

包含三大类工具：
- **基础工具**：数据查询、SQL生成、可视化等核心功能
- **沙箱工具**：代码执行、文件操作等沙箱环境功能
- **知识网络工具**：知识检索、概念重排序等功能

## 1. 返回结果格式说明

### 1.1 API模式返回格式

当通过 API 直接调用工具时，所有工具都会返回统一的格式：

```json
{
  "output": {
    // 精简后的结果数据，受 return_record_limit 和 return_data_limit 限制
  },
  "full_output": {
    // 完整的结果数据，包含所有数据（可能受 force_limit 限制）
  }
}
```

**字段说明**:
- `output`: 包含精简后的结果，用于返回给调用方。数据量受 `return_record_limit` 和 `return_data_limit` 限制，避免返回过多数据。
- `full_output`: 包含完整的结果数据，存储在缓存中。可以通过 `result_cache_key` 从缓存中获取完整数据。

### 1.2 非API模式返回格式

当在 Data Agent 内部调用工具时（`api_mode=False`），工具直接返回 `output` 的内容，不包含外层包装。

### 1.3 通用返回字段

大多数工具都会返回以下通用字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `result_cache_key` | string | 结果缓存键，用于从缓存中获取完整数据 |
| `data_desc` | object | 数据描述信息，包含 `return_records_num`（返回记录数）和 `real_records_num`（实际记录数） |
| `title` | string | 数据标题 |
| `message` | string | 执行消息（成功或错误信息） |

### 1.4 错误返回格式

当工具执行失败时，会返回错误响应（详见"错误码和错误处理"章节）：

```json
{
  "code": "错误码",
  "status": 500,
  "reason": "错误原因",
  "detail": "详细错误信息"
}
```

---

## 2. 工具缓存机制

### 2.1 缓存概述

采用基于会话（Session）的缓存机制，允许工具之间共享执行结果，避免重复计算和数据传递。每个工具执行完成后，会将结果存储到缓存中，其他工具可以通过缓存键（Cache Key）获取这些结果。

### 2.2 缓存键生成

每个工具在执行时会自动生成一个唯一的缓存键（`result_cache_key`），格式为：

```
result_cache_key = session_id + "_" + task_id
```

其中：
- `session_id`: 会话ID，用于标识不同的用户会话
- `task_id`: 任务ID，由系统自动生成的唯一标识符

### 2.3 缓存存储

工具执行完成后，会自动将结果存储到缓存中，使用生成的缓存键作为唯一标识。缓存内容通常包括：
- `data`: 工具执行的数据结果
- `title`: 数据标题
- `sql`: SQL语句（如适用）
- `explanation`: 查询解释（如适用）
- 其他工具特定的元数据

### 2.4 缓存读取

其他工具可以通过传入缓存键参数来读取之前工具的结果。支持缓存读取的工具包括：
- `json2plot`: 通过 `tool_result_cache_key` 参数获取 `text2sql` 或 `text2metric` 的结果
- `sandbox` 工具的 `create_file`: 通过 `result_cache_key` 参数获取之前工具的结果并写入文件

### 2.5 缓存存储方式

系统支持两种缓存存储方式：

1. **Redis 存储**（默认）
   - 使用 Redis 作为缓存后端
   - 过期时间：2小时
   - 适用于生产环境，支持分布式部署

2. **内存存储**（InMemory）
   - 使用内存字典存储
   - 过期时间：24小时
   - 适用于开发测试环境，重启后数据会丢失

### 2.6 工具间数据流转

以下流程图展示了工具之间如何通过缓存共享数据：

```
┌─────────────────────────────────────────────────────────────────┐
│                        工具缓存数据流转图                          │
└─────────────────────────────────────────────────────────────────┘

用户请求
    │
    ├─────────────────────────────────────────────────────────────┐
    │                                                             │
    ▼                                                             ▼
┌─────────────┐                                          ┌─────────────┐
│  text2sql   │                                          │ text2metric │
│   工具       │                                          │   工具       │
└─────────────┘                                          └─────────────┘
    │                                                             │
    │ 执行SQL查询                                                 │ 执行指标查询
    │                                                             │
    │ 生成缓存键: session_id_task_id_1                           │ 生成缓存键: session_id_task_id_2
    │                                                             │
    │ 存储结果到缓存                                               │ 存储结果到缓存
    │                                                             │
    ▼                                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Session 缓存存储                            │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ cache_key_1         │  │ cache_key_2         │            │
│  │ {                   │  │ {                   │            │
│  │   "data": [...],    │  │   "data": [...],    │            │
│  │   "title": "...",    │  │   "title": "...",    │            │
│  │   "sql": "..."      │  │   "explanation": {} │            │
│  │ }                   │  │ }                   │            │
│  └──────────────────────┘  └──────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
    │                                                             │
    │ 通过 cache_key 读取                                         │ 通过 cache_key 读取
    │                                                             │
    ▼                                                             ▼
┌─────────────┐                                          ┌─────────────┐
│  json2plot  │                                          │   sandbox   │
│   工具       │                                          │ create_file │
└─────────────┘                                          └─────────────┘
    │                                                             │
    │ 参数: tool_result_cache_key = cache_key_1                  │ 参数: result_cache_key = cache_key_1
    │                                                             │
    │ 从缓存获取数据                                               │ 从缓存获取数据
    │                                                             │
    │ 生成图表配置                                                 │ 写入文件
    │                                                             │
    ▼                                                             ▼
┌─────────────┐                                          ┌─────────────┐
│  图表结果   │                                          │  文件内容   │
└─────────────┘                                          └─────────────┘
```

### 2.7 缓存使用示例

#### 2.7.1 示例1: text2sql → json2plot

在 Data Agent 中配置时，两个工具都需要设置相同的 `session_id`：

```json
// text2sql 工具配置
{
  "session_id": "{{self_config.conversation_id}}",
  "data_source": {
    "user_id": "{{header.x-account-id}}",
    ...
  },
  "inner_llm": {
    "name": "deepseek-v3"
  }
}

// json2plot 工具配置（使用 text2sql 的缓存结果）
{
  "session_id": "{{self_config.conversation_id}}",
  "tool_result_cache_key": "{{text2sql.result_cache_key}}",
  "chart_type": "Line",
  "data_field": "销售额",
  "group_by": ["日期"]
}
```

注意上述例子中:
1. text2sql 工具中 `{{self_config.conversation_id}}` 需要在 Data Agent 中通过引用配置方式实现，不需要填写；`{{header.x-account-id}}`（新版本）或 `{{header.x-user}}`（老版本）需要通过引用变量的方式配置成 `header.x-account-id` 或 `header.x-user`，不需要填写具体值
2. json2plot 工具中 `{{text2sql.result_cache_key}}` 参数是模型自动生成的，也不需要填写

#### 2.7.2 示例2: text2metric → sandbox create_file

在 Data Agent 中配置时，两个工具都需要设置相同的 `session_id`：

```json
// text2metric 工具配置
{
  "session_id": "{{self_config.conversation_id}}",
  "data_source": {
    "user_id": "{{header.x-account-id}}",
    ...
  },
  "inner_llm": {
    "name": "deepseek-v3"
  }
}

// create_file 工具配置（使用 text2metric 的缓存结果）
{
  "session_id": "{{self_config.conversation_id}}",
  "filename": "metric_data.json",
  "result_cache_key": "{{text2metric.result_cache_key}}"
}
```

注意上述例子中:
1. text2metric 工具中 `{{self_config.conversation_id}}` 需要在 Data Agent 中通过引用配置方式实现，不需要填写；`{{header.x-account-id}}`（新版本）或 `{{header.x-user}}`（老版本）需要通过引用变量的方式配置成 `header.x-account-id` 或 `header.x-user`，不需要填写具体值
2. create_file 工具中 `{{text2metric.result_cache_key}}` 参数是模型自动生成的，也不需要填写

### 2.8 缓存注意事项

1. **会话ID配置**: 所有工具的 `session_id` 必须统一使用 `self_config.conversation_id`，确保工具缓存和沙箱 id 的一致性
2. **缓存键的有效性**: 缓存键只在同一会话（`session_id`）内有效，不同会话之间无法共享缓存
3. **缓存过期时间**: 
   - Redis: 2小时自动过期
   - InMemory: 24小时自动过期
4. **缓存大小限制**: 如果缓存内容超过 `CACHE_SIZE_LIMIT`，会被截取（保留前80%和后20%）
5. **支持的缓存源**: 
   - `json2plot` 只支持从 `text2sql` 或 `text2metric` 的缓存中获取数据
   - `sandbox` 工具支持从任何工具的缓存中获取数据
6. **缓存键格式**: 缓存键格式为 `session_id_task_id`，由系统自动生成，无需手动构造

---

## 3. Data Agent 的工具调用机制

### 3.1 调用方式

Data Agent 支持两种工具调用方式：

1. **主动调用**: 通过 `@工具名称` 的方式，即 `@text2sql(action="show_ds", input="问题")`，这种方式手工写入参数，不再赘述。

2. **大模型选择工具**: Data Agent 根据用户输入和上下文信息，通过大语言模型选择合适的工具，并自动填充参数。

### 3.2 调用流程

当使用大模型选择工具时，例如 explore 模式，调用流程如下：

1. **工具选择**: Data Agent 根据用户输入和上下文信息，通过大语言模型选择合适的工具
2. **参数解析**: 解析工具所需的参数，包括数据源配置、LLM配置、工具配置等
3. **工具执行**: 调用对应的工具 API，执行具体的业务逻辑
4. **结果处理**: 处理工具执行结果，包括数据格式化、缓存存储等
5. **结果返回**: 将处理后的结果返回给用户或传递给下一个工具

### 3.3 参数配置

在 Data Agent 的配置中，工具的参数有**禁用**和**启用**两种模式：

#### 3.3.1 禁用参数

如果禁用某参数，则说明调用工具时，不传该参数。如果是必填参数不能禁用。

#### 3.3.2 启用参数

如果启用参数，有三种类型：

1. **固定值**: 这种适用于固定的配置参数，比如固定的背景知识说明、固定的字段召回数量。例如下面
   ```json
   {
     "config": {
       "view_num_limit": 5,
       "dimension_num_limit": 30
     }
   }
   ```

2. **应用变量**: 使用 Data Agent 运行时的变量，比如 `self_config` 的 `conversation_id` 或者 `header` 中的变量。注意：`{{header.x-account-id}}`（新版本）或 `{{header.x-user}}`（老版本）需要通过引用变量的方式配置成 `header.x-account-id` 或 `header.x-user`，不需要填写具体值。例如：
   ```json
   {
     "session_id": "{{self_config.conversation_id}}",
     "data_source": {
       "user_id": "{{header.x-account-id}}",
     }
   }
   ```

3. **模型生成**: 这种情况下，适用于大模型根据用户的问题来自动生成调用参数。例如：
   ```json
   {
     "input": "{{模型生成}}",
     "data_source": {
       "view_list": ["{{模型生成}}"]
     }
   }
   ```

#### 3.3.3 参数配置建议

需要根据实际情况选择参数的类型，尽量让模型只生成必须生成的参数，提高准确率：

- **固定值**: 用于不会变化的配置项，减少模型负担
- **应用变量**: 用于运行时动态获取的值，如用户ID、会话ID等
- **模型生成**: 仅用于需要根据用户问题动态生成的参数，如查询问题、SQL语句等

### 3.4 参数传递

工具调用时，参数通过以下方式传递：

- **查询参数**: `stream`、`mode` 等控制参数（目前暂不支持）
- **请求体参数**: 工具的具体参数，包括：
  - `data_source`: 数据源配置
  - `inner_llm` / `llm`: 大模型配置
  - `config`: 工具配置参数
  - 工具特定的参数（如 `input`、`sql`、`command` 等）

### 3.5 会话管理

每个工具调用都与一个会话（Session）绑定：

- **session_id**: 通过 `session_id` 参数标识会话，通常使用 `{{self_config.conversation_id}}`
- **会话隔离**: 不同会话之间的数据相互隔离，确保数据安全
- **会话持久化**: 会话状态和缓存数据会持久化保存，支持多轮对话

### 3.6 工具链调用

Data Agent 支持工具链调用，即一个工具的输出可以作为另一个工具的输入：

- **缓存机制**: 通过 `result_cache_key` 或 `tool_result_cache_key` 传递工具结果
- **工具链示例**: 
  - `text2sql` → `json2plot`: SQL查询结果用于生成图表
  - `text2metric` → `sandbox create_file`: 指标查询结果保存到文件
- **会话一致性**: 工具链中的所有工具必须使用相同的 `session_id`

### 3.7 错误处理

工具调用过程中的错误处理机制：

- **参数验证**: 调用前验证必填参数和参数格式
- **执行错误**: 捕获工具执行过程中的异常，返回标准错误格式
- **重试机制**: 部分工具支持错误重试（如 `text2sql` 最多重试3次）
- **错误反馈**: 将错误信息反馈给大语言模型，用于改进后续调用

---

## 4. 工具映射概览

### 4.1 基础工具

包含以下工具：
- `json2plot`: Json2Plot - 数据可视化工具
- `text2sql`: Text2SQLTool - 自然语言转SQL工具
- `text2ngql`: Text2nGQLTool - 自然语言转nGQL工具
- `text2metric`: Text2DIPMetricTool - 自然语言转指标查询工具
- `sql_helper`: SQLHelperTool - SQL执行辅助工具
- `get_metadata`: GetMetadataTool - 获取数据源元数据工具
- `knowledge_item`: KnowledgeItemTool - 知识条目检索工具

### 4.2 沙箱工具

包含以下工具：
- `execute_code`: ExecuteCodeTool - 执行Python代码
- `execute_command`: ExecuteCommandTool - 执行系统命令
- `read_file`: ReadFileTool - 读取文件
- `create_file`: CreateFileTool - 创建文件
- `list_files`: ListFilesTool - 列出文件
- `get_status`: GetStatusTool - 获取沙箱状态
- `close_sandbox`: CloseSandboxTool - 关闭沙箱
- `download_from_efast`: DownloadFromEfastTool - 从Efast下载文件

### 4.3 知识网络工具

包含以下工具：
- `knowledge_rerank`: KnowledgeNetworkRerankTool - 知识网络概念重排序
- `knowledge_retrieve`: KnowledgeNetworkRetrievalTool - 知识网络检索

---

## 5. 基础工具详细说明

### 5.1 json2plot - 数据可视化工具

**工具名称**: `json2plot`

**功能描述**: 根据绘图参数生成用于前端展示的 JSON 对象，支持饼图、折线图、柱状图三种图表类型。

**实现原理**: 基于规则引擎和 pandas 数据处理。工具接收数据后，使用 pandas DataFrame 进行数据处理，根据图表类型（饼图、折线图、柱状图）和分组字段，通过预定义的 Schema 规则自动生成图表配置。不依赖大语言模型，纯基于规则和数据结构分析。

**API 端点**: `POST /tools/json2plot`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `title` | string | 是 | 图表的标题，与数据的 title 保持一致 | - |
| `chart_type` | string | 是 | 图表类型，支持: `Pie`（饼图）、`Line`（折线图）、`Column`（柱状图） | - |
| `group_by` | array[string] | 否 | 分组字段列表，支持多个字段。如果有时间字段，请放在第一位 | - |
| `data` | array[object] | 否* | 用于作图的 JSON 数据，与 `tool_result_cache_key` 不能同时设置 | - |
| `data_field` | string | 否 | 数据字段（指标字段），注意设置的 `group_by` 和 `data_field` 必须和数据匹配 | - |
| `tool_result_cache_key` | string | 否* | `text2metric` 或 `text2sql` 工具缓存 key，与 `data` 不能同时设置 | - |

**分组字段说明**:
- **折线图**: `group_by` 可能有1~2个值，第一个是 x 轴，第二个字段是分组，`data_field` 是 y 轴
- **柱状图**: `group_by` 可能有1~3个值，第一个是 x 轴，第二个字段是堆叠，第三个字段是分组，`data_field` 是 y 轴
- **饼图**: `group_by` 只有一个值，即 colorField，`data_field` 是 angleField

**请求示例**:

```bash
curl -X POST "http://data-retrieval:9100/tools/json2plot" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "销售数据统计",
    "chart_type": "Line",
    "group_by": ["日期", "产品类别"],
    "data_field": "销售额",
    "data": [
      {"日期": "2024-01", "产品类别": "A", "销售额": 1000},
      {"日期": "2024-02", "产品类别": "A", "销售额": 1200},
      {"日期": "2024-01", "产品类别": "B", "销售额": 800}
    ]
  }'
```

**响应示例**:

```json
{
  "output": {
    "title": "销售数据统计",
    "chart_config": {
      "xField": "日期",
      "yField": "销售额",
      "seriesField": "产品类别",
      "chart_type": "Line"
    },
    "data_sample": [
      {
        "日期": "2024-01",
        "产品类别": "A",
        "销售额": 1000
      }
    ],
    "result_cache_key": "session_id_task_id"
  },
  "full_output": {
    "title": "销售数据统计",
    "chart_config": {
      "xField": "日期",
      "yField": "销售额",
      "seriesField": "产品类别",
      "chart_type": "Line"
    },
    "data": [
      {
        "日期": "2024-01",
        "产品类别": "A",
        "销售额": 1000
      },
      {
        "日期": "2024-02",
        "产品类别": "A",
        "销售额": 1200
      }
    ],
    "result_cache_key": "session_id_task_id"
  }
}
```

**注意**: 
- API模式返回 `output` 和 `full_output` 两个字段
- `output` 包含精简后的数据（`data_sample` 只包含第一条数据）
- `full_output` 包含完整的数据（`data` 包含所有数据）
- 非API模式只返回 `output` 的内容（不包含外层包装）

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 | 默认值 |
|--------|------|------|--------|--------|
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` | - |
| `background` | 背景信息，用于提供额外的上下文信息，一般不需要模型生成，通过固定值或其他的工具的输入 | 否 | `"背景说明文本"` | - |
| `session_type` | 会话类型，可选值: `redis`, `in_memory`，默认: `redis` | 否 | `"redis"` | `redis` |

**注意**: 
- 此工具不依赖大语言模型，也不直接访问数据源
- `session_id` 必须设置，用于确保工具缓存的一致性

---

### 5.2 text2sql - 自然语言转SQL工具

**工具名称**: `text2sql`

**功能描述**: 根据用户输入的文本和数据视图信息来生成 SQL 语句，并查询数据库。注意：`input` 参数只接受问题，不接受SQL。

**实现原理**: 使用大语言模型（LLM）进行自然语言到 SQL 的转换。通过精心设计的 prompt 模板（包含数据库表结构、样例数据、背景知识等）指导 LLM 生成 SQL 语句。支持错误重试机制（最多3次）和查询重写功能，当 SQL 执行失败时会自动将错误信息反馈给 LLM 进行改进。生成的 SQL 会通过数据源执行并返回结果。

**关键参数说明**:
- `view_num_limit`: 传给大模型的视图数量限制。如果数据源包含多个视图，工具会通过召回机制筛选最相关的视图，避免传入过多视图占用大量 token。如果视图太多，可能占用大量的 token，内部采用召回的方式进行精简，所以建议根据实际情况进行配置，默认值为 5。
- `dimension_num_limit`: 传给大模型的维度数量限制。如果视图包含大量字段（维度），工具会通过召回机制筛选最相关的维度，避免传入过多字段占用大量 token。如果视图字段很多，可能占用大量的 token，内部采用召回的方式进行精简，所以建议根据实际情况进行配置，默认值为 30。
- `return_record_limit`: 返回的数据条数限制。控制工具返回的最大记录数，默认值为 100。超过此限制的数据会被截断，只返回前 N 条记录。
- `return_data_limit`: 返回的数据字节数限制。控制工具返回的数据大小（以字节为单位），默认值为 5000。超过此限制的数据会被截断，确保返回的数据量在合理范围内。
- `force_limit`: 强制限制SQL查询的行数。在SQL执行前限制返回的数据条数，默认值为 200。

**API 端点**: `POST /tools/text2sql`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 | 默认值 |
|--------|------|------|--------|--------|
| `data_source.token` | 认证令牌，使用 `header.token`。默认为内部调用，无需填写 | 否 | `{{header.token}}` | - |
| `data_source.user_id` | 用户ID，必须设置，需要通过引用变量的方式配置成 `header.x-account-id`（新版本）或 `header.x-user`（老版本） | 是 | `{{header.x-account-id}}` 或 `{{header.x-user}}` | - |
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` | - |
| `inner_llm` | 平台内部大模型配置，用于访问内部模型工厂中接入的模型。在 Agent 工厂中选择平台内部模型 | 否 | - | - |
| `llm` | 外部大模型配置。如需使用外部模型（如 OpenAI），需要配置此参数 | 否 | `{"model_name": "gpt-4", "openai_api_key": "xxx"}` | - |
| `config.background` | 背景信息，用于提供额外的上下文信息 | 否 | `"背景说明文本"` | - |
| `config.session_type` | 会话类型，可选值: `redis`, `in_memory`，默认: `redis` | 否 | `"redis"` | `redis` |
| `config.session_id` | 会话ID，用于维护会话状态 | 否 | `{{self_config.conversation_id}}` | - |
| `config.view_num_limit` | 传给大模型的视图数量限制。如果视图太多，可能占用大量 token，内部采用召回的方式进行精简。建议根据实际情况配置 | 否 | `5` | `5` |
| `config.dimension_num_limit` | 传给大模型的维度数量限制。如果视图字段很多，可能占用大量 token，内部采用召回的方式进行精简。建议根据实际情况配置 | 否 | `30` | `30` |
| `config.return_record_limit` | 返回的数据条数限制。控制工具返回的最大记录数，默认值为 100。超过此限制的数据会被截断，只返回前 N 条记录 | 否 | `100` | `100` |
| `config.return_data_limit` | 返回的数据字节数限制。控制工具返回的数据大小（以字节为单位），默认值为 5000。超过此限制的数据会被截断，确保返回的数据量在合理范围内 | 否 | `5000` | `5000` |
| `config.force_limit` | 强制限制SQL查询的行数。在SQL执行前限制返回的数据条数，默认值为 200 | 否 | `200` | `200` |
| `config.get_desc_from_datasource` | 是否从数据源获取描述。当设置为 `true` 时，会在工具说明中附加数据源的信息（如视图信息），帮助大模型更好地理解数据源结构，默认值为 `false` | 否 | `false` | `false` |

**注意**:
- 此工具需要使用大语言模型，必须配置 `inner_llm` 或 `llm` 其中之一
- 推荐使用平台内部模型（`inner_llm`），配置更简单且性能稳定
- `user_id` 必须设置，新版本使用 `header.x-account-id`，老版本可能使用 `header.x-user`，用于权限控制和数据隔离
- `session_id` 必须设置，用于确保工具缓存的一致性

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `stream` | boolean | 否 | 是否流式返回，默认: `false`（**暂不支持**） |
| `mode` | string | 否 | 请求模式，可选值: `http`, `sse`，默认: `http`（**暂不支持**） |

**注意**: `stream` 和 `mode` 查询参数暂时还不支持，请勿使用。

**请求体参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `input` | string | 是 | 一个没有歧义的表述清晰的问题 | - |
| `data_source` | object | 是 | 数据源配置信息 | - |
| `data_source.view_list` | array[string] | 否 | 数据视图ID列表 | - |
| `data_source.base_url` | string | 否 | 服务器地址 | - |
| `data_source.token` | string | 否 | 认证令牌，默认为内部调用，无需填写 | - |
| `data_source.user_id` | string | 否 | 用户ID，新版本使用 `header.x-account-id`，老版本可能使用 `header.x-user` | - |
| `data_source.kg` | array[object] | 否 | 知识图谱配置参数列表 | - |
| `data_source.kn` | array | 否 | 知识网络配置参数 | - |
| `data_source.search_scope` | array[string] | 否 | 搜索范围，可选值: `object_types`, `relation_types`, `action_types` | - |
| `data_source.recall_mode` | string | 否 | 召回模式，默认: `keyword_vector_retrieval` | `keyword_vector_retrieval` |
| `llm` | object | 否 | 大语言模型配置 | - |
| `inner_llm` | object | 否 | 内部LLM配置 | - |
| `config` | object | 否 | 工具配置参数 | - |
| `config.view_num_limit` | integer | 否 | 传给大模型的视图数量限制，默认: `5` | `5` |
| `config.dimension_num_limit` | integer | 否 | 传给大模型的维度数量限制，默认: `30` | `30` |
| `config.return_record_limit` | integer | 否 | 返回的数据条数限制，默认: `100` | `100` |
| `config.return_data_limit` | integer | 否 | 返回的数据字节数限制，默认: `5000` | `5000` |
| `config.get_desc_from_datasource` | boolean | 否 | 是否从数据源获取描述。当设置为 `true` 时，会在工具说明中附加数据源的信息（如视图信息），帮助大模型更好地理解数据源结构，默认: `false` | `false` |
| `knowledge_enhanced_information` | object | 否 | 调用知识增强工具获取的信息 | - |
| `extra_info` | string | 否 | 附加信息，但不是知识增强的信息 | - |
| `action` | string | 否 | 工具的行为类型：`gen`（只生成SQL）、`gen_exec`（生成并执行SQL）、`show_ds`（只展示配置的数据源的元数据信息），默认: `gen_exec` | `gen_exec` |

**请求示例**:

```bash
curl -X POST "http://data-retrieval:9100/tools/text2sql" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "查询所有用户的姓名和邮箱",
    "data_source": {
      "view_list": ["view_id_123"],
      "base_url": "https://example.com",
      "token": "your_token_here",
      "user_id": "user_123"
    },
    "action": "gen_exec"
  }'
```

**响应示例**:

```json
{
  "output": {
    "sql": "SELECT name, email FROM users",
    "explanation": {
      "用户视图": [
        {"指标": "用户信息"},
        {"日期": "全部"}
      ]
    },
    "cites": [
      {
        "id": "view_id_123",
        "name": "用户视图",
        "type": "data_view",
        "description": "用户信息视图"
      }
    ],
    "data": [
      {"name": "张三", "email": "zhangsan@example.com"},
      {"name": "李四", "email": "lisi@example.com"}
    ],
    "title": "查询所有用户的姓名和邮箱",
    "data_desc": {
      "return_records_num": 2,
      "real_records_num": 2
    },
    "result_cache_key": "session_id_task_id"
  },
  "full_output": {
    "sql": "SELECT name, email FROM users",
    "explanation": {
      "用户视图": [
        {"指标": "用户信息"},
        {"日期": "全部"}
      ]
    },
    "cites": [
      {
        "id": "view_id_123",
        "name": "用户视图",
        "type": "data_view",
        "description": "用户信息视图"
      }
    ],
    "data": [
      {"name": "张三", "email": "zhangsan@example.com"},
      {"name": "李四", "email": "lisi@example.com"}
    ],
    "title": "查询所有用户的姓名和邮箱",
    "data_desc": {
      "return_records_num": 2,
      "real_records_num": 2
    },
    "result_cache_key": "session_id_task_id"
  }
}
```

**注意**: 
- API模式返回 `output` 和 `full_output` 两个字段
- `output` 包含限制后的数据（受 `return_record_limit` 和 `return_data_limit` 限制）
- `full_output` 包含完整的数据（受 `force_limit` 限制，但可能包含更多数据）
- 非API模式只返回 `output` 的内容（不包含外层包装）

---

### 5.3 text2ngql - 自然语言转nGQL工具

**工具名称**: `text2ngql`

**功能描述**: 将问题生成nGQL查询语句，并获取执行结果。复杂问题务必拆分子问题，工具一次只能解决一个子问题。

**实现原理**: 结合大语言模型和知识图谱检索技术。首先通过关键词抽取和向量检索从知识图谱中召回相关实体和关系，然后使用 LLM 根据图谱 Schema、检索结果和用户问题生成 nGQL 查询语句。支持检索增强生成（RAG）模式，通过图谱检索结果增强 prompt，提高查询准确性。生成的 nGQL 会在 NebulaGraph 数据库中执行并返回结果。

**API 端点**: `POST /tools/text2ngql`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 | 默认值 |
|--------|------|------|--------|--------|
| `inner_kg.kg_id` | 知识图谱ID，必须设置 | 是 | `"14"` | - |
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` | - |
| `inner_llm` | 平台内部大模型配置，用于访问内部模型工厂中接入的模型。在 Agent 工厂中选择平台内部模型 | 否 | - | - |
| `llm` | 外部大模型配置。如需使用外部模型（如 OpenAI），需要配置此参数 | 否 | `{"model_name": "gpt-4", "openai_api_key": "xxx"}` | - |
| `background` | 背景信息，用于提供额外的上下文信息 | 否 | `"背景说明文本"` | - |
| `session_type` | 会话类型，可选值: `redis`, `in_memory`，默认: `redis` | 否 | `"redis"` | `redis` |

**注意**: 
- 此工具需要使用大语言模型，必须配置 `inner_llm` 或 `llm` 其中之一
- 推荐使用平台内部模型（`inner_llm`），配置更简单且性能稳定
- 知识图谱ID（`kg_id`）是必填项，用于指定要查询的知识图谱
- `session_id` 必须设置，用于确保工具缓存的一致性

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `stream` | boolean | 否 | 是否流式返回，默认: `false`（**暂不支持**） | `false` |
| `mode` | string | 否 | 请求模式，可选值: `http`, `sse`，默认: `http`（**暂不支持**） | `http` |

**注意**: `stream` 和 `mode` 查询参数暂时还不支持，请勿使用。

**请求体参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `query` | string | 否 | 自然语言查询语句 | - |
| `inner_kg` | object | 是 | 知识图谱相关配置，通用引用变量，使用 `self_config.data_source.kg[0]` 获取 | - |
| `inner_kg.kg_id` | string | 是 | 知识图谱ID | - |
| `inner_kg.fields` | array[string] | 否 | 字段列表 | - |
| `inner_llm` | object | 否 | 大语言模型参数配置 | - |
| `rewrite_query` | string | 否 | 重写后的查询语句，如有，会加入prompt中 | - |
| `background` | string | 否 | 背景信息，如有，会加入prompt中 | - |
| `retrieval` | boolean | 否 | 是否启用检索增强，默认: `true` | `true` |
| `retrieval_params` | object | 否 | 图谱检索相关配置 | - |
| `retrieval_params.score` | number | 否 | opensearch向量召回阈值，默认: `0.9` | `0.9` |
| `retrieval_params.select_num` | integer | 否 | 召回数量，默认: `5` | `5` |
| `retrieval_params.label_name` | string | 否 | 选中某个实体类型召回，默认: `"*"` | `"*"` |
| `retrieval_params.keywords_extract` | boolean | 否 | 是否用大模型对问题做关键词抽取，默认: `true` | `true` |
| `history` | array[object] | 否 | 对话历史记录，多轮对话时需要 | - |
| `cache_cover` | boolean | 否 | 是否覆盖缓存，如果 `true`，会重新获取最新的schema或者数据，默认: `false` | `false` |
| `action` | string | 否 | 操作类型，可选值: `nl2ngql`（自然语言转查询）、`get_schema`（获取schema）、`keyword_retrieval`（获取图谱检索结果），默认: `nl2ngql` | `nl2ngql` |
| `timeout` | number | 否 | 超时时间，默认: `120` | `120` |

**请求示例**:

```bash
curl -X POST "http://data-retrieval:9100/tools/text2ngql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Rose是谁",
    "inner_kg": {
      "kg_id": "14",
      "fields": ["orgnization", "person", "district"]
    },
    "inner_llm": {
      "name": "deepseek-v3",
      "temperature": 0.01,
      "max_tokens": 10000
    },
    "action": "nl2ngql"
  }'
```

**响应示例**:

```json
{
  "result": {
    "sql": "MATCH (p:person {name: \"Rose\"}) RETURN p",
    "data": [
      {
        "name": "Rose",
        "age": 30,
        "orgnization": "爱数公司"
      }
    ]
  },
  "execution_time": 0.5
}
```

---

### 5.4 text2metric - 自然语言转指标查询工具

**工具名称**: `text2metric`

**功能描述**: 根据文本生成指标查询参数，并查询指标数据。

**实现原理**: 使用大语言模型将自然语言转换为指标查询参数。工具接收用户问题后，通过 LLM 理解查询意图，解析出指标ID、维度、筛选条件等参数，然后调用 DIP Metric 服务查询指标数据。支持从知识网络中自动检索相关指标，通过向量检索和关键词匹配找到最相关的指标列表。

**关键参数说明**:
- `view_num_limit`: 传给大模型的视图数量限制。如果数据源包含多个视图，工具会通过召回机制筛选最相关的视图，避免传入过多视图占用大量 token。如果视图太多，可能占用大量的 token，内部采用召回的方式进行精简，所以建议根据实际情况进行配置，默认值为 5。
- `dimension_num_limit`: 传给大模型的维度数量限制。如果指标包含大量维度，工具会通过召回机制筛选最相关的维度，避免传入过多维度占用大量 token。如果视图字段很多，可能占用大量的 token，内部采用召回的方式进行精简，所以建议根据实际情况进行配置，默认值为 30。
- `return_record_limit`: 返回的数据条数限制。控制工具返回的最大记录数，默认值为 100。超过此限制的数据会被截断，只返回前 N 条记录。
- `return_data_limit`: 返回的数据字节数限制。控制工具返回的数据大小（以字节为单位），默认值为 5000。超过此限制的数据会被截断，确保返回的数据量在合理范围内。
- `force_limit`: 强制限制指标查询的行数。在查询执行前限制返回的数据条数，默认值为 1000。

**API 端点**: `POST /tools/text2metric`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 | 默认值 |
|--------|------|------|--------|--------|
| `data_source.token` | 认证令牌，使用 `header.token`。默认为内部调用，无需填写 | 否 | `{{header.token}}` | - |
| `data_source.user_id` | 用户ID，必须设置，需要通过引用变量的方式配置成 `header.x-account-id`（新版本）或 `header.x-user`（老版本） | 是 | `{{header.x-account-id}}` 或 `{{header.x-user}}` | - |
| `data_source.account_type` | 调用者类型，`user` 代表普通用户，`app` 代表应用账号，`anonymous` 代表匿名用户 | 否 | `"user"` | `user` |
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` | - |
| `inner_llm` | 平台内部大模型配置，用于访问内部模型工厂中接入的模型。在 Agent 工厂中选择平台内部模型 | 否 | - | - |
| `llm` | 外部大模型配置。如需使用外部模型（如 OpenAI），需要配置此参数 | 否 | `{"model_name": "gpt-4", "openai_api_key": "xxx"}` | - |
| `config.background` | 背景信息，用于提供额外的上下文信息 | 否 | `"背景说明文本"` | - |
| `config.session_type` | 会话类型，可选值: `redis`, `in_memory`，默认: `redis` | 否 | `"redis"` | `redis` |
| `config.session_id` | 会话ID，用于维护会话状态 | 否 | `{{self_config.conversation_id}}` | - |
| `config.view_num_limit` | 传给大模型的视图数量限制。如果视图太多，可能占用大量 token，内部采用召回的方式进行精简。建议根据实际情况配置 | 否 | `5` | `5` |
| `config.dimension_num_limit` | 传给大模型的维度数量限制。如果视图字段很多，可能占用大量 token，内部采用召回的方式进行精简。建议根据实际情况配置 | 否 | `30` | `30` |
| `config.return_record_limit` | 返回的数据条数限制。控制工具返回的最大记录数，默认值为 100。超过此限制的数据会被截断，只返回前 N 条记录 | 否 | `100` | `100` |
| `config.return_data_limit` | 返回的数据字节数限制。控制工具返回的数据大小（以字节为单位），默认值为 5000。超过此限制的数据会被截断，确保返回的数据量在合理范围内 | 否 | `5000` | `5000` |
| `config.force_limit` | 强制限制指标查询的行数。在查询执行前限制返回的数据条数，默认值为 1000 | 否 | `1000` | `1000` |
| `config.get_desc_from_datasource` | 是否从数据源获取描述。当设置为 `true` 时，会在工具说明中附加数据源的信息（如指标信息），帮助大模型更好地理解数据源结构，默认值为 `false` | 否 | `false` | `false` |

**注意**: 
- 此工具需要使用大语言模型，必须配置 `inner_llm` 或 `llm` 其中之一
- 推荐使用平台内部模型（`inner_llm`），配置更简单且性能稳定
- `user_id` 必须设置，新版本使用 `header.x-account-id`，老版本可能使用 `header.x-user`，用于权限控制和数据隔离
- `session_id` 必须设置，用于确保工具缓存的一致性

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `stream` | boolean | 否 | 是否流式返回，默认: `false`（**暂不支持**） | `false` |
| `mode` | string | 否 | 请求模式，可选值: `http`, `sse`，默认: `http`（**暂不支持**） | `http` |

**注意**: `stream` 和 `mode` 查询参数暂时还不支持，请勿使用。

**请求体参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `input` | string | 是 | 自然语言查询问题 | - |
| `data_source` | object | 是 | 数据源配置信息 | - |
| `data_source.metric_list` | array[string] | 否 | 指标ID列表 | - |
| `data_source.base_url` | string | 否 | 服务器地址 | - |
| `data_source.token` | string | 否 | 认证令牌，默认为内部调用，无需填写 | - |
| `data_source.user_id` | string | 否 | 用户ID，新版本使用 `header.x-account-id`，老版本可能使用 `header.x-user` | - |
| `data_source.account_type` | string | 否 | 调用者的类型，`user` 代表普通用户，`app` 代表应用账号，`anonymous` 代表匿名用户，默认: `user` | `user` |
| `data_source.kn` | array | 否 | 知识网络配置参数 | - |
| `data_source.search_scope` | array[string] | 否 | 搜索范围 | - |
| `data_source.recall_mode` | string | 否 | 召回模式 | - |
| `llm` | object | 否 | 大语言模型配置 | - |
| `inner_llm` | object | 否 | 内部LLM配置 | - |
| `config` | object | 否 | 工具配置参数 | - |
| `config.get_desc_from_datasource` | boolean | 否 | 是否从数据源获取描述。当设置为 `true` 时，会在工具说明中附加数据源的信息（如指标信息），帮助大模型更好地理解数据源结构，默认: `false` | `false` |
| `infos` | object | 否 | 额外信息 | - |
| `action` | string | 否 | 操作类型，默认: `query` | `query` |

**请求示例**:

```bash
curl -X POST "http://data-retrieval:9100/tools/text2metric" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "查询上个月的销售额",
    "data_source": {
      "metric_list": ["metric_id_1", "metric_id_2"],
      "base_url": "https://example.com",
      "token": "your_token_here",
      "user_id": "user_123",
      "account_type": "user"
    },
    "action": "query"
  }'
```

**响应示例**:

```json
{
  "output": {
    "metric_id": "metric_id_1",
    "query_params": {
      "instant": false,
      "start": 1646360670123,
      "end": 1646471470123,
      "step": "1m",
      "filters": [
        {
          "name": "日期",
          "value": ["2024-01"],
          "operation": "="
        }
      ]
    },
    "explanation": {
      "销售额": [
        {
          "指标": "使用 '销售额' 指标，按 '时间' '2024年1月' 的数据"
        },
        {
          "时间": "从 2024-01-01 到 2024-01-31"
        }
      ]
    },
    "cites": [
      {
        "id": "metric_id_1",
        "name": "销售额",
        "type": "metric"
      }
    ],
    "data": [
      {"日期": "2024-01", "销售额": 100000}
    ],
    "title": "查询上个月的销售额",
    "data_desc": {
      "return_records_num": 1,
      "real_records_num": 31
    },
    "result_cache_key": "session_id_task_id"
  },
  "full_output": {
    "metric_id": "metric_id_1",
    "query_params": {
      "instant": false,
      "start": 1646360670123,
      "end": 1646471470123,
      "step": "1m",
      "filters": [
        {
          "name": "日期",
          "value": ["2024-01"],
          "operation": "="
        }
      ]
    },
    "explanation": {
      "销售额": [
        {
          "指标": "使用 '销售额' 指标，按 '时间' '2024年1月' 的数据"
        },
        {
          "时间": "从 2024-01-01 到 2024-01-31"
        }
      ]
    },
    "cites": [
      {
        "id": "metric_id_1",
        "name": "销售额",
        "type": "metric"
      }
    ],
    "data": [
      {"日期": "2024-01-01", "销售额": 100000},
      {"日期": "2024-01-02", "销售额": 105000}
    ],
    "title": "查询上个月的销售额",
    "data_desc": {
      "return_records_num": 31,
      "real_records_num": 31
    },
    "result_cache_key": "session_id_task_id",
    "unit": "元",
    "unit_type": "currency",
    "step": "1m",
    "data_summary": {
      "total_data_points": 31,
      "force_limit": 1000,
      "step": "1m",
      "unit": "元",
      "unit_type": "currency"
    }
  }
}
```

**注意**: 
- API模式返回 `output` 和 `full_output` 两个字段
- `output` 包含限制后的数据（受 `return_record_limit` 和 `return_data_limit` 限制）
- `full_output` 包含完整的数据（受 `force_limit` 限制，但可能包含更多数据）
- 非API模式只返回 `output` 的内容（不包含外层包装）

---

### 5.5 sql_helper - SQL执行辅助工具

**工具名称**: `sql_helper`

**功能描述**: 专门用于调用 SQL 语句的工具，支持获取元数据信息和执行 SQL 语句。注意：此工具不生成 SQL 语句，只执行已提供的 SQL 语句。

**实现原理**: 直接执行 SQL 语句的轻量级工具，不涉及大语言模型。工具接收 SQL 语句后，通过数据源连接器（DataSource）直接执行查询，支持元数据获取和 SQL 执行两种模式。执行结果会进行数据限制和格式化处理，确保返回的数据量在合理范围内。

**关键参数说明**:
- `view_num_limit`: **仅在 `get_metadata` 命令时有效**。获取元数据时引用视图数量限制，-1表示不限制。原因是数据源包含大量视图，可能导致大模型上下文token超限，内置的召回算法会自动筛选最相关的视图。系统默认为 5。**在 `execute_sql` 命令时无效，因为工具会严格执行 SQL，不会限制视图数量。**
- `dimension_num_limit`: **仅在 `get_metadata` 命令时有效**。获取元数据时维度数量限制，-1表示不限制。系统默认为 30。**在 `execute_sql` 命令时无效，因为工具会严格执行 SQL，不会限制维度数量。**
- `force_limit`: **仅在 `execute_sql` 命令时有效**。强制限制SQL查询的行数。在SQL执行前，工具会将原始SQL包装为子查询并添加 LIMIT 子句，限制返回的数据条数。系统默认为 200。如果设置为 0 或负数，则不添加 LIMIT 限制。**注意：此参数在 SQL 执行前生效，会影响实际查询的数据量。**
- `return_record_limit`: **仅在 `execute_sql` 命令时有效**。SQL 执行后返回数据条数限制，-1表示不限制。原因是SQL执行后返回大量数据，可能导致大模型上下文token超限。系统默认为 -1。用于限制返回结果的数据条数。
- `return_data_limit`: **仅在 `execute_sql` 命令时有效**。SQL 执行后返回数据总量限制，单位是字节，-1表示不限制。原因是SQL执行后返回大量数据，可能导致大模型上下文token超限。系统默认为 -1。用于限制返回结果的数据大小。

**API 端点**: `POST /tools/sql_helper`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 | 默认值 |
|--------|------|------|--------|--------|
| `data_source.token` | 认证令牌，使用 `header.token`。默认为内部调用，无需填写 | 否 | `{{header.token}}` | - |
| `data_source.user_id` | 用户ID，必须设置，需要通过引用变量的方式配置成 `header.x-account-id`（新版本）或 `header.x-user`（老版本） | 是 | `{{header.x-account-id}}` 或 `{{header.x-user}}` | - |
| `data_source.account_type` | 调用者类型，`user` 代表普通用户，`app` 代表应用账号，`anonymous` 代表匿名用户 | 否 | `"user"` | `user` |
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` | - |
| `config.background` | 背景信息，用于提供额外的上下文信息 | 否 | `"背景说明文本"` | - |
| `config.session_type` | 会话类型，可选值: `redis`, `in_memory`，默认: `redis` | 否 | `"redis"` | `redis` |
| `config.session_id` | 会话ID，用于维护会话状态 | 否 | `{{self_config.conversation_id}}` | - |
| `config.view_num_limit` | **仅在 `get_metadata` 命令时有效**。获取元数据时引用视图数量限制，-1表示不限制。原因是数据源包含大量视图，可能导致大模型上下文token超限，内置的召回算法会自动筛选最相关的视图。系统默认为 5。**在 `execute_sql` 命令时无效，因为工具会严格执行 SQL，不会限制视图数量** | 否 | `5` | `5` |
| `config.dimension_num_limit` | **仅在 `get_metadata` 命令时有效**。获取元数据时维度数量限制，-1表示不限制。系统默认为 30。**在 `execute_sql` 命令时无效，因为工具会严格执行 SQL，不会限制维度数量** | 否 | `30` | `30` |
| `config.return_record_limit` | SQL 执行后返回数据条数限制，-1表示不限制。原因是SQL执行后返回大量数据，可能导致大模型上下文token超限。系统默认为 -1。**注意：此参数在 `execute_sql` 命令时有效，用于限制返回结果的数据条数** | 否 | `-1` | `-1` |
| `config.return_data_limit` | SQL 执行后返回数据总量限制，单位是字节，-1表示不限制。原因是SQL执行后返回大量数据，可能导致大模型上下文token超限。系统默认为 -1。**注意：此参数在 `execute_sql` 命令时有效，用于限制返回结果的数据大小** | 否 | `-1` | `-1` |
| `config.force_limit` | **仅在 `execute_sql` 命令时有效**。强制限制SQL查询的行数。在SQL执行前，工具会将原始SQL包装为子查询并添加 LIMIT 子句，限制返回的数据条数。系统默认为 200。如果设置为 0 或负数，则不添加 LIMIT 限制。**注意：此参数在 SQL 执行前生效，会影响实际查询的数据量** | 否 | `200` | `200` |
| `config.with_sample` | 查询元数据时是否包含样例数据，默认: `true` | 否 | `true` | `true` |

**注意**: 
- 此工具不依赖大语言模型，只需要配置数据源相关参数
- `user_id` 必须设置，新版本使用 `header.x-account-id`，老版本可能使用 `header.x-user`，用于权限控制和数据隔离
- `session_id` 必须设置，用于确保工具缓存的一致性
- **重要：`view_num_limit` 和 `dimension_num_limit` 仅在 `get_metadata` 命令时有效**，用于控制获取元数据时的数据量，避免 token 超限。**在 `execute_sql` 命令时完全无效**，因为工具会严格执行 SQL，不会限制视图或维度数量
- **`force_limit` 仅在 `execute_sql` 命令时有效**，用于在 SQL 执行前添加 LIMIT 限制，控制实际查询的数据量。如果设置为 0 或负数，则不添加限制
- **`return_record_limit` 和 `return_data_limit` 仅在 `execute_sql` 命令时有效**，用于控制 SQL 执行后返回结果的数据量，避免大模型上下文 token 超限

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `stream` | boolean | 否 | 是否流式返回，默认: `false`（**暂不支持**） | `false` |
| `mode` | string | 否 | 请求模式，可选值: `http`, `sse`，默认: `http`（**暂不支持**） | `http` |

**注意**: `stream` 和 `mode` 查询参数暂时还不支持，请勿使用。

**请求体参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `command` | string | 否 | 命令类型，其中 `get_metadata` 表示获取元数据信息，`execute_sql` 表示执行 SQL 语句，默认: `execute_sql` | `execute_sql` |
| `sql` | string | 否 | 要执行的 SQL 语句，当 `command` 为 `execute_sql` 时必填 | - |
| `title` | string | 否 | 数据的标题，获取元数据时必填 | - |
| `timeout` | number | 否 | 请求超时时间（秒），超过此时间未完成则返回超时错误，默认120秒 | `120` |
| `data_source` | object | 是 | 数据源配置信息 | - |
| `data_source.view_list` | array[string] | 否 | 数据视图ID列表 | - |
| `data_source.base_url` | string | 否 | 服务器地址 | - |
| `data_source.token` | string | 否 | 认证令牌，默认为内部调用，无需填写 | - |
| `data_source.user_id` | string | 否 | 用户ID，新版本使用 `header.x-account-id`，老版本可能使用 `header.x-user` | - |
| `data_source.account_type` | string | 否 | 调用者的类型，`user` 代表普通用户，`app` 代表应用账号，`anonymous` 代表匿名用户，默认: `user` | `user` |
| `data_source.kn` | array | 否 | 知识网络配置参数 | - |
| `data_source.search_scope` | array[string] | 否 | 搜索范围 | - |
| `data_source.recall_mode` | string | 否 | 召回模式，支持 `keyword_vector_retrieval`（默认）、`agent_intent_planning`、`agent_intent_retrieval` | `keyword_vector_retrieval` |
| `config` | object | 否 | 工具配置参数 | - |
| `config.view_num_limit` | integer | 否 | **仅在 `get_metadata` 命令时有效**。获取元数据时引用视图数量限制，-1表示不限制，默认: `5`。**在 `execute_sql` 命令时无效，因为工具会严格执行 SQL，不会限制视图数量** | `5` |
| `config.dimension_num_limit` | integer | 否 | **仅在 `get_metadata` 命令时有效**。获取元数据时维度数量限制，-1表示不限制，默认: `30`。**在 `execute_sql` 命令时无效，因为工具会严格执行 SQL，不会限制维度数量** | `30` |
| `config.return_record_limit` | integer | 否 | SQL 执行后返回数据条数限制，-1表示不限制，默认: `-1`。**注意：此参数在 `execute_sql` 命令时有效，用于限制返回结果的数据条数** | `-1` |
| `config.return_data_limit` | integer | 否 | SQL 执行后返回数据总量限制（字节），-1表示不限制，默认: `-1`。**注意：此参数在 `execute_sql` 命令时有效，用于限制返回结果的数据大小** | `-1` |
| `config.force_limit` | integer | 否 | **仅在 `execute_sql` 命令时有效**。强制限制SQL查询的行数。在SQL执行前，工具会将原始SQL包装为子查询并添加 LIMIT 子句，限制返回的数据条数，默认: `200`。如果设置为 0 或负数，则不添加 LIMIT 限制。**注意：此参数在 SQL 执行前生效，会影响实际查询的数据量** | `200` |
| `config.with_sample` | boolean | 否 | 查询元数据时是否包含样例数据，默认: `true` | `true` |

**请求示例**:

```bash
curl -X POST "http://data-retrieval:9100/tools/sql_helper" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "execute_sql",
    "sql": "SELECT * FROM users LIMIT 10",
    "title": "用户列表",
    "data_source": {
      "view_list": ["view_id_123"],
      "base_url": "https://example.com",
      "token": "your_token_here",
      "user_id": "user_123"
    }
  }'
```

**响应示例**:

**execute_sql 命令响应**:

```json
{
  "output": {
    "command": "execute_sql",
    "sql": "SELECT * FROM users LIMIT 10",
    "title": "用户列表",
    "data": [
      {"id": 1, "name": "张三", "email": "zhangsan@example.com"},
      {"id": 2, "name": "李四", "email": "lisi@example.com"}
    ],
    "data_desc": {
      "return_records_num": 2,
      "real_records_num": 10
    },
    "message": "SQL 执行成功",
    "result_cache_key": "session_id_task_id"
  },
  "full_output": {
    "command": "execute_sql",
    "sql": "SELECT * FROM users LIMIT 10",
    "title": "用户列表",
    "data": [
      {"id": 1, "name": "张三", "email": "zhangsan@example.com"},
      {"id": 2, "name": "李四", "email": "lisi@example.com"},
      {"id": 3, "name": "王五", "email": "wangwu@example.com"}
    ],
    "data_desc": {
      "return_records_num": 10,
      "real_records_num": 10
    },
    "message": "SQL 执行成功",
    "result_cache_key": "session_id_task_id"
  }
}
```

**get_metadata 命令响应**:

```json
{
  "output": {
    "command": "get_metadata",
    "title": "用户数据视图",
    "summary": [
      {
        "name": "用户视图",
        "comment": "用户信息视图",
        "table_path": "users"
      }
    ],
    "metadata": [
      {
        "name": "用户视图",
        "comment": "用户信息视图",
        "path": "users",
        "columns": [
          {"name": "id", "type": "integer"},
          {"name": "name", "type": "string"},
          {"name": "email", "type": "string"}
        ]
      }
    ],
    "sample": {
      "users": [
        {"id": 1, "name": "张三", "email": "zhangsan@example.com"}
      ]
    },
    "message": "成功获取元数据样本数据"
  }
}
```

**注意**: 
- API模式返回 `output` 和 `full_output` 两个字段
- `output` 包含限制后的数据（受 `return_record_limit` 和 `return_data_limit` 限制）
- `full_output` 包含完整的数据（受 `force_limit` 限制，但可能包含更多数据）
- 非API模式只返回 `output` 的内容（不包含外层包装）
- `get_metadata` 命令返回元数据信息，包括 `summary`（数据源摘要）、`metadata`（详细元数据）和 `sample`（样例数据，当 `with_sample=true` 时返回）
- `execute_sql` 命令返回SQL执行结果，包括 `data`（查询结果数据）和 `data_desc`（数据描述信息）
- `force_limit` 会在 SQL 执行前添加 LIMIT 限制，因此 `full_output` 中的数据量会受到 `force_limit` 的限制

---

### 5.6 knowledge_item - 知识条目检索工具

**工具名称**: `knowledge_item`

**功能描述**: 根据输入的文本，获取知识条目信息，知识条目可用于为其他工具提供背景知识。

**实现原理**: 使用混合检索算法（Hybrid Retrieval）进行知识条目检索。结合 BM25 关键词检索和向量语义检索，通过 RRF（Reciprocal Rank Fusion）算法融合两种检索结果，提高检索准确性。支持强制检索（FR标记）和普通检索两种模式，能够根据查询文本从大量知识条目中筛选出最相关的条目。

**API 端点**: `POST /tools/knowledge_item`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 | 默认值 |
|--------|------|------|--------|--------|
| `data_source.token` | 认证令牌，使用 `header.token`。默认为内部调用，无需填写 | 否 | `{{header.token}}` | - |
| `data_source.user_id` | 用户ID，必须设置，需要通过引用变量的方式配置成 `header.x-account-id`（新版本）或 `header.x-user`（老版本） | 是 | `{{header.x-account-id}}` 或 `{{header.x-user}}` | - |
| `data_source.data_item_ids` | 知识条目ID列表，通过 `self_config.data_source.kn_entry` 配置 | 是 | `{{self_config.data_source.kn_entry}}` | - |
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` | - |
| `config.background` | 背景信息，用于提供额外的上下文信息 | 否 | `"背景说明文本"` | - |
| `config.session_type` | 会话类型，可选值: `redis`, `in_memory`，默认: `redis` | 否 | `"redis"` | `redis` |
| `config.session_id` | 会话ID，用于维护会话状态 | 否 | `{{self_config.conversation_id}}` |
| `config` | 工具配置参数 | 否 | `{"return_record_limit": 10}` |

**注意**: 
- 此工具不依赖大语言模型，只需要配置数据源相关参数
- `user_id` 必须设置，新版本使用 `header.x-account-id`，老版本可能使用 `header.x-user`，用于权限控制和数据隔离
- `session_id` 必须设置，用于确保工具缓存的一致性
- `data_item_ids` 可以通过 `self_config.data_source.kn_entry` 获取知识条目配置

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `stream` | boolean | 否 | 是否流式返回，默认: `false`（**暂不支持**） | `false` |
| `mode` | string | 否 | 请求模式，可选值: `http`, `sse`，默认: `http`（**暂不支持**） | `http` |

**注意**: `stream` 和 `mode` 查询参数暂时还不支持，请勿使用。

**请求体参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `input` | string | 否 | 输入的文本，如果为空则获取全部的知识条目 | - |
| `data_source` | object | 是 | 数据源配置信息 | - |
| `data_source.data_item_ids` | array[string] | 是 | 知识条目ID列表 | - |
| `data_source.base_url` | string | 否 | 服务器地址 | - |
| `data_source.token` | string | 否 | 认证令牌，默认为内部调用，无需填写 | - |
| `data_source.user_id` | string | 否 | 用户ID，新版本使用 `header.x-account-id`，老版本可能使用 `header.x-user` | - |
| `config` | object | 否 | 工具配置参数 | - |
| `config.background` | string | 否 | 背景信息，用于提供额外的上下文信息 | - |
| `config.session_type` | string | 否 | 会话类型，可选值: `redis`, `in_memory`，默认: `redis` | `redis` |
| `config.session_id` | string | 否 | 会话ID，用于维护会话状态 | - |
| `config.return_record_limit` | integer | 否 | 返回记录数限制 | - |

**请求示例**:

```bash
curl -X POST "http://data-retrieval:9100/tools/knowledge_item" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "用户信息",
    "data_source": {
      "data_item_ids": ["ki_123", "ki_456"],
      "base_url": "https://example.com",
      "token": "your_token_here",
      "user_id": "user_123"
    },
    "config": {
      "return_record_limit": 10
    }
  }'
```

**响应示例**:

```json
{
  "output": [
    {
      "name": "用户信息",
      "comment": "知识条目描述",
      "type": "kv_dict",
      "items": [
        "用户ID: 001",
        "用户名: 张三",
        "邮箱: zhangsan@example.com"
      ],
      "data_summary": {
        "return_data_num": 2,
        "real_data_num": 10
      },
      "title": "用户信息"
    }
  ]
}
```

---

### 5.7 get_metadata - 获取数据源元数据工具

**工具名称**: `get_metadata`

**功能描述**: 获取数据视图和指标的元数据信息，支持从知识图谱(kg)和知识网络(kn)中获取数据源。可以同时获取数据视图和指标的元数据，也可以根据 `ds_type` 参数只获取其中一种类型的元数据。

**实现原理**: 工具支持多种数据源获取方式：
1. **直接指定**: 通过 `view_list` 和 `metric_list` 直接指定数据视图ID和指标ID列表
2. **知识图谱(kg)**: 从老版本的知识图谱中获取数据视图（kg 只能获取数据视图，不能获取指标）
3. **知识网络(kn)**: 从新版本的知识网络中获取数据视图和指标，支持通过查询语句检索相关的数据源

工具会根据配置的数据源类型，调用相应的数据源服务获取元数据信息，包括字段信息、类型信息、描述信息等。支持通过 `with_sample` 参数获取样例数据。

**关键参数说明**:
- `ds_type`: 数据源类型过滤参数，可选值: `data_view`（只获取数据视图）、`metric`（只获取指标）、`all` 或不指定（获取所有类型）。用于控制返回的数据源类型。
- `data_source_num_limit`: 数据源数量限制，-1表示不限制。用于控制从知识图谱或知识网络中获取的数据源数量，避免返回过多数据源。系统默认为 -1。
- `dimension_num_limit`: 维度数量限制，-1表示不限制。用于控制每个数据源返回的维度（字段）数量，避免返回过多字段。系统默认为 30。
- `with_sample`: 是否获取数据样例。当设置为 `true` 时，会在元数据中包含样例数据，帮助理解数据结构。默认值为 `false`。

**API 端点**: `POST /tools/get_metadata`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 | 默认值 |
|--------|------|------|--------|--------|
| `data_source.token` | 认证令牌，使用 `header.token`。默认为内部调用，无需填写 | 否 | `{{header.token}}` | - |
| `data_source.user_id` | 用户ID，必须设置，需要通过引用变量的方式配置成 `header.x-account-id`（新版本）或 `header.x-user`（老版本） | 是 | `{{header.x-account-id}}` 或 `{{header.x-user}}` | - |
| `data_source.account_type` | 调用者类型，`user` 代表普通用户，`app` 代表应用账号，`anonymous` 代表匿名用户 | 否 | `"user"` | `user` |
| `data_source.view_list` | 数据视图ID列表，直接指定要获取元数据的数据视图 | 否 | `["view_id_1", "view_id_2"]` | - |
| `data_source.metric_list` | 指标ID列表，直接指定要获取元数据的指标 | 否 | `["metric_id_1", "metric_id_2"]` | - |
| `data_source.kg` | 知识图谱配置参数（老版本），用于从知识图谱中获取数据源。注意：kg 只能获取数据视图（data_view），不能获取指标（metric） | 否 | `[{"kg_id": "129", "fields": ["regions", "comments"]}]` | - |
| `data_source.kn` | 知识网络配置参数（新版本），用于从知识网络中获取数据源。注意：kn 可以获取数据视图（data_view）和指标（metric） | 否 | `[{"knowledge_network_id": "kn_id_1"}]` | - |
| `data_source.search_scope` | 知识网络搜索范围，可选值: `object_types`, `relation_types`, `action_types` | 否 | `["object_types", "relation_types"]` | - |
| `data_source.recall_mode` | 召回模式，支持 `keyword_vector_retrieval`（默认）、`agent_intent_planning`、`agent_intent_retrieval` | 否 | `"keyword_vector_retrieval"` | `keyword_vector_retrieval` |
| `config.ds_type` | 数据源类型过滤，`data_view` 表示只获取数据视图，`metric` 表示只获取指标，`all` 或不指定则获取所有类型 | 否 | `"data_view"` | - |
| `config.with_sample` | 是否获取数据样例，默认: `false` | 否 | `true` | `false` |
| `config.data_source_num_limit` | 数据源数量限制，-1表示不限制，默认: `-1` | 否 | `10` | `-1` |
| `config.dimension_num_limit` | 维度数量限制，-1表示不限制，默认: `30` | 否 | `30` | `30` |
| `config.session_type` | 会话类型，可选值: `redis`, `in_memory`，默认: `redis` | 否 | `"redis"` | `redis` |
| `config.session_id` | 会话ID，用于维护会话状态 | 否 | `{{self_config.conversation_id}}` | - |

**注意**: 
- 此工具不依赖大语言模型，只需要配置数据源相关参数
- `user_id` 必须设置，新版本使用 `header.x-account-id`，老版本可能使用 `header.x-user`，用于权限控制和数据隔离
- `view_list`、`metric_list`、`kg` 和 `kn` 只需要配置一个或多个，工具会合并所有来源的数据源
- `kg` 只能获取数据视图，不能获取指标；`kn` 可以获取数据视图和指标，其中视图通过对象类获取，指标通过对象类的逻辑属性获取
- 如果设置了 `ds_type` 为 `metric`，则从 `kg` 获取的数据源会被跳过（因为 kg 只能获取数据视图）
- `query` 参数用于从知识网络中检索相关数据源，如果没有提供则使用默认值 "所有数据"

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `stream` | boolean | 否 | 是否流式返回，默认: `false`（**暂不支持**） | `false` |
| `mode` | string | 否 | 请求模式，可选值: `http`, `sse`，默认: `http`（**暂不支持**） | `http` |

**注意**: `stream` 和 `mode` 查询参数暂时还不支持，请勿使用。

**请求体参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `data_source` | object | 是 | 数据源配置信息 | - |
| `data_source.view_list` | array[string] | 否 | 数据视图ID列表 | - |
| `data_source.metric_list` | array[string] | 否 | 指标ID列表 | - |
| `data_source.base_url` | string | 否 | 服务器地址 | - |
| `data_source.token` | string | 否 | 认证令牌，默认为内部调用，无需填写 | - |
| `data_source.user_id` | string | 否 | 用户ID，新版本使用 `header.x-account-id`，老版本可能使用 `header.x-user` | - |
| `data_source.account_type` | string | 否 | 调用者的类型，`user` 代表普通用户，`app` 代表应用账号，`anonymous` 代表匿名用户，默认: `user` | `user` |
| `data_source.kg` | array[object] | 否 | 知识图谱配置参数（老版本），用于从知识图谱中获取数据源。注意：kg 只能获取数据视图（data_view），不能获取指标（metric） | - |
| `data_source.kg[].kg_id` | string | 是 | 知识图谱ID | - |
| `data_source.kg[].fields` | array[string] | 是 | 用户选中的实体字段列表 | - |
| `data_source.kn` | array[object] | 否 | 知识网络配置参数（新版本），用于从知识网络中获取数据源。注意：kn 可以获取数据视图（data_view）和指标（metric） | - |
| `data_source.kn[].knowledge_network_id` | string | 是 | 知识网络ID | - |
| `data_source.kn[].object_types` | array[string] | 否 | 知识网络对象类型 | - |
| `data_source.search_scope` | array[string] | 否 | 知识网络搜索范围，支持 `object_types`, `relation_types`, `action_types` | - |
| `data_source.recall_mode` | string | 否 | 召回模式，支持 `keyword_vector_retrieval`（默认）、`agent_intent_planning`、`agent_intent_retrieval`，默认: `keyword_vector_retrieval` | `keyword_vector_retrieval` |
| `config` | object | 否 | 工具配置参数 | - |
| `config.ds_type` | string | 否 | 数据源类型过滤，`data_view` 表示只获取数据视图，`metric` 表示只获取指标，`all` 或不指定则获取所有类型 | - |
| `config.with_sample` | boolean | 否 | 是否获取数据样例，默认: `false` | `false` |
| `config.data_source_num_limit` | integer | 否 | 数据源数量限制，-1表示不限制，默认: `-1` | `-1` |
| `config.dimension_num_limit` | integer | 否 | 维度数量限制，-1表示不限制，默认: `30` | `30` |
| `config.session_type` | string | 否 | 会话类型，可选值: `redis`, `in_memory`，默认: `redis` | `redis` |
| `config.session_id` | string | 否 | 会话ID，用于维护会话状态 | - |
| `query` | string | 否 | 查询语句，用于从知识网络中检索相关数据源 | - |
| `with_sample` | boolean | 否 | 是否获取数据样例（顶层参数，优先级高于 `config.with_sample`），默认: `false` | `false` |
| `timeout` | number | 否 | 请求超时时间（秒），超过此时间未完成则返回超时错误，默认120秒 | `120` |

**请求示例**:

```bash
# 示例1: 直接指定数据视图和指标
curl -X POST "http://data-retrieval:9100/tools/get_metadata" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "查询数据视图和指标的元数据",
    "data_source": {
      "view_list": ["view_id_1", "view_id_2"],
      "metric_list": ["metric_id_1", "metric_id_2"],
      "base_url": "https://example.com",
      "token": "your_token_here",
      "user_id": "user_123",
      "account_type": "user"
    },
    "config": {
      "with_sample": true,
      "data_source_num_limit": 10,
      "dimension_num_limit": 30,
      "ds_type": "all"
    }
  }'

# 示例2: 从知识图谱获取数据视图
curl -X POST "http://data-retrieval:9100/tools/get_metadata" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "查询用户相关的数据视图",
    "data_source": {
      "kg": [
        {
          "kg_id": "129",
          "fields": ["regions", "comments"]
        }
      ],
      "base_url": "https://example.com",
      "token": "your_token_here",
      "user_id": "user_123"
    },
    "config": {
      "ds_type": "data_view",
      "with_sample": false
    }
  }'

# 示例3: 从知识网络获取数据视图和指标
curl -X POST "http://data-retrieval:9100/tools/get_metadata" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "查询销售相关的数据视图和指标",
    "data_source": {
      "kn": [
        {
          "knowledge_network_id": "kn_id_1"
        }
      ],
      "search_scope": ["object_types", "relation_types"],
      "recall_mode": "keyword_vector_retrieval",
      "base_url": "https://example.com",
      "token": "your_token_here",
      "user_id": "user_123"
    },
    "config": {
      "ds_type": "all",
      "data_source_num_limit": 10,
      "dimension_num_limit": 30,
      "with_sample": true
    }
  }'
```

**响应示例**:

```json
{
  "data_view_metadata": {
    "view_id_1": {
      "id": "view_id_1",
      "name": "用户数据视图",
      "comment": "用户信息视图",
      "path": "catalog.schema.users",
      "fields": [
        {
          "name": "user_id",
          "type": "string",
          "comment": "用户ID"
        },
        {
          "name": "user_name",
          "type": "string",
          "comment": "用户名"
        }
      ]
    }
  },
  "metric_metadata": {
    "metric_id_1": {
      "id": "metric_id_1",
      "name": "销售额",
      "comment": "销售总额指标",
      "formula_config": {},
      "analysis_dimensions": [
        {
          "name": "日期",
          "type": "date"
        },
        {
          "name": "地区",
          "type": "string"
        }
      ]
    }
  },
  "data_view_summary": [
    {
      "name": "用户数据视图",
      "comment": "用户信息视图",
      "table_path": "catalog.schema.users"
    }
  ],
  "metric_summary": [
    {
      "name": "销售额",
      "comment": "销售总额指标",
      "id": "metric_id_1"
    }
  ],
  "title": "查询数据视图和指标的元数据"
}
```

**注意**: 
- 工具会返回 `data_view_metadata` 和 `metric_metadata` 两个字段，分别包含数据视图和指标的详细元数据信息
- `data_view_summary` 和 `metric_summary` 提供数据源摘要信息，便于快速了解数据源概况
- 如果设置了 `with_sample=true`，元数据中会包含样例数据
- 如果获取过程中出现错误，会在 `errors` 字段中返回错误信息列表，但不会中断整个流程
- 如果同时配置了多种数据源获取方式（如 `view_list`、`kg`、`kn`），工具会合并所有来源的数据源
- `ds_type` 参数用于过滤数据源类型，如果设置为 `data_view`，则只返回数据视图的元数据；如果设置为 `metric`，则只返回指标的元数据；如果设置为 `all` 或不设置，则返回所有类型的元数据

---

## 6. 沙箱工具详细说明

### 6.1 沙箱概述

沙箱是指 Linux 的虚拟运行环境，可以运行代码和系统命令，从而满足一些分析任务的要求。沙箱是一个临时运行环境，与 Agent Session 绑定，提供了隔离的执行环境，确保代码和命令的安全执行，同时支持文件操作、代码执行等复杂的数据分析任务。

**注意**: 为了安全性的考虑，沙箱中没有网络访问。

所有沙箱工具都支持以下通用参数：

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `server_url` | string | 否 | 沙箱服务器地址，默认在系统内部调用；无需配置，如果要调用外部沙箱，则需要配置 | - |
| `session_id` | string | 否 | 会话ID，用于维护沙箱会话状态 | - |
| `session_type` | string | 否 | 会话类型，可选值: `redis`, `in_memory`，默认: `redis` | `redis` |

### 6.2 execute_code - 执行代码工具

**工具名称**: `execute_code`

**功能描述**: 在沙箱环境中执行 Python 代码，支持 pandas 等数据分析库。注意沙箱环境是受限环境，没有网络连接，不能使用 pip 安装第三方库。

**实现原理**: 通过远程沙箱服务执行代码。工具将 Python 代码发送到独立的沙箱服务器（通常是 Docker 容器或类似隔离环境），在隔离的 Linux 环境中执行代码。沙箱环境预装了 Python3、pandas 等基础库，支持代码执行、变量提取、输出捕获等功能。每个会话（session）对应一个独立的沙箱工作区，支持文件持久化。

**API 端点**: `POST /tools/execute_code`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 | 默认值 |
|--------|------|------|--------|--------|
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` | - |
| `server_url` | 沙箱服务器地址，如果需要指定沙箱服务器地址，可以设置此参数 | 否 | `"http://sandbox-server:8080"` | - |

**注意**: 
- `session_id` 必须设置，用于确保沙箱会话和工具缓存的一致性

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `content` | string | 是 | 要执行的 Python 代码内容 | - |
| `filename` | string | 否 | 文件名，用于指定代码文件的名称，若不指定，则自动生成一个类似 `script_xxx.py` 的文件名 | - |
| `args` | array[string] | 否 | 代码执行参数 | - |
| `output_params` | array[string] | 否 | 输出参数列表，用于指定要返回的变量名 | - |

**请求示例**:

```bash
curl -X POST "http://data-retrieval:9100/tools/execute_code" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "import pandas as pd\nimport numpy as np\ndata = {\"x\": [1, 2, 3], \"y\": [4, 5, 6]}\ndf = pd.DataFrame(data)\nresult = df.sum().to_dict()",
    "filename": "data_analysis.py",
    "output_params": ["result"],
    "session_id": "test_session_123"
  }'
```

**响应示例**:

```json
{
  "action": "execute_code",
  "result": {
    "output": "",
    "variables": {
      "result": {"x": 6, "y": 15}
    }
  },
  "message": "代码执行成功"
}
```

---

### 6.3 execute_command - 执行命令工具

**工具名称**: `execute_command`

**功能描述**: 在沙箱环境中执行系统命令。

**实现原理**: 在沙箱环境的 Linux 系统中执行系统命令。通过沙箱服务的命令执行接口，在隔离环境中运行 Linux 命令（如 ls、cat、grep 等），捕获命令输出和退出码。命令执行在会话对应的工作目录中进行，支持参数传递和结果返回。

**API 端点**: `POST /tools/execute_command`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 |
|--------|------|------|--------|
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` |
| `server_url` | 沙箱服务器地址，如果需要指定沙箱服务器地址，可以设置此参数 | 否 | `"http://sandbox-server:8080"` |

**注意**: 
- `session_id` 必须设置，用于确保沙箱会话和工具缓存的一致性

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `command` | string | 是 | 要执行的命令 | - |
| `args` | array[string] | 否 | 命令参数列表 | - |

**请求示例**:

```bash
curl -X POST "http://data-retrieval:9100/tools/execute_command" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "ls",
    "args": ["-la"],
    "session_id": "test_session_123"
  }'
```

**响应示例**:

```json
{
  "action": "execute_command",
  "result": {
    "output": "total 8\ndrwxr-xr-x 2 user user 4096 Jan 1 12:00 .\n-rw-r--r-- 1 user user  1024 Jan 1 12:00 hello.py",
    "exit_code": 0
  },
  "message": "命令执行成功"
}
```

---

### 6.4 read_file - 读取文件工具

**工具名称**: `read_file`

**功能描述**: 读取沙箱环境中的文件内容。

**实现原理**: 通过沙箱服务的文件读取接口，从会话对应的工作目录中读取指定文件的内容。文件内容以字符串形式返回，支持文本文件和代码文件的读取。

**API 端点**: `POST /tools/read_file`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 |
|--------|------|------|--------|
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` |
| `server_url` | 沙箱服务器地址，如果需要指定沙箱服务器地址，可以设置此参数 | 否 | `"http://sandbox-server:8080"` |

**注意**: 
- `session_id` 必须设置，用于确保沙箱会话和工具缓存的一致性

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `filename` | string | 是 | 要读取的文件名 | - |

**请求示例**:

```bash
curl -X POST "http://data-retrieval:9100/tools/read_file" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "hello.py",
    "session_id": "test_session_123"
  }'
```

**响应示例**:

```json
{
  "action": "read_file",
  "result": "print('Hello World')",
  "message": "文件读取成功"
}
```

---

### 6.5 create_file - 创建文件工具

**工具名称**: `create_file`

**功能描述**: 在沙箱环境中创建文件。

**实现原理**: 通过沙箱服务的文件创建接口，在会话对应的工作目录中创建新文件并写入内容。文件会持久化保存在沙箱环境中，可以在后续操作中读取或执行。

**API 端点**: `POST /tools/create_file`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 |
|--------|------|------|--------|
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` |
| `server_url` | 沙箱服务器地址，如果需要指定沙箱服务器地址，可以设置此参数 | 否 | `"http://sandbox-server:8080"` |

**注意**: 
- `session_id` 必须设置，用于确保沙箱会话和工具缓存的一致性
- 如果通过 `result_cache_key` 从其他工具获取数据，确保缓存键有效即可

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `content` | string | 是 | 文件内容 | - |
| `filename` | string | 是 | 文件名 | - |

**请求示例**:

```bash
curl -X POST "http://data-retrieval:9100/tools/create_file" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
    "filename": "fibonacci.py",
    "session_id": "test_session_123"
  }'
```

**响应示例**:

```json
{
  "action": "create_file",
  "result": {
    "filename": "fibonacci.py",
    "size": 1024
  },
  "message": "文件创建成功"
}
```

---

### 6.6 list_files - 列出文件工具

**工具名称**: `list_files`

**功能描述**: 列出沙箱环境中的文件列表。

**实现原理**: 通过沙箱服务的文件列表接口，获取会话对应工作目录中的所有文件列表。返回文件名数组，用于查看当前工作区的文件情况。

**API 端点**: `POST /tools/list_files`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 | 默认值 |
|--------|------|------|--------|--------|
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` | - |
| `server_url` | 沙箱服务器地址，如果需要指定沙箱服务器地址，可以设置此参数 | 否 | `"http://sandbox-server:8080"` | - |

**注意**: 
- `session_id` 必须设置，用于确保沙箱会话和工具缓存的一致性

**请求参数**: 无特定参数，只需通用参数 `session_id`

**请求示例**:

```bash
curl -X POST "http://data-retrieval:9100/tools/list_files" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_session_123"
  }'
```

**响应示例**:

```json
{
  "action": "list_files",
  "result": [
    "hello.py",
    "fibonacci.py",
    "config.json"
  ],
  "message": "文件列表获取成功"
}
```

---

### 6.7 get_status - 获取状态工具

**工具名称**: `get_status`

**功能描述**: 获取沙箱环境的当前状态。

**实现原理**: 通过沙箱服务的状态查询接口，获取当前会话的沙箱环境状态信息，包括运行状态、文件数量、内存使用情况等。用于监控和调试沙箱环境。

**API 端点**: `POST /tools/get_status`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 | 默认值 |
|--------|------|------|--------|--------|
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` | - |
| `server_url` | 沙箱服务器地址，如果需要指定沙箱服务器地址，可以设置此参数 | 否 | `"http://sandbox-server:8080"` | - |

**注意**: 
- `session_id` 必须设置，用于确保沙箱会话和工具缓存的一致性

**请求参数**: 无特定参数，只需通用参数 `session_id`

**请求示例**:

```bash
curl -X POST "http://data-retrieval:9100/tools/get_status" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_session_123"
  }'
```

**响应示例**:

```json
{
  "action": "get_status",
  "result": {
    "status": "running",
    "session_id": "test_session_123",
    "files_count": 5,
    "memory_usage": "128MB"
  },
  "message": "沙箱状态获取成功"
}
```

---

### 6.8 close_sandbox - 关闭沙箱工具

**工具名称**: `close_sandbox`

**功能描述**: 关闭沙箱环境，清理工作区资源。

**实现原理**: 通过沙箱服务的清理接口，关闭当前会话对应的沙箱环境，清理工作目录中的所有文件，释放资源。用于在工作完成后清理临时文件和资源。

**API 端点**: `POST /tools/close_sandbox`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 | 默认值 |
|--------|------|------|--------|--------|
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` | - |
| `server_url` | 沙箱服务器地址，如果需要指定沙箱服务器地址，可以设置此参数 | 否 | `"http://sandbox-server:8080"` | - |

**注意**: 
- `session_id` 必须设置，用于确保沙箱会话和工具缓存的一致性

**请求参数**: 无特定参数，只需通用参数 `session_id`

**请求示例**:

```bash
curl -X POST "http://data-retrieval:9100/tools/close_sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_session_123"
  }'
```

**响应示例**:

```json
{
  "action": "close_sandbox",
  "result": {
    "status": "closed",
    "files_cleaned": 5
  },
  "message": "工作区清理成功"
}
```

---

### 6.9 download_from_efast - 从Efast下载文件工具

**工具名称**: `download_from_efast`

**功能描述**: 从文档库(EFAST)下载文件到沙箱环境，支持批量下载多个文件。

**实现原理**: 通过 EFAST 平台的文件下载接口，将指定文件下载到沙箱环境的工作目录中。支持从 EFAST 存储平台获取数据文件，便于在沙箱中进行数据分析处理。工具支持批量下载多个文件，每个文件需要提供完整的文档ID（docid）和文件名。

**API 端点**: `POST /tools/download_from_efast`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 | 默认值 |
|--------|------|------|--------|--------|
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` | - |
| `server_url` | 沙箱服务器地址，默认在系统内部调用；无需配置，如果要调用外部沙箱，则需要配置 | 否 | `"http://sandbox-server:8080"` | - |
| `efast_url` | EFAST服务器地址，可选，默认使用系统默认URL | 否 | `"https://efast.example.com"` | - |
| `token` | EFAST认证令牌，必须设置，使用 `header.token` | 是 | `{{header.token}}` | - |

**注意**: 
- `session_id` 必须设置，用于确保沙箱会话和工具缓存的一致性
- `token` 必须设置，与其他工具不同，此工具的 `token` 参数是必填的，用于 EFAST 认证
- `efast_url` 通常不需要配置，除非需要访问外部EFAST服务

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `file_params` | array[object] | 是 | 下载文件参数列表，格式为：`[{"id": "文档ID", "name": "文件名.docx", "details": {"docid": "gns://...", "size": 文件大小}}]` | - |
| `file_params[].id` | string | 否 | 文档ID | - |
| `file_params[].name` | string | 否 | 文件名 | - |
| `file_params[].details` | object | 是 | 文件详情 | - |
| `file_params[].details.docid` | string | 是 | 完整的文档ID，格式为 `gns://...` | - |
| `file_params[].details.size` | integer | 否 | 文件大小（字节） | - |
| `save_path` | string | 否 | 保存路径，可选，默认保存到会话目录 | - |
| `efast_url` | string | 否 | EFAST服务器地址，可选，默认使用系统默认URL | - |
| `timeout` | integer | 否 | 超时时间（秒），可选，默认300秒 | `300` |
| `token` | string | 是 | EFAST认证令牌，必须设置，用于 EFAST 认证。与其他工具不同，此工具的 `token` 参数是必填的 | - |

**请求示例**:

```bash
curl -X POST "http://data-retrieval:9100/tools/download_from_efast" \
  -H "Content-Type: application/json" \
  -d '{
    "file_params": [
      {
        "id": "5CB5AA515EBD4CB785918D43982FCE42",
        "name": "新能源汽车产业分析.docx",
        "details": {
          "docid": "gns://00328E97423F42AC9DEE87B4F4B4631E/83D893844A0B4A34A64DFFB343BEF416/5CB5AA515EBD4CB785918D43982FCE42",
          "size": 15635
        }
      }
    ],
    "save_path": "",
    "efast_url": "https://efast.example.com",
    "timeout": 300,
    "token": "Bearer your_token_here",
    "session_id": "test_session_123"
  }'
```

**响应示例**:

```json
{
  "action": "download_from_efast",
  "download_result": {
    "success": true,
    "files": [
      {
        "filename": "新能源汽车产业分析.docx",
        "size": 15635,
        "path": "/sandbox/test_session_123/新能源汽车产业分析.docx"
      }
    ],
    "message": "文件下载成功"
  },
  "title": "文件下载成功"
}
```

---

## 7. 知识网络工具详细说明

### 7.1 knowledge_retrieve - 知识网络检索工具

**工具名称**: `knowledge_retrieve`

**功能描述**: 基于知识网络的检索工具，实现五步检索流程：1. 获取业务知识网络列表 2. 使用LLM判断用户查询相关的知识网络 3. 获取知识网络详情 4. 使用LLM判断相关的对象类型 5. 构建最终的检索结果。支持两种模式：Schema召回模式（默认）和关键词上下文召回模式。

**实现原理**: 多步骤检索流程结合大语言模型。首先通过 HTTP 客户端获取知识网络列表，然后使用 LLM 判断哪些知识网络与查询相关；获取知识网络详情（包含对象类型和关系类型）后，再次使用 LLM 判断相关的对象类型和关系类型；最后构建检索结果，包含对象类型和关系类型的概念信息。支持会话管理，可以保存检索历史并在多轮对话中累积结果。

**关键参数说明**:
- `top_k`: 返回最相关的关系类型数量。注意：对象类型会根据选中的关系类型自动过滤，所以实际返回的对象类型数量可能小于或等于top_k*2（因为每个关系类型涉及2个对象类型：源对象和目标对象）
- `skip_llm`: 是否跳过LLM检索，直接使用前10个关系类型。设置为True时，将返回前10个关系类型和涉及的对象类型，确保高召回率
- `compact_format`: 是否返回紧凑格式。True返回紧凑格式（YAML格式文本，减少token数），False返回完整格式（JSON对象）
- `return_union`: 多轮检索时是否返回并集结果。True返回所有轮次的并集（默认），False只返回当前轮次新增的结果（增量结果），用于减少上下文长度
- `enable_keyword_context`: 是否启用关键词上下文召回。True：基于关键词召回上下文信息（需要先有schema）；False：只进行schema召回，不进行关键词上下文召回（默认）

**API 端点**: `POST /tools/knowledge_retrieve`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 | 默认值 |
|--------|------|------|--------|--------|
| `headers` | HTTP请求头，需要包含认证信息。使用 `header.token` 和 `header.x-account-id`（新版本）或 `header.x-user`（老版本），注意需要通过引用变量的方式配置成 `header.x-account-id` 或 `header.x-user` | 是 | `{"Authorization": "{{header.token}}", "x-account-id": "{{header.x-account-id}}"}` 或 `{"Authorization": "{{header.token}}", "x-user": "{{header.x-user}}"}` | - |
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` | - |
| `background` | 背景信息，用于提供额外的上下文信息 | 否 | `"背景说明文本"` | - |
| `session_type` | 会话类型，可选值: `redis`, `in_memory`，默认: `redis` | 否 | `"redis"` | `redis` |

**注意**: 
- 此工具需要使用大语言模型进行知识网络判断，但模型配置由系统内部管理
- 必须设置 `headers` 参数，包含认证令牌和用户ID
- `session_id` 必须设置，用于确保工具缓存的一致性
- 当 `enable_keyword_context=True` 时，`object_type_id` 参数必须提供，且需要先调用 `enable_keyword_context=False` 召回schema

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `query` | string | 是 | 用户查询问题（完整问题或关键词） | - |
| `top_k` | integer | 否 | 返回最相关的关系类型数量。注意：对象类型会根据选中的关系类型自动过滤，所以实际返回的对象类型数量可能小于或等于top_k*2 | `10` |
| `kn_ids` | array[object] | 是 | 指定的知识网络配置列表，必须传递，每个配置包含 `knowledge_network_id` 字段 | - |
| `kn_ids[].knowledge_network_id` | string | 是 | 知识网络ID | - |
| `additional_context` | string | 否 | 额外的上下文信息，用于二次检索时提供更精确的检索信息。当需要多轮召回使用时，当第一轮召回的结果用于下游任务时发现错误或查不到信息，就需要将问题query进行重写，然后额外提供对召回有任何帮助的上下文信息，越丰富越好 | - |
| `session_id` | string | 否 | 会话ID，用于维护多轮对话存储的历史召回记录。如果不提供，将自动生成一个随机ID | - |
| `skip_llm` | boolean | 否 | 是否跳过LLM检索，直接使用前10个关系类型。设置为True时，将返回前10个关系类型和涉及的对象类型，确保高召回率 | `true` |
| `compact_format` | boolean | 否 | 是否返回紧凑格式。True返回紧凑格式（YAML格式文本，减少token数），False返回完整格式（JSON对象） | `true` |
| `return_union` | boolean | 否 | 多轮检索时是否返回并集结果。True返回所有轮次的并集（默认），False只返回当前轮次新增的结果（增量结果），用于减少上下文长度 | `false` |
| `enable_keyword_context` | boolean | 否 | 是否启用关键词上下文召回。True：基于关键词召回上下文信息（需要先有schema）；False：只进行schema召回，不进行关键词上下文召回（默认） | `false` |
| `object_type_id` | string | 否* | 对象类型ID，用于指定关键词所属的对象类型。当 `enable_keyword_context=True` 时，此参数必须提供。例如：'person'、'disease'等 | - |

**请求示例**:

**示例1: Schema召回模式（默认）**

```bash
curl -X POST "http://data-retrieval:9100/tools/knowledge_retrieve" \
  -H "Content-Type: application/json" \
  -H "x-account-id: user_123" \
  -d '{
    "query": "查询化工企业使用的催化剂信息",
    "top_k": 10,
    "kn_ids": [
      {
        "knowledge_network_id": "129"
      }
    ],
    "session_id": "test_session_123",
    "compact_format": true,
    "return_union": false
  }'
```

**示例2: 关键词上下文召回模式**

```bash
curl -X POST "http://data-retrieval:9100/tools/knowledge_retrieve" \
  -H "Content-Type: application/json" \
  -H "x-account-id: user_123" \
  -d '{
    "query": "催化剂",
    "kn_ids": [
      {
        "knowledge_network_id": "129"
      }
    ],
    "session_id": "test_session_123",
    "enable_keyword_context": true,
    "object_type_id": "catalyst"
  }'
```

**响应示例**:

**紧凑格式响应（compact_format=true）**:

```json
{
  "objects": "objects:\n  obj_123:\n    name: 用户\n    properties:\n    - name: user_id\n      display_name: 用户ID\n      type: string\n      comment: 用户的唯一标识符\n",
  "relations": "relations:\n  rel_456:\n    name: 属于\n    from: obj_123\n    to: obj_789\n"
}
```

**完整格式响应（compact_format=false）**:

```json
{
  "object_types": [
    {
      "concept_type": "object_type",
      "concept_id": "obj_123",
      "concept_name": "用户",
      "properties": [
        {
          "name": "user_id",
          "display_name": "用户ID",
          "type": "string",
          "comment": "用户的唯一标识符",
          "condition_operations": ["=", "!=", "in", "not in"]
        }
      ],
      "primary_key_field": "user_id"
    }
  ],
  "relation_types": [
    {
      "concept_type": "relation_type",
      "concept_id": "rel_456",
      "concept_name": "属于",
      "source_object_type_id": "obj_123",
      "target_object_type_id": "obj_789"
    }
  ]
}
```

**关键词上下文召回响应（enable_keyword_context=true）**:

```json
{
  "keyword_context": {
    "context": "相关的上下文信息...",
    "matched_properties": ["property1", "property2"]
  }
}
```

**注意**: 
- 紧凑格式返回YAML格式的文本，可以减少token数量，适合传递给大模型
- 完整格式返回结构化的JSON对象，包含详细的属性信息
- 对象类型包含 `properties` 字段（属性列表）和 `primary_key_field` 字段（主键字段名）
- 关系类型包含 `source_object_type_id` 和 `target_object_type_id` 字段
- 对象类型不包含 `source_object_type_id` 和 `target_object_type_id` 字段

---

### 7.2 knowledge_rerank - 知识网络概念重排序工具

**工具名称**: `knowledge_rerank`

**功能描述**: 基于大模型的概念重排序工具，支持对概念进行重排序，过滤掉与问题无关的概念。支持两种重排序方法：LLM重排序和向量重排序。

**实现原理**: 使用大语言模型或向量模型对概念列表进行重排序和过滤。工具将用户问题和概念列表（包含概念类型、名称、描述等信息）构建成 prompt，让 LLM 或向量模型判断哪些概念与问题相关，并按照相关性排序。支持批量处理大量概念（默认批次大小128），通过分批处理避免 token 限制。LLM 返回相关概念的索引列表，工具根据索引重新排序概念并分配相关性分数。

**关键参数说明**:
- `query_understanding`: 查询理解结果对象，包含原始查询、处理后的查询和意图列表
- `action`: 重排序方法，可选值: `llm`（使用大语言模型重排序，默认）、`vector`（使用向量模型重排序）
- `batch_size`: 批处理大小，用于控制每次处理的概念数量，避免token超限，默认值为128

**API 端点**: `POST /tools/knowledge_rerank`

**Data Agent 配置**:

| 配置项 | 说明 | 必填 | 示例值 | 默认值 |
|--------|------|------|--------|--------|
| `session_id` | 会话ID，必须设置，使用 `self_config.conversation_id`。确保工具缓存和沙箱 id 的一致性 | 是 | `{{self_config.conversation_id}}` | - |
| `inner_llm` | 平台内部大模型配置，用于访问内部模型工厂中接入的模型。在 Agent 工厂中选择平台内部模型。当 `action=llm` 时需要配置 | 否 | - | - |
| `llm` | 外部大模型配置。如需使用外部模型（如 OpenAI），需要配置此参数。当 `action=llm` 时需要配置 | 否 | `{"model_name": "gpt-4", "openai_api_key": "xxx"}` | - |
| `background` | 背景信息，用于提供额外的上下文信息 | 否 | `"背景说明文本"` | - |
| `session_type` | 会话类型，可选值: `redis`, `in_memory`，默认: `redis` | 否 | `"redis"` | `redis` |

**注意**: 
- 当 `action=llm` 时，需要使用大语言模型进行概念重排序，必须配置 `inner_llm` 或 `llm` 其中之一
- 当 `action=vector` 时，使用向量模型重排序，不需要配置LLM
- 推荐使用平台内部模型（`inner_llm`），配置更简单且性能稳定
- `session_id` 必须设置，用于确保工具缓存的一致性

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `query_understanding` | object | 是 | 查询理解结果对象 | - |
| `query_understanding.origin_query` | string | 是 | 原始查询问题 | - |
| `query_understanding.processed_query` | string | 是 | 处理后的查询问题 | - |
| `query_understanding.intent` | array[object] | 否 | 意图列表，可选。每个意图包含 `query_segment`（查询片段）、`confidence`（置信度）、`reasoning`（推理说明）、`related_concepts`（相关概念）等字段 | `[]` |
| `concepts` | array[object] | 是 | 概念列表，每个概念包含 `concept_type`、`concept_id`、`concept_name`、`concept_detail` 等字段 | - |
| `concepts[].concept_type` | string | 是 | 概念类型，可选值: `object_type`、`relation_type` | - |
| `concepts[].concept_id` | string | 是 | 概念ID | - |
| `concepts[].concept_name` | string | 是 | 概念名称 | - |
| `concepts[].concept_detail` | object | 否 | 概念详情，包含 `comment`、`data_properties` 等字段 | - |
| `action` | string | 否 | 重排序方法，可选值: `llm`（使用大语言模型重排序）、`vector`（使用向量模型重排序），默认: `llm` | `llm` |
| `batch_size` | integer | 否 | 批处理大小，用于控制每次处理的概念数量，避免token超限，默认: `128` | `128` |

**请求示例**:

**示例1: LLM重排序（默认）**

```bash
curl -X POST "http://data-retrieval:9100/tools/knowledge_rerank" \
  -H "Content-Type: application/json" \
  -d '{
    "query_understanding": {
      "origin_query": "查询用户信息",
      "processed_query": "查询用户信息",
      "intent": [
        {
          "query_segment": "用户信息",
          "confidence": 0.9,
          "reasoning": "用户想要查询用户相关的信息",
          "related_concepts": [
            {
              "concept_name": "用户"
            }
          ]
        }
      ]
    },
    "concepts": [
      {
        "concept_type": "object_type",
        "concept_id": "obj_123",
        "concept_name": "用户",
        "concept_detail": {
          "comment": "用户相关信息",
          "data_properties": [
            {
              "comment": "用户ID属性"
            }
          ]
        }
      },
      {
        "concept_type": "relation_type",
        "concept_id": "rel_456",
        "concept_name": "属于",
        "concept_detail": {}
      }
    ],
    "action": "llm",
    "batch_size": 128
  }'
```

**示例2: 向量重排序**

```bash
curl -X POST "http://data-retrieval:9100/tools/knowledge_rerank" \
  -H "Content-Type: application/json" \
  -d '{
    "query_understanding": {
      "origin_query": "查询用户信息",
      "processed_query": "查询用户信息",
      "intent": []
    },
    "concepts": [
      {
        "concept_type": "object_type",
        "concept_id": "obj_123",
        "concept_name": "用户",
        "concept_detail": {
          "comment": "用户相关信息"
        }
      }
    ],
    "action": "vector",
    "batch_size": 128
  }'
```

**响应示例**:

```json
{
  "reranked_concepts": [
    {
      "concept_type": "object_type",
      "concept_id": "obj_123",
      "concept_name": "用户",
      "concept_detail": {
        "comment": "用户相关信息"
      },
      "score": 1.0,
      "rank": 1
    },
    {
      "concept_type": "relation_type",
      "concept_id": "rel_456",
      "concept_name": "属于",
      "concept_detail": {},
      "score": 0.5,
      "rank": 2
    }
  ],
  "filtered_count": 2
}
```

**响应字段说明**:
- `reranked_concepts`: 重排序后的概念列表，按照相关性从高到低排序
- `reranked_concepts[].score`: 相关性分数，范围0-1，分数越高表示与问题越相关
- `reranked_concepts[].rank`: 排序位置，从1开始，1表示最相关
- `filtered_count`: 过滤后的概念数量（即返回的概念数量）

---

## 8. 通用配置说明

### 8.1 数据源配置 (data_source)

多个工具都使用 `data_source` 对象来配置数据源，常见字段包括：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `base_url` | string | 服务器地址 |
| `token` | string | 认证令牌 |
| `user_id` | string | 用户ID，新版本使用 `header.x-account-id`，老版本可能使用 `header.x-user` |
| `account_type` | string | 调用者类型，`user` 代表普通用户，`app` 代表应用账号，`anonymous` 代表匿名用户 |
| `view_list` | array[string] | 数据视图ID列表 |
| `kg` | array[object] | 知识图谱配置参数列表 |
| `kn` | array | 知识网络配置参数 |
| `kn_entry` | array | 知识条目配置参数 |
| `search_scope` | array[string] | 搜索范围 |
| `recall_mode` | string | 召回模式 |

**重要说明**:
- **对于大多数工具**（如 `text2sql`、`text2metric`、`sql_helper`）: `view_list`、`kg` 和 `kn` 只需要配置一个，不能同时配置多个
  - **`view_list`**: 如果设置了 `view_list`，说明直接查询视图，不需要设置 `data_source.kg` 和 `data_source.kn`
  - **`kg`**: 老版本的业务知识网络（知识图谱）相关的信息，通过 Data Agent 的 `self_config.data_source.kg` 配置
  - **`kn`**: 新版本的业务知识网络（本体引擎）相关的信息，通过 Data Agent 的 `self_config.data_source.knowledge_network` 配置
- **对于 `get_metadata` 工具**: 支持同时配置多种数据源获取方式（`view_list`、`metric_list`、`kg`、`kn`），工具会合并所有来源的数据源
  - **`view_list`**: 直接指定数据视图ID列表
  - **`metric_list`**: 直接指定指标ID列表
  - **`kg`**: 从知识图谱中获取数据视图（kg 只能获取数据视图，不能获取指标）
  - **`kn`**: 从知识网络中获取数据视图和指标
- **`kn_entry`**: 知识条目的配置，通过 Data Agent 的 `self_config.data_source.kn_entry` 配置

### 8.2 LLM配置 (llm / inner_llm)

#### 8.2.1 inner_llm 配置

`inner_llm` 用于访问内部模型工厂中接入的模型。在 Data Agent 中配置时，通过 Agent 工厂选择平台内部模型即可。

如果需要通过 Postman 等工具直接调用工具 API，`inner_llm` 参数格式如下：

```json
{
  "inner_llm": {
    "id": "1935601639213895680",
    "name": "doubao-seed-1.6-flash",
    "max_tokens": 1000,
    "temperature": 1,
    "top_k": 1,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0
  }
}
```

**参数说明**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | string | 模型ID，内部模型工厂中模型的唯一标识 |
| `name` | string | 模型名称 |
| `max_tokens` | integer | 最大token数 |
| `temperature` | number | 温度参数，控制输出的随机性 |
| `top_k` | integer | Top-K参数 |
| `top_p` | number | Top-P参数 |
| `frequency_penalty` | number | 频率惩罚，减少重复内容 |
| `presence_penalty` | number | 存在惩罚，鼓励新话题 |

#### 8.2.2 llm 配置（外部模型）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `model_name` | string | 模型名称 |
| `openai_api_key` | string | API密钥 |
| `openai_api_base` | string | API地址 |
| `max_tokens` | integer | 最大token数 |
| `temperature` | number | 温度参数 |
| `top_k` | integer | Top-K参数 |
| `top_p` | number | Top-P参数 |
| `frequency_penalty` | number | 频率惩罚 |
| `presence_penalty` | number | 存在惩罚 |

### 8.3 工具配置 (config)

`config` 对象用于配置工具的行为参数，不同工具支持的配置项可能不同。以下是常见的配置项：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `background` | string | 背景信息，用于提供额外的上下文信息 |
| `session_type` | string | 会话类型，可选值: `redis`, `in_memory` |
| `session_id` | string | 会话ID，用于维护会话状态 |
| `return_record_limit` | integer | 返回记录数限制，控制返回数据的最大记录数。SQL 执行后返回数据条数限制，-1表示不限制，原因是SQL执行后返回大量数据，可能导致大模型上下文token超限 |
| `return_data_limit` | integer | 返回数据大小限制（字节数），控制返回数据的最大大小。SQL 执行后返回数据总量限制，单位是字节，-1表示不限制，原因是SQL执行后返回大量数据，可能导致大模型上下文token超限 |
| `force_limit` | integer | 强制限制查询的行数，在查询执行前限制返回的数据条数。对于 text2sql，是生成的 SQL 的 LIMIT 子句限制；对于 text2metric，是查询指标时如果没有设置返回数据条数限制，则采用该参数设置的值作为限制；对于 sql_helper，**仅在 `execute_sql` 命令时有效**，工具会将原始SQL包装为子查询并添加 LIMIT 子句，默认值为 200 |
| `view_num_limit` | integer | 传给大模型的视图数量限制。对于 text2sql，是给大模型选择时引用视图数量限制；对于 sql_helper，**仅在 `get_metadata` 命令时有效**，是获取元数据时引用视图数量限制。-1表示不限制，原因是数据源包含大量视图，可能导致大模型上下文token超限，内置的召回算法会自动筛选最相关的视图。默认值通常为 5。**注意：对于 sql_helper，在 `execute_sql` 命令时无效，因为工具会严格执行 SQL，不会限制视图数量** |
| `dimension_num_limit` | integer | 传给大模型的维度数量限制。对于 text2sql，是给大模型选择时维度数量限制；对于 sql_helper，**仅在 `get_metadata` 命令时有效**，是获取元数据时维度数量限制。-1表示不限制，系统默认为 30。**注意：对于 sql_helper，在 `execute_sql` 命令时无效，因为工具会严格执行 SQL，不会限制维度数量** |
| `data_source_num_limit` | integer | 数据源数量限制，**仅在 `get_metadata` 工具中有效**。用于控制从知识图谱或知识网络中获取的数据源数量，-1表示不限制，默认值为 -1。工具内部会通过召回机制自动筛选最相关的数据源 |
| `ds_type` | string | 数据源类型过滤，**仅在 `get_metadata` 工具中有效**。可选值: `data_view`（只获取数据视图）、`metric`（只获取指标）、`all` 或不指定（获取所有类型）。用于控制返回的数据源类型 |
| `with_sample` | boolean | 是否包含样例数据，用于元数据获取时是否返回样例数据。sql_helper 工具和 get_metadata 工具中用于控制获取元数据时是否包含样例数据 |

**配置说明**:
- `view_num_limit` 和 `dimension_num_limit` 是用于控制传给大模型的数据量，避免 token 超限的关键参数
- 如果数据源包含大量视图或视图包含大量字段，建议适当降低这两个参数的值
- 工具内部会通过召回机制自动筛选最相关的视图和维度，确保传入大模型的数据量在合理范围内

---

## 9. 错误码和错误处理

### 9.1 错误响应格式

所有工具在出错时都会返回标准的错误响应格式。错误响应包含以下字段：

```json
{
  "code": "错误码",
  "status": 500,
  "reason": "错误原因",
  "detail": "详细错误信息"
}
```

### 9.2 错误码列表

系统定义了以下错误码：

| 错误码 | 说明 | 常见场景 |
|--------|------|----------|
| `DataSourceError` | 数据源错误 | 数据源配置错误、连接失败、数据源未初始化 |
| `ExecuteSqlError` | SQL执行错误 | SQL语法错误、SQL执行失败、数据库连接问题 |
| `Text2MetricError` | 指标查询错误 | 指标ID不存在、指标查询参数错误 |
| `Text2DIPMetricError` | DIP指标查询错误 | DIP指标查询失败、指标参数错误 |
| `Json2PlotError` | 图表配置错误 | 图表类型不支持、数据字段不匹配、分组字段错误 |
| `ResultParseError` | 结果解析错误 | LLM返回结果格式错误、JSON解析失败 |
| `SDKRequestError` | SDK请求错误 | SDK调用失败、网络请求错误 |
| `OpenSearchRequestError` | OpenSearch请求错误 | OpenSearch查询失败、索引不存在 |
| `KnowledgeEnhancedError` | 知识增强错误 | 知识增强工具调用失败 |
| `PythonCodeError` | Python代码执行错误 | 代码语法错误、运行时异常 |
| `ToolFatalError` | 工具致命错误 | 工具初始化失败、不可恢复的错误 |
| `SandboxError` | 沙箱错误 | 沙箱环境错误、代码执行失败、文件操作失败 |
| `SQLHelperError` | SQL辅助工具错误 | SQL执行失败、元数据获取失败 |
| `KnowledgeItemError` | 知识条目错误 | 知识条目检索失败 |

### 9.3 常见错误类型和处理

#### 9.3.1 参数错误

**错误码**: `DataSourceError` 或 `Json2PlotError`

**常见原因**:
- 缺少必填参数
- 参数格式不正确
- 参数值超出允许范围

**示例**:
```json
{
  "code": "Json2PlotError",
  "status": 500,
  "reason": "配置字段与实际数据不匹配",
  "detail": "配置字段与实际数据不匹配: 销售额，请告诉用户绘图失败"
}
```

**处理建议**:
- 检查请求参数是否完整
- 验证参数格式是否符合API文档要求
- 确认参数值是否在有效范围内

#### 9.3.2 数据源错误

**错误码**: `DataSourceError`

**常见原因**:
- 数据源未初始化
- 数据源连接失败
- 用户ID或token无效
- 视图ID不存在

**示例**:
```json
{
  "code": "DataSourceError",
  "status": 500,
  "reason": "数据源为空，请先设置数据源",
  "detail": "数据源为空，请先设置数据源"
}
```

**处理建议**:
- 检查数据源配置是否正确
- 验证用户ID和token是否有效
- 确认视图ID是否存在
- 检查网络连接是否正常

#### 9.3.3 SQL执行错误

**错误码**: `ExecuteSqlError` 或 `SQLHelperError`

**常见原因**:
- SQL语法错误
- 表或字段不存在
- 权限不足
- 数据库连接失败

**示例**:
```json
{
  "code": "ExecuteSqlError",
  "status": 500,
  "reason": "SQL 执行错误",
  "detail": "SQL 执行错误: 表 'users' 不存在"
}
```

**处理建议**:
- 检查SQL语法是否正确
- 验证表名和字段名是否存在
- 确认用户是否有执行权限
- 检查数据库连接状态

#### 9.3.4 指标查询错误

**错误码**: `Text2MetricError` 或 `Text2DIPMetricError`

**常见原因**:
- 指标ID不存在
- 指标查询参数错误
- 时间范围无效
- 过滤条件错误

**示例**:
```json
{
  "code": "Text2DIPMetricError",
  "status": 500,
  "reason": "处理查询失败，已重试 3 次",
  "detail": {
    "error_1": "指标ID为空",
    "error_2": "指标查询参数错误"
  }
}
```

**处理建议**:
- 检查指标ID是否正确
- 验证查询参数格式
- 确认时间范围是否有效
- 检查过滤条件是否正确

#### 9.3.5 图表配置错误

**错误码**: `Json2PlotError`

**常见原因**:
- 图表类型不支持
- 数据字段不存在
- 分组字段与数据不匹配
- 数据为空

**示例**:
```json
{
  "code": "Json2PlotError",
  "status": 500,
  "reason": "配置字段与实际数据不匹配",
  "detail": "配置字段与实际数据不匹配: 销售额，请告诉用户绘图失败"
}
```

**处理建议**:
- 检查图表类型是否支持（Pie、Line、Column）
- 验证数据字段是否存在
- 确认分组字段与数据匹配
- 检查数据是否为空

#### 9.3.6 沙箱错误

**错误码**: `SandboxError`

**常见原因**:
- 代码执行失败
- 文件操作失败
- 沙箱环境异常
- 命令执行失败

**示例**:
```json
{
  "code": "SandboxError",
  "status": 500,
  "reason": "代码执行失败",
  "detail": "退出码: 1, 错误信息: NameError: name 'undefined_var' is not defined"
}
```

**处理建议**:
- 检查代码语法是否正确
- 验证代码中使用的变量和函数是否存在
- 确认文件路径是否正确
- 检查命令参数是否正确

### 9.4 错误处理最佳实践

1. **错误重试**: 对于临时性错误（如网络错误），可以实现重试机制
2. **错误日志**: 记录详细的错误信息，包括错误码、原因和详细信息
3. **用户提示**: 向用户提供友好的错误提示，避免暴露技术细节
4. **错误分类**: 根据错误码进行错误分类处理，不同错误码采用不同的处理策略
5. **错误恢复**: 对于可恢复的错误，提供重试或替代方案
6. **错误监控**: 监控错误发生频率，及时发现系统问题

---

## 10. 最佳实践

### 10.1 Data Agent 配置最佳实践

1. **会话ID统一配置**: 
   - 所有工具的 `session_id` 必须统一使用 `{{self_config.conversation_id}}`，确保工具缓存和沙箱 id 的一致性
   - 这样可以保证同一会话内的工具能够共享缓存数据，避免重复计算

2. **数据源配置选择**:
   - **对于大多数工具**（如 `text2sql`、`text2metric`、`sql_helper`）: `view_list`、`kg` 和 `kn` 只需要配置一个，不能同时配置多个
     - 如果直接查询视图，使用 `view_list`，不需要配置 `kg` 和 `kn`
     - 使用知识图谱时，通过 `self_config.data_source.kg` 配置 `kg` 参数
     - 使用本体引擎时，通过 `self_config.data_source.knowledge_network` 配置 `kn` 参数
   - **对于 `get_metadata` 工具**: 支持同时配置多种数据源获取方式（`view_list`、`metric_list`、`kg`、`kn`），工具会合并所有来源的数据源
     - 可以直接指定数据视图和指标列表
     - 可以从知识图谱和知识网络中获取数据源
     - 使用 `ds_type` 参数可以过滤只获取特定类型的数据源（数据视图或指标）

3. **用户ID和认证配置**:
   - `data_source.user_id` 必须设置，新版本需要通过引用变量的方式配置成 `header.x-account-id`，使用 `{{header.x-account-id}}`，老版本可能使用 `header.x-user`，使用 `{{header.x-user}}`，用于权限控制和数据隔离
   - `data_source.token` 使用 `{{header.token}}`，默认为内部调用，无需填写

4. **大模型配置**:
   - 推荐使用平台内部模型（`inner_llm`），用于访问内部模型工厂中接入的模型，在 Agent 工厂中选择平台内部模型，配置更简单且性能稳定
   - 如需使用外部模型（如 OpenAI），需要配置 `llm` 参数
   - 如果通过 Postman 等工具直接调用工具 API，需要按照 `inner_llm` 的参数格式进行配置（详见"通用配置说明"部分的 LLM 配置）

5. **Token 控制配置**:
   - 对于包含大量视图或字段的数据源，建议配置 `config.view_num_limit` 和 `config.dimension_num_limit`
   - `view_num_limit` 建议值：5（默认），如果视图数量较少可以适当增加
   - `dimension_num_limit` 建议值：30（默认），如果字段数量较少可以适当增加
   - 工具内部会通过召回机制自动筛选最相关的视图和维度，避免 token 超限

6. **工具链配置**:
   - 合理使用 `tool_result_cache_key` 来复用之前工具的结果，避免重复查询
   - 例如：`text2sql` → `json2plot`，`text2metric` → `sandbox create_file`
   - 确保工具链中的 `session_id` 保持一致

### 10.2 通用最佳实践

7. **会话管理**: 对于需要维护状态的工具（如沙箱工具），建议使用相同的 `session_id` 来复用会话

8. **错误重试**: 对于临时性错误，可以实现重试机制

9. **参数验证**: 在调用前验证参数格式和内容

10. **资源清理**: 使用完毕后及时清理资源（如关闭沙箱）

11. **日志记录**: 记录重要的 API 调用和响应，便于调试和监控

12. **批量操作**: 对于需要处理大量数据的场景，考虑使用批量接口或分批处理

13. **缓存利用**: 合理使用 `tool_result_cache_key` 来复用之前工具的结果

