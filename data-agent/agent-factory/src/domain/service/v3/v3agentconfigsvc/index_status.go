package v3agentconfigsvc

import (
	"errors"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/daconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/daconfeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/releaseeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/p2e/daconfp2e"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/docindexobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigreq"
	"github.com/gin-gonic/gin"
)

func (s *dataAgentConfigSvc) BatchCheckIndexStatus(ctx *gin.Context, req *agentconfigreq.BatchCheckIndexStatusReq) (res []*docindexobj.AgentDocIndexStatusInfo, err error) {
	var dsUniqWithDatasetIDDtos []*dsdto.DsUniqWithDatasetIDDto

	req2 := &dsdto.BatchCheckIndexStatusReq{
		IsShowFailInfos: req.IsShowFailInfos,
	}

	// 1. 获取 unpublishIDs
	unpublishIDs, _ := req.GetAgentIDs()

	// 2. 获取 unpublishIDs 对应的 agent
	mUnPub, err := s.agentConfRepo.GetMapByIDs(ctx, unpublishIDs)
	if err != nil {
		return
	}

	// 2.1 将 unpublishIDs 中内置doc类型的agent 添加到 dsUniqWithDatasetIDDtos
	for _, item := range mUnPub {
		var eoSimple *daconfeo.DataAgent

		eoSimple, err = daconfp2e.DataAgentSimple(ctx, item)
		if err != nil {
			return
		}

		conf := eoSimple.Config
		if conf != nil && conf.IsHasBuiltInDocSource() {
			tmp := &dsdto.DsUniqWithDatasetIDDto{}
			tmp.AgentID = eoSimple.ID
			tmp.AgentVersion = daconstant.AgentVersionUnpublished
			tmp.DatasetID = conf.GetBuiltInDocDatasetId()

			if tmp.DatasetID == "" {
				err = errors.New("[dataAgentConfigSvc][BatchCheckIndexStatus][unpublish]: dataset id should not be empty")
				return
			}

			dsUniqWithDatasetIDDtos = append(dsUniqWithDatasetIDDtos, tmp)
		}
	}

	// 3. 获取 publishIDs 对应的 release agent

	publishUniqFlags := req.GetPublishUniqFlags()

	mPub, err := s.releaseRepo.GetMapByUniqFlags(ctx, publishUniqFlags)
	if err != nil {
		return
	}

	// 3.1 将 publishIDs 中内置doc类型的agent 添加到 dsUniqWithDatasetIDDtos
	for _, item := range mPub {
		var eoSimple *releaseeo.ReleaseDAConfWrapperEO

		eoSimple, err = daconfp2e.ReleaseDAConfEoSimple(ctx, item)
		if err != nil {
			return
		}

		conf := eoSimple.Config
		if conf != nil && conf.IsHasBuiltInDocSource() {
			tmp := &dsdto.DsUniqWithDatasetIDDto{}
			tmp.AgentID = eoSimple.AgentID
			tmp.AgentVersion = eoSimple.AgentVersion
			tmp.DatasetID = conf.GetBuiltInDocDatasetId()

			if tmp.DatasetID == "" {
				err = errors.New("[dataAgentConfigSvc][BatchCheckIndexStatus][publish]: dataset id should not be empty")
				return
			}

			dsUniqWithDatasetIDDtos = append(dsUniqWithDatasetIDDtos, tmp)
		}
	}

	// 4. 设置请求参数
	req2.DsUniqWithDatasetIDDtos = dsUniqWithDatasetIDDtos

	// 5. 调用ds服务 批量获取索引状态
	res, err = s.dsSvc.BatchGetDsIndexStatus(ctx, req2)
	if err != nil {
		return
	}

	return
}
