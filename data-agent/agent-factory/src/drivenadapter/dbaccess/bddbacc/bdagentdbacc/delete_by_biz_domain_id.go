package bdagentdbacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"github.com/pkg/errors"
)

// DeleteByBizDomainID 根据业务域ID删除关联
func (repo *BizDomainAgentRelRepo) DeleteByBizDomainID(ctx context.Context, tx *sql.Tx, bizDomainID string) (err error) {
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	po := &dapo.BizDomainAgentRelPo{}
	sr.FromPo(po)

	_, err = sr.WhereEqual("f_biz_domain_id", bizDomainID).Delete()
	if err != nil {
		return errors.Wrapf(err, "delete by biz domain id %s", bizDomainID)
	}

	return nil
}
