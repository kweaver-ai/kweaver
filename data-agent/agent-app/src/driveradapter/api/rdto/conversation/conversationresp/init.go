package conversationresp

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cenum"

type InitConversationResp struct {
	ID           string            `json:"id"`
	TTL          int               `json:"ttl"`
	XAccountID   string            `json:"-"` // 用户ID
	XAccountType cenum.AccountType `json:"-"` // 用户类型 app/user/anonymous
}
