# 版本changelog说明

## 1.0.0

- [feat] Agent 支持上下文共享

## 1.0.1
- [feat] 超级助手的在线搜索模式、普通模式默认开启相关问题
- [refact] 移除找数问数相关初始化工具


## 1.1.0
- [feat] python 版本升级到 3.10.18
- [feat] 新增 API Tool 处理策略功能： 支持绑定工具结果处理策略；初始化 DolphinSDK 时自动注册内置策略
- [feat] 新增可观测性trace和log埋点：支持dataagent运行时全链路追踪。
- [feat] 增强“技能引用变量类型参数”path解析能力（支持数组下标和[*]等）
- [feat] 新增 trajectory 记录，在 data/dialog 可查看详细的对话 messages, 方便定位和排查问题
- [feat] 新增 profile 记录， 在 data/profile 可查看详细 Dolphin 运行链路信息
- [feat] explore 切换为 V2 版本，提升性能和稳定性
- [feat] AGENT RUN 接口支持返回 DolphinSDK 指定异常错误码和错误信息
- [feat] “自然语言模式”支持”任务规划“能力（plan mode)
- [refact] 优化 request log 记录，增加请求头信息
- [refact] 构建记忆时，透传 x-user 和 x-visitor-type ，用于模型工厂鉴权
- [refact] 重构配置模块和启动流程优化
- [fix] bug-782619 启动时依赖的服务不可用时的处理（重试，重试失败程序退出）
- [doc] README.MD 补充了本地开发相关说明 



## 1.2.0

### 概述
    此次版本进行了大规模架构重构和模块化优化，详细说明见 docs/changelogs/1.2.0.md

- [refact] 代码拆分优化-router/tool/agent_core 模块化重构，提升可维护性

- [feat] 新增 Agent Core V2 模块化架构，实现分层处理和独立模块设计
    - [refact] agent_core_v2 - dolphin-sdk 从直接使用 dolphin executor 改成使用 DolphinAgent
    - [feat] 新增 OpenTelemetry 追踪支持（trace.py）
    
- [feat] 新增 API V2 版本接口（run_agent_v2、run_agent_debug_v2）
- [refact] 新增 Tool V2 包，重构 API/Agent/MCP Tool 实现，统一工具处理逻辑
- [refact] 新增 Domain/VO 层，定义 AgentConfigVo/AgentInputVo/AgentOptionVo 数据模型

- [refact] 新增 agent 执行接口的session相关逻辑

- [refact] [local dev] 优化配置管理，环境变量化依赖服务地址，支持多模型配置

- [feat] 新增业务域ID(biz_domain_id)支持，透传到 agent/tool 执行链路
- [feat] 新增对话日志模块(dialog_log_v2)和调试日志管理工具(debug_logs.mk)
- [chore] 更新 dolphinlanguagesdk 依赖到 0.3.3，临时禁用 ContextManager 功能
- [fix] 修复 PyInstaller 打包问题
- [fix] 修复会话初始化时 biz_domain_id 参数未传递的问题
- [feat] 增强 stand_log curl 命令生成：支持单引号转义、gzip 压缩、查询参数 URL 编码
- [feat] 新增 conversation-session/init 请求日志开关配置（log_conversation_session_init）


## 1.2.1
- [refact] Graph RAG 检索客户端优化用户账号header处理

## 1.2.2
- [fix] (api_tool_pkg): 完善v1版本接口中工具参数 schema 类型和描述的处理逻辑，确保存在type和description