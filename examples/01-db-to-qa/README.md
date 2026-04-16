# 01 - From Database to Intelligent Q&A

End-to-end example: connect a MySQL database, build a Knowledge Network,
explore its schema, run semantic search, and chat with an Agent — all from the
CLI.

## Prerequisites

```bash
# 1. Install the KWeaver CLI
npm install -g @kweaver-ai/kweaver-sdk

# 2. Authenticate to a KWeaver platform
kweaver auth login https://<platform-url>

# 3. Ensure a MySQL database is reachable from the platform
#    The script imports seed.sql automatically (a fictional smart-home company).
```

## What This Example Does

```
MySQL Database
     │
     ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Datasource  │────▶│  Knowledge   │────▶│ Context-Loader   │
│  Connect    │     │   Network    │     │ Semantic Search  │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │    Schema    │     │   Agent Chat    │
                    │   Explore   │     │   (Q&A)         │
                    └──────────────┘     └─────────────────┘
```

0. **Seed** sample data into MySQL (`seed.sql` — fictional smart-home supply chain)
1. **Connect** a MySQL datasource to the platform
2. **Create & Build** a Knowledge Network from the datasource
3. **Explore** the auto-discovered object types and properties
4. **Search** the knowledge graph with natural language
5. **Chat** with an Agent to answer questions about the data

## Quick Start

```bash
# Copy the sample config and fill in your database credentials
cp env.sample .env
vim .env

# Run the full flow
./run.sh
```

## Step-by-Step

See `run.sh` for the complete script. Key commands:

```bash
# Connect a datasource
kweaver ds connect mysql $DB_HOST $DB_PORT $DB_NAME \
  --account $DB_USER --password $DB_PASS --name "my-datasource"

# Create a Knowledge Network from it
kweaver bkn create-from-ds <datasource-id> --name "my-kn" --build

# Explore the schema
kweaver bkn object-type list <kn-id>

# Configure context-loader and search
kweaver context-loader config set --kn-id <kn-id>
kweaver context-loader kn-search "supply chain"

# Chat with an agent
kweaver agent chat <agent-id> -m "What are the main suppliers?"
```

## Cleanup

The script cleans up all created resources (KN, datasource) on exit.
To clean up manually:

```bash
kweaver bkn delete <kn-id> -y
kweaver ds delete <datasource-id> -y
```
