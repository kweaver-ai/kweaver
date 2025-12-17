package releaseacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
)

// DeleteByAgentId implements release.ReleaseRepo.
func (repo *releaseRepo) DeleteByAgentID(ctx context.Context, tx *sql.Tx, agentID string) (err error) {
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	po := &dapo.ReleasePO{}
	sr.FromPo(po)
	_, err = sr.WhereEqual("f_agent_id", agentID).Delete()

	return
}
