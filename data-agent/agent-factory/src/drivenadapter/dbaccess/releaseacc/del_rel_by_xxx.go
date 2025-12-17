package releaseacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"github.com/pkg/errors"
)

// DelByReleaseId implements idbaccess.ReleaseCategoryRelRepo.
func (repo *releaseCategoryRelRepo) DelByReleaseID(ctx context.Context, tx *sql.Tx, releaseID string) (err error) {
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	po := &dapo.ReleaseCategoryRelPO{}
	sr.FromPo(po)

	_, err = sr.WhereEqual("f_release_id", releaseID).Delete()
	if err != nil {
		return errors.Wrapf(err, "delete category by release id %s", releaseID)
	}

	return nil
}
