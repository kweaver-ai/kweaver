package agentsvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/agentexecutoraccess/agentexecutordto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iagentexecutorhttp"
)

type AgentCall struct {
	callCtx       context.Context
	req           *agentexecutordto.AgentCallReq
	agentExecutor iagentexecutorhttp.IAgentExecutor
	cancelFunc    context.CancelFunc
}

func (a *AgentCall) Call() (chan string, chan error, error) {
	return a.agentExecutor.Call(a.callCtx, a.req)
}

func (a *AgentCall) Cancel() {
	a.cancelFunc()
}
