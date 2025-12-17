package dsdbacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

func (r *DsRepo) Create(ctx context.Context, tx *sql.Tx, dto *dsdto.DsUniqDto, datasetId string) (id string, err error) {
	po := &dapo.DsDataSetAssocPo{
		AgentID:      dto.AgentID,
		AgentVersion: dto.AgentVersion,
		DatasetID:    datasetId,
		CreateTime:   cutil.GetCurrentMSTimestamp(),
	}

	sr := dbhelper2.NewSQLRunner(r.db, r.logger)

	if tx != nil {
		sr = dbhelper2.TxSr(tx, r.logger)
	}

	_, err = sr.FromPo(po).InsertStruct(po)
	if err != nil {
		return
	}

	return
}
