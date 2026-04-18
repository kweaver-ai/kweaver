# 03 · Action Lifecycle — Self-Evolving Knowledge Network

> A knowledge network that watches your supply chain and acts on its own.

## What This Shows

A knowledge network is not a static query layer. Once you define **action types**
and a **schedule**, it starts operating autonomously:

- **Finds the right entities** — using relationship-aware conditions
  (e.g., "purchase orders whose supplier is flagged at-risk")
- **Triggers follow-up actions** — calling your business systems
- **Records everything** — full audit trail in `action-log`

No one needs to run a script every morning. The network acts. You review the log.

## Prerequisites

- `kweaver` CLI ≥ 0.6.3 and a logged-in session (`kweaver auth whoami`)
- MySQL accessible from the kweaver platform
- Python 3 and `curl` on your local machine

## Quick Start

```bash
cp env.sample .env
# Edit .env with your DB credentials
./run.sh
```

## Flow

| Step | What happens |
|------|-------------|
| 0 | Seed MySQL: suppliers + purchase orders (4 linked to at-risk suppliers) |
| 1–2 | Connect datasource, build knowledge network |
| 3–5 | Register action tool backend |
| 6 | Define action type: *"find POs with at-risk suppliers, trigger follow-up"* |
| 7 | Query confirms affected POs identified via relationship context |
| 8–9 | Schedule: runs every day at 08:00 automatically |
| 10 | Manual trigger: see results immediately |
| 11 | Audit log: the network's history of autonomous actions |

## Note on Execute Status

The demo tool backend does not perform real write-back (that is your business
system's job). Execute may show `failed` at the tool level — the execution
record and audit log are still written correctly. In production, replace the
tool binding with your ERP or business API endpoint.

## Cleanup

Resources are deleted automatically when the script exits (success or failure).
