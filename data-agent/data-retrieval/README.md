# data-retrieval

`data-retrieval` provides **built-in tools** and a **FastAPI tool server** for Data Agent.
It includes tools like `text2sql`, `sql_helper`, sandbox tools, knowledge network tools, and graph tools.

中文文档见：[`README.zh.md`](README.zh.md)。

## Project layout

```
data-retrieval/
├── src/data_retrieval/            # Python package (src layout)
│   └── tools/tool_api_router.py   # FastAPI entrypoint (DEFAULT_APP)
├── requirements.txt               # Python dependencies (includes local sandbox wheel)
├── tmp/                           # vendored wheels
│   └── sandbox_env-0.1.0-*.whl
├── load-env.ps1                   # Windows: set PYTHONPATH
├── load-env.sh                    # macOS/Linux: set PYTHONPATH
└── Dockerfile                     # container build for tool server
```

## Requirements

- Python **3.10+**

## Setup

### 1) Create a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate
```

### 2) Install dependencies (includes sandbox wheel in `./tmp/`)

```bash
pip install -r requirements.txt
```

> `requirements.txt` includes `./tmp/sandbox_env-0.1.0-py3-none-any.whl` so the sandbox package is installed without relying on an external index.

## Run (tool server)

### Option A: set PYTHONPATH then run uvicorn

macOS/Linux:

```bash
source ./load-env.sh
uvicorn src.data_retrieval.tools.tool_api_router:DEFAULT_APP --host 0.0.0.0 --port 9100
```

Windows (PowerShell):

```powershell
.\load-env.ps1
uvicorn src.data_retrieval.tools.tool_api_router:DEFAULT_APP --host 0.0.0.0 --port 9100
```

### Option B: install as an editable package (recommended for dev)

```bash
pip install -e .
uvicorn data_retrieval.tools.tool_api_router:DEFAULT_APP --host 0.0.0.0 --port 9100
```

## Useful docs

- `docs/tools_usage_guide.md`
- `docs/sql_helper_usage.md`
- `docs/sandbox_api_examples.md`

## Notes

- The top-level Python package is **`data_retrieval`** (not `af_agent`).
