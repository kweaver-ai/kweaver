package iagentfactoryhttp

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/agentfactoryaccess/agentfactorydto"
)

type IAgentFactory interface {
	GetAgent(ctx context.Context, agentID string, version string) (agentfactorydto.Agent, error)
}
