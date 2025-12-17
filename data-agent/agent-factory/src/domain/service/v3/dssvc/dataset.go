package dssvc

import (
	"context"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/datahubcentralhttp/datahubcentraldto"
	"github.com/pkg/errors"
)

func (s *dsSvc) createDatasetByDatahub(ctx context.Context, dto *dsdto.DsComDto, userID string) (datasetId string, err error) {
	// 1. 获取doc数据源fields
	docSourceFields := dto.Config.GetBuiltInDsDocSourceFields()
	if len(docSourceFields) == 0 {
		err = errors.New("[dsSvc][createDataset]: 没有内置doc数据源")
		return
	}

	// 2. 创建dataset by datahub

	// 2.1 构造req
	var items []*datahubcentraldto.DataSetUpsertReqItem

	var sourceValue string
	for _, source := range docSourceFields {
		sourceValue = source.GetDirObjID()
		if sourceValue == "" {
			err = errors.New("[dsSvc][createDatasetByDatahub]: dataSource.GetDirObjID is empty")
			return
		}

		items = append(items, &datahubcentraldto.DataSetUpsertReqItem{
			Type:  "dir",
			Name:  source.Name,
			Value: sourceValue,
		})
	}

	req := &datahubcentraldto.CreateDatasetsReq{
		UserID:      userID,
		DatasetName: fmt.Sprintf("%s-%s", dto.DsUniqDto.AgentID, dto.DsUniqDto.AgentVersion),
		Items:       items,
	}

	// 2.2 调用datahub创建dataset
	datasetId, err = s.datahubCentralHttp.CreateDataset(ctx, req)
	if err != nil {
		return
	}

	return
}
