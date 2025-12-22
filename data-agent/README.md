# Data Agent (Monorepo)

This repository contains the core services and web UI for **Data Agent**.
It is a monorepo with multiple components (Go/Python/Node.js) that together provide:

- A **web UI** to configure and use agents
- Backend **services** to manage agent configs and execution
- Built-in **tools** (e.g., data retrieval / text2sql) that agents can call

For Chinese documentation, see [`README.zh.md`](README.zh.md).

## Repository layout

| Component | Path | Tech | What it does | Docs |
|---|---|---|---|---|
| Web UI | `agent-web/` | React + TypeScript | Data Agent frontend | `agent-web/README.md` |
| App service | `agent-app/` | Go | Main backend service / APIs | `agent-app/README.md` |
| Executor | `agent-executor/` | Python | Runs agents based on configs | `agent-executor/README.md` |
| Factory | `agent-factory/` | Go | Agent config management / publishing | `agent-factory/README.md` |
| Memory | `agent-memory/` | Python | Agent memory service | `agent-memory/README.md` |
| Retrieval | `agent-retrieval/` | Go | Retrieval service | `agent-retrieval/README.md` |
| Data tools | `data-retrieval/` | Python | Tool server & built-in tools | `data-retrieval/README.md` |

## Quick start (local development)

This repo includes multiple services; you can run only the parts you need.
Each component has its own README with the most accurate setup steps.

### Prerequisites

- **Git**
- For Go services: **Go** (see each service README for version)
- For Python services: **Python 3.10+**
- For the web UI: **Node.js** (see `agent-web/package.json`)

### Run a component

#### agent-web (frontend)

```bash
cd agent-web
npm install
npm run dev
```

#### data-retrieval (tool server)

```bash
cd data-retrieval
python -m venv .venv
# activate the venv, then:
pip install -r requirements.txt
# run tool API router (FastAPI)
uvicorn src.data_retrieval.tools.tool_api_router:DEFAULT_APP --host 0.0.0.0 --port 9100
```

> Notes:
> - `data-retrieval/load-env.ps1` sets `PYTHONPATH` for Windows; it does **not** auto-load `.env` by default.

## Contributing

- Create a feature branch from `develop`
- Open a PR targeting `develop`
- Keep changes scoped to a component when possible

## Troubleshooting

- If you see missing Python modules when importing `data_retrieval`, ensure dependencies are installed in your venv.
- For environment variables, prefer explicit setup (local `.env` files are intentionally not auto-loaded by default).