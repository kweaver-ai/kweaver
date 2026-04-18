# KWeaver Examples

[中文版](./README.zh.md)

End-to-end examples that demonstrate core KWeaver capabilities using the CLI.

| Example | Description |
|---------|-------------|
| [01-db-to-qa](./01-db-to-qa/) | Connect a MySQL database, build a Knowledge Network, and chat with an Agent — from raw tables to intelligent Q&A in one script. |
| [02-csv-to-kn](./02-csv-to-kn/) | Import CSV data into a Knowledge Network and explore structured information through knowledge graph queries. |
| [03-action-lifecycle](./03-action-lifecycle/) | Self-Evolving Knowledge Network | MySQL → KN → Action → Schedule → Audit Log |

## Getting Started

Each example is self-contained. Enter the directory, copy `env.sample` to `.env`, fill in your credentials, and run the script:

```bash
cd 01-db-to-qa
cp env.sample .env
vim .env
./run.sh
```

All examples require the KWeaver CLI (`npm install -g @kweaver-ai/kweaver-sdk`) and an authenticated platform (`kweaver auth login`). See the README inside each example for specific prerequisites.

## Cleanup

Scripts clean up resources (datasources, knowledge networks) automatically on exit. See individual READMEs for manual cleanup commands.
