package dsdbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
)

func (r *DsRepo) GetAssocInfoAndIsOtherUsed(ctx context.Context, agentID, agentVersion string) (datasetID string, isAssocExists bool, isOtherUsed bool, err error) {
	var selfID int64 = 0

	// 1. 先获取当前配置的id
	_po, err := r.GetByAgentIDAgentVersion(ctx, agentID, agentVersion)
	if err != nil {
		if !chelper.IsSqlNotFound(err) {
			return
		}
	}

	if chelper.IsSqlNotFound(err) {
		err = nil
		isAssocExists = false

		return
	}

	isAssocExists = true

	// 2. 是否有其他配置使用了相同dataset_id
	selfID = _po.ID
	datasetID = _po.DatasetID

	sr := dbhelper2.NewSQLRunner(r.db, r.logger)

	sr.FromPo(&dapo.DsDataSetAssocPo{}).
		WhereNotEqual("f_id", selfID).
		WhereEqual("f_dataset_id", datasetID)

	isOtherUsed, err = sr.Exists()

	return
}
