package agentsvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/agentexecutoraccess/agentexecutordto"
	agentreq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/req"
	"github.com/pkg/errors"
)

func (agentSvc *agentSvc) ConversationSessionInit(ctx context.Context, req *agentreq.ConversationSessionInitReq) (ttl int, err error) {
	agent, err := agentSvc.agentFactory.GetAgent(ctx, req.AgentID, req.AgentVersion)
	if err != nil {
		return 0, errors.Wrapf(err, "get agent failed")
	}
	return agentSvc.agentExecutor.ConversationSessionInit(ctx, &agentexecutordto.ConversationSessionInitReq{
		ConversationID: req.ConversationID,
		AgentID:        req.AgentID,
		AgentVersion:   req.AgentVersion,
		AgentConfig:    agent.Config,
		UserID:         req.UserID,
		// VisitorType:     req.VisitorType,
		XAccountID:        req.XAccountID,
		XAccountType:      req.XAccountType,
		XBusinessDomainID: req.XBusinessDomainID,
		ExecutorVersion:   "v2",
	})
}
