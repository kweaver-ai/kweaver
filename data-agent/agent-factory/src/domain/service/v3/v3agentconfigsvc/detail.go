package v3agentconfigsvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/p2e/daconfp2e"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigresp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
)

func (s *dataAgentConfigSvc) Detail(ctx context.Context, id, key string) (res *agentconfigresp.DetailRes, err error) {
	var po *dapo.DataAgentPo

	// 1. 获取数据
	if id != "" {
		po, err = s.agentConfRepo.GetByID(ctx, id)
	} else {
		po, err = s.agentConfRepo.GetByKey(ctx, key)
	}

	if err != nil {
		if chelper.IsSqlNotFound(err) {
			err = capierr.NewCustom404Err(ctx, apierr.DataAgentConfigNotFound, "数据智能体配置不存在")
			return
		}

		return
	}

	isPrivate := chelper.IsInternalAPIFromCtx(ctx)
	uid := chelper.GetUserIDFromCtx(ctx)

	// 2. 权限检查
	err = s.detailPmsCheck(ctx, po, isPrivate, uid)
	if err != nil {
		return
	}

	// 3. PO转EO
	eo, err := daconfp2e.DataAgent(ctx, po)
	if err != nil {
		return
	}

	// 4. 标记技能配置中的Agent
	if !isPrivate {
		err = s.markSkillAgentPmsForDetail(ctx, eo, uid)
		if err != nil {
			return
		}
	}

	// 5. 转换为响应DTO
	res = agentconfigresp.NewDetailRes()
	err = res.LoadFromEo(eo)

	return
}
