package agentreq

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/constant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/comvalobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cenum"
)

type ChatReq struct {
	InternalParam             `json:",inline"`
	AgentAPPKey               string                  `json:"agent_app_key"`                    // agent app key
	AgentID                   string                  `json:"agent_id"`                         // agentID
	AgentKey                  string                  `json:"agent_key"`                        // agentKey
	AgentVersion              string                  `json:"agent_version,omitempty"`          // agent版本
	ConversationID            string                  `json:"conversation_id"`                  // 会话ID
	TemporaryAreaID           string                  `json:"temporary_area_id"`                // 临时区域ID
	TempFiles                 []valueobject.TempFile  `json:"temp_files"`                       // 临时文件
	Query                     string                  `json:"query"`                            // 查询内容
	CustomQuerys              map[string]interface{}  `json:"custom_querys"`                    // 自定义查询
	Tool                      Tool                    `json:"tool"`                             // 工具
	InterruptedAssistantMsgID string                  `json:"interrupted_assistant_message_id"` // 中断的助手消息ID
	ChatMode                  string                  `json:"chat_mode"`                        // 聊天模式
	ConfirmPlan               bool                    `json:"confirm_plan"`                     // 是否确认计划
	RegenerateUserMsgID       string                  `json:"regenerate_user_message_id"`       // 重新生成的用户消息ID
	RegenerateAssistantMsgID  string                  `json:"regenerate_assistant_message_id"`  // 重新生成的助手消息ID
	History                   []*comvalobj.LLMMessage `json:"history,omitempty"`                // 历史上下文
	HistoryLimit              int                     `json:"history_limit,omitempty"`          // 历史上下文限制,默认10轮
	ModelName                 string                  `json:"model_name,omitempty"`             // 指定使用的大模型名称
	//NOTE: 新增stream参数，控制流式返回
	Stream    bool `json:"stream,omitempty"`     // 是否流式返回
	IncStream bool `json:"inc_stream,omitempty"` // 是否增量返回

	ExecutorVersion string `json:"executor_version"` // executor version v1 或 v2 默认v1
}

type InternalParam struct {
	//NOTE: 用于创建会话、消息
	UserID string `json:"-"` // 用户ID
	Token  string `json:"-"` // 用户token
	//NOTE: 新增参数，用于svc处理中透传信息
	UserMessageID         string `json:"-"` // 用户消息ID
	AssistantMessageID    string `json:"-"` // 助手消息ID
	AssistantMessageIndex int    `json:"-"` // 助手消息下标
	AgentRunID            string `json:"-"` // 会话ID
	//NOTE: 新增参数，用于内部权限校验
	VisitorType constant.VisitorType `json:"-"` // 用户类型 user/app
	//NOTE: 新增参数,用于标识当前是普通chat/debugchat/apichat
	CallType constant.CallType `json:"-"` // 调用类型

	ReqStartTime int64 `json:"-"` // 请求开始时间
	TTFT         int64 `json:"-"` //  首字节时间

	//NOTE: 新增参数，替代之前的userID和visitorType
	XAccountID   string            `json:"-"` // 用户ID
	XAccountType cenum.AccountType `json:"-"` // 用户类型 app/user/anonymous

	//NOTE: 新增参数，业务域ID请求头
	XBusinessDomainID string `json:"-"`
}

type Tool struct {
	SessionID string    `json:"session_id"`
	ToolName  string    `json:"tool_name"`
	ToolArgs  []ToolArg `json:"tool_args"`
}

type ToolArg struct {
	Key string `json:"key"`
	//NOTE： 值类型不确定可能是string、array
	Value interface{} `json:"value"`
	Type  interface{} `json:"type"`
}
