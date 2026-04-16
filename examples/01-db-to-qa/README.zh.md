# 01 - 从数据库到智能问答

端到端示例：连接 MySQL 数据库，构建知识网络，探索 Schema，语义搜索，并通过 Agent 对话回答业务问题 —— 全程 CLI 操作。

## 前置条件

```bash
# 1. 安装 KWeaver CLI
npm install -g @kweaver-ai/kweaver-sdk

# 2. 安装 MySQL 客户端（run.sh 的 Step 0 需要在本机执行 mysql 导入 seed.sql）
#    macOS:   brew install mysql-client
#    Ubuntu:  sudo apt install -y mysql-client
#    macOS 下脚本还会自动搜索 Homebrew 的 /opt/homebrew 和 /usr/local 路径。
#    如果仍找不到，可在 .env 中设置 MYSQL_BIN 指定完整路径（见 env.sample）。

# 3. 登录 KWeaver 平台
kweaver auth login https://<platform-url>

# 4. 确保 MySQL 数据库可从平台访问
#    需要提前创建好数据库（例如 CREATE DATABASE supply_chain_test ...）。
#    DB 用户必须拥有该数据库的权限 —— kweaver_rw 通常只能访问 kweaver_app，
#    如需其他数据库请 DBA 单独授权。
#    脚本会自动导入 seed.sql（虚构的智能家居供应链数据）。
```

## 这个示例做了什么

```
MySQL 数据库
     │
     ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  数据源连接   │────▶│   知识网络    │────▶│  上下文加载器     │
│  (ds connect)│     │   (KN)       │     │  语义搜索        │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │  Schema 探索  │     │   Agent 对话     │
                    │  (对象类/属性) │     │   (智能问答)      │
                    └──────────────┘     └─────────────────┘
```

0. **导入数据** — 将示例数据 (`seed.sql`，虚构的智能家居供应链) 导入 MySQL
1. **连接数据源** — 将 MySQL 数据库注册到平台
2. **创建知识网络** — 基于数据源自动发现表结构并构建知识网络
3. **探索 Schema** — 查看自动识别的对象类型和属性
4. **语义搜索** — 用自然语言检索知识图谱
5. **Agent 对话** — 向 Agent 提问，基于数据库内容进行智能问答

## 快速开始

```bash
# 复制配置模板，填写数据库连接信息
cp env.sample .env
vim .env

# 运行完整流程
./run.sh
```

## 配置说明

### `DB_NAME`

设置为服务器上**已存在**的数据库名（如 `supply_chain_test`）。Step 0 会将 `seed.sql` 导入到该数据库中。

### `DB_HOST` 与 `DB_HOST_SEED`

- `DB_HOST`：**平台内部访问**的数据库地址（Step 1 的 `kweaver ds connect` 使用），通常是云服务器**内网 IP**（如 `172.19.0.9`）
- `DB_HOST_SEED`：**本机导数据**的地址（Step 0 的 `mysql` 客户端使用），如果本机无法访问内网 IP，可设为**公网 IP**

如果不设 `DB_HOST_SEED`，默认使用 `DB_HOST`。

### `DEBUG`

在 `.env` 中设置 `DEBUG=1`（或 `true`）可打印详细诊断信息：主机地址、`kweaver` 版本、配置、API 原始 JSON 等（不会泄露密码）。

## 关键命令

```bash
# 连接数据源
kweaver ds connect mysql $DB_HOST $DB_PORT $DB_NAME \
  --account $DB_USER --password $DB_PASS --name "my-datasource"

# 从数据源创建知识网络
kweaver bkn create-from-ds <datasource-id> --name "my-kn" --build

# 探索 Schema
kweaver bkn object-type list <kn-id>

# 配置上下文加载器并搜索
kweaver context-loader config set --kn-id <kn-id>
kweaver context-loader kn-search "供应链"

# 与 Agent 对话
kweaver agent chat <agent-id> -m "主要供应商有哪些？"
```

## 常见问题

### `ERROR 1044 ... Access denied ... to database '<name>'`

`.env` 中的 MySQL 用户对 `DB_NAME` 指定的数据库没有权限。例如 `kweaver_rw` 通常只被授权 `kweaver_app` 库。需要 DBA 执行：

```sql
GRANT ALL PRIVILEGES ON `your_db`.* TO 'your_user'@'%';
FLUSH PRIVILEGES;
```

### `504 Gateway Time-out`

Agent 对话超时（Nginx 默认 60 秒）。脚本已使用 `--stream` 流式模式避免此问题。如仍出现，可在 Ingress 上增加超时配置：

```yaml
nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
```

## 清理

脚本退出时会自动清理创建的资源（知识网络、数据源）。手动清理：

```bash
kweaver bkn delete <kn-id> -y
kweaver ds delete <datasource-id> -y
```
