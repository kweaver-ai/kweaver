# 结构说明

## boot
服务启动时执行的代码，负责系统初始化工作，包括配置加载、数据库连接、Redis初始化、验证器初始化和HTTP客户端初始化等。

## domain
领域模型层，采用领域驱动设计(DDD)架构，包含以下子模块：
- aggregate：聚合根对象
- entity：实体对象
- service：领域服务
- valueobject：值对象
- e2p：实体到持久化的转换
- p2e：持久化到实体的转换

## drivenadapter
从动适配层，实现领域模型与外部系统的交互，包括：
- dbaccess：数据库访问

## driveradapter
驱动适配层，处理外部请求并调用领域服务，包括：
- api：API接口
- mq：消息队列
- task：任务处理

## infra
基础设施层，提供技术支持，包括：
- persistence：持久化相关

## port
接口（港口），定义系统与外部交互的接口，包括：
- driven：从动端口，由领域层定义，由从动适配器实现
- driver：驱动端口，由领域层实现，由驱动适配器调用
