package tempareadbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
)

func (repo *TempAreaRepo) Remove(ctx context.Context, tempAreaID string, sourceID []string) (err error) {
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	po := &dapo.TempAreaPO{}
	sr.FromPo(po)
	_, err = sr.WhereEqual("f_temp_area_id", tempAreaID).In("f_source_id", sourceID).Delete()
	return
}
