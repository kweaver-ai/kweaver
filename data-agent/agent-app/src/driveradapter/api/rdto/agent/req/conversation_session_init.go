package agentreq

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cenum"

type ConversationSessionInitReq struct {
	ConversationID    string            `json:"conversation_id"`
	AgentID           string            `json:"agent_id"`
	AgentVersion      string            `json:"agent_version"`
	UserID            string            `json:"-"`
	XAccountID        string            `json:"-"` // 用户ID
	XAccountType      cenum.AccountType `json:"-"` // 用户类型 app/user/anonymous
	XBusinessDomainID string            `json:"-"`
}
