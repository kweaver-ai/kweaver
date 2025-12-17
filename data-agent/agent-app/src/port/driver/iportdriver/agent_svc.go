package iportdriver

import (
	"context"

	agentreq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/req"
	agentresp "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/resp"
)

//go:generate mockgen -source=./agent_svc.go -destination ./iportdrivermock/agent_svc.go -package iportdrivermock
type IAgent interface {
	Chat(ctx context.Context, req *agentreq.ChatReq) (chan []byte, error)
	ResumeChat(ctx context.Context, conversationID string) (chan []byte, error)
	TerminateChat(ctx context.Context, conversationID string) error
	Debug(ctx context.Context, req *agentreq.DebugReq) (chan []byte, error)
	GetAPIDoc(ctx context.Context, req *agentreq.GetAPIDocReq) (interface{}, error)
	FileCheck(ctx context.Context, req *agentreq.FileCheckReq) (agentresp.FileCheckResp, error)

	ConversationSessionInit(ctx context.Context, req *agentreq.ConversationSessionInitReq) (ttl int, err error)
}
