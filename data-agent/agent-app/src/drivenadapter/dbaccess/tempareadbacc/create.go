package tempareadbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
)

func (repo *TempAreaRepo) Create(ctx context.Context, po []*dapo.TempAreaPO) (err error) {
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	sr.FromPo(&dapo.TempAreaPO{})
	_, err = sr.InsertStructs(po)
	return
}
