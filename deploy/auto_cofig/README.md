# 场景化自动配置

部署完成后，使用此目录下的脚本可以快速导入供应链等场景的示例数据和配置。

## 文件说明

| 文件 | 用途 |
| --- | --- |
| `config.env` | 统一配置文件，包含认证信息和数据源连接参数 |
| `setup_tem_db.sh` | 数据准备脚本，将示例数据导入 MariaDB 并自动回写连接信息到 `config.env` |
| `auto_config.sh` | 自动配置脚本，读取 `config.env` 后创建数据源、导入知识网络/智能体/数据流等 |
| `dump-tem.sql` | 供应链示例数据的 SQL 文件 |
| `agent.json` | DataAgent 配置 |
| `供应链业务知识网络.json` | 业务知识网络配置 |
| `dataflow.json` | 数据流配置 |
| `*.adp` | 工具集文件 |

## 前置条件

1. KWeaver 已部署完成（`deploy.sh full init`）
2. 登录系统工作台（`https://<ip>/deploy`，默认账号/密码：`admin/eisoo.com`），在 **信息安全管理 → 统一身份认证 → 账户 → 用户** 中新建用户 `test`，在 **角色与访问策略 → 角色管理** 中将 `test` 添加到数据管理员、AI管理员、应用管理员角色
3. 访问 `https://<ip>/studio`，使用 `test` 登录（默认密码：`123456`），按提示修改密码为 `111111`

## 使用步骤

### 步骤 1：准备示例数据库

`setup_tem_db.sh` 会自动从 `conf/config.yaml` 读取 MariaDB 的连接凭据，在集群内创建 `tem` 数据库并导入 `dump-tem.sql`，完成后将数据库地址、用户名和密码回写到 `config.env`。

```bash
chmod +x setup_tem_db.sh
./setup_tem_db.sh
```

执行后 `config.env` 中的 `DS_HOST`、`DS_USERNAME`、`DS_PASSWORD` 会被自动更新，无需手动修改。

### 步骤 2：执行自动配置

`auto_config.sh` 读取 `config.env` 中的认证信息和数据源配置，依次完成创建数据源、导入知识网络、导入智能体等操作。

```bash
chmod +x auto_config.sh

# 一键导入（数据源 + 知识网络 + 智能体 + 数据流）
./auto_config.sh agent.json 供应链业务知识网络.json dataflow.json

# 导入工具集
./auto_config.sh --step 7 contextloader工具集_020.adp
./auto_config.sh --step 7 基础结构化数据分析工具箱2.adp
```

### 步骤 3：在 Studio 中完成关联

使用 `test` 账号登录 Studio（`https://<ip>/studio`）：

- **BKN引擎 → 业务知识网络** 中编辑 **供应链业务知识网络**，将对象类、关系类、行动类等关联到导入的数据源
- **决策智能体 → 开发 → 决策智能体** 中编辑 **供应链业务问答助手**，在知识来源中添加 **供应链业务知识网络**，配置模型后发布

## config.env 配置说明

```bash
# 认证信息（登录 Studio 的用户）
USERNAME=test
PASSWORD=111111

# 数据源配置（setup_tem_db.sh 会自动填充以下字段）
DS_TYPE=mysql              # 数据库类型
DS_NAME=供应链业务分析       # 连接名称
DS_DATABASE_NAME=tem       # 数据库名称
DS_HOST=<自动填充>          # 数据库地址（setup_tem_db.sh 回写）
DS_PORT=3306               # 端口（port-forward 的本地端口）
DS_USERNAME=<自动填充>      # 数据库用户名（setup_tem_db.sh 回写）
DS_PASSWORD=<自动填充>      # 数据库密码（setup_tem_db.sh 回写）
```
