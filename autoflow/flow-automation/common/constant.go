package common

import "time"

type Order string //nolint

const (
	// ASC 升序
	ASC = "asc"
	// DESC 降序
	DESC = "desc"
	// Updated_At 更新于
	Updated_At = "updated_at" //nolint
	// UpdatedAt 更新于
	UpdatedAt = "updatedAt"
	// Created_At 创建于
	Created_At = "created_at" //nolint
	// CreatedAt 创建于
	CreatedAt = "createdAt"
	// Started_At 开始于
	Started_At = "started_at" //nolint
	// Ended_At 结束于
	Ended_At = "ended_at" //nolint
	// EndedAt 结束于
	EndedAt = "endedAt"
	// Name 排序按名称
	Name = "name"
	// NormalStatus 任务状态启用
	NormalStatus = "normal"
	// SuccessStatus 任务运行成功
	SuccessStatus = "success"
	// FailedStatus 任务运行失败
	FailedStatus = "failed"
	// CanceledStatus 任务运行取消
	CanceledStatus = "canceled"
	// RunningStatus 任务运行中
	RunningStatus = "running"
	// ScheduledStatus 任务等待中
	ScheduledStatus = "scheduled"
	// StoppedStatus 任务状态禁用
	StoppedStatus = "stopped"
	// UndoStatus 任务未运行
	UndoStatus = "undo"
	// BlockStatus 任务阻塞中
	BlockStatus = "block"

	// TimeFormat 时间戳转换格式
	TimeFormat = "2006-01-02 15:04:05"

	// ChannelMessage channel
	ChannelMessage string = "automation"

	DagChannelPrefix string = "automation.dag"

	// CreateTask 创建任务
	CreateTask = "createTask"
	// UpdateTask 更新任务
	UpdateTask = "updateTask"
	// DeleteTask 删除任务
	DeleteTask = "deleteTask"
	// TriggerTaskManually 手动触发任务
	TriggerTaskManually = "triggerTaskManually"
	// TriggerTaskCron 定时触发任务
	TriggerTaskCron = "triggerTaskCron"
	// CompleteTaskWithSuccess 完成任务-成功
	CompleteTaskWithSuccess = "completeTaskWithSuccess"
	// CompleteTaskWithFailed 完成任务-失败
	CompleteTaskWithFailed = "completeTaskWithFailed"
	// CancelRunningInstance 取消执行实例
	CancelRunningInstance = "cancelRunningInstance"

	// 自定义节点操作
	CreateCustomExecutor       = "createCustomExecutor"
	UpdateCustomExecutor       = "updateCustomExecutor"
	DeleteCustomExecutor       = "deleteCustomExecutor"
	CreateCustomExecutorAction = "createCustomExecutorAction"
	UpdateCustomExecutorAction = "updateCustomExecutorAction"
	DeleteCustomExecutorAction = "deleteCustomExecutorAction"

	// AuditType 审核类型
	AuditType = "automation"

	SecurityPolicyAuditPrefix = "security_policy_"

	// Authorization header Authorization 标识
	Authorization = "x-authorization"
	// AnyshareAddress as 地址
	AnyshareAddress = "x-as-address"

	// SystemSysAdmin admin管理员
	SystemSysAdmin string = "266c6a42-6131-4d62-8f39-853e7093701c"
	// SystemAuditAdmin audit管理员
	SystemAuditAdmin string = "94752844-BDD0-4B9E-8927-1CA8D427E699"
	// SystemSecAdmin security管理员
	SystemSecAdmin string = "4bb41612-a040-11e6-887d-005056920bea"
	// SystemOriginSysAdmin 原有sys管理员ID
	SystemOriginSysAdmin string = "234562BE-88FF-4440-9BFF-447F139871A2"

	// PriorityHighest 调度highest优先级
	PriorityHighest string = "highest"
	// PriorityHigh 调度high优先级
	PriorityHigh string = "high"
	// PriorityMedium 调度medium优先级
	PriorityMedium string = "medium"
	// PriorityLow 调度low优先级
	PriorityLow string = "low"
	// PriorityLowest 调度lowest优先级
	PriorityLowest string = "lowest"

	// DumpLogLockTime 日志转存锁持有时间
	DumpLogLockTime = 30 * time.Second
	// DefaultQuerySize 一次批量查询的大小
	DefaultQuerySize = 10000
	// WorkflowApprovalTaskIds 待审核任务id变量名称
	WorkflowApprovalTaskIds = "__workflow_approval_task_ids"
	// SecurityPolicyPerm 权限申请安全策略类型
	SecurityPolicyPerm = "perm"
	// SecurityPolicyUpload 上传审核安全策略类型
	SecurityPolicyUpload = "upload"
	// SecurityPolicyDelete 删除审核安全策略类型
	SecurityPolicyDelete = "delete"
	// NotifyToExecutor 通知执行者
	NotifyToExecutor = "notifyToExecutor"
	// TrainStatusInit 模型训练初始化状态
	TrainStatusInit = "init"
	// TrainStatusRunning 模型训练训练完成状态
	TrainStatusFinished = "finished"
	// TrainStatusFailed 模型训练失败状态
	TrainStatusFailed = "failed"

	// ArLogCreateDag ar日志类型 创建dag
	ArLogCreateDag = "create"
	// ArLogStartDagIns ar日志类型 运行dag
	ArLogStartDagIns = "start"
	// ArLogEndDagIns ar日志类型 dag运行结束
	ArLogEndDagIns = "end"
	// CreateByLocal 从本地导入标识
	CreateByLocal = "local"
	// CreateByTemplate 从流程模板新建标识
	CreateByTemplate = "template"
	// CreateByLocalName 从本地导入
	CreateByLocalName = "从本地导入"
	// CreateByTemplateName 从流程模板新建
	CreateByTemplateName = "从流程模板新建"
	// CreateByDirectName 直接新建
	CreateByDirectName = "直接新建"
	// CreateFlowByClient 从客户端创建工作流
	CreateFlowByClient = "client"
	// CreateFlowByConsole 从控制台创建工作流
	CreateFlowByConsole = "console"
	// CMS_CONFIG_SERVICE_ACCESS cms配置路径
	CMS_CONFIG_SERVICE_ACCESS = "/conf/service-access/default.yaml"
	// AuthenticatedUserType 实名用户
	AuthenticatedUserType = "authenticated_user"
	// AnonymousUserType 匿名用户
	AnonymousUserType = "anonymous_user"
	// InternalServiceUserType 内部服务用户
	InternalServiceUserType = "internal_service"
	// AppUserType 应用账户用户
	AppUserType = "app"
	// KnowledgeDocLib 知识库
	KnowledgeDocLib = "knowledge_doc_lib"
	// DepartmentDocLib 部门文档库
	DepartmentDocLib = "department_doc_lib"
	// CustomDocLib 自定义文档库
	CustomDocLib = "custom_doc_lib"
	// ServiceName 服务名
	ServiceName = "content-automation"
	// FlowServiceName 工作流服务名
	FlowServiceName = "flow-automation"
	// StartRunDag 开始执行dag
	StartRunDag = "startRunDag"
	// ErrCodeServiceName RestError 错误码第一段服务名
	ErrCodeServiceName = "FlowAutomation"
	// ExecutionModeAsync 异步
	ExecutionModeAsync = "async"
	// ExecutionModeSync 同步
	ExecutionModeSync = "sync"
)

const (
	_ = iota
	UIEType
	TagRuleType
)

const (
	Init = iota - 1
	UnPublish
	Publish
)

const (
	APIPREFIXV2        = "/api/automation/v2"
	BizDomainDefaultID = "bd_public"
)

// 服务已存在工作流类型
const (
	// DagTypeSecurityPolicy 安全策略类流程
	DagTypeSecurityPolicy = "security-policy"
	// DagTypeDataFlow 数据流类型
	DagTypeDataFlow = "data-flow"
	// DagTypeDataFlowForBot bot已绑定工作流
	DagTypeDataFlowForBot = "data-flow-for-bot"
	// DagTypeComboOperator 组合算子
	DagTypeComboOperator = "combo-operator"
	// DefalutDagType 默认流程类型
	DagTypeDefault = "default"
)

// 国际化资源路径
const (
	MultiResourcePath = "resource/locales"
)

const (
	DBTYPEKDB = "KDB"
)

// 数据流版本管理默认版本定义
const (
	DefaultDagVersion = "v0.0.0"
)

// 权限校验资源类型常量定义，已定义类型:
// DagTypeDataFlow
// DagTypeComboOperator
// DagTypeDefault
const (
	// ReSourceTypeObservability 可观测性概览资源类型
	ReSourceTypeObservability = "observability"
)
