package spacedbacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// Update 更新空间
func (repo *SpaceRepo) Update(ctx context.Context, tx *sql.Tx, po *dapo.SpacePo) (err error) {
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	if po.UpdatedBy == "" {
		po.UpdatedBy = chelper.GetUserIDFromCtx(ctx)
	}

	po.UpdatedAt = cutil.GetCurrentMSTimestamp()

	sr.FromPo(po)

	_, err = sr.WhereEqual("f_id", po.ID).
		SetUpdateFields([]string{
			"f_name",
			"f_profile",
			"f_updated_at",
			"f_updated_by",
		}).
		UpdateByStruct(po)

	return
}
