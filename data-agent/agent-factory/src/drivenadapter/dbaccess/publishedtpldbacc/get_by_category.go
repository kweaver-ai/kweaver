package publishedtpldbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"github.com/pkg/errors"
)

func (repo *PubedTplRepo) GetByCategoryID(ctx context.Context, categoryID string) (res []*dapo.PublishedTplPo, err error) {
	po := &dapo.PublishedTplPo{}
	poList := make([]dapo.PublishedTplPo, 0)
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	sr.FromPo(po)

	err = sr.
		WhereEqual("f_category_id", categoryID).
		Find(&poList)
	if err != nil {
		return nil, errors.Wrapf(err, "get by category id %s", categoryID)
	}

	res = cutil.SliceToPtrSlice(poList)

	return
}
