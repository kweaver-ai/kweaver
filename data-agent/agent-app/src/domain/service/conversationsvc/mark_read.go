package conversationsvc

import (
	"context"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/pkg/errors"
	"go.opentelemetry.io/otel/attribute"
)

// MarkRead implements iportdriver.IConversation.
func (svc *conversationSvc) MarkRead(ctx context.Context, id string, lastestReadIdx int) (err error) {
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	o11y.SetAttributes(ctx, attribute.String("conversation_id", id))
	o11y.SetAttributes(ctx, attribute.Int("lastest_read_idx", lastestReadIdx))
	_, err = svc.conversationRepo.GetByID(ctx, id)
	if err != nil {
		if chelper.IsSqlNotFound(err) {
			o11y.Error(ctx, fmt.Sprintf("[MarkRead] get conversation error, id: %s, err: %v", id, err))
			err = capierr.NewCustom404Err(ctx, apierr.ConversationNotFound, fmt.Sprintf("[MarkRead] get conversation error, id: %s, err: %v", id, err))
			return
		}
		o11y.Error(ctx, fmt.Sprintf("[MarkRead] get conversation error, id: %s, err: %v", id, err))
		return
	}

	// 更新最新读取索引
	err = svc.conversationRepo.Update(ctx, &dapo.ConversationPO{ID: id, ReadMessageIndex: lastestReadIdx})
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[MarkRead] update conversation error, id: %s, err: %v", id, err))
		return errors.Wrapf(err, "[MarkRead] update conversation error, id: %s, err: %v", id, err)
	}
	return
}
