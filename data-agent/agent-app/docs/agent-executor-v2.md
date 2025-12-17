# Agent Executor V2 接口升级文档

## 概述 (Overview)

本文档描述了 Agent Executor 从 v1 接口升级到 v2 接口的变化和配置方法。

## v1 与 v2 接口差异 (Differences between V1 and V2)

### 参数名称变化 (Parameter Name Changes)

| v1 参数名 | v2 参数名 | 说明 (Description) |
|-----------|-----------|-------------------|
| `id` | `agent_id` | Agent ID |
| `config` | `agent_config` | Agent 配置 (Agent Configuration) |
| `input` | `agent_input` | Agent 输入 (Agent Input) |
| `options` | `options` | 运行选项（保持不变）(Run Options - unchanged) |

### 请求方式变化 (Request Method Changes)

**v1 接口**：
- `user_id` 和 `visitor_type` 通过 HTTP Header 传递
  - Header: `x-user` (user_id)
  - Header: `x-visitor-type` (visitor_type)

**v2 接口**：
- `user_id` 和 `visitor_type` 在请求体 (Request Body) 中传递
  - Body: `user_id`
  - Body: `visitor_type`

### API 端点 (API Endpoints)

| 功能 | v1 端点 | v2 端点 |
|------|---------|---------|
| 运行 Agent | `/api/agent-executor/v1/agent/run` | `/api/agent-executor/v2/agent/run` |
| 调试模式 | `/api/agent-executor/v1/agent/debug` | `/api/agent-executor/v2/agent/debug` |

## 配置方法 (Configuration)

### 配置文件 (Configuration File)

在 `conf/agent-app.yaml` 中添加 `use_v2` 配置项：

\`\`\`yaml
agent_executor:
  public_svc:
    host: "agent-executor"
    port: 8080
    protocol: "http"
  private_svc:
    host: "agent-executor"
    port: 8080
    protocol: "http"
  # 控制是否使用 v2 接口
  # true: 使用 v2 接口 (agent_id, agent_config, agent_input)
  # false: 使用 v1 接口 (id, config, input)
  use_v2: false  # 默认使用 v1 接口
\`\`\`

### 环境变量 (Environment Variable)

也可以通过环境变量控制（如果配置支持）：

\`\`\`bash
export AGENT_EXECUTOR_USE_V2=true
\`\`\`

## 架构设计 (Architecture Design)

### 类图 (Class Diagram)

\`\`\`mermaid
classDiagram
    class IAgentExecutor {
        <<interface>>
        +Call(ctx, req) (chan, chan, error)
        +Debug(ctx, req) (chan, chan, error)
    }

    class IV2AgentExecutor {
        <<interface>>
        +Call(ctx, v2req) (chan, chan, error)
        +Debug(ctx, v2req) (chan, chan, error)
    }

    class AgentExecutorAdapter {
        -useV2 bool
        -v1 IAgentExecutor
        -v2 IV2AgentExecutor
        +Call(ctx, req) (chan, chan, error)
        +Debug(ctx, req) (chan, chan, error)
    }

    class agentExecutorHttpAcc {
        +Call(ctx, req) (chan, chan, error)
        +Debug(ctx, req) (chan, chan, error)
    }

    class v2AgentExecutorHttpAcc {
        +Call(ctx, v2req) (chan, chan, error)
        +Debug(ctx, v2req) (chan, chan, error)
    }

    IAgentExecutor <|.. AgentExecutorAdapter : implements
    IAgentExecutor <|.. agentExecutorHttpAcc : implements
    IV2AgentExecutor <|.. v2AgentExecutorHttpAcc : implements
    AgentExecutorAdapter o-- IAgentExecutor : v1
    AgentExecutorAdapter o-- IV2AgentExecutor : v2
\`\`\`

### 时序图 (Sequence Diagram)

#### 使用 v1 接口 (Using V1 Interface)

\`\`\`mermaid
sequenceDiagram
    participant Client as Agent Service
    participant Adapter as AgentExecutorAdapter
    participant V1 as V1 Implementation
    participant Executor as Agent Executor (V1 API)

    Client->>Adapter: Call(ctx, v1Req)
    alt use_v2 = false
        Adapter->>V1: Call(ctx, v1Req)
        V1->>Executor: POST /v1/agent/run
        Note over V1,Executor: Headers: x-user, x-visitor-type
        Executor-->>V1: Response Stream
        V1-->>Adapter: chan string, chan error
        Adapter-->>Client: chan string, chan error
    end
\`\`\`

#### 使用 v2 接口 (Using V2 Interface)

\`\`\`mermaid
sequenceDiagram
    participant Client as Agent Service
    participant Adapter as AgentExecutorAdapter
    participant V2 as V2 Implementation
    participant Executor as Agent Executor (V2 API)

    Client->>Adapter: Call(ctx, v1Req)
    alt use_v2 = true
        Adapter->>Adapter: ConvertV1ToV2CallReq(v1Req)
        Note over Adapter: 转换参数名称：<br/>id -> agent_id<br/>config -> agent_config<br/>input -> agent_input
        Adapter->>V2: Call(ctx, v2Req)
        V2->>Executor: POST /v2/agent/run
        Note over V2,Executor: Body: user_id, visitor_type
        Executor-->>V2: Response Stream
        V2-->>Adapter: chan string, chan error
        Adapter-->>Client: chan string, chan error
    end
\`\`\`

### 流程图 (Flow Chart)

\`\`\`mermaid
flowchart TD
    Start([开始 Start]) --> CheckConfig{检查配置<br/>use_v2?}

    CheckConfig -->|false| CreateV1[创建 V1 实现<br/>agentExecutorHttpAcc]
    CheckConfig -->|true| CreateBoth[创建 V1 和 V2 实现]

    CreateV1 --> ReturnV1[返回 V1 实现]
    CreateBoth --> CreateAdapter[创建适配器<br/>AgentExecutorAdapter]
    CreateAdapter --> ReturnAdapter[返回适配器]

    ReturnV1 --> CallInterface([调用接口])
    ReturnAdapter --> CallInterface

    CallInterface --> AdapterCheck{适配器检查<br/>useV2?}

    AdapterCheck -->|false| CallV1API[调用 V1 API<br/>/v1/agent/run]
    AdapterCheck -->|true| Convert[转换参数<br/>V1 -> V2]

    Convert --> CallV2API[调用 V2 API<br/>/v2/agent/run]

    CallV1API --> Return([返回结果])
    CallV2API --> Return
\`\`\`

## 升级步骤 (Migration Steps)

### 1. 准备阶段 (Preparation)

- 确保 Agent Executor 服务已经部署了 v2 接口
- 备份当前配置文件

### 2. 测试阶段 (Testing)

在测试环境中：

1. 保持 `use_v2: false`，确认 v1 接口正常工作
2. 修改为 `use_v2: true`，测试 v2 接口
3. 对比两个版本的响应，确保结果一致

### 3. 生产部署 (Production Deployment)

1. 先在少量实例上启用 v2 接口
2. 监控日志和性能指标
3. 确认无问题后，逐步扩大到所有实例

### 4. 回滚方案 (Rollback Plan)

如果发现问题，可以快速回滚：

\`\`\`yaml
agent_executor:
  use_v2: false  # 回滚到 v1
\`\`\`

重启服务即可生效。

## 示例代码 (Example Code)

### v1 请求示例 (V1 Request Example)

\`\`\`go
req := &agentexecutordto.AgentCallReq{
    ID: "agent-123",
    Config: agentexecutordto.Config{
        AgentID:        "agent-123",
        SessionID:      "session-456",
        ConversationID: "conv-789",
    },
    Input: map[string]interface{}{
        "query": "你好",
    },
    UserID:      "user-001",
    VisitorType: constant.User,
}

messages, errs, err := agentExecutor.Call(ctx, req)
\`\`\`

### v2 请求示例 (V2 Request Example)

\`\`\`go
// 注意：业务代码不需要修改，适配器会自动转换
// 适配器内部会将 v1 格式转换为 v2 格式：
v2Req := &v2agentexecutordto.V2AgentCallReq{
    AgentID: "agent-123",  // 从 ID 转换
    AgentConfig: v2agentexecutordto.Config{
        // Config 字段
    },
    AgentInput: map[string]interface{}{  // 从 Input 转换
        "query": "你好",
    },
    UserID:      "user-001",
    VisitorType: "user",  // 从 constant.User 转换
    AgentOptions: v2agentexecutordto.AgentOptions{
        AgentID:        "agent-123",
        SessionID:      "session-456",
        ConversationID: "conv-789",
    },
}
\`\`\`

## 注意事项 (Notes)

1. **向后兼容 (Backward Compatibility)**：默认使用 v1 接口，确保现有系统不受影响
2. **平滑迁移 (Smooth Migration)**：可以随时通过配置切换版本
3. **性能影响 (Performance Impact)**：适配器的转换开销很小，不会明显影响性能
4. **监控告警 (Monitoring)**：建议在切换到 v2 后加强监控

## 故障排查 (Troubleshooting)

### 问题：切换到 v2 后接口调用失败

**解决方案**：
1. 检查 Agent Executor 服务是否支持 v2 接口
2. 查看日志，确认请求参数格式是否正确
3. 临时回滚到 v1 接口

### 问题：参数转换错误

**解决方案**：
1. 检查 adapter.go 中的转换逻辑
2. 确认 v1 和 v2 的数据结构定义一致
3. 查看错误日志，定位具体的转换失败点

## 相关文件 (Related Files)

- `conf/agent_executor.go` - 配置结构定义
- `src/drivenadapter/httpaccess/agentexecutoraccess/` - v1 实现
- `src/drivenadapter/httpaccess/v2agentexecutoraccess/` - v2 实现
- `src/drivenadapter/httpaccess/agentexecutoraccess/adapter.go` - 适配器
- `src/drivenadapter/httpaccess/httpinject/agent_executor.go` - 依赖注入
