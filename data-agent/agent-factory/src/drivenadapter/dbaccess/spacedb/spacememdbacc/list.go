package spacememdbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/sqlhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// List 获取空间成员列表
func (repo *SpaceMemberRepo) List(ctx context.Context, spaceID string, req *common.PageByLastIntID) (rt []*dapo.SpaceMemberPo, err error) {
	// 使用新的SQLRunner进行Find查询
	findSr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	poList := make([]dapo.SpaceMemberPo, 0)

	findSr.FromPo(&dapo.SpaceMemberPo{}).
		WhereEqual("f_space_id", spaceID)

	if req != nil {
		if req.Size > 0 {
			findSr.Limit(req.Size)
		}

		if req.LastID > 0 {
			findSr.Where("f_id", sqlhelper2.OperatorLt, req.LastID)
		}
	}

	err = findSr.Order("f_id DESC").Find(&poList)
	if err != nil {
		return
	}

	rt = cutil.SliceToPtrSlice(poList)

	return
}
