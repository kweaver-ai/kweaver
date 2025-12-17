package conversationsvc

import (
	"context"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/conversation/conversationreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/pkg/errors"
	"go.opentelemetry.io/otel/attribute"
)

func (svc *conversationSvc) Update(ctx context.Context, req conversationreq.UpdateReq) (err error) {
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	o11y.SetAttributes(ctx, attribute.String("conversation_id", req.ID))

	// 1. 获取数据
	_, err = svc.conversationRepo.GetByID(ctx, req.ID)
	if err != nil {
		if chelper.IsSqlNotFound(err) {
			o11y.Error(ctx, fmt.Sprintf("[Update] get conversation error, id: %s, err: %v", req.ID, err))
			err = capierr.NewCustom404Err(ctx, apierr.ConversationNotFound, fmt.Sprintf("[Update] get conversation error, id: %s, err: %v", req.ID, err))
			return
		}
		return
	}
	currentTimestamp := cutil.GetCurrentMSTimestamp()
	// 2. 更新标题
	err = svc.conversationRepo.Update(ctx, &dapo.ConversationPO{ID: req.ID, Title: req.Title, UpdateTime: currentTimestamp})
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[Update] update conversation error, id: %s, err: %v", req.ID, err))
		return errors.Wrapf(err, "[Update] update conversation error, id: %s, err: %v", req.ID, err)
	}
	// 3. 更新临时区域
	if req.TempareaId != "" {
		err = svc.tempAreaRepo.Bind(ctx, req.TempareaId, req.ID)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[Update] update conversation title failed, id: %s, err: %v", req.ID, err))
			return errors.Wrapf(err, "[Update] update conversation title failed, id: %s, err: %v", req.ID, err)
		}
	}
	return
}
