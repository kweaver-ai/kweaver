package agentresp

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/conversationmsgvo"
	// "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
)

// NOTE: chat的响应结果，要求和会话详情基本一致
type ChatResp struct {
	ConversationID     string `json:"conversation_id"`      // 会话ID
	UserMessageID      string `json:"user_message_id"`      // 用户消息ID
	AssistantMessageID string `json:"assistant_message_id"` // 助手消息ID

	Message conversationmsgvo.Message `json:"message"` // 消息
	// Status  string                    `json:"status"`  // 状态
	Error *rest.HTTPError `json:"error"` // 错误
}
