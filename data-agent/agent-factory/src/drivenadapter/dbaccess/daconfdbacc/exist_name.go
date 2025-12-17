package daconfdbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
)

func (repo *DAConfigRepo) ExistsByName(ctx context.Context, name string) (exists bool, err error) {
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	sr.FromPo(&dapo.DataAgentPo{})
	exists, err = sr.WhereEqual("f_name", name).
		WhereEqual("f_deleted_at", 0).
		Exists()

	return
}
