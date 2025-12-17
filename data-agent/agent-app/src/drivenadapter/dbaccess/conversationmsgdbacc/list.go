package conversationmsgdbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/conversation_message/conversationmsgreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"go.opentelemetry.io/otel/attribute"

	"github.com/pkg/errors"
)

// List implements idbaccess.IConversationMsgRepo.
func (repo *ConversationMsgRepo) List(ctx context.Context, req conversationmsgreq.ListReq) (rt []*dapo.ConversationMsgPO, err error) {
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, nil)
	o11y.SetAttributes(ctx, attribute.String("conversationID", req.ConversationID))
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)

	po := &dapo.ConversationMsgPO{}
	sr.FromPo(po)

	sr.WhereEqual("f_conversation_id", req.ConversationID).WhereEqual("f_is_deleted", 0)

	poList := make([]dapo.ConversationMsgPO, 0)

	sr.Order("f_index ASC")

	err = sr.Find(&poList)
	if err != nil {
		err = errors.Wrapf(err, "get conversation message list")
		return
	}

	rt = cutil.SliceToPtrSlice(poList)
	return
}
