# data-retrieval

`data-retrieval` 为 Data Agent 提供 **内置工具** 与 **FastAPI 工具服务**，包含 `text2sql`、`sql_helper`、sandbox 工具、知识网络工具、图谱工具等。

英文版见：[`README.md`](README.md)。

## 目录结构

```
data-retrieval/
├── src/data_retrieval/            # Python 包（src 布局）
│   └── tools/tool_api_router.py   # FastAPI 入口（DEFAULT_APP）
├── requirements.txt               # Python 依赖（包含本地 sandbox wheel）
├── tmp/                           # 预置 wheel
│   └── sandbox_env-0.1.0-*.whl
├── load-env.ps1                   # Windows：设置 PYTHONPATH
├── load-env.sh                    # macOS/Linux：设置 PYTHONPATH
└── Dockerfile                     # 工具服务镜像构建
```

## 环境要求

- Python **3.10+**

## 安装

### 1）创建虚拟环境

```bash
python -m venv .venv
source .venv/bin/activate
```

### 2）安装依赖（会自动安装 `./tmp/` 下的 sandbox wheel）

```bash
pip install -r requirements.txt
```

> `requirements.txt` 已包含 `./tmp/sandbox_env-0.1.0-py3-none-any.whl`，因此无需依赖外部源即可安装 sandbox 包。

## 启动（工具服务）

### 方式 A：先设置 PYTHONPATH 再启动 uvicorn

macOS/Linux：

```bash
source ./load-env.sh
uvicorn src.data_retrieval.tools.tool_api_router:DEFAULT_APP --host 0.0.0.0 --port 9100
```

Windows（PowerShell）：

```powershell
.\load-env.ps1
uvicorn src.data_retrieval.tools.tool_api_router:DEFAULT_APP --host 0.0.0.0 --port 9100
```

### 方式 B：以可编辑模式安装（开发推荐）

```bash
pip install -e .
uvicorn data_retrieval.tools.tool_api_router:DEFAULT_APP --host 0.0.0.0 --port 9100
```

## 相关文档

- `docs/tools_usage_guide.md`
- `docs/sql_helper_usage.md`
- `docs/sandbox_api_examples.md`

## 备注

- 当前 Python 包名为 **`data_retrieval`**（不再是 `af_agent`）。


