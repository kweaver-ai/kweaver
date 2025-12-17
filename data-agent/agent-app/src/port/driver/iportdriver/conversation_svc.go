package iportdriver

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/comvalobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/conversation/conversationreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/conversation/conversationresp"
)

//go:generate mockgen -source=./conversation_svc.go -destination ./iportdrivermock/conversation_svc.go -package iportdrivermock
type IConversationSvc interface {
	List(ctx context.Context, req conversationreq.ListReq) (agentList conversationresp.ListConversationResp, count int64, err error)
	Detail(ctx context.Context, id string) (res conversationresp.ConversationDetail, err error)
	Init(ctx context.Context, req conversationreq.InitReq) (rt conversationresp.InitConversationResp, err error)
	Update(ctx context.Context, req conversationreq.UpdateReq) (err error)
	Delete(ctx context.Context, id string) (err error)
	DeleteByAppKey(ctx context.Context, appKey string) (err error)
	MarkRead(ctx context.Context, id string, latest_read_index int) (err error)

	//NOTE: 获取会话中的历史上下文
	GetHistory(ctx context.Context, id string, limit int, regenerateUserMsgID string, regenerateAssistantMsgID string) ([]*comvalobj.LLMMessage, error)
}
