package iv2agentexecutorhttp

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/v2agentexecutoraccess/v2agentexecutordto"
)

// IV2AgentExecutor v2 版本的 Agent Executor 接口
type IV2AgentExecutor interface {
	Call(ctx context.Context, req *v2agentexecutordto.V2AgentCallReq) (chan string, chan error, error)
	Debug(ctx context.Context, req *v2agentexecutordto.V2AgentDebugReq) (chan string, chan error, error)

	ConversationSessionInit(ctx context.Context, req *v2agentexecutordto.V2ConversationSessionInitReq) (ttl int, err error)
}
