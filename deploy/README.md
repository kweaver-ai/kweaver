# 产品部署手册

## 概述

本手册提供两种部署方案：

### 方案一：完整基础设施部署（推荐）
适用于**高版本主机**，使用 `init_infra.sh` 脚本从零开始部署单节点 Kubernetes 集群和所有数据服务。

### 方案二：已有环境部署
适用于**已存在 Kubernetes 集群和基础数据服务**的环境，仅部署应用服务。

---

## 方案一：完整基础设施部署

### 适用场景

- ✅ 高版本 Linux 主机（RHEL 8/9、OpenEuler 24、CentOS 8+、Ubuntu 20.04+）
- ✅ 需要从零开始部署完整环境
- ✅ 单节点或开发环境
- ✅ 测试环境快速搭建

### 系统要求

- **操作系统**：Linux（RHEL 8/9、OpenEuler 24、CentOS 8+、Ubuntu 20.04+）
- **CPU**：最少 16 核，推荐 24 核
- **内存**：最少 48 GB，推荐 64GB
- **磁盘**：最少 200GB 可用空间
- **网络**：能访问镜像仓库和互联网

**支持的发行版：**
- ✅ **RHEL 8/9** - Red Hat Enterprise Linux 8.x/9.x
- ✅ **OpenEuler 24** - OpenEuler 24.03 LTS
- ✅ **CentOS 8+** - CentOS Stream 8/9

### 支持的组件

#### 基础设施组件
- **Kubernetes**：v1.28.0+ 单节点集群（容器编排平台）
- **containerd**：v1.6.0+（容器运行时）
- **Flannel CNI**：v0.22.0+（网络插件，Pod CIDR: 192.169.0.0/16）
- **local-path-provisioner**：v0.0.32+（本地存储提供者）
- **ingress-nginx-controller**：v1.14.1+（Ingress 控制器，HostNetwork 模式）

#### 数据服务组件
- **MongoDB**：v4.4.30 副本集模式（单节点，数据库名：anyshare/osssys/automation）
- **Redis**：v7.4.6 哨兵模式（主从架构，Sentinel 端口：26379）
- **OpenSearch**：v2.19.4（JVM 内存 >2GB，HTTP 协议）
- **MariaDB**：v11.4.7-debian-12-r2（数据库：adp，最大连接数：5000）
- **Kafka**：v3.9.0（SASL/PLAIN 认证，协议：SASL_PLAINTEXT）
- **ZooKeeper**：v3.9.3（SASL 认证，端口：2181）

#### 应用服务
- **Studio**：部署管理服务
- **Ontology**：本体管理服务
- **Agent Operator**：代理管理服务
- **DataAgent**：数据代理服务
- **FlowAutomation**：流程自动化服务

---

## 快速开始

### 第一步：环境准备

```bash
# 1. 下载脚本
git clone <repository-url>
cd deploymentstudio/scripts

# 2. 检查系统要求
./init_infra.sh

# 3. 确保有 root 权限
sudo su -

# 4. 配置包管理器（根据发行版选择）
# RHEL 8/9
subscription-manager register --username <user> --password <pass>
subscription-manager repos --enable=rhel-8-for-x86_64-baseos-rpms
subscription-manager repos --enable=rhel-8-for-x86_64-appstream-rpms

# OpenEuler 24
dnf update -y
dnf install -y wget curl git

# CentOS Stream
dnf config-manager --set-enabled crb
dnf update -y

# Ubuntu 20.04+
apt update -y
apt install -y wget curl git
```

### 第二步：交互式部署

```bash
# 运行交互式菜单（推荐）
./init_infra.sh

# 或直接部署所有组件
./init_infra.sh all init
```

### 第三步：验证部署

```bash
# 检查集群状态
./init_infra.sh k8s status

# 检查所有服务
kubectl get pods -A
kubectl get svc -A
```

---

## 详细部署指南

### 1. Kubernetes 集群部署

#### 自动部署
```bash
# 完整 K8s 初始化（包含依赖安装）
./init_infra.sh k8s init
```

#### 手动分步部署
```bash
# 1. 安装依赖
./init_infra.sh k8s init  # 自动包含依赖安装

# 2. 重置集群（如需要）
./init_infra.sh k8s reset

# 3. 检查状态
./init_infra.sh k8s status
```

#### 配置参数
```bash
# 网络配置
export POD_CIDR=192.169.0.0/16
export SERVICE_CIDR=10.96.0.0/12
export API_SERVER_ADVERTISE_ADDRESS=<主机IP>

# 镜像仓库
export IMAGE_REPOSITORY=registry.aliyuncs.com/google_containers
export DOCKER_IO_MIRROR_PREFIX=swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/

# CNI 配置
export FLANNEL_IMAGE_REPO=swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/
```

### 2. 数据服务部署

#### MongoDB（副本集模式）
```bash
# 部署 MongoDB
./init_infra.sh mongodb init

# 验证副本集
kubectl exec -it mongodb-0 -n resource -- mongosh
> rs.status()
> rs.conf()

# 检查数据库
kubectl exec -it mongodb-0 -n resource -- mongosh
> show dbs
> use anyshare
> show collections
```

**MongoDB 配置参数：**
```bash
# 基础配置
export MARIADB_NAMESPACE=resource
export MONGODB_REPLICAS=1
export MONGODB_REPLSET_NAME=rs0

# 存储配置
export MONGODB_STORAGE_SIZE=10Gi
export MONGODB_STORAGE_CLASS=local-path

# 认证配置
export MONGODB_SECRET_USERNAME=anyshare
export MONGODB_SECRET_PASSWORD=your-secure-password
```

**初始化的数据库：**
- `anyshare` - 核心业务数据
- `osssys` - OSS 系统数据  
- `automation` - 自动化流程数据

#### Redis（哨兵模式）
```bash
# 部署 Redis
./init_infra.sh redis init

# 验证哨兵模式
kubectl exec -it redis-sentinel-0 -n resource -- redis-cli -p 26379
> sentinel masters
> sentinel get-master-addr-by-name mymaster

# 检查主从状态
kubectl exec -it redis-master-0 -n resource -- redis-cli
> info replication
```

**Redis 配置参数：**
```bash
# 架构配置
export REDIS_ARCHITECTURE=sentinel
export REDIS_REPLICA_COUNT=3
export REDIS_SENTINEL_QUORUM=2
export REDIS_MASTER_GROUP_NAME=mymaster

# 存储配置
export REDIS_STORAGE_SIZE=5Gi
export REDIS_PURGE_PVC=false  # 保留数据

# 认证配置
export REDIS_PASSWORD=your-redis-password
```

#### OpenSearch（2.x 版本）
```bash
# 部署 OpenSearch
./init_infra.sh opensearch init

# 验证集群
kubectl exec -it opensearch-master-0 -n resource -- curl -X GET "http://localhost:9200/_cluster/health"

# 检查节点
kubectl exec -it opensearch-master-0 -n resource -- curl -X GET "http://localhost:9200/_cat/nodes"
```

**OpenSearch 配置参数：**
```bash
# 版本和内存
export OPENSEARCH_IMAGE=opensearchproject/opensearch:2.13.0
export OPENSEARCH_JAVA_OPTS="-Xms2g -Xmx4g -XX:MaxDirectMemorySize=1g"
export OPENSEARCH_MEMORY_LIMIT=8Gi

# 安全配置
export OPENSEARCH_PROTOCOL=http
export OPENSEARCH_INITIAL_ADMIN_PASSWORD=OpenSearch@123456

# 存储配置
export OPENSEARCH_STORAGE_SIZE=8Gi
export OPENSEARCH_PURGE_PVC=false
```

#### MariaDB
```bash
# 部署 MariaDB
./init_infra.sh mariadb init

# 连接数据库
kubectl exec -it mariadb-0 -n resource -- mysql -u root -p$MARIADB_ROOT_PASSWORD

# 检查数据库
mysql> show databases;
mysql> use adp;
mysql> show tables;
```

**MariaDB 配置参数：**
```bash
# 版本配置
export MARIADB_VERSION=11.4
export MARIADB_IMAGE=bitnami/mariadb:11.4.7-debian-12-r2

# 数据库配置
export MARIADB_DATABASE=adp
export MARIADB_USER=adp
export MARIADB_PASSWORD=adp@123456
export MARIADB_ROOT_PASSWORD=mariadb-root-password

# 性能配置
export MARIADB_MAX_CONNECTIONS=5000
export MARIADB_STORAGE_SIZE=10Gi
```

#### Kafka（SASL/PLAIN 模式）
```bash
# 部署 Kafka
./init_infra.sh kafka init

# 验证集群
kubectl exec -it kafka-broker-0 -n resource -- kafka-topics.sh --bootstrap-server localhost:9092 --list

# 测试生产消费
kubectl exec -it kafka-broker-0 -n resource -- kafka-console-producer.sh --bootstrap-server localhost:9092 --topic test
```

**Kafka 配置参数：**
```bash
# 版本配置
export KAFKA_IMAGE=bitnami/kafka:3.9.0-debian-12-r10
export KAFKA_REPLICAS=1

# 认证配置
export KAFKA_PROTOCOL=SASL_PLAINTEXT
export KAFKA_SASL_MECHANISM=PLAIN
export KAFKA_CLIENT_USER=anyshare
export KAFKA_CLIENT_PASSWORD=your-kafka-password

# 性能配置
export KAFKA_HEAP_OPTS="-Xms256m -Xmx256m"
export KAFKA_MEMORY_LIMIT=512Mi
export KAFKA_STORAGE_SIZE=8Gi
```

#### ZooKeeper
```bash
# 部署 ZooKeeper
./init_infra.sh zookeeper init

# 验证状态
kubectl exec -it zookeeper-0 -n resource -- zkCli.sh -server localhost:2181
> ls /
> stat /
```

**ZooKeeper 配置参数：**
```bash
# 版本配置
export ZOOKEEPER_IMAGE=proton/proton-zookeeper:5.6.0-20250625.2.138fb9
export ZOOKEEPER_REPLICAS=1

# 性能配置
export ZOOKEEPER_JVMFLAGS="-Xms500m -Xmx500m"
export ZOOKEEPER_RESOURCES_MEMORY=2Gi
export ZOOKEEPER_STORAGE_SIZE=1Gi

# 认证配置
export ZOOKEEPER_SASL_ENABLED=true
export ZOOKEEPER_SASL_USER=kafka
export ZOOKEEPER_SASL_PASSWORD=zookeeper-password
```

### 3. 网络和存储

#### Ingress Controller
```bash
# 部署 Ingress
./init_infra.sh ingress-nginx init

# 检查状态
kubectl get svc -n ingress-nginx
kubectl get pods -n ingress-nginx
```

**Ingress 配置参数：**
```bash
# 网络配置
export INGRESS_NGINX_HOSTNETWORK=true
export INGRESS_NGINX_HTTP_PORT=30080
export INGRESS_NGINX_HTTPS_PORT=30443

# 镜像配置
export INGRESS_NGINX_CONTROLLER_IMAGE=registry.k8s.io/ingress-nginx/controller:v1.14.1
```

#### 存储配置
```bash
# 手动安装存储
./init_infra.sh storage init

# 检查存储类
kubectl get storageclass
kubectl get pv
kubectl get pvc
```

### 4. 应用服务部署

#### Studio 服务
```bash
# 部署 Studio
./init_infra.sh studio init

# 检查状态
./init_infra.sh studio status
kubectl get pods -n proton
```

#### Ontology 服务
```bash
# 部署 Ontology
./init_infra.sh ontology init

# 检查状态
./init_infra.sh ontology status
```

#### Agent Operator 服务
```bash
# 部署 Agent Operator
./init_infra.sh agent_operator init

# 检查状态
./init_infra.sh agent_operator status
```

#### DataAgent 服务
```bash
# 部署 DataAgent
./init_infra.sh dataagent init

# 检查状态
./init_infra.sh dataagent status
```

#### FlowAutomation 服务
```bash
# 部署 FlowAutomation
./init_infra.sh flowautomation init

# 检查状态
./init_infra.sh flowautomation status
```

---

## 方案二：已有环境部署

### 适用场景

- ✅ 客户已有 Kubernetes 集群（v1.20+）
- ✅ 客户已有数据服务基础设施
- ✅ 需要手动初始化数据库 SQL
- ✅ 需要配置特定的数据服务参数

### 数据服务配置要求

#### 1. MongoDB（文档数据库）

**部署模式要求：**
- 必须使用副本集模式（Replica Set）
- 副本集名称：rs0（默认）
- 端口：27017

**数据库和权限：**
| 数据库名 | 用途 | 权限 |
|---------|------|------|
| `anyshare` | AnyShare 核心数据 | dbOwner, readWrite |
| `osssys` | OSS 系统数据 | dbOwner, readWrite |
| `automation` | 自动化流程数据 | dbOwner, readWrite |

**初始化 SQL：**
```javascript
// 1. 初始化副本集
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb-0.mongodb.resource.svc.cluster.local:27017" }
  ]
})

// 2. 创建管理员用户
db.getSiblingDB('admin').createUser({
  user: 'admin',
  pwd: 'your-secure-password',
  roles: [{ role: 'root', db: 'admin' }]
})

// 3. 创建应用用户
db.getSiblingDB('anyshare').createUser({
  user: 'anyshare',
  pwd: 'your-secure-password',
  roles: [
    { role: 'dbOwner', db: 'anyshare' },
    { role: 'readWrite', db: 'anyshare' },
    { role: 'dbOwner', db: 'osssys' },
    { role: 'readWrite', db: 'osssys' },
    { role: 'dbOwner', db: 'automation' },
    { role: 'readWrite', db: 'automation' }
  ]
})

// 4. 创建数据库集合
db.getSiblingDB('anyshare').healthcheck.insert({ init: true, timestamp: new Date() })
db.getSiblingDB('osssys').healthcheck.insert({ init: true, timestamp: new Date() })
db.getSiblingDB('automation').healthcheck.insert({ init: true, timestamp: new Date() })
```

#### 2. Redis（缓存）

**部署模式要求：**
- 必须使用哨兵模式（Sentinel Mode）
- 主节点组名：mymaster（默认）
- 哨兵监听端口：26379

**初始化配置：**
```bash
# 验证哨兵模式
redis-cli -h redis-sentinel.resource.svc.cluster.local -p 26379 sentinel masters

# 获取主节点
redis-cli -h redis-sentinel.resource.svc.cluster.local -p 26379 sentinel get-master-addr-by-name mymaster

# 设置密码
redis-cli -h <master-ip> -p 6379
> CONFIG SET requirepass "your-secure-password"
> CONFIG REWRITE
```

#### 3. OpenSearch（搜索引擎）

**版本要求：**
- 必须是 2.x 版本或更高
- JVM 内存必须大于 2GB

**内存配置：**
```yaml
最小堆内存：2G
最大堆内存：4G（建议）
直接内存：1G
总内存请求：4Gi
总内存限制：8Gi（建议）
```

**初始化配置：**
```bash
# 创建索引
curl -X PUT "https://admin:password@opensearch-cluster-master.resource.svc.cluster.local:9200/anyshare-index" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0
    }
  }'
```

#### 4. 关系型数据库

**支持的数据库：**
| 数据库 | 版本 | 驱动 | 备注 |
|--------|------|------|------|
| MySQL | 5.7+ | mysql-connector-java | 推荐 5.7.x |
| MariaDB | 10.5+ | mysql-connector-java | 推荐 11.x |
| TiDB | 5.0+ | mysql-connector-java | 兼容 MySQL 协议 |
| OceanBase | 3.1+ | mysql-connector-java | 兼容 MySQL 协议 |

**数据库初始化：**
```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS adp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'adp'@'%' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON adp.* TO 'adp'@'%';
FLUSH PRIVILEGES;

-- 设置连接参数
SET GLOBAL max_connections = 5000;
SET GLOBAL max_allowed_packet = 256M;
SET GLOBAL innodb_buffer_pool_size = 2G;
```

#### 5. 消息中间件

**支持的消息队列：**
| 消息队列 | 版本 | 认证模式 | 备注 |
|---------|------|---------|------|
| NSQ | 1.2+ | 无认证 | 轻量级，推荐开发环境 |
| Kafka | 3.0+ | SASL/PLAIN | 必须启用 SASL/PLAIN 认证 |

**Kafka 配置要求：**
- 认证机制：SASL/PLAIN
- 监听器协议：SASL_PLAINTEXT 或 SASL_SSL
- Broker 数量：1 个（最小）或 3 个（生产环境）

**Kafka 初始化：**
```bash
# 创建 SASL 用户
kafka-configs.sh --bootstrap-server kafka:9092 \
  --alter \
  --entity-type users \
  --entity-name anyshare \
  --add-config 'SCRAM-SHA-256=[password=your-secure-password]'

# 创建主题
kafka-topics.sh --bootstrap-server kafka:9092 \
  --create \
  --topic anyshare-events \
  --partitions 3 \
  --replication-factor 1
```

---

## 配置管理

### 生成配置文件

```bash
# 自动生成配置
./init_infra.sh config generate

# 查看配置文件
cat conf/config.yaml
```

### 配置文件结构

```yaml
# conf/config.yaml 示例
global:
  namespace: proton
  registry: your-registry.com/proton

mongodb:
  host: mongodb-0.mongodb.resource.svc.cluster.local
  port: 27017
  username: anyshare
  password: your-password
  replicaSet: rs0
  authSource: anyshare

redis:
  sentinel:
    host: redis-sentinel.resource.svc.cluster.local
    port: 26379
    masterName: mymaster
    password: your-password

opensearch:
  host: opensearch-cluster-master.resource.svc.cluster.local
  port: 9200
  username: admin
  password: your-password
  protocol: https

database:
  type: mysql
  host: mysql.resource.svc.cluster.local
  port: 3306
  username: adp
  password: your-password
  database: adp
  maxConnections: 5000

kafka:
  bootstrap_servers: kafka.resource.svc.cluster.local:9092
  security_protocol: SASL_PLAINTEXT
  sasl_mechanism: PLAIN
  sasl_username: anyshare
  sasl_password: your-password
```

---

## 故障排查

### 常见问题

#### 1. Kubernetes 初始化失败

```bash
# 检查系统状态
./init_infra.sh k8s status

# 重置集群
./init_infra.sh k8s reset

# 重新初始化
./init_infra.sh k8s init
```

#### 2. 数据服务启动失败

```bash
# 检查 Pod 状态
kubectl get pods -n resource -o wide

# 查看 Pod 日志
kubectl logs -n resource <pod-name>

# 检查存储
kubectl get pv,pvc -n resource
```

#### 3. 网络访问问题

```bash
# 检查 Ingress
kubectl get svc -n ingress-nginx
kubectl get pods -n ingress-nginx

# 检查网络策略
kubectl get networkpolicy -A
```

#### 4. 存储问题

```bash
# 检查存储类
kubectl get storageclass

# 检查 PV 状态
kubectl get pv -o wide

# 手动清理存储
kubectl delete pvc --all -n resource
kubectl delete pv --all
```

### 日志收集

```bash
# 收集所有服务日志
mkdir -p logs
kubectl logs -n kube-system -l k8s-app=kube-dns > logs/kube-dns.log
kubectl logs -n resource -l app=mongodb > logs/mongodb.log
kubectl logs -n resource -l app=redis > logs/redis.log
kubectl logs -n resource -l app=opensearch > logs/opensearch.log
kubectl logs -n resource -l app=mariadb > logs/mariadb.log
kubectl logs -n resource -l app=kafka > logs/kafka.log
```

---

## 性能优化

### 系统级优化

```bash
# 调整系统参数
echo 'vm.max_map_count=262144' >> /etc/sysctl.conf
echo 'fs.file-max=65536' >> /etc/sysctl.conf
sysctl -p

# 调整容器限制
echo 'default_pids_limit = 4096' >> /etc/containerd/config.toml
systemctl restart containerd
```

### 发行版特定优化

#### OpenEuler 24 优化
```bash
# 启用高性能调度器
echo 'kernel.sched_migration_cost_ns=5000000' >> /etc/sysctl.conf

# 优化网络性能
echo 'net.core.rmem_max=134217728' >> /etc/sysctl.conf
echo 'net.core.wmem_max=134217728' >> /etc/sysctl.conf

# 启用 cgroup v2（OpenEuler 24 默认支持）
echo 'GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=1"' >> /etc/default/grub
grub2-mkconfig -o /boot/grub2/grub.cfg
```

#### RHEL 8/9 优化
```bash
# 启用高性能网络
echo 'net.ipv4.tcp_fastopen=3' >> /etc/sysctl.conf

# 优化内存管理
echo 'vm.swappiness=10' >> /etc/sysctl.conf

# 启用 SELinux 优化
setsebool -P container_use_cephfs on
```

#### Ubuntu 优化
```bash
# 优化文件系统
echo 'fs.inotify.max_user_watches=524288' >> /etc/sysctl.conf

# 启用 BBR 拥塞控制
echo 'net.core.default_qdisc=fq' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_congestion_control=bbr' >> /etc/sysctl.conf
```

### Kubernetes 优化

```bash
# 调整 kubelet 参数
echo 'KUBELET_EXTRA_ARGS="--max-pods=250"' >> /etc/default/kubelet
systemctl restart kubelet

# 调整集群 DNS
kubectl edit configmap coredns -n kube-system
```

### 数据服务优化

#### MongoDB 优化
```javascript
// 创建索引
db.anyshare.createIndex({ "userId": 1 })
db.anyshare.createIndex({ "createdAt": -1 })

// 调整缓存大小
db.adminCommand({setParameter: 1, wiredTigerCacheSizeGB: 2})
```

#### Redis 优化
```bash
# 调整内存策略
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 启用持久化
redis-cli CONFIG SET save "900 1 300 10 60 10000"
```

#### OpenSearch 优化
```bash
# 调整分片数
curl -X PUT "https://admin:password@opensearch:9200/anyshare-index/_settings" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "number_of_replicas": 2
    }
  }'
```

---

## 安全建议

### 1. 密码管理
- ✅ 使用强密码（至少 12 字符）
- ✅ 定期更换密码
- ✅ 使用 Kubernetes Secret 存储敏感信息
- ❌ 不要在配置文件中明文存储密码

### 2. 网络安全
- ✅ 使用 NetworkPolicy 限制 Pod 间通信
- ✅ 启用 TLS/SSL 加密通信
- ✅ 配置防火墙规则
- ❌ 不要暴露数据库端口到公网

### 3. 访问控制
- ✅ 使用 RBAC 限制用户权限
- ✅ 启用 Pod 安全策略
- ✅ 定期审计访问日志
- ❌ 不要使用 root 用户运行应用

### 4. 数据备份
- ✅ 定期备份数据库
- ✅ 测试备份恢复流程
- ✅ 将备份存储在安全位置
- ❌ 不要只依赖单一备份

---

## 监控和维护

### 健康检查脚本

```bash
#!/bin/bash
# health-check.sh

echo "=== Kubernetes 健康检查 ==="
kubectl get nodes
kubectl get pods -A

echo "=== 数据服务健康检查 ==="
kubectl exec -n resource mongodb-0 -- mongosh --eval "db.adminCommand('ping')"
kubectl exec -n resource redis-master-0 -- redis-cli ping
curl -f http://opensearch-master-0:9200/_cluster/health

echo "=== 应用服务健康检查 ==="
kubectl get pods -n proton
kubectl get svc -n proton
```

### 备份脚本

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/backup_$DATE"

mkdir -p $BACKUP_DIR

# MongoDB 备份
kubectl exec -n resource mongodb-0 -- mongodump --out=/backup/mongodb_$DATE

# Redis 备份
kubectl exec -n resource redis-master-0 -- redis-cli BGSAVE

# OpenSearch 备份
curl -X PUT "http://opensearch-master-0:9200/_snapshot/backup/snapshot_$DATE" \
  -H "Content-Type: application/json" \
  -d '{"indices": "*"}'

echo "备份完成: $BACKUP_DIR"
```

---

## 升级和维护

### 升级脚本

```bash
#!/bin/bash
# upgrade.sh

# 备份数据
./backup.sh

# 升级 Kubernetes 组件
./init_infra.sh k8s reset
./init_infra.sh k8s init

# 升级数据服务
./init_infra.sh mongodb uninstall
./init_infra.sh mongodb init

./init_infra.sh redis uninstall
./init_infra.sh redis init

# 验证升级
./health-check.sh
```

### 清理脚本

```bash
#!/bin/bash
# cleanup.sh

# 停止所有服务
./init_infra.sh all uninstall

# 清理集群
./init_infra.sh k8s reset

# 清理数据
rm -rf /opt/local-path-provisioner
docker system prune -f
```

---

## 支持和反馈

如有问题，请联系技术支持团队：
- 📧 Email: support@example.com
- 📞 Phone: +86-xxx-xxxx-xxxx
- 🌐 Website: https://support.example.com

---

## 版本历史

| 版本 | 日期 | 变更 |
|-----|------|------|
| 1.0 | 2024-01-16 | 初始版本，支持完整基础设施部署 |

---

**最后更新**：2024-01-16

---

## 前置要求

### 系统要求

- **操作系统**：Linux（RHEL 8/9、OpenEuler 24、CentOS 8+、Ubuntu 20.04+）
- **Kubernetes**：v1.20 或更高版本
- **Helm**：v3.0 或更高版本
- **kubectl**：与 Kubernetes 版本匹配
- **网络**：集群节点间网络互通，能访问镜像仓库

### 权限要求

- 需要 `root` 或 `sudo` 权限执行脚本
- 需要 `kubeconfig` 文件配置完整的集群访问权限

### 依赖工具

```bash
# 检查必要工具
which kubectl helm docker tar curl
```

---

## 数据服务配置要求

### 1. MongoDB（文档数据库）

#### 部署模式

**必须使用副本集模式**（Replica Set）

```yaml
副本集配置：
  - 最少 1 个节点（开发环境）
  - 建议 3 个节点（生产环境）
  - 副本集名称：rs0（默认）
```

#### 数据库和权限

需要创建以下数据库及用户：

| 数据库名 | 用途 | 权限 |
|---------|------|------|
| `anyshare` | AnyShare 核心数据 | dbOwner, readWrite |
| `osssys` | OSS 系统数据 | dbOwner, readWrite |
| `automation` | 自动化流程数据 | dbOwner, readWrite |

#### 初始化 SQL

```javascript
// 1. 初始化副本集（如果未初始化）
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb-0.mongodb.resource.svc.cluster.local:27017" },
    { _id: 1, host: "mongodb-1.mongodb.resource.svc.cluster.local:27017" },
    { _id: 2, host: "mongodb-2.mongodb.resource.svc.cluster.local:27017" }
  ]
})

// 2. 创建管理员用户（在 admin 数据库）
db.getSiblingDB('admin').createUser({
  user: 'admin',
  pwd: 'your-secure-password',
  roles: [{ role: 'root', db: 'admin' }]
})

// 3. 创建应用用户（在 anyshare 数据库）
db.getSiblingDB('anyshare').createUser({
  user: 'anyshare',
  pwd: 'your-secure-password',
  roles: [
    { role: 'dbOwner', db: 'anyshare' },
    { role: 'readWrite', db: 'anyshare' },
    { role: 'dbOwner', db: 'osssys' },
    { role: 'readWrite', db: 'osssys' },
    { role: 'dbOwner', db: 'automation' },
    { role: 'readWrite', db: 'automation' }
  ]
})

// 4. 创建数据库集合（确保数据库存在）
db.getSiblingDB('anyshare').healthcheck.insert({ init: true, timestamp: new Date() })
db.getSiblingDB('osssys').healthcheck.insert({ init: true, timestamp: new Date() })
db.getSiblingDB('automation').healthcheck.insert({ init: true, timestamp: new Date() })
```

#### 连接字符串示例

```
mongodb://anyshare:password@mongodb-0.mongodb.resource.svc.cluster.local:27017,mongodb-1.mongodb.resource.svc.cluster.local:27017,mongodb-2.mongodb.resource.svc.cluster.local:27017/anyshare?replicaSet=rs0&authSource=anyshare
```

---

### 2. Redis（缓存）

#### 部署模式

**必须使用哨兵模式**（Sentinel Mode）

```yaml
哨兵配置：
  - Redis 主节点：1 个
  - Redis 从节点：2 个（建议）
  - 哨兵节点：3 个
  - 主节点组名：mymaster（默认）
  - 哨兵监听端口：26379
```

#### 初始化配置

```bash
# 1. 验证哨兵模式是否正常
redis-cli -h redis-sentinel.resource.svc.cluster.local -p 26379 sentinel masters

# 2. 获取当前主节点
redis-cli -h redis-sentinel.resource.svc.cluster.local -p 26379 sentinel get-master-addr-by-name mymaster

# 3. 连接到主节点并设置密码
redis-cli -h <master-ip> -p 6379
> CONFIG SET requirepass "your-secure-password"
> CONFIG REWRITE
```

#### 连接字符串示例

```
# 应用应使用哨兵连接
sentinel://mymaster:password@redis-sentinel.resource.svc.cluster.local:26379
```

#### 哨兵配置验证

```bash
# 检查哨兵状态
redis-cli -h redis-sentinel.resource.svc.cluster.local -p 26379 info sentinel

# 检查主从状态
redis-cli -h redis-sentinel.resource.svc.cluster.local -p 26379 sentinel slaves mymaster
```

---

### 3. OpenSearch（搜索引擎）

#### 版本要求

**必须是 2.x 版本或更高**

```yaml
版本要求：
  - 最低版本：2.0.0
  - 推荐版本：2.13.0 或更高
  - 不支持：1.x 版本
```

#### JVM 内存要求

**JVM 内存必须大于 2GB**

```yaml
内存配置：
  - 最小堆内存：2G
  - 最大堆内存：4G（建议）
  - 直接内存：1G
  - 总内存请求：4Gi
  - 总内存限制：8Gi（建议）
```

#### Helm 安装参数

```bash
helm install opensearch ./opensearch-chart \
  --set image.tag=2.13.0 \
  --set opensearchJavaOpts="-Xms2g -Xmx4g -XX:MaxDirectMemorySize=1g" \
  --set resources.requests.memory=4Gi \
  --set resources.limits.memory=8Gi \
  --set persistence.size=20Gi
```

#### 初始化配置

```bash
# 1. 获取 OpenSearch 服务地址
kubectl get svc -n resource opensearch-cluster-master

# 2. 创建索引
curl -X PUT "https://admin:password@opensearch-cluster-master.resource.svc.cluster.local:9200/anyshare-index" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0
    }
  }'

# 3. 验证索引
curl -X GET "https://admin:password@opensearch-cluster-master.resource.svc.cluster.local:9200/_cat/indices"
```

#### 连接字符串示例

```
https://admin:password@opensearch-cluster-master.resource.svc.cluster.local:9200
```

---

### 4. 关系型数据库

#### 支持的数据库

| 数据库 | 版本 | 驱动 | 备注 |
|--------|------|------|------|
| MySQL | 5.7+ | mysql-connector-java | 推荐 5.7.x |
| MariaDB | 10.5+ | mysql-connector-java | 推荐 11.x |
| TiDB | 5.0+ | mysql-connector-java | 兼容 MySQL 协议 |
| OceanBase | 3.1+ | mysql-connector-java | 兼容 MySQL 协议 |

#### 数据库初始化

```sql
-- 1. 创建数据库
CREATE DATABASE IF NOT EXISTS adp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 创建用户（推荐）
CREATE USER 'adp'@'%' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON adp.* TO 'adp'@'%';
FLUSH PRIVILEGES;

-- 3. 设置连接参数
SET GLOBAL max_connections = 5000;
SET GLOBAL max_allowed_packet = 256M;
SET GLOBAL innodb_buffer_pool_size = 2G;

-- 4. 验证连接
SELECT 1;
```

#### 连接字符串示例

```
# MySQL/MariaDB
jdbc:mysql://mysql.resource.svc.cluster.local:3306/adp?useSSL=false&serverTimezone=UTC&characterEncoding=utf8mb4

# TiDB
jdbc:mysql://tidb.resource.svc.cluster.local:4000/adp?useSSL=false&serverTimezone=UTC&characterEncoding=utf8mb4

# OceanBase
jdbc:mysql://oceanbase.resource.svc.cluster.local:2881/adp?useSSL=false&serverTimezone=UTC&characterEncoding=utf8mb4
```

---

### 5. 消息中间件

#### 支持的消息队列

| 消息队列 | 版本 | 认证模式 | 备注 |
|---------|------|---------|------|
| NSQ | 1.2+ | 无认证 | 轻量级，推荐开发环境 |
| Kafka | 3.0+ | SASL/PLAIN | 必须启用 SASL/PLAIN 认证 |

#### NSQ 配置

```bash
# 1. NSQ Lookup 地址
nsq-lookup.resource.svc.cluster.local:4161

# 2. NSQ 生产者地址
nsq-producer.resource.svc.cluster.local:4150

# 3. 创建 Topic（可选，NSQ 自动创建）
curl -X POST http://nsq-lookup.resource.svc.cluster.local:4151/api/topics/create?topic=anyshare-events
```

#### Kafka 配置（SASL/PLAIN 模式）

**Kafka 必须启用 SASL/PLAIN 认证**

```yaml
Kafka 配置要求：
  - 认证机制：SASL/PLAIN
  - 监听器协议：SASL_PLAINTEXT 或 SASL_SSL
  - Broker 数量：1 个（最小）或 3 个（生产环境）
  - 副本因子：1（单节点）或 3（多节点）
```

##### Kafka 初始化 SQL

```bash
# 1. 创建 SASL 用户
kafka-configs.sh --bootstrap-server kafka:9092 \
  --alter \
  --entity-type users \
  --entity-name anyshare \
  --add-config 'SCRAM-SHA-256=[password=your-secure-password]'

# 2. 创建主题
kafka-topics.sh --bootstrap-server kafka:9092 \
  --create \
  --topic anyshare-events \
  --partitions 3 \
  --replication-factor 1

# 3. 验证主题
kafka-topics.sh --bootstrap-server kafka:9092 \
  --list

# 4. 验证 SASL 连接
kafka-console-producer.sh \
  --bootstrap-server kafka:9092 \
  --topic anyshare-events \
  --producer-property security.protocol=SASL_PLAINTEXT \
  --producer-property sasl.mechanism=PLAIN \
  --producer-property sasl.jaas.config='org.apache.kafka.common.security.plain.PlainLoginModule required username="anyshare" password="your-secure-password";'
```

##### Kafka 连接字符串示例

```
# SASL/PLAIN 模式
bootstrap.servers=kafka.resource.svc.cluster.local:9092
security.protocol=SASL_PLAINTEXT
sasl.mechanism=PLAIN
sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username="anyshare" password="your-secure-password";
```

---

## 部署步骤

### 第一步：环境准备

#### 1.1 验证 Kubernetes 集群

```bash
# 检查集群状态
kubectl cluster-info
kubectl get nodes

# 检查 Helm
helm version

# 创建命名空间
kubectl create namespace resource
kubectl create namespace proton
```

#### 1.2 配置镜像仓库

```bash
# 如果使用私有镜像仓库，创建 Secret
kubectl create secret docker-registry regcred \
  --docker-server=your-registry.com \
  --docker-username=username \
  --docker-password=password \
  --docker-email=email@example.com \
  -n proton
```

#### 1.3 验证存储类

```bash
# 检查可用的存储类
kubectl get storageclass

# 如果没有存储类，安装 local-path-provisioner
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/deploy/local-path-storage.yaml
```

### 第二步：初始化数据服务

#### 2.1 MongoDB 初始化

```bash
# 连接到 MongoDB Pod
kubectl exec -it mongodb-0 -n resource -- mongosh

# 执行初始化脚本（参考上面的 MongoDB 初始化 SQL）
```

#### 2.2 Redis 初始化

```bash
# 验证哨兵模式
kubectl exec -it redis-sentinel-0 -n resource -- redis-cli -p 26379 sentinel masters

# 设置密码
kubectl exec -it redis-master-0 -n resource -- redis-cli CONFIG SET requirepass "your-password"
```

#### 2.3 OpenSearch 初始化

```bash
# 获取 OpenSearch 服务
kubectl get svc -n resource | grep opensearch

# 创建索引（参考上面的 OpenSearch 初始化配置）
```

#### 2.4 关系型数据库初始化

```bash
# 连接到数据库
mysql -h mysql.resource.svc.cluster.local -u root -p

# 执行初始化 SQL（参考上面的数据库初始化脚本）
```

#### 2.5 Kafka 初始化

```bash
# 创建 SASL 用户和主题（参考上面的 Kafka 初始化 SQL）
```

### 第三步：部署应用服务

#### 3.1 准备配置文件

```bash
# 复制配置模板
cp conf/config.yaml.example conf/config.yaml

# 编辑配置文件，填入数据服务连接信息
vim conf/config.yaml
```

#### 3.2 配置示例

```yaml
# conf/config.yaml
global:
  namespace: proton
  registry: your-registry.com/proton

mongodb:
  host: mongodb-0.mongodb.resource.svc.cluster.local
  port: 27017
  username: anyshare
  password: your-password
  replicaSet: rs0
  authSource: anyshare

redis:
  sentinel:
    host: redis-sentinel.resource.svc.cluster.local
    port: 26379
    masterName: mymaster
    password: your-password

opensearch:
  host: opensearch-cluster-master.resource.svc.cluster.local
  port: 9200
  username: admin
  password: your-password
  protocol: https

database:
  type: mysql  # mysql, mariadb, tidb, oceanbase
  host: mysql.resource.svc.cluster.local
  port: 3306
  username: adp
  password: your-password
  database: adp
  maxConnections: 5000

kafka:
  bootstrap_servers: kafka.resource.svc.cluster.local:9092
  security_protocol: SASL_PLAINTEXT
  sasl_mechanism: PLAIN
  sasl_username: anyshare
  sasl_password: your-password
```

#### 3.3 部署应用

```bash
# 使用 Helm 部署应用服务
helm install proton ./charts/proton \
  --namespace proton \
  --values conf/config.yaml

# 验证部署
kubectl get pods -n proton
kubectl get svc -n proton
```

### 第四步：验证部署

#### 4.1 检查 Pod 状态

```bash
# 查看所有 Pod
kubectl get pods -n proton -o wide

# 查看 Pod 日志
kubectl logs -n proton <pod-name>

# 查看 Pod 详细信息
kubectl describe pod -n proton <pod-name>
```

#### 4.2 检查服务连接

```bash
# 测试 MongoDB 连接
kubectl exec -it <pod-name> -n proton -- \
  mongosh "mongodb://anyshare:password@mongodb-0.mongodb.resource.svc.cluster.local:27017/anyshare?replicaSet=rs0&authSource=anyshare"

# 测试 Redis 连接
kubectl exec -it <pod-name> -n proton -- \
  redis-cli -h redis-sentinel.resource.svc.cluster.local -p 26379 ping

# 测试数据库连接
kubectl exec -it <pod-name> -n proton -- \
  mysql -h mysql.resource.svc.cluster.local -u adp -p -e "SELECT 1;"

# 测试 Kafka 连接
kubectl exec -it <pod-name> -n proton -- \
  kafka-console-producer.sh --bootstrap-server kafka:9092 --topic test
```

#### 4.3 应用健康检查

```bash
# 检查应用端点
kubectl get endpoints -n proton

# 测试应用 API
curl -X GET http://<service-ip>:8080/health
```

---

## 故障排查

### MongoDB 问题

#### 副本集初始化失败

```bash
# 检查副本集状态
kubectl exec -it mongodb-0 -n resource -- mongosh
> rs.status()

# 重新初始化副本集
> rs.initiate({...})

# 查看日志
kubectl logs mongodb-0 -n resource
```

#### 连接超时

```bash
# 检查 MongoDB 服务
kubectl get svc -n resource | grep mongodb

# 检查网络连接
kubectl exec -it <pod-name> -n proton -- \
  nc -zv mongodb-0.mongodb.resource.svc.cluster.local 27017
```

### Redis 问题

#### 哨兵模式异常

```bash
# 检查哨兵状态
kubectl exec -it redis-sentinel-0 -n resource -- \
  redis-cli -p 26379 info sentinel

# 检查主从状态
kubectl exec -it redis-sentinel-0 -n resource -- \
  redis-cli -p 26379 sentinel slaves mymaster
```

#### 密码认证失败

```bash
# 重置 Redis 密码
kubectl exec -it redis-master-0 -n resource -- \
  redis-cli CONFIG SET requirepass "new-password"

# 验证连接
kubectl exec -it redis-master-0 -n resource -- \
  redis-cli -a "new-password" ping
```

### OpenSearch 问题

#### 内存不足

```bash
# 检查 OpenSearch Pod 资源
kubectl describe pod -n resource <opensearch-pod>

# 增加内存限制
kubectl patch statefulset opensearch -n resource --type='json' \
  -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/resources/limits/memory", "value":"8Gi"}]'
```

#### 索引创建失败

```bash
# 检查 OpenSearch 日志
kubectl logs -n resource <opensearch-pod>

# 验证连接
curl -X GET "https://admin:password@opensearch-cluster-master.resource.svc.cluster.local:9200/_cluster/health"
```

### Kafka 问题

#### SASL 认证失败

```bash
# 检查 Kafka Broker 日志
kubectl logs -n resource kafka-broker-0

# 验证 SASL 用户
kubectl exec -it kafka-broker-0 -n resource -- \
  kafka-configs.sh --bootstrap-server localhost:9092 --describe --entity-type users --entity-name anyshare

# 重新创建 SASL 用户
kubectl exec -it kafka-broker-0 -n resource -- \
  kafka-configs.sh --bootstrap-server localhost:9092 \
  --alter --entity-type users --entity-name anyshare \
  --add-config 'SCRAM-SHA-256=[password=new-password]'
```

#### 主题创建失败

```bash
# 检查 Kafka 集群状态
kubectl exec -it kafka-broker-0 -n resource -- \
  kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# 查看现有主题
kubectl exec -it kafka-broker-0 -n resource -- \
  kafka-topics.sh --bootstrap-server localhost:9092 --list
```

---

## 常见问题

### Q: 如何升级数据服务版本？

A: 使用 Helm 升级：
```bash
helm upgrade mongodb ./mongodb-chart \
  --namespace resource \
  --set image.tag=new-version
```

### Q: 如何备份 MongoDB 数据？

A: 使用 mongodump：
```bash
kubectl exec -it mongodb-0 -n resource -- \
  mongodump --uri="mongodb://user:password@localhost:27017/anyshare?replicaSet=rs0&authSource=anyshare" \
  --out=/backup
```

### Q: 如何扩展 Redis 副本数？

A: 修改 Helm values：
```bash
helm upgrade redis ./redis-chart \
  --namespace resource \
  --set replicaCount=5
```

### Q: 如何监控 Kafka 消费进度？

A: 使用 Kafka 工具：
```bash
kubectl exec -it kafka-broker-0 -n resource -- \
  kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group your-group --describe
```

### Q: 如何处理 OpenSearch 磁盘满的问题？

A: 扩展存储：
```bash
kubectl patch pvc opensearch-data-0 -n resource \
  -p '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'
```

---

## 安全建议

### 1. 密码管理

- ✅ 使用强密码（至少 12 字符，包含大小写字母、数字、特殊字符）
- ✅ 定期更换密码
- ✅ 使用 Kubernetes Secret 存储敏感信息
- ❌ 不要在配置文件中明文存储密码

### 2. 网络安全

- ✅ 使用 NetworkPolicy 限制 Pod 间通信
- ✅ 启用 TLS/SSL 加密通信
- ✅ 配置防火墙规则
- ❌ 不要暴露数据库端口到公网

### 3. 访问控制

- ✅ 使用 RBAC 限制用户权限
- ✅ 启用 Pod 安全策略
- ✅ 定期审计访问日志
- ❌ 不要使用 root 用户运行应用

### 4. 数据备份

- ✅ 定期备份数据库
- ✅ 测试备份恢复流程
- ✅ 将备份存储在安全位置
- ❌ 不要只依赖单一备份

---

## 性能优化

### MongoDB 优化

```javascript
// 创建索引
db.anyshare.createIndex({ "userId": 1 })
db.anyshare.createIndex({ "createdAt": -1 })

// 查看索引
db.anyshare.getIndexes()
```

### Redis 优化

```bash
# 调整内存策略
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 启用持久化
redis-cli CONFIG SET save "900 1 300 10 60 10000"
```

### OpenSearch 优化

```bash
# 调整分片数
curl -X PUT "https://admin:password@opensearch:9200/anyshare-index/_settings" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "number_of_replicas": 2
    }
  }'
```

### Kafka 优化

```bash
# 调整 Broker 配置
kafka-configs.sh --bootstrap-server localhost:9092 \
  --alter --entity-type brokers --entity-name 0 \
  --add-config 'num.network.threads=8,num.io.threads=8'
```

---

## 支持和反馈

如有问题，请联系技术支持团队：
- 📧 Email: support@example.com
- 📞 Phone: +86-xxx-xxxx-xxxx
- 🌐 Website: https://support.example.com

---

## 版本历史

| 版本 | 日期 | 变更 |
|-----|------|------|
| 1.0 | 2024-01-16 | 初始版本 |

---

**最后更新**：2024-01-16
