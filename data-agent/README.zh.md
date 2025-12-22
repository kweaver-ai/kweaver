# Data Agent（单仓库）

本仓库是 **Data Agent** 的单仓库（monorepo），包含前端与多个后端/执行/工具服务（Go / Python / Node.js），用于提供：

- **Web UI**：配置、发布与使用 Data Agent
- **后端服务**：管理 Agent 配置与对外 API
- **执行器**：根据配置运行 Agent
- **内置工具**：例如 data retrieval / text2sql 等工具服务，供 Agent 调用

英文版本见：[`README.md`](README.md)。

## 仓库结构

| 模块 | 目录 | 技术栈 | 作用 | 文档 |
|---|---|---|---|---|
| Web 前端 | `agent-web/` | React + TypeScript | Data Agent 前端 | `agent-web/README.md` |
| App 服务 | `agent-app/` | Go | 主要后端服务 / APIs | `agent-app/README.md` |
| 执行器 | `agent-executor/` | Python | 按配置运行 Agent | `agent-executor/README.md` |
| Factory | `agent-factory/` | Go | Agent 配置管理/发布 | `agent-factory/README.md` |
| Memory | `agent-memory/` | Python | 记忆服务 | `agent-memory/README.md` |
| Retrieval | `agent-retrieval/` | Go | 检索服务 | `agent-retrieval/README.md` |
| 数据工具 | `data-retrieval/` | Python | 工具服务与内置工具 | `data-retrieval/README.md` |

## 快速开始（本地开发）

本仓库包含多个服务，通常只需要启动你关心的那一两个模块即可。每个模块的目录里都有更详细的 README，请以各模块 README 为准。

### 环境要求

- **Git**
- Go 服务：**Go**（版本见各服务 README）
- Python 服务：**Python 3.10+**
- 前端：**Node.js**（见 `agent-web/package.json`）

### 启动示例

#### agent-web（前端）

```bash
cd agent-web
npm install
npm run dev
```

#### data-retrieval（工具服务）

```bash
cd data-retrieval
python -m venv .venv
# 激活虚拟环境后：
pip install -r requirements.txt
uvicorn src.data_retrieval.tools.tool_api_router:DEFAULT_APP --host 0.0.0.0 --port 9100
```

> 说明：
> - Windows 下可使用 `data-retrieval/load-env.ps1` 设置 `PYTHONPATH`；默认 **不会自动加载** `.env`。

## 参与贡献

- 从 `develop` 拉分支开发
- 给 `develop` 提 PR
- 尽量让改动聚焦在单个模块目录内，便于评审与回滚

## 常见问题

- Python import 报缺少依赖：请确认 venv 已安装依赖。
- 环境变量：默认不自动加载 `.env`，建议显式设置或按模块 README 配置。


