package conversationmsgdbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"go.opentelemetry.io/otel/attribute"
)

func (r *ConversationMsgRepo) GetLatestMsgByConversationID(ctx context.Context, conversationID string) (po *dapo.ConversationMsgPO, err error) {
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, nil)
	o11y.SetAttributes(ctx, attribute.String("conversationID", conversationID))
	po = &dapo.ConversationMsgPO{}
	sr := dbhelper2.NewSQLRunner(r.db, r.logger)
	sr.FromPo(po)
	sr.WhereEqual("f_conversation_id", conversationID)
	sr.Order("f_index DESC")
	sr.Limit(1)
	err = sr.FindOne(po)
	if err != nil {
		return nil, err
	}
	return po, nil
}
