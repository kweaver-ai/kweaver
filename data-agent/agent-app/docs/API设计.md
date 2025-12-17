# API 设计文档

## 概述

Agent-App 提供基于 RESTful 的 API 接口，支持智能对话、会话管理、调试等功能。所有 API 都需要身份验证，使用 Bearer Token 进行授权。

## 基础信息

- **Base URL**: `http://localhost:30777/api/agent-app/v1`
- **认证方式**: Bearer Token
- **数据格式**: JSON
- **流式支持**: Server-Sent Events (SSE)

## 认证和授权

### 请求头

```http
Authorization: Bearer {token}
Content-Type: application/json
```

### 用户类型

- **实名用户**: 个人用户身份
- **应用用户**: 第三方应用身份
- **匿名用户**: 临时访问身份

## API 端点

### 1. 对话接口

#### POST /app/{app_key}/api/chat/completion

智能对话接口，支持流式和非流式响应。

**路径参数:**
- `app_key` (string, required): Agent App Key

**请求体:**
```json
{
  "agent_id": "string",
  "agent_version": "string",
  "stream": true,
  "inc_stream": true,
  "conversation_id": "string",
  "temporary_area_id": "string",
  "temp_files": [
    {
      "id": "string",
      "type": "doc",
      "name": "string"
    }
  ],
  "query": "string",
  "custom_querys": {},
  "tool": {
    "session_id": "string",
    "tool_name": "string",
    "tool_args": [
      {
        "key": "string",
        "value": "string",
        "type": "string"
      }
    ]
  },
  "interrupted_assistant_message_id": "string",
  "chat_mode": "normal | deep_thinking",
  "confirm_plan": true,
  "regenerate_user_message_id": "string",
  "regenerate_assistant_message_id": "string",
  "history": [
    {
      "role": "user | assistant",
      "content": "string"
    }
  ],
  "llm_config": {
    "id": "string",
    "name": "string",
    "model_type": "string",
    "temperature": 0.7,
    "top_p": 0.9,
    "top_k": 50,
    "frequency_penalty": 0,
    "presence_penalty": 0,
    "max_tokens": 2048
  },
  "data_source": {
    "kg": [
      {
        "kg_id": "string",
        "fields": ["string"],
        "field_properties": {},
        "output_fields": ["string"]
      }
    ],
    "doc": [
      {
        "ds_id": "string",
        "fields": [
          {
            "name": "string",
            "path": "string",
            "source": "string"
          }
        ],
        "datasets": ["string"]
      }
    ],
    "advanced_config": {
      "kg": {
        "text_match_entity_nums": 50,
        "vector_match_entity_nums": 50,
        "graph_rag_topk": 20,
        "long_text_length": 100,
        "reranker_sim_threshold": 0.5,
        "retrieval_max_length": 4000
      },
      "doc": {
        "retrieval_slices_num": 100,
        "max_slice_per_cite": 10,
        "rerank_topk": 20,
        "slice_head_num": 2,
        "slice_tail_num": 2,
        "documents_num": 5,
        "document_threshold": 0.5,
        "retrieval_max_length": 4000
      }
    }
  }
}
```

**参数详细说明**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `agent_id` | string | 是 | Agent的唯一标识符 |
| `agent_version` | string | 否 | Agent版本，默认为"latest" |
| `stream` | boolean | 否 | 是否启用流式响应，默认为true |
| `inc_stream` | boolean | 否 | 是否启用增量流式，默认为true |
| `conversation_id` | string | 否 | 会话ID，用于多轮对话 |
| `temporary_area_id` | string | 否 | 临时区域ID，用于文件管理 |
| `temp_files` | array | 否 | 临时文件列表 |
| `query` | string | 是 | 用户输入的查询内容 |
| `custom_querys` | object | 否 | 自定义查询参数 |
| `tool` | object | 否 | 工具调用配置 |
| `interrupted_assistant_message_id` | string | 否 | 中断的助手消息ID |
| `chat_mode` | string | 否 | 对话模式：normal/deep_thinking |
| `confirm_plan` | boolean | 否 | 是否确认计划，默认为true |
| `regenerate_user_message_id` | string | 否 | 重新生成的用户消息ID |
| `regenerate_assistant_message_id` | string | 否 | 重新生成的助手消息ID |
| `history` | array | 否 | 历史对话记录 |
| `llm_config` | object | 否 | 大模型配置 |
| `data_source` | object | 否 | 数据源配置 |

**temp_files 参数说明**:
- `id`: 文件唯一标识
- `type`: 文件类型（doc、image、audio等）
- `name`: 文件名称

**tool 参数说明**:
- `session_id`: 工具会话ID
- `tool_name`: 工具名称
- `tool_args`: 工具参数列表

**llm_config 参数说明**:
- `id`: 模型ID
- `name`: 模型名称
- `model_type`: 模型类型
- `temperature`: 温度参数，控制生成随机性
- `top_p`: top-p采样参数
- `top_k`: top-k采样参数
- `frequency_penalty`: 频率惩罚
- `presence_penalty`: 存在惩罚
- `max_tokens`: 最大生成token数

**响应 (流式):**
```
event: message
data: {"conversation_id": "string", "user_message_id": "string", "assistant_message_id": "string", "message": {...}}

event: end
data: {}
```

**响应 (非流式):**
```json
{
  "conversation_id": "string",
  "user_message_id": "string",
  "assistant_message_id": "string",
  "message": {
    "id": "string",
    "conversation_id": "string",
    "role": "assistant",
    "content": {
      "text": "string",
      "temp_files": [
        {
          "id": "string",
          "name": "string",
          "type": "string"
        }
      ],
      "final_answer": {
        "query": "string",
        "answer": {
          "text": "string",
          "cites": {},
          "ask": {}
        },
        "temp_files": [],
        "thinking": "string",
        "skill_process": [
          {
            "agent_name": "string",
            "text": "string",
            "cites": {},
            "status": "string",
            "type": "string",
            "thinking": "string",
            "input_message": {},
            "interrupted": false,
            "related_queries": [
              {
                "query": "string"
              }
            ]
          }
        ]
      },
      "middle_answer": [
        {
          "doc_retrieval": "string",
          "graph_retrieval": "string",
          "middle_output_vars": []
        }
      ]
    },
    "content_type": "string",
    "status": "string",
    "reply_id": "string",
    "agent_info": {
      "agent_id": "string",
      "agent_name": "string",
      "agent_status": "string",
      "agent_version": "string"
    },
    "index": 0
  },
  "status": "string"
}
```

**响应参数说明**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `conversation_id` | string | 会话ID，用于关联多轮对话 |
| `user_message_id` | string | 用户消息ID，唯一标识用户输入 |
| `assistant_message_id` | string | 助手消息ID，唯一标识助手回复 |
| `message` | object | 完整的消息详情对象 |
| `status` | string | 响应状态（success/failed） |

**message 参数说明**:
- `id`: 消息唯一标识符
- `conversation_id`: 所属会话ID
- `role`: 消息角色（user/assistant）
- `content`: 消息内容对象，包含文本和结构化数据
- `content_type`: 内容类型（text/json等）
- `status`: 消息处理状态（processing/succeeded/failed）
- `reply_id`: 回复消息ID，用于消息关联
- `agent_info`: Agent相关信息
- `index`: 消息在会话中的索引位置

**content 参数说明**:
- `text`: 消息的纯文本内容
- `temp_files`: 临时文件列表，包含会话中使用的文件
- `final_answer`: 最终答案对象，包含处理结果
- `middle_answer`: 中间答案数组，展示处理过程

**final_answer 参数说明**:
- `query`: 原始用户查询内容
- `answer`: 答案内容对象，包含文本和引用信息
- `temp_files`: 答案中使用的临时文件
- `thinking`: Agent的思考过程文本
- `skill_process`: 技能执行过程数组，展示每个技能的执行状态

**answer 参数说明**:
- `text`: 答案的纯文本内容
- `cites`: 引用信息，包含数据源引用
- `ask`: 追问信息，用于需要用户进一步输入的场景

**skill_process 参数说明**:
- `agent_name`: 技能名称
- `text`: 技能执行结果文本
- `cites`: 技能执行中的引用信息
- `status`: 技能执行状态
- `type`: 技能类型
- `thinking`: 技能执行思考过程
- `input_message`: 技能输入消息
- `interrupted`: 是否被中断
- `related_queries`: 相关查询数组

**结果返回处理**:
- **仅需要最终结果**: 直接使用 `final_answer` 中的内容
- **需要展示对话过程**: 使用 `middle_answer` 中的 `progress` 字段
- **高级处理**: 结合两者实现渐进式展示
- **技能执行跟踪**: 使用 `skill_process` 监控每个技能的执行状态

### 2. 调试接口

#### POST /app/{app_key}/api/debug

Agent 调试接口，用于测试和验证 Agent 配置，支持完整的调试功能。

**路径参数:**
- `app_key` (string, required): Agent App Key，用于标识应用

**请求体:**
```json
{
  "agent_id": "string",
  "input": {
    "query": "string",
    "temp_files": [],
    "history": [],
    "tool": {},
    "custom_querys": {}
  },
  "chat_mode": "normal | deep_thinking"
}
```

**参数详细说明**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `agent_id` | string | 是 | 要调试的Agent ID |
| `input` | object | 是 | 调试输入配置 |
| `chat_mode` | string | 否 | 调试模式：normal/deep_thinking |

**input 参数说明**:
- `query`: 调试查询内容
- `temp_files`: 调试使用的临时文件
- `history`: 调试历史记录
- `tool`: 调试工具配置
- `custom_querys`: 自定义调试参数

**响应:** 与对话接口类似，支持流式和非流式响应，包含详细的调试信息。

**调试响应特性**:
- **完整执行跟踪**: 包含每个步骤的执行状态
- **性能指标**: 响应时间、资源使用等
- **错误诊断**: 详细的错误信息和堆栈跟踪
- **配置验证**: Agent配置的有效性检查

### 3. 会话管理接口

#### GET /app/{app_key}/conversations

获取会话列表，支持分页查询。

**路径参数:**
- `app_key` (string, required): Agent App Key，用于标识应用

**查询参数:**
- `page` (int, optional): 页码，默认 1，范围：1-1000
- `page_size` (int, optional): 每页大小，默认 20，范围：1-100

**响应:**
```json
{
  "conversations": [
    {
      "id": "string",
      "title": "string",
      "agent_app_key": "string",
      "message_index": 0,
      "create_time": 0,
      "update_time": 0,
      "create_by": "string",
      "update_by": "string",
      "ext": "string"
    }
  ],
  "total": 0,
  "page": 1,
  "page_size": 20
}
```

**响应参数说明**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `conversations` | array | 会话列表数组 |
| `total` | int | 总会话数量 |
| `page` | int | 当前页码 |
| `page_size` | int | 每页大小 |

**会话对象参数说明**:
- `id`: 会话唯一标识符
- `title`: 会话标题，自动生成或用户设置
- `agent_app_key`: 关联的Agent应用Key
- `message_index`: 消息索引，表示会话中的消息数量
- `create_time`: 创建时间戳
- `update_time`: 最后更新时间戳
- `create_by`: 创建者标识
- `update_by`: 最后更新者标识
- `ext`: 扩展字段，用于存储自定义数据

#### GET /app/{app_key}/conversations/{conversation_id}

获取会话详情，包含完整的消息历史。

**路径参数:**
- `app_key` (string, required): Agent App Key，用于标识应用
- `conversation_id` (string, required): 会话 ID，要查询的会话标识

**响应:**
```json
{
  "id": "string",
  "title": "string",
  "agent_app_key": "string",
  "message_index": 0,
  "create_time": 0,
  "update_time": 0,
  "create_by": "string",
  "update_by": "string",
  "ext": "string",
  "messages": [
    {
      "id": "string",
      "conversation_id": "string",
      "agent_app_key": "string",
      "agent_id": "string",
      "agent_version": "string",
      "reply_id": "string",
      "index": 0,
      "role": "user | assistant",
      "content": "string",
      "content_type": "string",
      "status": "string",
      "ext": "string",
      "create_time": 0,
      "update_time": 0,
      "create_by": "string",
      "update_by": "string"
    }
  ]
}
```

**响应参数说明**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `id` | string | 会话唯一标识符 |
| `title` | string | 会话标题 |
| `agent_app_key` | string | 关联的Agent应用Key |
| `message_index` | int | 消息索引数量 |
| `create_time` | int | 创建时间戳 |
| `update_time` | int | 最后更新时间戳 |
| `create_by` | string | 创建者标识 |
| `update_by` | string | 最后更新者标识 |
| `ext` | string | 扩展字段 |
| `messages` | array | 会话消息列表 |

**消息对象参数说明**:
- `id`: 消息唯一标识符
- `conversation_id`: 所属会话ID
- `agent_app_key`: 关联的Agent应用Key
- `agent_id`: 处理消息的Agent ID
- `agent_version`: Agent版本
- `reply_id`: 回复消息ID，用于消息关联
- `index`: 消息在会话中的索引位置
- `role`: 消息角色（user/assistant）
- `content`: 消息内容，JSON字符串格式
- `content_type`: 内容类型（text/json等）
- `status`: 消息状态（processing/succeeded/failed）
- `ext`: 扩展字段
- `create_time`: 创建时间戳
- `update_time`: 最后更新时间戳
- `create_by`: 创建者标识
- `update_by`: 最后更新者标识

#### PUT /app/{app_key}/conversations/{conversation_id}

更新会话信息，主要用于修改会话标题和扩展信息。

**路径参数:**
- `app_key` (string, required): Agent App Key，用于标识应用
- `conversation_id` (string, required): 会话 ID，要更新的会话标识

**请求体:**
```json
{
  "title": "string",
  "ext": "string"
}
```

**参数详细说明**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `title` | string | 否 | 会话标题，用于标识会话内容 |
| `ext` | string | 否 | 扩展字段，用于存储自定义数据 |

#### DELETE /app/{app_key}/conversations/{conversation_id}

删除会话，包括会话中的所有消息记录。

**路径参数:**
- `app_key` (string, required): Agent App Key，用于标识应用
- `conversation_id` (string, required): 会话 ID，要删除的会话标识

**响应:**
```json
{
  "success": true,
  "message": "会话删除成功"
}
```

### 4. 消息管理接口

#### PUT /app/{app_key}/conversations/{conversation_id}/messages/{message_id}/read

标记消息为已读状态。

**路径参数:**
- `app_key` (string, required): Agent App Key，用于标识应用
- `conversation_id` (string, required): 会话 ID，消息所属会话
- `message_id` (string, required): 消息 ID，要标记为已读的消息标识

**响应:**
```json
{
  "success": true,
  "message": "消息已标记为已读"
}
```

### 5. 临时区域接口

#### GET /app/{app_key}/temporary-area

获取当前用户的临时区域列表。

**路径参数:**
- `app_key` (string, required): Agent App Key，用于标识应用

**响应:**
```json
{
  "temporary_areas": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "create_time": 0,
      "update_time": 0,
      "file_count": 0
    }
  ]
}
```

**临时区域对象参数说明**:
- `id`: 临时区域唯一标识符
- `name`: 临时区域名称
- `description`: 临时区域描述
- `create_time`: 创建时间戳
- `update_time`: 最后更新时间戳
- `file_count`: 临时区域中的文件数量

#### POST /app/{app_key}/temporary-area

创建新的临时区域。

**路径参数:**
- `app_key` (string, required): Agent App Key，用于标识应用

**请求体:**
```json
{
  "name": "string",
  "description": "string"
}
```

**参数详细说明**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `name` | string | 是 | 临时区域名称，用于标识区域用途 |
| `description` | string | 否 | 临时区域描述，说明区域用途 |

**响应:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "create_time": 0
}
```

#### DELETE /app/{app_key}/temporary-area/{temporary_area_id}

删除临时区域及其中的所有文件。

**路径参数:**
- `app_key` (string, required): Agent App Key，用于标识应用
- `temporary_area_id` (string, required): 临时区域 ID，要删除的区域标识

**响应:**
```json
{
  "success": true,
  "message": "临时区域删除成功"
}
```

## 错误处理

### 错误响应格式

```json
{
  "code": "string",
  "message": "string",
  "details": "string",
  "timestamp": 0
}
```

### 常见错误码

- `400`: 请求参数错误
- `401`: 未授权
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误
- `503`: 服务不可用

### 业务错误码

- `AgentAPP_Agent_GetAgentFailed`: 获取 Agent 配置失败
- `AgentAPP_Agent_CallAgentExecutorFailed`: 调用 Agent Executor 失败
- `AgentAPP_Agent_CreateConversationFailed`: 创建会话失败
- `AgentAPP_Forbidden_PermissionDenied`: 权限不足
- `AgentAPP_InternalError`: 内部错误

## 流式传输

### Server-Sent Events (SSE)

对话接口支持 SSE 流式传输：

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### 事件类型

- `message`: 普通消息事件
- `error`: 错误事件
- `end`: 结束事件

### 增量流式 (IncStream)

当 `inc_stream` 为 `true` 时，只传输变化的数据：

```javascript
// 客户端处理示例
const eventSource = new EventSource('/api/chat/completion');

eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    // 增量更新界面
};

eventSource.onerror = function(event) {
    console.error('SSE error:', event);
};
```

## 数据模型

### AgentInfo

```json
{
  "agent_id": "string",
  "agent_name": "string",
  "agent_status": "string",
  "agent_version": "string"
}
```

### Message

```json
{
  "id": "string",
  "conversation_id": "string",
  "role": "user | assistant",
  "content": {},
  "content_type": "string",
  "status": "string",
  "reply_id": "string",
  "agent_info": {},
  "index": 0
}
```

### Content

```json
{
  "text": "string",
  "temp_files": [],
  "final_answer": {},
  "middle_answer": []
}
```

### FinalAnswer

```json
{
  "query": "string",
  "answer": {},
  "temp_files": [],
  "thinking": "string",
  "skill_process": []
}
```

## 性能优化建议

### 1. 流式传输

- 使用增量流式减少网络传输
- 合理设置流式传输频率
- 及时关闭 SSE 连接

### 2. 请求优化

- 合理设置历史上下文长度
- 使用合适的数据源配置
- 避免过大的临时文件

### 3. 错误处理

- 实现重试机制
- 添加超时控制
- 使用降级策略

---

*最后更新: 2025-11-13*