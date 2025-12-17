package dsdbacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"github.com/pkg/errors"
)

func (r *DsRepo) Delete(ctx context.Context, tx *sql.Tx, dto *dsdto.DsRepoDeleteDto) (err error) {
	// 1. delete dataset assoc
	sr := dbhelper2.NewSQLRunner(r.db, r.logger)

	if tx != nil {
		sr = dbhelper2.TxSr(tx, r.logger)
	}

	sr.FromPo(&dapo.DsDataSetAssocPo{})

	_, err = sr.WhereEqual("f_agent_id", dto.AgentID).
		WhereEqual("f_agent_version", dto.AgentVersion).
		WhereEqual("f_dataset_id", dto.DatasetID).
		Delete()
	if err != nil {
		err = errors.Wrap(err, "[DsRepo][Delete]：删除数据集关联失败")
		return
	}

	// 2. 如果数据集没有被其他data agent使用，delete dataset and dataset obj
	if !dto.IsOtherUsed {
		err = r.datasetRepo.DeleteDatasetAndObj(ctx, tx, dto.DatasetID)
		if err != nil {
			err = errors.Wrap(err, "[DsRepo][Delete]：DeleteDatasetAndObj failed")
			return
		}
	}

	return
}
