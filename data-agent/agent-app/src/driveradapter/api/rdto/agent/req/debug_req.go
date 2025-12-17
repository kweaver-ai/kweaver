package agentreq

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/comvalobj"
)

type DebugReq struct {
	AgentID        string     `json:"agent_id"`        // agentID
	AgentVersion   string     `json:"agent_version"`   // agent版本
	Input          DebugInput `json:"input"`           // 输入
	ConversationID string     `json:"conversation_id"` // 会话ID

	ChatMode string `json:"chat_mode"` // 聊天模式
	//NOTE: 新增stream参数，控制流式返回
	Stream    bool `json:"stream,omitempty"`     // 是否流式返回
	IncStream bool `json:"inc_stream,omitempty"` // 是否增量返回

	UserID      string `json:"-"` // 用户ID
	Token       string `json:"-"` // 用户token
	AgentAPPKey string `json:"-"`

	SessionID string `json:"-"`

	ExecutorVersion string `json:"executor_version"` // executor version v1 或 v2 默认v1
}

type DebugInput struct {
	TempFiles    []valueobject.TempFile  `json:"temp_files"`    // 临时文件
	Query        string                  `json:"query"`         // 查询内容
	CustomQuerys map[string]interface{}  `json:"custom_querys"` // 自定义查询
	Tool         Tool                    `json:"tool"`          // 工具
	History      []*comvalobj.LLMMessage `json:"history"`       // 历史
}
