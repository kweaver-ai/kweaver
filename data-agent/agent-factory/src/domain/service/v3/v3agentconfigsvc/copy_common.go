package v3agentconfigsvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/pubedagentdbacc/padbarg"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/pubedagentdbacc/padbret"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
)

// getPublishedAgentPo 获取已发布的Agent版本
func (s *dataAgentConfigSvc) getPublishedAgentPo(ctx context.Context, agentID string) (po *dapo.DataAgentPo, err error) {
	arg := padbarg.NewGetPAPoListByIDArg([]string{agentID}, nil)

	var ret *padbret.GetPaPoMapByXxRet

	ret, err = s.pubedAgentRepo.GetPubedPoMapByXx(ctx, arg)
	if err != nil {
		return
	}

	joinPo := ret.JoinPosID2PoMap[agentID]
	if joinPo == nil {
		err = capierr.NewCustom404Err(ctx, apierr.ReleaseNotFound, "此已发布的Agent不存在")
		return
	}

	po = &joinPo.DataAgentPo

	return
}

func (s *dataAgentConfigSvc) getAgentPoForCopy(ctx context.Context, agentID string) (sourcePo *dapo.DataAgentPo, err error) {
	sourcePo, err = s.agentConfRepo.GetByID(ctx, agentID)
	if err != nil {
		if chelper.IsSqlNotFound(err) {
			err = capierr.NewCustom404Err(ctx, apierr.DataAgentConfigNotFound, "源Agent不存在")
		}

		return
	}

	//if sourcePo.Status == cdaenum.StatusPublished {
	//	// 获取已发布版本
	//	sourcePo, err = s.getPublishedAgentPo(ctx, agentID)
	//	if err != nil {
	//		return
	//	}
	//}

	return
}
