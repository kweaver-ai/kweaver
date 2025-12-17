package releaseacc

import (
	"context"
	"database/sql"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
)

// Create implements release.ReleasePermissionRepo.
func (repo *releasePermissionRepo) Create(ctx context.Context, tx *sql.Tx, po *dapo.ReleasePermissionPO) (err error) {
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	sr.FromPo(po)
	result, err := sr.InsertStruct(po)
	fmt.Println(result)

	return
}

func (repo *releasePermissionRepo) BatchCreate(ctx context.Context, tx *sql.Tx, pos []*dapo.ReleasePermissionPO) (err error) {
	if len(pos) == 0 {
		return
	}

	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	sr.FromPo(&dapo.ReleasePermissionPO{})
	_, err = sr.InsertStructs(pos)

	return
}
