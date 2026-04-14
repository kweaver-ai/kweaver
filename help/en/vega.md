# VEGA Engine

## Overview

**VEGA** provides **data virtualization** over heterogeneous sources: **data connections**, **models**, and **views** (including atomic and composite views). Agents and applications query through a unified SQL-oriented surface instead of wiring each source by hand.

Ingress prefix (typical):

| Prefix | Role |
| --- | --- |
| `/api/vega-backend/v1` | VEGA backend — connections, metadata, query execution |

**Related modules:** [BKN Engine](bkn.md) (semantic layer on top of data), [Context Loader](context-loader.md), [Dataflow](dataflow.md) (pipelines that land or transform data).

## Prerequisites

```bash
export KWEAVER_BASE="https://<access-address>"
export TOKEN="<bearer-token>"
```

---

## CLI

### Health and Diagnostics

```bash
# Quick health check — returns service status and version
kweaver vega health

# Platform statistics: connection count, catalog count, total resources
kweaver vega stats

# Deep inspection: per-catalog health, resource counts, recent errors
kweaver vega inspect
```

### Catalog Management

```bash
# List all registered catalogs
kweaver vega catalog list

# Get details for a single catalog
kweaver vega catalog get <catalog_id>

# Health check for a specific catalog connection
kweaver vega catalog health <catalog_id>

# Test connectivity before registering
kweaver vega catalog test-connection \
  --type mysql \
  --host db.example.com \
  --port 3306 \
  --database mydb \
  --username root \
  --password secret

# Discover schemas and tables from a catalog
kweaver vega catalog discover <catalog_id>

# List resources (tables, views) within a catalog
kweaver vega catalog resources <catalog_id>
```

### Resource Operations

```bash
# List all resources across catalogs
kweaver vega resource list

# Get metadata for a specific resource
kweaver vega resource get <resource_id>

# Query a resource with SQL
kweaver vega resource query <resource_id> "SELECT * FROM t LIMIT 10"

# Preview a resource (first N rows with schema info)
kweaver vega resource preview <resource_id> --rows 20
```

### Connector Types

```bash
# List all supported connector types (mysql, postgres, hive, etc.)
kweaver vega connector-type list

# Get details for a connector type (supported features, config schema)
kweaver vega connector-type get mysql
```

### Dataview Operations

```bash
# List all dataviews
kweaver dataview list

# Search dataviews by name
kweaver dataview find --name "order"

# Get dataview details
kweaver dataview get <dataview_id>

# Query a dataview with SQL
kweaver dataview query <dataview_id> "SELECT order_id, amount FROM t WHERE status = 'active' LIMIT 10"

# Pass SQL via flag instead of positional arg
kweaver dataview query <dataview_id> --sql "SELECT COUNT(*) AS total FROM t"
```

**Custom SQL (`--sql`) and Etrino**: Without `--sql`, `dataview query` uses the view’s stored definition and talks to the data source directly. With `--sql`, traffic goes through **`vega-calculate-coordinator`** (Hetu/Presto–style engine), which is **not** in the default KWeaver Core manifest. Install the **Etrino** charts: `vega-hdfs`, `vega-calculate` (includes the coordinator), and `vega-metadata`. **You do not need to install DIP:** run `./deploy.sh etrino install` from the `deploy` directory to install Etrino only. For a minimal setup you can `helm install` only `kweaver/vega-calculate` and align images and `depServices` yourself. **Use fully-qualified `catalog."schema"."table"` names for ad-hoc SQL.** See **Optional: Etrino** in [Deploy](installation/deploy.md).

### End-to-End Example

```bash
# 1. Check VEGA is healthy
kweaver vega health

# 2. See which connector types are available
kweaver vega connector-type list

# 3. Test connection to a MySQL database
kweaver vega catalog test-connection \
  --type mysql --host db.example.com --port 3306 \
  --database orders_db --username reader --password pass123

# 4. After registering (via API or BKN create-from-ds), discover resources
kweaver vega catalog discover <catalog_id>
kweaver vega catalog resources <catalog_id>

# 5. Query a dataview built from the discovered tables
kweaver dataview find --name "orders"
kweaver dataview query <dataview_id> "SELECT customer_id, SUM(amount) AS total FROM t GROUP BY customer_id ORDER BY total DESC LIMIT 10"
```

---

## Python SDK

```python
from kweaver_sdk import KWeaverClient

client = KWeaverClient(base_url="https://<access-address>")

# Health check
health = client.vega.health()
print(health["status"], health["version"])

# List catalogs
catalogs = client.vega.list_catalogs()
for cat in catalogs:
    print(cat["id"], cat["name"], cat["type"])

# Get catalog details
detail = client.vega.get_catalog("cat-001")

# Test connection before registering
ok = client.vega.test_connection(
    type="mysql",
    host="db.example.com",
    port=3306,
    database="mydb",
    username="root",
    password="secret",
)
print("reachable:", ok["success"])

# Discover schemas and tables
schemas = client.vega.discover_catalog("cat-001")

# List resources
resources = client.vega.list_resources()
for r in resources:
    print(r["id"], r["name"], r["catalog_id"])

# Query a resource with SQL
rows = client.vega.query_resource("res-001", sql="SELECT * FROM t LIMIT 5")

# List dataviews
views = client.vega.list_dataviews()

# Query a dataview
result = client.vega.query_dataview(
    dataview_id="dv-001",
    sql="SELECT order_id, amount FROM t WHERE status = 'active' LIMIT 10",
)
for row in result["data"]:
    print(row)

# List connector types
connectors = client.vega.list_connector_types()
for ct in connectors:
    print(ct["name"], ct["supported_features"])
```

---

## TypeScript SDK

```typescript
import { KWeaverClient } from '@kweaver-ai/kweaver-sdk';

const client = new KWeaverClient({ baseUrl: 'https://<access-address>' });

// Health check
const health = await client.vega.health();
console.log(health.status, health.version);

// List catalogs
const catalogs = await client.vega.listCatalogs();
catalogs.forEach((cat) => console.log(cat.id, cat.name, cat.type));

// Test connection
const ok = await client.vega.testConnection({
  type: 'mysql',
  host: 'db.example.com',
  port: 3306,
  database: 'mydb',
  username: 'root',
  password: 'secret',
});
console.log('reachable:', ok.success);

// Discover and list resources
const schemas = await client.vega.discoverCatalog('cat-001');
const resources = await client.vega.listResources();

// Query a dataview
const result = await client.vega.queryDataview({
  dataviewId: 'dv-001',
  sql: "SELECT order_id, amount FROM t WHERE status = 'active' LIMIT 10",
});
result.data.forEach((row) => console.log(row));

// Connector types
const connectors = await client.vega.listConnectorTypes();
connectors.forEach((ct) => console.log(ct.name, ct.supportedFeatures));
```

---

## curl

```bash
# Health check
curl -sk "$KWEAVER_BASE/api/vega-backend/v1/health" \
  -H "Authorization: Bearer $TOKEN"

# List catalogs
curl -sk "$KWEAVER_BASE/api/vega-backend/v1/catalogs" \
  -H "Authorization: Bearer $TOKEN"

# Get a single catalog
curl -sk "$KWEAVER_BASE/api/vega-backend/v1/catalogs/cat-001" \
  -H "Authorization: Bearer $TOKEN"

# Test a connection
curl -sk -X POST "$KWEAVER_BASE/api/vega-backend/v1/catalogs/test-connection" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "mysql",
    "host": "db.example.com",
    "port": 3306,
    "database": "mydb",
    "username": "root",
    "password": "secret"
  }'

# Discover schemas within a catalog
curl -sk "$KWEAVER_BASE/api/vega-backend/v1/catalogs/cat-001/discover" \
  -H "Authorization: Bearer $TOKEN"

# List resources in a catalog
curl -sk "$KWEAVER_BASE/api/vega-backend/v1/catalogs/cat-001/resources" \
  -H "Authorization: Bearer $TOKEN"

# Query a resource via SQL
curl -sk -X POST "$KWEAVER_BASE/api/vega-backend/v1/resources/res-001/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM t LIMIT 10"}'

# List dataviews
curl -sk "$KWEAVER_BASE/api/vega-backend/v1/dataviews" \
  -H "Authorization: Bearer $TOKEN"

# Query a dataview
curl -sk -X POST "$KWEAVER_BASE/api/vega-backend/v1/dataviews/dv-001/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT order_id, amount FROM t WHERE status = '\''active'\'' LIMIT 10"}'

# List connector types
curl -sk "$KWEAVER_BASE/api/vega-backend/v1/connector-types" \
  -H "Authorization: Bearer $TOKEN"

# Get connector type details
curl -sk "$KWEAVER_BASE/api/vega-backend/v1/connector-types/mysql" \
  -H "Authorization: Bearer $TOKEN"
```
