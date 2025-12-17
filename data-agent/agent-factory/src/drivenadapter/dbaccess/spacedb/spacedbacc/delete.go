package spacedbacc

import (
	"context"
	"database/sql"
	"errors"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// Delete 删除空间（软删除）
func (repo *SpaceRepo) Delete(ctx context.Context, tx *sql.Tx, id string) (err error) {
	po := &dapo.SpacePo{}

	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)

	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	uid := chelper.GetUserIDFromCtx(ctx)
	if uid == "" {
		err = errors.New("[SpaceRepo][Delete]: uid is empty")
		return
	}

	sr.FromPo(po)

	_, err = sr.WhereEqual("f_id", id).
		SetUpdateFields([]string{
			"f_deleted_at",
			"f_deleted_by",
		}).
		UpdateByStruct(struct {
			DeletedAt int64  `db:"f_deleted_at"`
			DeletedBy string `db:"f_deleted_by"`
		}{
			DeletedAt: cutil.GetCurrentMSTimestamp(),
			DeletedBy: uid,
		})

	return
}
