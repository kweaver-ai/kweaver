# 01 - From Database to Intelligent Q&A

End-to-end example: connect a MySQL database, build a Knowledge Network,
explore its schema, run semantic search, and chat with an Agent — all from the
CLI.

## Prerequisites

```bash
# 1. Install the KWeaver CLI
npm install -g @kweaver-ai/kweaver-sdk

# 2. Install the MySQL **client** on the machine where you run ./run.sh (for Step 0: seed.sql)
#    macOS:   brew install mysql-client
#    Ubuntu:  sudo apt install -y mysql-client
#    On macOS, run.sh also looks for Homebrew mysql-client under /opt/homebrew and /usr/local if mysql is not on PATH.
#    If it is still not found, set MYSQL_BIN in .env to the full path (see env.sample).

# 3. Authenticate to a KWeaver platform
kweaver auth login https://<platform-url>

# 4. Ensure a MySQL database is reachable from the platform
#    Create the database first if needed (e.g. CREATE DATABASE supply_chain …).
#    The DB user must have rights on that database — `kweaver_rw` is often only for `kweaver_app`,
#    while `supply_chain` may use a different user (e.g. `kweaver` on that schema).
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

**`DB_NAME`**: Set this to a database that **already exists** on the server (e.g. `supply_chain_test`). Step 0 imports `seed.sql` into **that** database only. Older versions of this example hardcoded `supply_chain` inside `seed.sql` and ignored `DB_NAME`; current `run.sh` passes `DB_NAME` to the MySQL client so your setting is honored.

**`DB_HOST` vs `DB_HOST_SEED`**: Step 0 runs **`mysql` on your PC**; Step 1 runs **`kweaver ds connect`**, where the **platform** opens the DB connection. If your laptop only reaches the server via **public IP** but pods must use **VPC internal IP**, set **`DB_HOST`** to the internal address (for Step 1) and optionally **`DB_HOST_SEED`** to the public address (for Step 0). If unset, `DB_HOST_SEED` defaults to `DB_HOST`.

**`DEBUG`**: Set `DEBUG=1` (or `true`) in `.env` to print host, `kweaver` version, `kweaver config show`, raw JSON from `ds connect` / `create-from-ds`, and `agent chat --verbose`. Passwords are never printed.

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

## Troubleshooting

### `ERROR 1044 ... Access denied ... to database '<name>'`

The MySQL user in `.env` has no privilege on the database you set as `DB_NAME` (the error shows the real name, e.g. `supply_chain_test`). For example, `kweaver_rw` is often restricted to `kweaver_app` only. User `kweaver` may have `supply_chain.*` but not another database until a DBA runs `GRANT ... ON your_db.*`. Create the database first, then ensure your user can `CREATE TABLE` / `INSERT` there.

## Cleanup

The script cleans up all created resources (KN, datasource) on exit.
To clean up manually:

```bash
kweaver bkn delete <kn-id> -y
kweaver ds delete <datasource-id> -y
```
