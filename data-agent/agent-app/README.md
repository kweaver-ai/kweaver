# Agent-app

## 项目简介

    Agent-APP 是 XXX

## 名词解释

| 术语名称 | 定义 |
|---------|------|
| Agent（智能体） | 一种借助大模型、知识库、记忆、工具、数据流等多种基础功能，实现智能化的交互、决策、任务执行的自主实体，通过 Agent 配置进行创建，发布后可以被用户使用 |
| Agent App Market（智能体应用市场） | 一个用于查找、使用 Agent App 的入口，支持按照空间、分类等维度显示 Agent App，也可以查看历史使用的 Agent App |
| Agent Template（智能体模板） | 基于 Agent 配置保存的配置模板，模板支持导入导出，可以基于模板快速创建 Agent App |
| Agent App（智能体应用） | 基于一个或多个Agent 构建的完整的应用或系统，通常结合业务逻辑、多 Agent 协作提供特定产品能力的、解决实际场景的复杂问题 |

## 项目结构（ai生成，其中部分目录是只是示例）

```
./
├── conf                          # 配置文件目录
├── deploy                        # 部署配置目录
├── helm                          # Helm Chart部署配置
├── src                           # 代码目录
│   ├── boot                      # 启动相关代码
│   ├── domain                    # 领域层 - DDD核心层
│   │   ├── aggregate             # 聚合
│   │   ├── constant              # 常量
│   │   │   └── daconstant        # 数据智能体常量
│   │   ├── e2p                   # 实体到持久化对象转换
│   │   │   └── daconfe2p         # 数据智能体配置实体到持久化对象转换
│   │   ├── entity                # 实体
│   │   │   └── daconfeo          # 数据智能体配置实体对象
│   │   ├── enum                  # 枚举
│   │   │   └── daenum            # 数据智能体枚举
│   │   ├── p2e                   # 持久化对象到实体转换
│   │   │   └── daconfp2e         # 数据智能体配置持久化对象到实体转换
│   │   ├── service               # 领域服务
│   │   │   ├── agentconfigsvc    # 智能体配置服务
│   │   │   └── inject            # 依赖注入
│   │   │       └── dainject      # 数据智能体依赖注入
│   │   ├── types                 # 类型定义
│   │   │   └── dto               # 数据传输对象
│   │   │       └── daconfigdto   # 数据智能体配置DTO
│   │   │           └── dsdto     # 数据源DTO
│   │   └── valueobject           # 值对象
│   │       └── comvalobj         # 通用值对象
│   ├── drivenadapter             # 被驱动适配器
│   │   ├── dbaccess              # 数据库访问
│   │   │   └── daconfdbacc       # 数据智能体配置数据库访问
│   │   └── httpaccess            # HTTP访问
│   ├── driveradapter             # 驱动适配器
│   │   ├── api                   # API定义
│   │   │   ├── apimiddleware     # API中间件
│   │   │   ├── httphandler       # HTTP处理器
│   │   │   │   └── agentconfighandler # 智能体配置处理器
│   │   │   └── rdto              # 请求响应数据传输对象
│   │   │       ├── agent_config  # 智能体配置相关DTO
│   │   │       │   ├── agentconfigreq  # 智能体配置请求DTO
│   │   │       │   └── agentconfigresp # 智能体配置响应DTO
│   │   │       └── common        # 通用DTO
│   │   ├── mq                    # 消息队列
│   │   └── task                  # 任务
│   ├── infra                     # 基础设施层
│   │   ├── apierr                # API错误
│   │   ├── common                # 通用工具
│   │   │   ├── constant          # 常量
│   │   │   ├── enums             # 枚举
│   │   │   ├── global            # 全局变量
│   │   │   └── helpers           # 辅助函数
│   │   ├── persistence           # 持久化
│   │   │   └── dapo              # 数据智能体持久化对象
│   │   └── server                # httpsever等
│   └── port                      # 端口层 - DDD端口
│       ├── driven                # 被驱动端口
│       │   └── idbaccess         # 数据库访问接口
│       │       └── idbaccessmock # 数据库访问接口Mock
│       └── driver                # 驱动端口
│           ├── ihandlerportdriver # 处理器端口驱动接口
│           └── iportdriver       # 端口驱动接口
│               └── iportdrivermock # 端口驱动接口Mock
├── locale                        # 本地化资源
├── migrations                    # 数据库迁移脚本
```

## ddd相关概念说明（主要是ai生成）
| 英文 |缩写| 中文 |说明 |
|----|----|----|----|
|persistence object| po |持久化对象|与数据库表结构一一对应的对象，用于数据库表的增删改查操作，属于持久化层 |
|entity| eo(entity object) |实体|具有唯一标识的领域对象，即使属性相同，不同实体也被视为不同对象|
|value object| vo |值对象|没有唯一标识的领域对象，通过其属性值来识别，相同属性值的值对象被视为同一对象|
|aggregate| - |聚合|由根实体、值对象和其他实体组成的一组相关对象的集合，作为一个整体被外界访问|
|aggregate root| - |聚合根|聚合的根实体，是外部访问聚合内部对象的唯一入口|
|repository| repo |仓储|提供对聚合的持久化和查询能力，隐藏数据访问细节|
|domain service| - |领域服务|表示领域中的一个操作，这个操作不属于任何实体或值对象|
|application service| - |应用服务|协调多个领域对象完成用户用例，是应用层与领域层的边界|


## 缩写约定（ai参与生成）
| 缩写 | 全称              |说明|
|----|-----------------|----|
| da | data agent      |数据智能体|
| um | user_management |用户管理服务相关|
| cmp | component |组件|
|dto| data transfer object |数据传输对象|在不同层或组件间传输数据的简单对象，只包含数据属性和简单的获取/设置方法，不包含业务逻辑|
| rdto | request and response data transfer object |请求和响应数据传输对象|
| d2e| dto to entity |数据传输对象到实体（当dto为rdto的req时，指将rdto转换为entity）|
|ds|datasource|数据源|data agent的数据源|
|assoc|association|关联|data agent和数据集的关联|
|obj|object|对象|数据源中的对象|
|obj_id|object id|对象id|“文档”对象的唯一标识|



## 接口定义规范
### 格式规范
接口路径采用三级分段结构， 格式为：
```
/服务名/版本/Restful资源对象
```
比如 `/agent-app/v3/agent`

### 内外接口区分规范
1. 外部接口（前端/外部系统访问）: 
  - 用途： 提供给前端或第三方系统访问的公共接口， 通过 `Ingress` 暴漏服务
  - 路径格式： `/服务名/版本/Restful资源对象`
  - 访问方式： 通过 Ingress 配置的域名或者 IP 访问
2. 内部接口（后端微服务间调用）
  - 用途： 通过 K8S Service 暴漏服务，不对外暴漏
  - 路径格式： 在基础格式前增加 `internal`前缀， `/服务名/internal/版本/Restful资源对象`
  - 访问方式： 通过集群内 Service 名称或 DNS 访问
