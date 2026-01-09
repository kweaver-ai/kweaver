# MongoDB Helm Chart

这是一个从 `proton-mongodb-operator` 反推出来的简化 MongoDB Helm Chart，只包含 MongoDB 核心功能，不包含 mgmt 和 exporter。

## 功能特性

- MongoDB StatefulSet 部署
- **默认单节点副本集模式**（`replSet.enabled=true`, `replicas=1`）
- 支持多节点副本集扩展
- 支持动态存储和本地存储
- 支持 TLS 加密（可选）
- 支持 ClusterIP 和 NodePort 服务类型
- 自动健康检查（liveness 和 readiness probes）
- 自动初始化副本集

## 前置要求

1. Kubernetes 1.19+
2. Helm 3.0+
3. 如果使用动态存储，需要配置 StorageClass
4. 如果使用本地存储，需要手动创建 PV

## 安装

### 1. 创建 Secret（如果不在 Chart 中创建）

```bash
# 创建包含 MongoDB 认证信息的 Secret
kubectl create secret generic mongodb-secret \
  --from-literal=username=admin \
  --from-literal=password=your-password \
  --from-literal=mongodb.keyfile=$(openssl rand -base64 1024)
```

### 2. 使用动态存储安装

```bash
helm install mongodb ./scripts/charts/mongodb \
  --namespace resource \
  --set storage.storageClassName=local-path \
  --set storage.capacity=10Gi \
  --set secret.createSecret=true \
  --set secret.password=your-password
```

### 3. 使用本地存储安装

首先需要手动创建 PV，然后：

```bash
helm install mongodb ./scripts/charts/mongodb \
  --namespace resource \
  --set storage.storageClassName="" \
  --set secret.createSecret=true \
  --set secret.password=your-password
```

## 配置说明

### 主要配置项

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `mongodb.replicas` | MongoDB 副本数 | `1` |
| `mongodb.replSet.enabled` | 是否启用副本集 | `true`（单节点副本集模式） |
| `mongodb.replSet.name` | 副本集名称 | `rs0` |
| `mongodb.image.repository` | MongoDB 镜像仓库 | `acr.aishu.cn/proton/proton-mongo` |
| `mongodb.image.tag` | MongoDB 镜像标签 | `2.1.0-feature-mongo-4.4.30` |
| `mongodb.service.type` | 服务类型 | `ClusterIP` |
| `mongodb.service.port` | 服务端口 | `30280` |
| `mongodb.conf.wiredTigerCacheSizeGB` | WiredTiger 缓存大小 | `4` |
| `storage.storageClassName` | 存储类名称 | `""` (空字符串表示使用本地存储) |
| `storage.capacity` | 存储容量 | `10Gi` |
| `secret.name` | Secret 名称 | `mongodb-secret` |
| `secret.createSecret` | 是否创建 Secret | `false` |

### 完整配置示例

**默认配置（单节点副本集）**：
```yaml
mongodb:
  image:
    repository: acr.aishu.cn/proton/proton-mongo
    tag: "2.1.0-feature-mongo-4.4.30"
    pullPolicy: IfNotPresent
  replicas: 1
  replSet:
    enabled: true  # 默认启用单节点副本集
    name: "rs0"
```

**多节点副本集配置**：
```yaml
mongodb:
  image:
    repository: acr.aishu.cn/proton/proton-mongo
    tag: "2.1.0-feature-mongo-4.4.30"
    pullPolicy: IfNotPresent
  replicas: 3
  replSet:
    enabled: true
    name: "rs0"
  service:
    type: ClusterIP
    port: 30280
    enableDualStack: false
  conf:
    wiredTigerCacheSizeGB: 4
    tls:
      enabled: false
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: "1"
      memory: 1Gi

storage:
  storageClassName: "local-path"
  capacity: 10Gi

secret:
  name: mongodb-secret
  createSecret: true
  username: admin
  password: "your-password"
```

## 副本集配置

### 启用副本集

MongoDB 支持单节点和多节点副本集模式：

#### 单节点副本集（推荐用于开发环境）

```bash
export MONGODB_REPLSET_ENABLED=true
export MONGODB_REPLICAS=1  # 单节点副本集
export MONGODB_REPLSET_NAME=rs0
./init_infra.sh mongodb init
```

#### 多节点副本集（推荐用于生产环境）

```bash
export MONGODB_REPLSET_ENABLED=true
export MONGODB_REPLICAS=3  # 多节点副本集（推荐奇数个）
export MONGODB_REPLSET_NAME=rs0
./init_infra.sh mongodb init
```

**自动初始化**：
- 脚本会自动检测 Pod 就绪后初始化副本集
- 副本集初始化会在数据库创建之前完成
- 如果副本集已经初始化，脚本会跳过初始化步骤

### 手动初始化副本集（如果需要）

如果自动初始化失败，可以手动初始化：

**单节点副本集**：
```bash
# 连接到 MongoDB Pod
kubectl exec -it mongodb-mongodb-0 -n resource -c mongodb -- mongosh --port 28000 -u admin -p your-password --authenticationDatabase admin

# 在 MongoDB shell 中执行
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb-mongodb-0.mongodb-mongodb.resource.svc.cluster.local:28000" }
  ]
})

# 检查副本集状态
rs.status()
```

**多节点副本集**：
```bash
# 连接到 MongoDB Pod
kubectl exec -it mongodb-mongodb-0 -n resource -c mongodb -- mongosh --port 28000 -u admin -p your-password --authenticationDatabase admin

# 在 MongoDB shell 中执行
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb-mongodb-0.mongodb-mongodb.resource.svc.cluster.local:28000", priority: 2 },
    { _id: 1, host: "mongodb-mongodb-1.mongodb-mongodb.resource.svc.cluster.local:28000", priority: 1 },
    { _id: 2, host: "mongodb-mongodb-2.mongodb-mongodb.resource.svc.cluster.local:28000", priority: 1 }
  ]
})

# 检查副本集状态
rs.status()
```

### 副本集要求

- **单节点副本集**：`replicas=1` + `replSet.enabled=true`，适合开发环境或需要副本集模式但资源有限的情况
- **多节点副本集**：`replicas>=2` + `replSet.enabled=true`，推荐 3 个或奇数个节点用于生产环境
- **Keyfile**：启用副本集时，会自动生成 `mongodb.keyfile` 并添加到 Secret 中
- **存储**：每个副本需要独立的持久化存储（PVC）
- **网络**：所有 Pod 之间需要能够通过 Service DNS 名称互相访问

## 卸载

```bash
helm uninstall mongodb -n resource
```

## 注意事项

1. **Secret 管理**：建议在生产环境中使用外部 Secret 管理工具，而不是在 Chart 中创建
2. **数据持久化**：确保 StorageClass 或 PV 配置正确，避免数据丢失
3. **副本集初始化**：
   - 使用 `init_infra.sh mongodb init` 时会自动初始化副本集（如果启用）
   - 如果自动初始化失败，请参考上面的手动初始化步骤
   - 副本集初始化需要所有 Pod 都处于 Ready 状态
4. **资源限制**：根据实际负载调整 resources 配置
5. **TLS 配置**：生产环境建议启用 TLS 加密
6. **副本集配置**：
   - **单节点非副本集模式**（`replicas=1` + `replSet.enabled=false`）：最简单的配置，适合开发环境
   - **单节点副本集模式**（`replicas=1` + `replSet.enabled=true`）：单节点副本集，适合需要副本集模式但资源有限的情况，未来可以轻松扩展为多节点
   - **多节点副本集模式**（`replicas>=2` + `replSet.enabled=true`）：自动初始化副本集，适合生产环境，提供高可用性

## 与 Operator 的差异

- 不包含 mgmt 组件
- 不包含 exporter 组件
- 不包含 logrotate CronJob
- 简化了存储配置逻辑
- 需要手动初始化副本集（Operator 会自动处理）
