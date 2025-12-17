package bdagenttpldbacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
)

const batchSize = 5000

// BatchCreate 批量创建业务域与agent模板关联（分批写入，每批5000条）
func (repo *BizDomainAgentTplRelRepo) BatchCreate(ctx context.Context, tx *sql.Tx, pos []*dapo.BizDomainAgentTplRelPo) (err error) {
	if len(pos) == 0 {
		return
	}

	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	sr.FromPo(&dapo.BizDomainAgentTplRelPo{})
	err = sr.InsertStructsInBatches(pos, batchSize)

	return
}
