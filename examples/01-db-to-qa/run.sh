#!/usr/bin/env bash
# =============================================================================
# 01-db-to-qa: From Database to Intelligent Q&A
#
# End-to-end flow: MySQL → Datasource → Knowledge Network → Semantic Search → Agent Chat
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Load config ──────────────────────────────────────────────────────────────
if [ -f "$SCRIPT_DIR/.env" ]; then
    # shellcheck disable=SC1091
    source "$SCRIPT_DIR/.env"
fi

DB_HOST="${DB_HOST:?Set DB_HOST in .env}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:?Set DB_NAME in .env}"
DB_USER="${DB_USER:?Set DB_USER in .env}"
DB_PASS="${DB_PASS:?Set DB_PASS in .env}"

TIMESTAMP=$(date +%s)
DS_NAME="example_ds_${TIMESTAMP}"
KN_NAME="example_kn_${TIMESTAMP}"

# Track created resources for cleanup
DS_ID=""
KN_ID=""

cleanup() {
    echo ""
    echo "=== Cleanup ==="
    [ -n "$KN_ID" ] && kweaver bkn delete "$KN_ID" -y 2>/dev/null && echo "  Deleted KN $KN_ID"
    [ -n "$DS_ID" ] && kweaver ds delete "$DS_ID" -y 2>/dev/null && echo "  Deleted datasource $DS_ID"
    echo "Done."
}
trap cleanup EXIT

# ── Step 0: Seed the database ───────────────────────────────────────────────
echo "=== Step 0: Seed sample data into MySQL ==="
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" < "$SCRIPT_DIR/seed.sql"
echo "  Imported seed.sql → ${DB_NAME} (erp_material_bom, erp_purchase_order)"

# ── Step 1: Connect datasource ──────────────────────────────────────────────
echo ""
echo "=== Step 1: Connect MySQL datasource ==="
echo "  Host: $DB_HOST:$DB_PORT  Database: $DB_NAME"

DS_JSON=$(kweaver ds connect mysql "$DB_HOST" "$DB_PORT" "$DB_NAME" \
    --account "$DB_USER" --password "$DB_PASS" --name "$DS_NAME")

DS_ID=$(echo "$DS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('datasource_id',''))")
echo "  Datasource created: $DS_ID"

# ── Step 2: Create Knowledge Network ────────────────────────────────────────
echo ""
echo "=== Step 2: Create Knowledge Network from datasource ==="

KN_JSON=$(kweaver bkn create-from-ds "$DS_ID" --name "$KN_NAME" --build)

KN_ID=$(echo "$KN_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('kn_id',''))")
echo "  Knowledge Network created: $KN_ID"

# Show auto-discovered object types
OT_COUNT=$(echo "$KN_JSON" | python3 -c "
import sys,json
d = json.load(sys.stdin)
ots = d.get('object_types', [])
print(len(ots))
for ot in ots[:5]:
    print(f\"    - {ot.get('name', '?')}\")
if len(ots) > 5:
    print(f'    ... and {len(ots)-5} more')
")
echo "  Auto-discovered object types:"
echo "$OT_COUNT"

# ── Step 3: Explore schema ──────────────────────────────────────────────────
echo ""
echo "=== Step 3: Explore Knowledge Network schema ==="

OT_LIST=$(kweaver bkn object-type list "$KN_ID")
echo "$OT_LIST" | python3 -c "
import sys, json
data = json.load(sys.stdin)
entries = data.get('entries', data) if isinstance(data, dict) else data
if isinstance(entries, list):
    print(f'  Object types ({len(entries)}):')
    for e in entries[:8]:
        name = e.get('name', '?')
        props = e.get('data_properties', [])
        print(f'    - {name} ({len(props)} properties)')
"

# Pick the first OT and show its properties
FIRST_OT_ID=$(echo "$OT_LIST" | python3 -c "
import sys, json
data = json.load(sys.stdin)
entries = data.get('entries', data) if isinstance(data, dict) else data
if isinstance(entries, list) and entries:
    print(entries[0].get('id', ''))
")

if [ -n "$FIRST_OT_ID" ]; then
    echo ""
    echo "  Properties of first object type:"
    kweaver bkn object-type get "$KN_ID" "$FIRST_OT_ID" --pretty 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
entry = data.get('entries', [data])[0] if isinstance(data, dict) else data
if isinstance(entry, dict):
    for p in (entry.get('data_properties') or [])[:10]:
        print(f\"    - {p.get('name', '?')} ({p.get('type', '?')})\")
" 2>/dev/null || true
fi

# ── Step 4: Semantic search via context-loader ──────────────────────────────
echo ""
echo "=== Step 4: Semantic search ==="

kweaver context-loader config set --kn-id "$KN_ID" --name example-e2e >/dev/null 2>&1
echo "  Context-loader configured for KN $KN_ID"

echo "  Searching schema: \"采购订单 物料\""
SCHEMA_RAW=$(kweaver context-loader kn-search "采购订单 物料" --only-schema 2>/dev/null \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('raw',''))" 2>/dev/null || true)

echo "$SCHEMA_RAW" | head -10 | sed 's/^/    /'
[ "$(echo "$SCHEMA_RAW" | wc -l)" -gt 10 ] && echo "    ..."

# ── Step 5: Chat with Agent ─────────────────────────────────────────────────
echo ""
echo "=== Step 5: Chat with Agent ==="

# Use provided AGENT_ID or find the first available agent
if [ -z "${AGENT_ID:-}" ]; then
    AGENT_ID=$(kweaver agent list --limit 1 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list) and data:
    print(data[0].get('id', ''))
" 2>/dev/null || true)
fi

if [ -z "$AGENT_ID" ]; then
    echo "  No agent available. Set AGENT_ID in .env or create one."
    echo "  Skipping chat step."
else
    echo "  Agent: $AGENT_ID"

    QUESTION="这个数据库里有哪些核心的业务表？它们之间是什么关系？"

    # Inject schema context so the agent answers with real table info
    if [ -n "$SCHEMA_RAW" ]; then
        PROMPT="以下是通过知识网络检索到的数据库 schema 信息：

${SCHEMA_RAW}

基于以上 schema，请回答：${QUESTION}"
    else
        PROMPT="$QUESTION"
    fi

    echo "  Question: $QUESTION"
    echo ""

    RESPONSE=$(kweaver agent chat "$AGENT_ID" \
        -m "$PROMPT" \
        --no-stream 2>/dev/null)

    echo "  Agent response:"
    echo "$RESPONSE" | fold -s -w 80 | sed 's/^/    /'
fi

echo ""
echo "=== Example complete ==="
