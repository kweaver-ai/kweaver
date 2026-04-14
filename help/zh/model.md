# 模型管理

## 概述

KWeaver Core 通过**模型管理器**（`mf-model-manager`）统一管理 LLM 和小模型。平台默认不包含预置模型，需自行注册后才能使用语义搜索和 Agent 功能。

| 模型类别 | 用途 | 必需场景 |
|---------|------|---------|
| **LLM**（大语言模型） | Agent 对话、推理、决策 | Decision Agent |
| **Embedding**（嵌入模型） | 向量化、语义搜索、意图识别 | `kweaver bkn search`、Agent 意图识别 |
| **Reranker**（重排模型） | 检索结果精排 | 可选，提高检索精度 |

典型 Ingress 前缀：

| 前缀 | 作用 |
| --- | --- |
| `/api/mf-model-manager/v1` | 模型管理 API |

**相关模块：** [BKN 引擎](bkn.md)（语义搜索消费 Embedding）、[Decision Agent](decision-agent.md)（消费 LLM）、[Context Loader](context-loader.md)（检索使用 Embedding + Reranker）。

---

## CLI

以下操作使用 `kweaver call`，CLI 会自动注入认证和平台地址。

### LLM 管理

#### 注册 LLM

注册一个 OpenAI 兼容的 LLM：

```bash
# DeepSeek
kweaver call /api/mf-model-manager/v1/llm/add -d '{
  "model_name": "deepseek-chat",
  "model_series": "deepseek",
  "max_model_len": 8192,
  "model_config": {
    "api_key": "<你的 API Key>",
    "api_model": "deepseek-chat",
    "api_url": "https://api.deepseek.com/chat/completions"
  }
}'

# OpenAI
kweaver call /api/mf-model-manager/v1/llm/add -d '{
  "model_name": "gpt-4o",
  "model_series": "openai",
  "max_model_len": 128000,
  "model_config": {
    "api_key": "<你的 API Key>",
    "api_model": "gpt-4o",
    "api_url": "https://api.openai.com/v1/chat/completions"
  }
}'

# 通义千问
kweaver call /api/mf-model-manager/v1/llm/add -d '{
  "model_name": "qwen-plus",
  "model_series": "qwen",
  "max_model_len": 131072,
  "model_config": {
    "api_key": "<你的 API Key>",
    "api_model": "qwen-plus",
    "api_url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
  }
}'
```

支持的 `model_series`：`openai`、`deepseek`、`qwen`、`claude`、`tome`（私有部署）等。任何兼容 OpenAI Chat Completions API 的端点均可接入。

#### 列出 LLM

```bash
kweaver call '/api/mf-model-manager/v1/llm/list?page=1&size=50'
```

#### 测试 LLM 连通性

```bash
kweaver call /api/mf-model-manager/v1/llm/test -d '{
  "model_id": "<model_id>"
}'
```

#### 删除 LLM

```bash
kweaver call /api/mf-model-manager/v1/llm/delete -d '{
  "model_ids": ["<model_id>"]
}'
```

### 小模型管理（Embedding / Reranker）

#### 注册 Embedding 模型

```bash
# BGE-M3（通过 SiliconFlow）
kweaver call /api/mf-model-manager/v1/small-model/add -d '{
  "model_name": "bge-m3",
  "model_type": "embedding",
  "model_config": {
    "api_url": "https://api.siliconflow.cn/v1/embeddings",
    "api_model": "BAAI/bge-m3",
    "api_key": "<你的 API Key>"
  },
  "batch_size": 32,
  "max_tokens": 512,
  "embedding_dim": 1024
}'

# OpenAI text-embedding-3-small
kweaver call /api/mf-model-manager/v1/small-model/add -d '{
  "model_name": "text-embedding-3-small",
  "model_type": "embedding",
  "model_config": {
    "api_url": "https://api.openai.com/v1/embeddings",
    "api_model": "text-embedding-3-small",
    "api_key": "<你的 API Key>"
  },
  "batch_size": 32,
  "max_tokens": 8191,
  "embedding_dim": 1536
}'
```

#### 注册 Reranker 模型（可选）

Reranker 对语义搜索结果进行精排，可提高检索精度：

```bash
kweaver call /api/mf-model-manager/v1/small-model/add -d '{
  "model_name": "bge-reranker-v2-m3",
  "model_type": "reranker",
  "model_config": {
    "api_url": "https://api.siliconflow.cn/v1/rerank",
    "api_model": "BAAI/bge-reranker-v2-m3",
    "api_key": "<你的 API Key>"
  },
  "batch_size": 32,
  "max_tokens": 512
}'
```

#### 列出小模型

```bash
kweaver call '/api/mf-model-manager/v1/small-model/list?page=1&size=50'
```

返回示例：

```json
{
  "count": 2,
  "data": [
    {
      "model_id": "2044075511382151168",
      "model_name": "bge-m3",
      "model_type": "embedding",
      "model_config": { "api_url": "...", "api_model": "BAAI/bge-m3" },
      "batch_size": 32,
      "max_tokens": 512,
      "embedding_dim": 1024
    }
  ]
}
```

#### 测试小模型连通性

```bash
kweaver call /api/mf-model-manager/v1/small-model/test -d '{
  "model_id": "<model_id>"
}'
```

#### 删除小模型

```bash
kweaver call /api/mf-model-manager/v1/small-model/delete -d '{
  "model_id": "<model_id>"
}'
```

---

## 启用 BKN 语义搜索

注册 Embedding 模型后，还需要开启 BKN 后端的语义向量化（默认关闭）：

```bash
kubectl edit configmap bkn-backend-cm -n kweaver
# 将 defaultSmallModelEnabled: false 改为 true
# 将 defaultSmallModelName 改为你注册的 embedding 模型名（如 bge-m3）

kubectl rollout restart deployment/bkn-backend -n kweaver
```

验证：

```bash
kweaver bkn search <kn_id> "测试搜索"
```

---

## 模型参数说明

### LLM 参数

| 参数 | 必填 | 说明 |
|------|:----:|------|
| `model_name` | YES | 模型显示名称，需唯一 |
| `model_series` | YES | 模型系列：`openai`、`deepseek`、`qwen`、`claude`、`tome` 等 |
| `max_model_len` | YES | 最大上下文长度（tokens） |
| `model_config.api_key` | YES | API Key |
| `model_config.api_model` | YES | 提供商侧的模型名称 |
| `model_config.api_url` | YES | Chat Completions API 端点 |

### 小模型参数

| 参数 | 必填 | 说明 |
|------|:----:|------|
| `model_name` | YES | 模型显示名称，需唯一 |
| `model_type` | YES | `embedding` 或 `reranker` |
| `model_config.api_key` | YES | API Key |
| `model_config.api_model` | YES | 提供商侧的模型名称 |
| `model_config.api_url` | YES | Embedding / Rerank API 端点 |
| `batch_size` | NO | 批量处理大小（默认 32） |
| `max_tokens` | NO | 单次最大 token 数 |
| `embedding_dim` | NO | 向量维度（仅 embedding 类型需要） |

---

## 常见模型提供商

| 提供商 | 模型类型 | 模型名称 | API 端点 |
|--------|---------|---------|---------|
| DeepSeek | LLM | `deepseek-chat` | `https://api.deepseek.com/chat/completions` |
| OpenAI | LLM | `gpt-4o` | `https://api.openai.com/v1/chat/completions` |
| 通义千问 | LLM | `qwen-plus` | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` |
| SiliconFlow | Embedding | `BAAI/bge-m3` | `https://api.siliconflow.cn/v1/embeddings` |
| SiliconFlow | Reranker | `BAAI/bge-reranker-v2-m3` | `https://api.siliconflow.cn/v1/rerank` |
| OpenAI | Embedding | `text-embedding-3-small` | `https://api.openai.com/v1/embeddings` |

私有部署的模型（如 vLLM、Ollama）只需将 `api_url` 指向本地端点即可，`model_series` 选 `openai` 或 `tome`。

---

## 端到端流程

```bash
# 1. 注册 LLM
kweaver call /api/mf-model-manager/v1/llm/add -d '{
  "model_name": "deepseek-chat",
  "model_series": "deepseek",
  "max_model_len": 8192,
  "model_config": {
    "api_key": "<key>",
    "api_model": "deepseek-chat",
    "api_url": "https://api.deepseek.com/chat/completions"
  }
}'

# 2. 注册 Embedding
kweaver call /api/mf-model-manager/v1/small-model/add -d '{
  "model_name": "bge-m3",
  "model_type": "embedding",
  "model_config": {
    "api_url": "https://api.siliconflow.cn/v1/embeddings",
    "api_model": "BAAI/bge-m3",
    "api_key": "<key>"
  },
  "batch_size": 32,
  "max_tokens": 512,
  "embedding_dim": 1024
}'

# 3. 验证注册结果
kweaver call '/api/mf-model-manager/v1/llm/list?page=1&size=50'
kweaver call '/api/mf-model-manager/v1/small-model/list?page=1&size=50'

# 4. 测试连通性
kweaver call /api/mf-model-manager/v1/llm/test -d '{"model_id": "<llm_id>"}'
kweaver call /api/mf-model-manager/v1/small-model/test -d '{"model_id": "<embedding_id>"}'

# 5. 启用 BKN 语义搜索（需要 kubectl）
kubectl edit configmap bkn-backend-cm -n kweaver
kubectl rollout restart deployment/bkn-backend -n kweaver

# 6. 验证语义搜索
kweaver bkn search <kn_id> "测试查询"

# 7. 创建 Agent（需要 llm_id）
kweaver agent create --name "测试助手" --profile "回答问题" --llm-id <llm_id>
```
