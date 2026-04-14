# Quick Start

This walkthrough assumes KWeaver Core is already [deployed](installation/deploy.md), including the post-install checks in that page.

> **Model configuration note**: Semantic search (Step 4) and Agent chat (Step 5) require LLM and Embedding models. A `--minimum` install does not include pre-configured models — complete the [model configuration in the deploy guide](installation/deploy.md#configure-models-required-for-semantic-search-and-agent) first. Data source connection, knowledge network creation, and conditional queries work without models.

---

## Scenario: First Semantic Search in 5 Minutes

**Story**: You just deployed KWeaver Core. You have a MySQL database with ERP data. Your goal is to turn the database into a knowledge network and search it with natural language — "which orders are overdue?"

### Step 1: Authenticate

> If the `kweaver` CLI is not yet installed, run `npm install -g @kweaver-ai/kweaver-sdk` first (or `npx kweaver --help` to try without a global install).

```bash
kweaver auth login <platform-url> -k
```

- `<platform-url>` is the access address printed by `deploy.sh` after installation completes.
- `-k` skips TLS certificate verification — use it with self-signed certificates; omit if you have a valid cert.
- If multiple business domains were configured during installation, verify the active domain after login:

```bash
kweaver config show
# If later commands return empty results, try switching to the correct domain:
kweaver config list-bd
kweaver config set-bd <uuid>
```

### Step 2: Connect a Data Source

```bash
kweaver ds connect mysql db.example.com 3306 erp \
  --account root --password pass123
# → returns ds_id, e.g. ds-abc123
```

Arguments: `mysql` is the data source type (supports mysql / postgresql / hive, etc.), followed by **host**, **port**, **database name**. `--account` and `--password` are the connection credentials.

Inspect what's available:

```bash
kweaver ds list
kweaver ds tables ds-abc123
```

### Step 3: Create a Knowledge Network

**Option A: CLI one-liner**

```bash
kweaver bkn create-from-ds ds-abc123 \
  --name "erp-supply-chain" \
  --tables "orders,products,customers" \
  --build --timeout 600
```

This single command discovers table schemas, creates object types, maps fields, and builds the search index.

> **Note**: `create-from-ds` automatically selects a primary key and display key. If the source table has no explicit primary key, the auto-selection may be suboptimal (e.g. choosing `status`), causing records with the same key value to be merged. You can later fix this with `kweaver bkn object-type update`.

**Option B: Via AI coding assistant**

If you have installed the [AI Agent Skills](https://github.com/kweaver-ai/kweaver-sdk) (see the root [README](../../README.md#ai-agent-skills) for setup), you can use natural language in your AI coding assistant (Cursor, Claude Code, etc.):

```
Create a knowledge network called erp-supply-chain from datasource ds-abc123 using the orders, products, and customers tables
```

Or use the slash command:

```
/kweaver-core Create a knowledge network from datasource ds-abc123 with tables orders, products, customers, name it erp-supply-chain
```

The skill will automatically invoke the `kweaver` CLI to discover the datasource, create object types, and build indexes.

**Verify**

Regardless of which method you used, verify the result:

```bash
kweaver bkn object-type list <kn_id>
# → orders (ot-1), products (ot-2), customers (ot-3)
```

### Step 4: Semantic Search

> Semantic search requires an Embedding model. If not configured, this step returns an error. See [model configuration](installation/deploy.md#configure-models-required-for-semantic-search-and-agent). The **conditional query** below works without an Embedding model.

```bash
kweaver bkn search <kn_id> "overdue orders"
```

Returns concepts and instances semantically related to "overdue orders". Drill down with a conditional query:

```bash
kweaver bkn object-type query <kn_id> ot-1 \
  '{"limit":10,"condition":{"field":"status","operation":"==","value":"overdue"}}'
```

**Congratulations** — you went from a blank platform to natural-language database search.

---

## Scenario: Same Thing, With the TypeScript SDK

If you prefer code over CLI, here's the same flow in TypeScript.

> Full runnable examples at [kweaver-sdk/examples](https://github.com/kweaver-ai/kweaver-sdk/tree/main/examples).

### Simplest Way (Simple API — 3 Lines of Code)

```typescript
import kweaver from '@kweaver-ai/kweaver-sdk/kweaver';

kweaver.configure({ config: true }); // auto-reads ~/.kweaver/ credentials

const knList = await kweaver.bkns({ limit: 10 });
console.log(`Found ${knList.length} knowledge network(s)`);

const result = await kweaver.search('overdue orders', { bknId: knList[0].id, maxConcepts: 5 });
for (const c of result.concepts ?? []) {
  console.log(`${c.concept_name} (score: ${c.intent_score})`);
}
```

### Full Control (Client API)

```typescript
import { KWeaverClient } from '@kweaver-ai/kweaver-sdk';

// Auto-reads credentials from ~/.kweaver/ (written by `kweaver auth login`)
const client = await KWeaverClient.connect();
```

### Discover Knowledge Networks

```typescript
const knList = await client.knowledgeNetworks.list({ limit: 10 });
for (const kn of knList) {
  console.log(`${kn.name} (${kn.id})`);
}
```

### Browse the Schema: Object Types, Relations, Actions

```typescript
const knId = knList[0].id;

const objectTypes = await client.knowledgeNetworks.listObjectTypes(knId);
for (const ot of objectTypes) {
  console.log(`${ot.name} — ${ot.properties?.length ?? 0} properties`);
}

const relationTypes = await client.knowledgeNetworks.listRelationTypes(knId);
for (const rt of relationTypes) {
  console.log(`${rt.source_object_type?.name} —[${rt.name}]→ ${rt.target_object_type?.name}`);
}

const actionTypes = await client.knowledgeNetworks.listActionTypes(knId);
```

### Query Instances & Subgraph Traversal

```typescript
const otId = objectTypes[0].id;

// Conditional query
const instances = await client.bkn.queryInstances(knId, otId, {
  limit: 5,
  condition: { field: 'status', operation: '==', value: 'overdue' },
});
console.log(instances.datas);

// Subgraph traversal (expand along a relation type)
const rt = relationTypes[0];
const subgraph = await client.bkn.querySubgraph(knId, {
  relation_type_paths: [{
    relation_types: [{
      relation_type_id: rt.id,
      source_object_type_id: rt.source_object_type?.id,
      target_object_type_id: rt.target_object_type?.id,
    }],
  }],
  limit: 5,
});
```

### Semantic Search

```typescript
const result = await client.bkn.semanticSearch(knId, 'overdue orders');
for (const concept of result.concepts ?? []) {
  console.log(`${concept.concept_name} (score: ${concept.intent_score})`);
}
```

### Context Loader (MCP Layered Retrieval)

```typescript
const { baseUrl } = client.base();
const mcpUrl = `${baseUrl}/api/agent-retrieval/v1/mcp`;
const cl = client.contextLoader(mcpUrl, knId);

// Layer 1: Schema search
const schema = await cl.schemaSearch({ query: 'orders', max_concepts: 5 });

// Layer 2: Instance query
const mcpInstances = await cl.queryInstances({ ot_id: otId, limit: 5 });
```

---

## Scenario: Create an Agent and Chat

**Story**: The knowledge network is built. Now you want to give your business team a natural-language interface — no SQL needed, just ask questions and get answers.

> **Prerequisite**: Agents require an LLM and an Embedding model. If not yet configured, complete [model configuration](installation/deploy.md#configure-models-required-for-semantic-search-and-agent) first.

### CLI

```bash
# Check registered LLMs (to get llm_id)
curl -sk "https://<platform-url>/api/mf-model-manager/v1/llm/list?page=1&size=50"

# List available templates (may be empty on --minimum installs)
kweaver agent template-list

# Create an Agent (specify --llm-id)
kweaver agent create \
  --name "Supply Chain Assistant" \
  --profile "Answer supply chain questions" \
  --llm-id <llm_id>

# If templates are available, create from a template config
kweaver agent template-get <template_id> --save-config /tmp/config.json
kweaver agent create \
  --name "Supply Chain Assistant" \
  --profile "Answer supply chain questions" \
  --config /tmp/config-*.json

# Bind the knowledge network
kweaver agent update <agent_id> --knowledge-network-id <kn_id>

# Publish (required before chatting)
kweaver agent publish <agent_id>

# Single-turn chat
kweaver agent chat <agent_id> -m "How many orders are overdue this month?"

# Interactive multi-turn chat
kweaver agent chat <agent_id>
# > Which suppliers have the slowest delivery?
# > What improvements do you suggest?
```

### TypeScript SDK

```typescript
// List agents
const agents = await client.agents.list({ limit: 10 });

// Single-turn chat
const reply = await client.agents.chat(agentId, 'How many orders are overdue this month?');
console.log(reply.text);

// Inspect the reasoning chain
for (const step of reply.progress ?? []) {
  console.log(`[${step.skill_info?.type}] ${step.skill_info?.name} → ${step.status}`);
}

// Streaming chat (real-time output)
let prevLen = 0;
await client.agents.stream(agentId, 'Which suppliers have the slowest delivery?', {
  onTextDelta: (fullText) => {
    process.stdout.write(fullText.slice(prevLen));
    prevLen = fullText.length;
  },
  onProgress: (progress) => {
    for (const p of progress) {
      console.log(`[progress] ${p.skill_info?.name} → ${p.status}`);
    }
  },
});

// Conversation history
const sessions = await client.conversations.list(agentId, { limit: 5 });
const messages = await client.conversations.listMessages(conversationId, { limit: 20 });
```

---

## Scenario: Trace the Reasoning (Trace AI)

**Story**: The agent's answer looks wrong. You want to know exactly what data it queried, which tools it called, and how long each step took.

```bash
# List conversation sessions
kweaver agent sessions <agent_id>

# Get the full trace
kweaver agent trace <conversation_id> --pretty
```

The trace returns a Span tree ordered by time, showing:
- The agent's planning and reasoning steps
- Tool calls (BKN query, VEGA SQL, external API)
- Inputs, outputs, and latency per step
- Context assembled by Context Loader

```
[HTTP Request] → [Intent Recognition] → [BKN Query] → [SQL Execution] → [Answer Generation]
      ↓                 ↓                    ↓               ↓                  ↓
  User question    "find overdue"       Conditional      3 results         "There are 3..."
   received         identified          ot: orders       from VEGA          composed
```

---

## Scenario: Build a Knowledge Network From CSV Files

**Story**: You don't have a database — just a few CSV reports.

```bash
# List available data sources (CSV needs an intermediate store)
kweaver ds list

# Import CSV into a data source
kweaver ds import-csv <ds_id> --files "materials.csv,inventory.csv" --table-prefix sc_

# Create and build the knowledge network
kweaver bkn create-from-csv <ds_id> \
  --files "materials.csv,inventory.csv" \
  --name "supply-reports" --build

# Verify
kweaver bkn search <kn_id> "zero inventory"
```

---

## Scenario: VEGA Data Views & SQL

**Story**: You want to run SQL directly against the underlying data, bypassing the knowledge network.

```bash
# Platform health check
kweaver vega inspect

# List catalogs
kweaver vega catalog list

# Browse resources in a catalog
kweaver vega catalog resources <catalog_id> --category table

# Find data views
kweaver dataview find --name "supplier_entity"

# Query a data view (uses the view's stored definition)
kweaver dataview query <view_id> --limit 10

# Custom SQL query (use fully-qualified catalog."schema"."table" names)
kweaver dataview query <view_id> --sql "SELECT supplier_name, city FROM <catalog>.\"supply_chain\".\"supplier_entity\" LIMIT 10"
```

On a **Core-only** install, `dataview query` without `--sql` supports structured reads (pagination, column selection, etc.). **Ad-hoc `--sql`** requires **`vega-calculate-coordinator`**, shipped as part of the **Etrino** stack (`vega-hdfs`, `vega-calculate`, `vega-metadata`). **You do not need DIP:** from the `deploy` directory run `./deploy.sh etrino install`. See [Deploy](installation/deploy.md) and [VEGA](vega.md).

---

## Scenario: Dataflow Pipeline Orchestration

**Story**: You have a document-processing pipeline and need to upload a PDF to trigger parsing.

```bash
# List flows
kweaver dataflow list

# Trigger a run with file upload
kweaver dataflow run <dag_id> --file ./contract.pdf

# View today's runs
kweaver dataflow runs <dag_id> --since 2026-04-14

# View execution logs (with inputs/outputs)
kweaver dataflow logs <dag_id> <instance_id> --detail
```

---

## Where to Go Next

| Goal | Doc |
| --- | --- |
| Full BKN operations (schema, conditional queries, actions) | [bkn.md](bkn.md) |
| Data virtualization & catalog management | [vega.md](vega.md) |
| Agent lifecycle | [decision-agent.md](decision-agent.md) |
| Pipeline orchestration details | [dataflow.md](dataflow.md) |
| MCP layered retrieval | [context-loader.md](context-loader.md) |
| Tools & skill management | [execution-factory.md](execution-factory.md) |
| Trace & evidence chain | [trace-ai.md](trace-ai.md) |
| Auth & security governance | [isf.md](isf.md) |

Full SDK example code at [kweaver-sdk/examples](https://github.com/kweaver-ai/kweaver-sdk/tree/main/examples).
