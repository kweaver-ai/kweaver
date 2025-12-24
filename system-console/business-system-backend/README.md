# 业务系统后端服务

## 项目简介
业务系统后端服务（Business System Backend）是一个基于Go语言开发的企业级后端服务，主要负责业务域管理和资源管理功能。该服务为企业提供业务域的创建、查询、编辑、删除以及成员管理功能，同时支持资源的连接、解绑和搜索操作。

## 技术栈

### 核心技术
- **编程语言**: Go 1.25.3
- **Web框架**: Gin 1.11.0
- **ORM框架**: GORM 1.31.1
- **日志库**: Logrus 1.9.3
- **配置管理**: envconfig 1.4.0, godotenv 1.5.1

### 数据库支持
- MySQL
- 支持多种数据库方言（dm8, kdb9, mariadb）

### 中间件与服务依赖
- 消息队列: 支持Kafka等
- 认证授权: 与外部授权服务集成
- 服务部署: 支持容器化部署（Docker）

## 项目结构

```
/root/develop/DIP/business-system-backend/
├── ci/                  # CI/CD配置
├── docker/              # Docker相关配置文件
├── helm/                # Helm Chart部署配置
├── internal/            # 内部包
│   ├── cerror/          # 自定义错误处理
│   ├── config/          # 配置管理
│   ├── database/        # 数据库连接和操作
│   ├── initial/         # 初始化逻辑
│   ├── logger/          # 日志配置
│   ├── midware/         # 中间件
│   ├── model/           # 数据模型
│   ├── pkg/             # 公共包
│   │   ├── auditlog/    # 审计日志
│   │   ├── authorization/ # 授权服务
│   │   ├── deployservice/ # 部署服务
│   │   ├── hydra/       # Hydra认证
│   │   └── usermgnt/    # 用户管理
│   ├── router/          # 路由定义
│   ├── server/          # 服务器配置
│   └── service/         # 业务服务层
│       ├── business_domain/ # 业务域服务
│       └── resource/    # 资源服务
├── migrations/          # 数据库迁移脚本
├── sql/                 # SQL脚本按数据库类型分类
├── cmd/                 # 命令行入口
│   └── business-system/ # 业务系统命令
│       └── main.go      # 应用入口
├── go.mod               # Go模块定义
└── go.sum               # 依赖校验
```

## 主要功能模块

### 1. 业务域管理 (Business Domain)
业务域是企业资源和用户的组织单位，该模块提供以下功能：

- **业务域生命周期管理**
  - 创建业务域
  - 查询业务域详情
  - 获取业务域列表
  - 编辑业务域信息
  - 删除业务域

- **业务域成员管理**
  - 管理业务域成员（添加、更新、移除）
  - 查询业务域成员列表
  - 支持不同角色（管理员、开发者、查看者、客户）

- **资源类型实例管理**
  - 获取资源类型实例列表
  - 支持分页和关键词搜索

### 2. 资源管理 (Resource)
该模块负责管理业务域与资源的关联关系：

- **资源连接管理**
  - 将资源连接到业务域
  - 从业务域解绑资源
  - 搜索资源

- **内部API接口**
  - 提供内部系统调用的专用接口

## 配置说明

### 环境变量配置
应用通过环境变量进行配置，主要配置项包括：

#### 基本配置
- `PORT`: 服务端口，默认8080
- `NAME`: 服务名称，默认business-system-backend
- `PREFIX`: API前缀，默认/api/business-system

#### 数据库配置
- `DB_HOST`: 数据库主机，默认localhost
- `DB_PORT`: 数据库端口，默认3306
- `DB_USER`: 数据库用户名，默认root
- `DB_PASSWORD`: 数据库密码，默认root
- `DB_NAME`: 数据库名称，默认mydb
- `DB_TYPE`: 数据库类型，默认MYSQL
- `DB_SYSTEMID`: 数据库系统ID
- 连接池配置参数

#### 消息队列配置
- `MQ_TYPE`: 消息队列类型，默认kafka
- `MQ_HOST`: 消息队列主机
- `MQ_PORT`: 消息队列端口
- 认证配置

#### 日志配置
- `LOG_LEVEL`: 日志级别，默认debug
- `LOG_FORMAT`: 日志格式，默认text

#### 依赖服务配置
- `AUTH_PRIVATE_BASE_URL`: 授权服务私有API地址
- `AUTH_PUBLIC_BASE_URL`: 授权服务公共API地址
- `DEPLOY_SERVICE_BASE_URL`: 部署服务地址
- `HYDRA_BASE_URL`: Hydra服务地址
- `USER_MNGT_BASE_URL`: 用户管理服务地址
- `ENABLE_MQ`: 是否启用消息队列，默认true

## 部署说明

### Docker部署
项目提供了Docker相关配置，支持通过Docker Compose或Kubernetes部署。

#### 构建镜像
使用docker-bake.hcl构建Docker镜像：
```bash
docker buildx bake
```

### Helm部署
项目包含Helm Chart配置，支持在Kubernetes集群中部署：
```bash
helm install business-system-service ./helm/business-system-service
```

## API文档

### 业务域管理API
- `POST /api/business-system/v1/business-domain` - 创建业务域
- `GET /api/business-system/v1/business-domain` - 获取业务域列表
- `GET /api/business-system/v1/business-domain/:bdid` - 获取业务域详情
- `DELETE /api/business-system/v1/business-domain/:bdid` - 删除业务域
- `PUT /api/business-system/v1/business-domain/:bdid` - 编辑业务域
- `GET /api/business-system/v1/business-domain/members/:bdid` - 获取业务域成员列表
- `POST /api/business-system/v1/business-domain/members/:bdid` - 编辑业务域成员

### 资源管理API
- `DELETE /api/business-system/v1/resource` - 解绑资源
- `POST /api/business-system/v1/resource` - 连接资源
- `GET /api/business-system/v1/resource` - 搜索资源

## 开发指南

### 安装依赖
```bash
go mod tidy
```

### 运行服务
```bash
go run cmd/business-system/main.go
```

### 环境变量文件
可以通过创建.env文件设置环境变量：
```
# .env 示例
PORT=8080
DB_HOST=localhost
DB_PORT=3306
# 其他配置...
```

## 安全说明
- 所有API接口都需要认证中间件进行权限验证
- 使用JWT或OAuth2.0进行用户认证
- 敏感操作都有审计日志记录
