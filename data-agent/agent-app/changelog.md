# 版本changelog说明

## 1.0.0

- 新增会话管理功能
- 自定义会话标题
- 会话已读未读状态
- 会话列表显示会话是否有正在进行的对话
- Agent对话
- 对话终止
- 对话恢复
- 重新生成答案
- 编辑问题
- Agent调试运行
- Agent API 能力
- Agent API 文档
- chat内部接口对接benchmark
- 检查上传文件全文内容存储进度
- 关键链路可观测性埋点
- Agent 权限对接



## 1.0.1
- feat: progress中添加flags字段 用于前端控制是否展示 progress 
- feat: 更新agent-go-common-pkg 到 v1.0.2
- bug-fix: 修复agent-app启动时无法连接数据库的bug ，componentMeta中添加rds dependence
- bug-fix: 修复可观测性埋点bug，Process传给AfterProcess的ctx改为span的ctx
- feat: 文档召回结果适应新结构， 增加doc_qa工具文档召回结果处理策略

## 1.0.2
- feat: 基于IP实现会话亲和性,Agent-App支持多pod,修改ingress.yaml，增加亲和性配置
- bug-fix: 修复对话过程中客户端断开连接引起的管道损坏bug, 修改管道错误处理方式


## 1.0.3
- feat: 更新agent-go-common-pkg 到 1.0.6, 工具配置新增工具结果处理策略和指标模型知识条目字段
- feat: 支持通过configmap修改日志等级配置
- feat: 添加部分可观测性埋点
- bug-fix: 修复多次调用doc_qa工具只保存最后一次结果的bug，在progress中，直接对doc_qa结果添加引用，弃用doc_retreivel_res


## 1.0.4
- feat: trace 埋点增加user-id属性
- bug-fix: 优化对话吐字慢的问题；使用有缓冲channel，改用sonic序列化
- bug-fix: 修复不需要文档召回时返回“不需要召回”导致的序列化错误（未调用doc_qa工具）， 去除了原有的文档召回结果处理逻辑，在progress中直接处理doc_qa工具的结果
- bug-fix: 修复Agent工具重复调用的问题，问题是因为progress中的一些字段比如blockeranswer，是interface类型，在序列化为json字符串进行去重时，数据中字段顺序不一致，但是内容相同
           导致未去重； 在progress中增加唯一标识id，作为去重标记
- bug-fix: 修复nil map 赋值出现panic的问题
- bug-fix: 修复应用账号权限校验错误；内部接口传递x-visitor-type给executor，如果是应用账号使用的是app而不是business
- feat: 优化process处理过程，控制StreamDiff的频率； 精简progress中的结果，接受executor时动态字段去除无用字段
- feat: 丰富执行过程信息，增加耗时和token信息
- feat: 服务器优雅关闭功能
- bug-fix: 修复nil map 赋值出现panic的问题
- bug-fix: 跨服务请求上下文注入trace信息； 修复API文档错误；
- feat： API Chat 新增内部接口供工具调用
- bug-fix：重新生成时，对话历史上下文不应该包含重新生成前的消息
- feat: APIChat 请求参数由agent_id 改为agent_key； Agent使用权限校验时，先使用agent_id校验，若无agent_id，再根据agent_key获取agent_id; 内部请求权限校验时请求头改为user/app

## 1.0.5
- feat: 临时区代码迁移-intellisearch服务下线
- feat: Agent对话性能优化，降低首token响应， 修改初始化会话接口；新增session初始化接口； 对话接口支持选择v1 v2版本的executor； 
- feat: 细化Agent-executor返回的错误，新增错误码并国际化
- feat: 微服务间内部接口使用x-account-id, x-account-type； 修改鉴权中间件
- feat: 工具和Agent新增超时时间配置，修改agent-go-common-pkg版本
- bug: 修复chat报错时，丢失progress中的一个stage的bug
- feat: 接入业务域，请求executor时，注入业务域id信息
- fix : stream_diff_frequency 改为configmap配置，支持通过配置传入
- bug: 调整消息处理逻辑并移除无效错误处理代码,对于非法格式消息记录错误日志并跳过处理而非中断流程
- fix: 在 StreamDiff 函数中增加对 emitJSON 调用次数的计数，并在未发现 JSON 差异时输出警告日志，便于调试和监控空变更情况。同时引入 logger 包以支持日志记录功能。
