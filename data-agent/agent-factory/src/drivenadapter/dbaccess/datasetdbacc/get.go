package datasetdbacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/enum/daenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// GetReusableDataset 获取可复用的dataset
// [说明]： 通过hash查找，如果没找到，快速返回。如果找到，再根据obj_ids验证一遍，防止hash冲突
func (r *DatasetRepo) GetReusableDataset(ctx context.Context, tx *sql.Tx, dto *dsdto.DsComDto) (datasetId string, isReusable bool, err error) {
	sr := dbhelper2.TxSr(tx, r.logger)

	config := dto.Config

	hash, err := config.GetDocIDsHash()
	if err != nil {
		return
	}

	objIDs := config.GetBuiltInDocObjIDs()

	// 1. 根据hash查找dataset
	var ids []string

	err = sr.FromPo(&dapo.DsDatasetPo{}).
		WhereEqual("f_hash_sha256", hash).
		FindColumn("f_id", &ids)
	if err != nil {
		return
	}

	if len(ids) == 0 {
		isReusable = false
		return
	}

	datasetId = ids[0]

	// 2. 根据id和object_type查找dataset obj ids
	var _objIds []string

	sr2 := dbhelper2.TxSr(tx, r.logger)

	err = sr2.FromPo(&dapo.DsDatasetObjPo{}).
		WhereEqual("f_dataset_id", datasetId).
		WhereEqual("f_object_type", daenum.DatasetObjTypeDir).
		FindColumn("f_object_id", &_objIds)
	if err != nil {
		return
	}

	// 3. 比较obj_ids，如果一致，说明dataset一致，可复用
	isReusable = cutil.IsSliceEqualGeneric(objIDs, _objIds)

	if !isReusable {
		datasetId = ""
		return
	}

	return
}
