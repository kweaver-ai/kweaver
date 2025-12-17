package dssvc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/daconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj/datasourcevalobj"
	"github.com/pkg/errors"
)

// Update 数据源相关更新。返回data agent新的dataset id（可能和旧的dataset id相同）
// 说明：能进到这里说明newDocSize>0（oldDocSize可能为0）
func (s *dsSvc) Update(ctx context.Context, tx *sql.Tx, dto *dsdto.DsUpdateDto) (newDatasetId string, err error) {
	if !dto.IsDatasetChanged() {
		return
	}

	newDocSourceFields := dto.Config.GetBuiltInDsDocSourceFields()
	newDocSize := len(newDocSourceFields)

	// 1. 老配置处理
	err = s.handleOld(ctx, tx, dto)
	if err != nil {
		return
	}

	// 2. 新配置处理
	if newDocSize > 0 {
		newDatasetId, err = s.handleNew(ctx, tx, dto, newDocSourceFields)
		if err != nil {
			return
		}
	}

	return
}

func (s *dsSvc) handleOld(ctx context.Context, tx *sql.Tx, dto *dsdto.DsUpdateDto) (err error) {
	oldDocSourceFields := dto.OldConfig.GetBuiltInDsDocSourceFields()
	oldDocSize := len(oldDocSourceFields)

	var (
		oldDatasetID  string
		isOtherUsed   bool
		isAssocExists bool
	)

	// 1. 判断除了当前配置之外是否还有其他配置使用了当前的dataset
	if oldDocSize > 0 {
		oldDatasetID, isAssocExists, isOtherUsed, err = s.dsRepo.GetAssocInfoAndIsOtherUsed(ctx, dto.AgentID, dto.AgentVersion)
		if err != nil {
			return
		}

		if !isAssocExists {
			err = errors.Wrap(err, "[DsSvc][Update]：oldDocSize > 0 but old assoc not exists")
			return
		}
	}

	// 2. 如果其他配置没有使用当前的dataset，且旧配置的文档数量大于0，需要删除旧配置的索引
	if !isOtherUsed && oldDocSize > 0 && oldDatasetID != "" {
		err = s.ecoIndexHttp.RemoveSourceIndex(ctx, oldDatasetID, oldDocSourceFields)
		if err != nil {
			return
		}
	}

	// 3. 删除老的
	if oldDocSize > 0 && oldDatasetID != "" {
		delDto := &dsdto.DsRepoDeleteDto{}
		delDto.DsUniqDto = dto.DsUniqDto
		delDto.IsOtherUsed = isOtherUsed
		delDto.DatasetID = oldDatasetID

		err = s.dsRepo.Delete(ctx, tx, delDto)
		if err != nil {
			return
		}
	}

	return
}

func (s *dsSvc) handleNew(ctx context.Context, tx *sql.Tx, dto *dsdto.DsUpdateDto, newDocSourceFields []*datasourcevalobj.DocSourceField) (datasetId string, err error) {
	dsCreateDto := dsdto.NewDsComDto(dto.AgentID, daconstant.AgentVersionUnpublished, dto.Config)

	var isReusable bool

	datasetId, isReusable, err = s.Create(ctx, tx, dsCreateDto)
	if err != nil {
		return
	}

	if !isReusable {
		err = s.ecoIndexHttp.AddBotSourceIndex(ctx, datasetId, newDocSourceFields)
		if err != nil {
			return
		}
	}

	return
}
