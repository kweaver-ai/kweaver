# 🚢 安装与部署

本页说明 KWeaver Core 的**环境要求**、**部署步骤**与**安装后检查**。

> 📌 安装通过产品包或源码中的 `deploy/` 目录下的 `deploy.sh` 脚本完成。

---

## 🧱 环境要求

部署前，请准备好主机、网络与客户端工具。

### 💻 主机要求

> ⚠️ 安装过程需以 `root` 或 `sudo` 执行。

| 项 | 最低 | 推荐 |
| --- | --- | --- |
| 🖥️ 操作系统 | CentOS 8+、openEuler 23+ | CentOS 8+ |
| ⚙️ CPU | 16 核 | 16 核 |
| 🧠 内存 | 48 GB | 64 GB |
| 💾 磁盘 | 200 GB | 500 GB |

### 🛠️ 主机准备（典型 Linux）

```bash
# 1. 关闭防火墙（或按策略放行端口）
systemctl stop firewalld && systemctl disable firewalld

# 2. 关闭 swap
swapoff -a && sed -i '/ swap / s/^/#/' /etc/fstab

# 3. 按需将 SELinux 设为 permissive
setenforce 0

# 4. 安装容器运行时（示例：containerd）
# dnf install containerd.io   # 按发行版调整
```

> 💡 具体步骤因发行版而异；完整清单以随产品提供的部署说明为准。

### 🌐 网络访问

部署脚本可能需要访问外网镜像与仓库：

| 域名 | 用途 |
| --- | --- |
| `mirrors.aliyun.com` | RPM 镜像 |
| `mirrors.tuna.tsinghua.edu.cn` | containerd RPM 镜像 |
| `registry.aliyuncs.com` | Kubernetes 镜像 |
| `swr.cn-east-3.myhuaweicloud.com` | KWeaver 镜像 |
| `repo.huaweicloud.com` | Helm 二进制 |
| `kweaver-ai.github.io` | Helm Chart 仓库 |

### 🧰 客户端工具

在能访问集群的工作机上需要：

- 🔧 **kubectl** — 可选，用于集群健康检查
- 🚀 **kweaver CLI** — KWeaver 命令行（通过 npm 安装 `@kweaver-ai/kweaver-sdk`）

```bash
npm install -g @kweaver-ai/kweaver-sdk
# 或免安装直接运行：
npx kweaver --help
```

- 🌐 **curl** — 直接调用 HTTP API

---

## 📥 进入 deploy 目录

在已解压的产品目录或构建环境中：

```bash
cd deploy
chmod +x deploy.sh
```

> ℹ️ 若目录名不同，请以实际发布包中的 `deploy` 路径为准。

---

## 🚀 安装 KWeaver Core

### ⚡ 最小化安装（首次体验推荐）

跳过部分可选模块（如认证、业务域），资源占用更小：

```bash
./deploy.sh kweaver-core install --minimum
```

等价写法：

```bash
./deploy.sh kweaver-core install \
  --set auth.enabled=false \
  --set businessDomain.enabled=false
```

### 📦 完整安装

包含认证与业务域等组件：

```bash
./deploy.sh kweaver-core install
```

> 💡 脚本可能交互式询问 **访问地址**，并自动探测 **API Server 地址**。

### 🤖 非交互安装

```bash
./deploy.sh kweaver-core install \
  --access_address=<你的IP或域名> \
  --api_server_address=<K8s API 绑定的网卡 IP>
```

- `--access_address` — 客户端访问 KWeaver（Ingress）所用的地址
- `--api_server_address` — Kubernetes API Server 绑定的真实网卡 IP

### 🔌 自定义 Ingress 端口（可选）

```bash
export INGRESS_NGINX_HTTP_PORT=8080
export INGRESS_NGINX_HTTPS_PORT=8443
./deploy.sh kweaver-core install
```

### 🧾 常用命令

```bash
./deploy.sh kweaver-core status
./deploy.sh kweaver-core uninstall
./deploy.sh --help
```

### 📋 安装内容概览

1. 单节点 Kubernetes（如需要）、存储、Ingress
2. 数据服务：MariaDB、Redis、Kafka、ZooKeeper、OpenSearch（以发布清单为准）
3. KWeaver Core 应用 Helm Chart

> ℹ️ 卸载与集群重置以随产品提供的部署说明为准。

---

## ✅ 安装完成后（检查集群与 API）

`deploy.sh kweaver-core install` 结束后，请确认集群正常且能访问平台。

### ☸️ Kubernetes 状态

```bash
kubectl get nodes
kubectl get pods -A
```

> 💡 等待核心命名空间中关键工作负载为 `Running` / `Ready`。

### 🩺 部署脚本状态

```bash
./deploy.sh kweaver-core status
```

### 🔑 CLI 登录与验证

```bash
kweaver auth login https://<访问地址> -k
kweaver bkn list
```

> `<访问地址>` 与 `--access_address` 或安装提示的节点地址一致；`-k` 用于自签名证书，正式证书可省略。

### 🌐 HTTP 健康检查（可选）

```bash
curl -sk "https://<访问地址>/health" || true
```

> ℹ️ 具体路径因 Ingress 与版本而异；子系统路由以环境中的 OpenAPI 为准。

---

## 🧮 可选：Etrino（数据视图自定义 SQL）

仅安装 **KWeaver Core** 时，`kweaver dataview query <id>` 不带 `--sql` 通常已可用（按视图定义分页查询等）。

> ⚠️ `kweaver dataview query --sql "..."` 自定义 SQL 依赖集群内的 `vega-calculate-coordinator`，由 **Etrino** 相关 Chart 提供（与 `vega-hdfs`、`vega-calculate`（内含 coordinator）、`vega-metadata` 一并部署）。

在已存在 Core 的集群上，使用 `deploy.sh` 的 `etrino` 子命令即可：

```bash
./deploy.sh etrino install
./deploy.sh etrino status
./deploy.sh etrino uninstall
```

> 💡 如需指定配置文件，可附加 `--config=/path/to/config.yaml`。安装会检查 Helm、为节点打标签、创建 HDFS 所需目录、添加 Helm 仓库别名 `myrepo`（`https://kweaver-ai.github.io/helm-repo/`），依次安装 `vega-hdfs → vega-calculate → vega-metadata`。请保证节点磁盘与资源足够，镜像仓库对你的环境可达（chart 默认镜像可能与 Core 所用仓库不同，必要时在 values 或 chart 升级中覆盖 `image.registry` 等）。

> 📌 **若仍会安装 DIP**：`./deploy.sh kweaver-dip install` 在完成 DIP 图表后也会执行同一套 Etrino 安装逻辑，无需重复安装。

---

## 🧠 配置模型

KWeaver 默认不包含预置模型。如需使用 **语义搜索**（`kweaver bkn search`）或 **Decision Agent**，需先注册 LLM 与 Embedding 小模型。

> 🔧 详细操作见 [模型管理](model.md)。以下为最小注册示例：

```bash
# 注册 LLM（以 DeepSeek 为例）
kweaver call /api/mf-model-manager/v1/llm/add -d '{
  "model_name": "deepseek-chat",
  "model_series": "deepseek",
  "max_model_len": 8192,
  "model_config": {
    "api_key": "<你的 API Key>",
    "api_model": "deepseek-chat",
    "api_url": "https://api.deepseek.com/chat/completions"
  }
}'

# 注册 Embedding 模型
kweaver call /api/mf-model-manager/v1/small-model/add -d '{
  "model_name": "bge-m3",
  "model_type": "embedding",
  "model_config": {
    "api_url": "https://api.siliconflow.cn/v1/embeddings",
    "api_model": "BAAI/bge-m3",
    "api_key": "<你的 API Key>"
  },
  "batch_size": 32,
  "max_tokens": 512,
  "embedding_dim": 1024
}'

# 验证
kweaver call '/api/mf-model-manager/v1/llm/list?page=1&size=50'
kweaver call '/api/mf-model-manager/v1/small-model/list?page=1&size=50'
```

> 🔧 启用 BKN 语义搜索还需修改 ConfigMap，见 [模型管理 — 启用 BKN 语义搜索](model.md#启用-bkn-语义搜索)。

---

## 🔧 故障排查

如遇安装或 Pod 异常，请结合 `kubectl` 日志与部署脚本输出排查；详细清单以随产品提供的运维文档为准。

---

## 📖 下一步

| 目标 | 文档 |
| --- | --- |
| 🚀 上手第一条命令、首次创建 BKN | [快速开始](quick-start.md) |
| 🧠 模型注册、测试与管理 | [模型管理](model.md) |
| 🔧 启用 BKN 语义搜索（ConfigMap） | [启用 BKN 语义搜索](model.md#启用-bkn-语义搜索) |
