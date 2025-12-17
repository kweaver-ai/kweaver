package spacememdbacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// BatchCreate 批量创建空间成员
func (repo *SpaceMemberRepo) BatchCreate(ctx context.Context, tx *sql.Tx, pos []*dapo.SpaceMemberPo) (err error) {
	if len(pos) == 0 {
		return
	}

	for i := range pos {
		if pos[i].CreatedBy == "" {
			pos[i].CreatedBy = chelper.GetUserIDFromCtx(ctx)
		}

		if pos[i].CreatedAt == 0 {
			pos[i].CreatedAt = cutil.GetCurrentMSTimestamp()
		}
	}

	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	sr.FromPo(&dapo.SpaceMemberPo{})
	_, err = sr.InsertStructs(pos)

	return
}
