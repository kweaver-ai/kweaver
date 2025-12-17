package daconfdbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"github.com/pkg/errors"
)

// GetByIDsAndCreatedBy 根据ID列表和创建者获取agent
func (repo *DAConfigRepo) GetByIDsAndCreatedBy(ctx context.Context, ids []string, createdBy string) (res []*dapo.DataAgentPo, err error) {
	if len(ids) == 0 {
		return make([]*dapo.DataAgentPo, 0), nil
	}

	// 去重ID列表
	ids = cutil.DeduplGeneric(ids)

	po := &dapo.DataAgentPo{}
	poList := make([]dapo.DataAgentPo, 0)
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	sr.FromPo(po)

	err = sr.WhereEqual("f_deleted_at", 0).
		WhereEqual("f_created_by", createdBy).
		In("f_id", ids).
		Find(&poList)
	if err != nil {
		return nil, errors.Wrapf(err, "[DAConfigRepo][GetByIDsAndCreatedBy]: get by ids %v and created_by %s", ids, createdBy)
	}

	res = cutil.SliceToPtrSlice(poList)

	return
}
