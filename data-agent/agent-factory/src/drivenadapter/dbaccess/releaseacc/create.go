package releaseacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// Create implements release.ReleaseRepo.
func (repo *releaseRepo) Create(ctx context.Context, tx *sql.Tx, po *dapo.ReleasePO) (id string, err error) {
	po.ID = cutil.UlidMake()

	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	sr.FromPo(po)
	_, err = sr.InsertStruct(po)

	return
}
