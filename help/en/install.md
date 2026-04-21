# 🚢 Ship and deploy

This page covers **prerequisites**, **install steps**, and **post-install checks** for KWeaver Core.

> Use the `deploy.sh` script under the `deploy/` directory from your product bundle or build tree.

---

## 🧱 Prerequisites

Prepare the host, network, and client tooling before you deploy.

### Host requirements

> Run installation as `root` or with `sudo`.

| Item | Minimum | Recommended |
| --- | --- | --- |
| OS | CentOS 8+, openEuler 23+ | CentOS 8+ |
| CPU | 16 cores | 16 cores |
| Memory | 48 GB | 64 GB |
| Disk | 200 GB | 500 GB |

### Host preparation (typical Linux)

```bash
# 1. Disable firewall (or open required ports per your policy)
systemctl stop firewalld && systemctl disable firewalld

# 2. Disable swap
swapoff -a && sed -i '/ swap / s/^/#/' /etc/fstab

# 3. SELinux permissive if needed
setenforce 0

# 4. Install container runtime (example: containerd)
# dnf install containerd.io   # adjust for your distro
```

> Exact steps depend on your OS; follow the deployment guide shipped with your release.

### Network access

The deploy scripts may need outbound access to mirrors and registries, for example:

| Domain | Purpose |
| --- | --- |
| `mirrors.aliyun.com` | RPM mirrors |
| `mirrors.tuna.tsinghua.edu.cn` | containerd RPM mirror |
| `registry.aliyuncs.com` | Kubernetes images |
| `swr.cn-east-3.myhuaweicloud.com` | KWeaver images |
| `repo.huaweicloud.com` | Helm binary |
| `kweaver-ai.github.io` | Helm chart repo |

### Client tooling (after deploy)

On your workstation (with network access to the cluster):

- **kubectl** — optional but useful for health checks
- **kweaver CLI** — install via npm package `@kweaver-ai/kweaver-sdk`

```bash
npm install -g @kweaver-ai/kweaver-sdk
# or: npx kweaver --help
```

- **curl** — for raw HTTP API calls

---

## 📥 Enter the deploy directory

From your extracted bundle or repo:

```bash
cd deploy
chmod +x deploy.sh
```

> Adjust the path if your layout differs.

---

## 🚀 Install KWeaver Core

### Minimum install (recommended for first try)

Skips some optional modules (e.g. auth / business domain) for a lighter footprint:

```bash
./deploy.sh kweaver-core install --minimum
```

Equivalent flags:

```bash
./deploy.sh kweaver-core install --set auth.enabled=false --set businessDomain.enabled=false
```

### Full install

Includes auth and business-domain related components:

```bash
./deploy.sh kweaver-core install
```

> The script may prompt for **access address** and detect **API server address** automatically.

### Non-interactive install

```bash
./deploy.sh kweaver-core install \
  --access_address=<your-ip-or-domain> \
  --api_server_address=<nic-ip-for-k8s-api>
```

- `--access_address` — URL or IP clients use to reach KWeaver (ingress)
- `--api_server_address` — real NIC IP bound for the Kubernetes API server

### Custom ingress ports (optional)

```bash
export INGRESS_NGINX_HTTP_PORT=8080
export INGRESS_NGINX_HTTPS_PORT=8443
./deploy.sh kweaver-core install
```

### Useful commands

```bash
./deploy.sh kweaver-core status
./deploy.sh kweaver-core uninstall
./deploy.sh --help
```

### What gets installed

1. Single-node Kubernetes (if needed), storage, ingress
2. Data services: MariaDB, Redis, Kafka, ZooKeeper, OpenSearch (as defined by release manifests)
3. KWeaver Core application Helm charts

> For uninstall and cluster reset, follow the operations guide bundled with your release.

---

## ✅ After install (check cluster and API)

When `deploy.sh kweaver-core install` finishes, confirm the cluster and that you can reach the platform.

### Kubernetes

```bash
kubectl get nodes
kubectl get pods -A
```

> Wait until core namespaces show `Running` / `Ready` for critical workloads.

### Deploy script status

```bash
./deploy.sh kweaver-core status
```

### CLI

```bash
kweaver auth login https://<access-address> -k
kweaver bkn list
```

> Use the same host as `--access_address` or the node IP from the installer. Omit `-k` when using a trusted TLS certificate.

### HTTP (optional)

```bash
curl -sk "https://<access-address>/health" || true
```

> Exact paths depend on your ingress and version; use OpenAPI from your environment for subsystem routes.

---

## 🧮 Optional: Etrino (dataview `--sql`)

On a **KWeaver Core–only** install, `kweaver dataview query <id>` without `--sql` usually works (paging against the view definition).

> **Ad-hoc SQL** via `kweaver dataview query --sql "..."` requires **`vega-calculate-coordinator`** in the cluster. That comes from the **Etrino** Helm stack: **`vega-hdfs`**, **`vega-calculate`** (includes the coordinator), and **`vega-metadata`**.

On a cluster where Core is already running:

```bash
./deploy.sh etrino install
./deploy.sh etrino status
./deploy.sh etrino uninstall
```

> Add `--config=/path/to/config.yaml` if needed. The flow adds the Helm repo alias **`myrepo`** (`https://kweaver-ai.github.io/helm-repo/`), labels nodes, prepares HDFS directories, and installs **`vega-hdfs` → `vega-calculate` → `vega-metadata`**. Ensure nodes have disk and resources; override `image.registry` / values when chart defaults do not match your registry.

> **If you install DIP anyway:** `./deploy.sh kweaver-dip install` runs the same Etrino installation flow after DIP charts, so you do not need to run it twice.

---

## 🧠 Configure models

KWeaver does not include pre-configured models by default. To use **semantic search** (`kweaver bkn search`) or **Decision Agent**, register an LLM and an Embedding model first.

> Full details: [Model management](model.md). Minimal registration example:

```bash
# Register an LLM (DeepSeek example)
kweaver call /api/mf-model-manager/v1/llm/add -d '{
  "model_name": "deepseek-chat",
  "model_series": "deepseek",
  "max_model_len": 8192,
  "model_config": {
    "api_key": "<your-api-key>",
    "api_model": "deepseek-chat",
    "api_url": "https://api.deepseek.com/chat/completions"
  }
}'

# Register an Embedding model
kweaver call /api/mf-model-manager/v1/small-model/add -d '{
  "model_name": "bge-m3",
  "model_type": "embedding",
  "model_config": {
    "api_url": "https://api.siliconflow.cn/v1/embeddings",
    "api_model": "BAAI/bge-m3",
    "api_key": "<your-api-key>"
  },
  "batch_size": 32,
  "max_tokens": 512,
  "embedding_dim": 1024
}'

# Verify
kweaver call '/api/mf-model-manager/v1/llm/list?page=1&size=50'
kweaver call '/api/mf-model-manager/v1/small-model/list?page=1&size=50'
```

> Enabling BKN semantic search also requires a ConfigMap change — see [Model management — Enable BKN semantic search](model.md#enable-bkn-semantic-search).

---

## 🔧 Troubleshooting

Use `kubectl` logs and deploy script output; follow the operations guide bundled with your release for a full checklist.

---

## 📖 Next steps

| Goal | Doc |
| --- | --- |
| First commands and BKN | [Quick start](quick-start.md) |
| Model registration | [Model management](model.md) |
| Enable BKN semantic search | [Enable BKN semantic search](model.md#enable-bkn-semantic-search) |
