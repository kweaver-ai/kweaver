package releaseacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"github.com/pkg/errors"
)

func (repo *releasePermissionRepo) GetByReleaseID(ctx context.Context, releaseID string) (poList []*dapo.ReleasePermissionPO, err error) {
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	po := &dapo.ReleasePermissionPO{}
	sr.FromPo(po)

	pos := make([]dapo.ReleasePermissionPO, 0)

	err = sr.WhereEqual("f_release_id", releaseID).Find(&pos)
	if err != nil {
		err = errors.Wrapf(err, "get permission by release id %s", releaseID)
		return nil, err
	}

	poList = cutil.SliceToPtrSlice(pos)

	return
}
