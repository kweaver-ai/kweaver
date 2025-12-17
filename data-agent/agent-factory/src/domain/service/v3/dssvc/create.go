package dssvc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"github.com/pkg/errors"
)

func (s *dsSvc) Create(ctx context.Context, tx *sql.Tx, dto *dsdto.DsComDto) (datasetId string, isReusable bool, err error) {
	docSourceFields := dto.Config.GetBuiltInDsDocSourceFields()
	if len(docSourceFields) == 0 {
		err = errors.New("[dsSvc][Create]: 没有内置doc数据源")
		return
	}

	// 1. 获取可复用的dataset
	datasetId, isReusable, err = s.datasetRepo.GetReusableDataset(ctx, tx, dto)
	if err != nil {
		return
	}

	if !isReusable {
		// 2. 如果不可复用，创建新的dataset
		var hash string

		hash, err = dto.Config.GetDocIDsHash()
		if err != nil {
			return
		}

		// 2.1 通过datahub创建dataset
		userID := chelper.GetUserIDFromCtx(ctx)

		datasetId, err = s.createDatasetByDatahub(ctx, dto, userID)
		if err != nil {
			return
		}

		// 2.2 保存dataset到db（datahub中有一份，db中再保存一份 后续可能会用到）
		err = s.datasetRepo.Create(ctx, tx, datasetId, hash)
		if err != nil {
			return
		}

		// 2.3 创建dataset obj
		err = s.datasetRepo.CreateDatasetObjs(ctx, tx, dto, datasetId)
		if err != nil {
			return
		}
	}

	// 3. 创建dataset assoc
	_, err = s.dsRepo.Create(ctx, tx, dto.DsUniqDto, datasetId)
	if err != nil {
		return
	}

	return
}
