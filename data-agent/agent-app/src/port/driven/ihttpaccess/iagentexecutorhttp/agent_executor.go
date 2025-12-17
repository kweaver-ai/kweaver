package iagentexecutorhttp

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/agentexecutoraccess/agentexecutordto"
)

type IAgentExecutor interface {
	Call(ctx context.Context, req *agentexecutordto.AgentCallReq) (chan string, chan error, error)
	Debug(ctx context.Context, req *agentexecutordto.AgentDebugReq) (chan string, chan error, error)
	//NOTE: v1版本没有这个接口
	ConversationSessionInit(ctx context.Context, req *agentexecutordto.ConversationSessionInitReq) (ttl int, err error)
}
