package conversationdbacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"go.opentelemetry.io/otel/attribute"
)

// DeleteByAppKey implements idbaccess.IConversationRepo.
func (repo *ConversationRepo) Delete(ctx context.Context, tx *sql.Tx, id string) (err error) {
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, nil)
	o11y.SetAttributes(ctx, attribute.String("conversationID", id))
	po := &dapo.ConversationPO{}

	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}
	sr.FromPo(po)

	_, err = sr.WhereEqual("f_id", id).Update(map[string]interface{}{"f_is_deleted": 1})

	return
}

func (repo *ConversationRepo) DeleteByAPPKey(ctx context.Context, tx *sql.Tx, appKey string) (err error) {
	po := &dapo.ConversationPO{}

	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	sr.FromPo(po)

	_, err = sr.WhereEqual("f_agent_app_key", appKey).Update(map[string]interface{}{"f_is_deleted": 1})

	return
}
