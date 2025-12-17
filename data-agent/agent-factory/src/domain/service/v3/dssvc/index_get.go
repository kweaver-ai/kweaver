package dssvc

import (
	"context"
	"math"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/docindexobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/comvalobj"
)

func (s *dsSvc) GetDsIndexStatus(ctx context.Context, req *dsdto.DsUniqWithDatasetIDDto, isShowFailInfos bool) (info *docindexobj.AgentDocIndexStatusInfo, err error) {
	p := &comvalobj.Pagination{
		Offset: 0,
		Limit:  3000,
	}

	_info, err := s.ecoIndexHttp.GetBotIndexStatus(ctx, req.DatasetID, isShowFailInfos, p)
	if err != nil {
		return
	}

	info = &docindexobj.AgentDocIndexStatusInfo{
		AgentID:       req.AgentID,
		AgentVersion:  req.AgentVersion,
		DatasetID:     _info.BotVersion,
		CompleteCount: _info.CompleteCount,
		FailInfos:     _info.FailInfos,
		Progress:      int(math.Ceil(_info.Progress) * 100),
	}

	return
}

func (s *dsSvc) BatchGetDsIndexStatus(ctx context.Context, req *dsdto.BatchCheckIndexStatusReq) (infos []*docindexobj.AgentDocIndexStatusInfo, err error) {
	infos = make([]*docindexobj.AgentDocIndexStatusInfo, 0, len(req.DsUniqWithDatasetIDDtos))

	for _, v := range req.DsUniqWithDatasetIDDtos {
		var info *docindexobj.AgentDocIndexStatusInfo

		info, err = s.GetDsIndexStatus(ctx, v, req.IsShowFailInfos)
		if err != nil {
			return
		}

		infos = append(infos, info)
	}

	return
}
