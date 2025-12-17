package conversationmsgdbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"go.opentelemetry.io/otel/attribute"
)

// Create implements idbaccess.IConversationMsgRepo.
func (repo *ConversationMsgRepo) Create(ctx context.Context, po *dapo.ConversationMsgPO) (id string, err error) {
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, nil)
	o11y.SetAttributes(ctx, attribute.String("conversationID", po.ConversationID))
	po.ID = cutil.UlidMake()
	po.CreateTime = cutil.GetCurrentMSTimestamp()
	po.UpdateTime = po.CreateTime
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)

	sr.FromPo(po)
	_, err = sr.InsertStruct(po)

	return po.ID, err
}
