package agentsvc

import (
	"context"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"go.opentelemetry.io/otel/attribute"
)

func (agentSvc *agentSvc) TerminateChat(ctx context.Context, conversationID string) error {
	var err error
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	o11y.SetAttributes(ctx, attribute.String("conversation_id", conversationID))
	stopchan, _ := stopChanMap.Load(conversationID)
	if stopchan == nil {
		o11y.Error(ctx, fmt.Sprintf("[TerminateChat] terminate chat failed, conversationID: %s, stopchan not found", conversationID))
		agentSvc.logger.Errorf("terminate chat failed, conversationID: %s, stopchan not found", conversationID)
		return capierr.New404Err(ctx, "stopchan not found")
	}
	close(stopchan.(chan struct{}))
	stopChanMap.Delete(conversationID)
	o11y.Info(ctx, fmt.Sprintf("[TerminateChat] terminate chat success, conversationID: %s", conversationID))
	agentSvc.logger.Infof("terminate chat success, conversationID: %s", conversationID)
	return nil
}
