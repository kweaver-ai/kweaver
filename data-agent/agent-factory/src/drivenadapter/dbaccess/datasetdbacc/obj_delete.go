package datasetdbacc

import (
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
)

func (r *DatasetRepo) DeleteObj(tx *sql.Tx, datasetId string) (err error) {
	sr := dbhelper2.TxSr(tx, r.logger)

	_, err = sr.FromPo(&dapo.DsDatasetObjPo{}).
		WhereEqual("f_dataset_id", datasetId).
		Delete()
	if err != nil {
		return
	}

	return
}
