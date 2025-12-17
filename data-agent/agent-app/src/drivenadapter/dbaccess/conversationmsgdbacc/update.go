package conversationmsgdbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"go.opentelemetry.io/otel/attribute"
)

// Update implements idbaccess.IConversationMsgRepo.
func (repo *ConversationMsgRepo) Update(ctx context.Context, po *dapo.ConversationMsgPO) (err error) {
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, nil)
	o11y.SetAttributes(ctx, attribute.String("conversationID", po.ConversationID))
	o11y.SetAttributes(ctx, attribute.String("msgID", po.ID))
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)

	sr.FromPo(po)

	_, err = sr.WhereEqual("f_id", po.ID).
		SetUpdateFields([]string{
			"f_content",
			"f_content_type",
			"f_status",
			"f_ext",
			"f_update_time",
			"f_update_by",
		}).
		UpdateByStruct(po)

	return
}
