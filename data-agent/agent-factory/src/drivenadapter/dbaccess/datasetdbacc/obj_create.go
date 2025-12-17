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

func (r *DatasetRepo) CreateDatasetObjs(ctx context.Context, tx *sql.Tx, dto *dsdto.DsComDto, datasetId string) (err error) {
	sr := dbhelper2.TxSr(tx, r.logger)

	objIds := dto.Config.GetBuiltInDocObjIDs()
	objPos := make([]*dapo.DsDatasetObjPo, 0, len(objIds))

	for _, objId := range objIds {
		objPo := &dapo.DsDatasetObjPo{
			DatasetID:  datasetId,
			ObjectID:   objId,
			ObjectType: daenum.DatasetObjTypeDir,
			CreateTime: cutil.GetCurrentMSTimestamp(),
		}

		objPos = append(objPos, objPo)
	}

	_, err = sr.FromPo(&dapo.DsDatasetObjPo{}).
		InsertStructs(objPos)
	if err != nil {
		return
	}

	return
}
