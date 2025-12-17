package publishedtpldbacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
)

func (repo *PubedTplRepo) Delete(ctx context.Context, tx *sql.Tx, id int64) (err error) {
	po := &dapo.PublishedTplPo{}

	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)

	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	sr.FromPo(po)

	_, err = sr.WhereEqual("f_id", id).
		Delete()

	return
}

func (repo *PubedTplRepo) DeleteByTplID(ctx context.Context, tx *sql.Tx, tplID int64) (err error) {
	po := &dapo.PublishedTplPo{}

	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)

	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	sr.FromPo(po)

	_, err = sr.WhereEqual("f_tpl_id", tplID).
		Delete()

	return
}
