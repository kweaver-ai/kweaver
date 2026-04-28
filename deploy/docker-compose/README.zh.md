# KWeaver Core — Docker Compose（B1 演示子集）

这个目录提供一个**精简演示**栈：**基础设施 + 一次性数据库迁移器 + 11 个 KWeaver 业务服务**（ontology/query、data model、model factory、Vega、data-connection）。它不是完整的 `deploy.sh kweaver-core --minimum` Helm 部署面（不包含 agent-*、dataflow、coderunner、doc-convert、sandbox、oss-gateway，也不包含内置 otel/observability）。

服务定义、端口、卷挂载和 `configs/kweaver/**` 模板与 **[kweaver-ai/helm-repo](https://github.com/kweaver-ai/helm-repo)** 中的 chart 对齐。如果刷新模板，请先将 chart 解包到 `/tmp/kc-charts-unpacked`，再重新运行 `tools/extract-helm-templates.py`；之后需要人工核对 Compose 的**手工调整**，例如 `mf-model-*/cm-kw-yaml.env.tmpl` 的主机名配置。

本目录的**必要检查**是 **`./setup.sh`**：它会渲染模板并运行 `docker compose config`。这个步骤**不会拉取镜像**。

## 包含内容（19 个 `docker compose` 服务）

- **基础设施（6）：** `mariadb`、`redis`、`zookeeper`、`kafka`、`opensearch`、`minio`。
- **任务（1）：** `kweaver-core-data-migrator`（一次性任务；其他服务等待它 `service_completed_successfully`）。
- **KWeaver（11）：** `bkn-backend`、`ontology-query`、`mdl-data-model`、`mdl-uniquery`、`mdl-data-model-job`、`mf-model-manager`、`mf-model-api`、`vega-backend`、`vega-gateway`、`vega-gateway-pro`、`data-connection`。
- **入口（1）：** `nginx` 会随 app 阶段启动，因为它的上游是 KWeaver 服务。

**不包含：** `agent-backend`、`agent-operator-integration`、`agent-retrieval`、`agent-observability`、`dataflow`、`flow-stream-data-pipeline`、`coderunner`、`dataflowtools`、`doc-convert-*`、`sandbox`、`oss-gateway-backend`、`otelcol-contrib`。生成的配置中仍可能在注释或依赖里提到这些主机；如果请求被路由到 `nginx` 以解析 DNS，但你没有添加对应服务，会返回 **502**。

## 前置条件

- [Docker](https://docs.docker.com/get-docker/) 和 **Docker Compose v2**（`docker compose`）。建议使用 **v2.17+**，更推荐 v2.20+。
- 这个子集通常需要 **约 10–12 GB 内存**（OpenSearch + Kafka + MariaDB）。
- **镜像仓库：** 默认镜像使用华为云 SWR 的 `swr.cn-east-3.myhuaweicloud.com/kweaver-ai/dip` 路径。请保持 `.env` 中 `IMAGE_REGISTRY=swr.cn-east-3.myhuaweicloud.com/kweaver-ai`、`DIP_NAMESPACE=dip`。如果拉取失败（例如 `You may not login yet`），先运行 `docker compose config --images`，确认路径包含 `/dip/`；如果你的组织要求鉴权，再执行 `docker login swr.cn-east-3.myhuaweicloud.com`。**公共**镜像（MariaDB、Redis、Kafka、Zookeeper、Nginx、OpenSearch、MinIO）不需要 SWR 登录。

## 一次性设置

```bash
cd deploy/docker-compose
chmod +x ./setup.sh
chmod +x ./compose.sh
./setup.sh
```

`setup.sh` 会：

1. 如果 `.env` 不存在，从 `.env.example` 复制一份（`.env` 已被 git 忽略）。
2. 解析 `MARIADB_ROOT_PASSWORD`、`MARIADB_PASSWORD`、`MINIO_ROOT_PASSWORD`（优先级：命令行参数 > 环境变量 > 共享 `-p` / `PASSWORD` > `.env` > 交互输入 > 报错）。
3. 运行 `tools/render_compose_configs.py`：将 `configs/kweaver/**/*.tmpl` 替换渲染到 `configs/generated/...`（包括给 `mf-model-*` 使用的 `cm-kw-yaml.env.tmpl` → `cm-kw-yaml.env`）。

### 密码规则

只能使用 `[A-Za-z0-9_-]`。这些值会写入 `.env`，并在需要时嵌入生成的配置。

## 启动服务（可选）

```bash
./compose.sh infra up
./compose.sh app up
```

`infra up` 只启动公共依赖镜像（MariaDB、Redis、Zookeeper、Kafka、OpenSearch、MinIO）。`app up` 随后启动 `kweaver-core-data-migrator`、KWeaver 服务和 nginx。如果某个 SWR 应用镜像拉取失败，基础设施仍可保持运行，你可以继续修正镜像路径或 registry 登录问题。

启动应用前可以先拉取应用镜像：

```bash
./compose.sh app pull
```

也可以用一个命令运行两个阶段：

```bash
./compose.sh all up
```

`kweaver-core-data-migrator` 预期会**完成一次**；应用服务会在它完成后启动。

### 仅 Vega（与 `deploy.sh` 中分组方式对应）

先启动**基础设施**、**migrator**，再只启动 Vega 相关服务（`vega-backend`、`data-connection`、`vega-gateway`、`vega-gateway-pro`）。**不会**启动 `nginx`、bkn、mdl、mf — 因为 compose 里 `nginx` 的 `depends_on` 包含整套应用。若需要 `http://localhost:8080` 统一入口，请使用 `./compose.sh app up` 或 `./compose.sh all up`。

```bash
./compose.sh vega up
```

容器**对内**端口（默认未映射到宿主机，可在 compose 中加 `ports` 便于本机调试）：

| 服务              | 典型对内端口 |
|-------------------|-------------|
| vega-gateway      | 8099        |
| vega-gateway-pro  | 8097        |
| data-connection   | 8098        |
| vega-backend      | 13014       |

其他子命令：`./compose.sh vega pull|down|restart|status|logs`。

**停止：**

```bash
./compose.sh all down
```

### 本地冒烟检查

```bash
curl -sS http://localhost:8080/healthz    # 预期：ok
curl -sI http://localhost:8080/api/bkn-backend/v1/nonexistent  # 路由到 bkn-backend（401/404 均可接受）
docker compose logs bkn-backend 2>&1 | head -50
```

## 仅基础设施冒烟（不拉取 KWeaver 镜像）

```bash
./compose.sh infra up
```

（可选：如果只挂载 `configs/nginx/default.conf`，可以添加 `nginx`；如果有内容引用 `configs/generated/`，请先运行 `./setup.sh`。）

## 入口

| 内容           | URL / 端口                                                                            |
|----------------|---------------------------------------------------------------------------------------|
| nginx 代理 API | `http://<ACCESS_HOST>:<KWEAVER_HTTP_PORT>`，默认 `http://localhost:8080`              |
| 健康检查       | `http://localhost:8080/healthz`                                                       |

## 与 Kubernetes / Helm 的限制差异

- 没有 ingress TLS、多副本高可用、Helm hooks；migrator 被建模为一个一次性 Compose 服务。
- **Auth / IAM：** chart 会引用 `authorization-private`、`hydra-admin` 等。抽取后的 YAML 可能会把这些 host 改写到 `nginx` 以便 DNS 能解析；没有真实 IAM 服务时，这些调用会失败。Compose 文件中可暴露的服务已设置 `AUTH_ENABLED=false`。
- **Redis：** `mf-model-*` 环境变量使用的是**单机** Redis（`REDISCLUSTERMODE=false`，端口 `6379`），不是某些 chart 中的 Sentinel 模式。

## 开发者：从 Helm 刷新模板

```bash
# 将 chart 解包到 /tmp/kc-charts-unpacked（参见 tools/extract-helm-templates.py 文件头说明）
python3 deploy/docker-compose/tools/extract-helm-templates.py
```

然后核对手工修改，尤其是面向 Compose 的 `mf-model-*/cm-kw-yaml.env.tmpl` 和 `dm_svc.conf.tmpl`。

## 远程实验环境（例如 Ubuntu VM）

将此目录同步到目标主机后：

```bash
cd deploy/docker-compose
./setup.sh -p YOUR_PASSWORD -y
sudo docker compose up -d   # 如果 Docker daemon 需要 sudo
```

使用上面的冒烟检查验证 `curl http://127.0.0.1:8080/healthz` 和后端路由。（CI/agent 的自动 SSH 可能被防火墙阻断。）

---

Kubernetes 部署请参考 [../README.zh.md](../README.zh.md)。
