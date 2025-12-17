package spacedbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/space/spacereq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// List 获取空间列表
func (repo *SpaceRepo) List(ctx context.Context, req *spacereq.ListReq) (pos []*dapo.SpacePo, count int64, err error) {
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)

	po := &dapo.SpacePo{}
	sr.FromPo(po).
		WhereEqual("f_deleted_at", 0)

	if req.Name != "" {
		sr.Like("f_name", req.Name)
	}

	// 1. 先统计总数
	count, err = sr.Count()
	if err != nil {
		return
	}

	if count == 0 {
		return
	}

	// 2. 再分页查询
	poList := make([]dapo.SpacePo, 0)

	sr.ResetSelect().
		Order("f_created_at DESC").
		Offset((req.Page - 1) * req.Size).
		Limit(req.Size)

	err = sr.Find(&poList)
	if err != nil {
		return
	}

	pos = cutil.SliceToPtrSlice(poList)

	return
}
