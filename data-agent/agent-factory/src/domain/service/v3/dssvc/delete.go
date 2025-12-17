package dssvc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
	"github.com/pkg/errors"
)

func (s *dsSvc) Delete(ctx context.Context, tx *sql.Tx, dto *dsdto.DsComDto) (err error) {
	fields := dto.Config.GetBuiltInDsDocSourceFields()

	docSize := len(fields)
	if docSize == 0 {
		return
	}

	var (
		datasetID     string
		isOtherUsed   bool
		isAssocExists bool
	)

	// 1. 判断除了当前配置之外是否还有其他配置使用了当前的dataset
	datasetID, isAssocExists, isOtherUsed, err = s.dsRepo.GetAssocInfoAndIsOtherUsed(ctx, dto.AgentID, dto.AgentVersion)
	if err != nil {
		return
	}

	if !isAssocExists {
		err = errors.New("[DsSvc][Delete]：DocSize > 0 but assoc not exists")
		return
	}

	// 2.1. 如果其他配置没有使用当前的dataset，且旧配置的文档数量大于0，需要删除旧配置的索引
	if !isOtherUsed && datasetID != "" {
		err = s.ecoIndexHttp.RemoveSourceIndex(ctx, datasetID, fields)
		if err != nil {
			return
		}
	}

	// 2.2. 删除老的
	delDto := &dsdto.DsRepoDeleteDto{}
	delDto.DsUniqDto = dto.DsUniqDto
	delDto.IsOtherUsed = isOtherUsed
	delDto.DatasetID = datasetID

	err = s.dsRepo.Delete(ctx, tx, delDto)
	if err != nil {
		return
	}

	return
}
