package datasetdbacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
)

func (r *DatasetRepo) DeleteDatasetAndObj(ctx context.Context, tx *sql.Tx, datasetId string) (err error) {
	// 1. delete dataset
	sr := dbhelper2.TxSr(tx, r.logger)

	_, err = sr.FromPo(&dapo.DsDatasetPo{}).
		WhereEqual("f_id", datasetId).
		Delete()
	if err != nil {
		return
	}

	// 2. delete dataset obj
	err = r.DeleteObj(tx, datasetId)

	return
}
