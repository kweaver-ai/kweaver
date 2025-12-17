package dssvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
)

// 调用eco_index创建ds_index
func (s *dsSvc) AddIndex(ctx context.Context, dto *dsdto.DsComDto, datasetID string) (err error) {
	err = s.ecoIndexHttp.AddBotSourceIndex(ctx, datasetID, dto.Config.GetBuiltInDsDocSourceFields())
	if err != nil {
		return
	}

	return
}
