package conversationsvc

import (
	"context"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/agentexecutoraccess/agentexecutordto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/conversation/conversationreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/conversation/conversationresp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/pkg/errors"
)

func (sv *conversationSvc) Init(ctx context.Context, req conversationreq.InitReq) (rt conversationresp.InitConversationResp, err error) {
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	if req.Title == "" {
		req.Title = "新会话"
	}
	po := &dapo.ConversationPO{
		AgentAPPKey: req.AgentAPPKey,
		CreateBy:    req.UserID,
		UpdateBy:    req.UserID,
		Title:       req.Title,
		Ext:         new(string),
	}
	po, err = sv.conversationRepo.Create(ctx, po)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[Init] create conversation error, err: %v", err))
		return rt, errors.Wrapf(err, "update conversation title failed")
	}
	rt = conversationresp.InitConversationResp{
		ID: po.ID,
	}
	if req.TempareaId != "" {
		err = sv.tempAreaRepo.Bind(ctx, req.TempareaId, po.ID)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[Init] bind temparea failed, err: %v", err))
			return rt, errors.Wrapf(err, "bind temparea failed")
		}
	}

	agent, err := sv.agentFactory.GetAgent(ctx, req.AgentID, req.AgentVersion)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[Init] get agent failed, err: %v", err))
		return rt, errors.Wrapf(err, "get agent failed")
	}
	rt.TTL, err = sv.agentExecutor.ConversationSessionInit(ctx, &agentexecutordto.ConversationSessionInitReq{
		ConversationID:    po.ID,
		AgentID:           agent.ID,
		AgentConfig:       agent.Config,
		UserID:            req.UserID,
		XAccountID:        req.XAccountID,
		XAccountType:      req.XAccountType,
		XBusinessDomainID: req.XBusinessDomainID,
		//NOTE: 需要根据配置决定使用 v1 或 v2
		ExecutorVersion: req.ExecutorVersion,
	})
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[Init] initialize conversation session failed, err: %v", err))
		return rt, errors.Wrapf(err, "initialize conversation session failed")
	}
	return
}
