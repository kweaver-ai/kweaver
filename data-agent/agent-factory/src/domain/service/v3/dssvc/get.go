package dssvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
)

func (s *dsSvc) GetAgentDatasetID(ctx context.Context, req *dsdto.DsUniqDto) (datasetID string, err error) {
	po, err := s.dsRepo.GetByAgentIDAgentVersion(ctx, req.AgentID, req.AgentVersion)
	if err != nil {
		return
	}

	datasetID = po.DatasetID

	return
}
