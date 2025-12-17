package conversationreq

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/common"

type ListReq struct {
	AgentAPPKey string `json:"-"`
	UserId      string `json:"-"`
	Title       string `json:"title"`
	common.PageSize
}
