package v3agentconfigsvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigresp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"github.com/pkg/errors"
)

func (s *dataAgentConfigSvc) ListForBenchmark(ctx context.Context, req *agentconfigreq.ListForBenchmarkReq) (resp *agentconfigresp.ListForBenchmarkResp, err error) {
	resp = agentconfigresp.NewListForBenchmarkResp()

	// 1. 获取当前用户当前的业务域ID
	bdIDs := []string{
		chelper.GetBizDomainIDFromCtx(ctx),
	}

	// 2. 获取当前用户所属的业务域ID下的Agent ID列表
	agentIDsByBizDomain, _, err := s.bizDomainHttp.GetAllAgentIDList(ctx, bdIDs)
	if err != nil {
		err = errors.Wrapf(err, "[ListForBenchmark] get agent list by biz domain failed")
		return
	}

	// 如果此业务域下没有agent，直接返回
	if len(agentIDsByBizDomain) == 0 {
		return
	}

	// 3. 设置业务域过滤条件
	req.AgentIDsByBizDomain = agentIDsByBizDomain

	// 4. 获取数据
	pos, total, err := s.agentConfRepo.ListForBenchmark(ctx, req)
	if err != nil {
		err = errors.Wrapf(err, "[ListForBenchmark] failed")
		return
	}

	err = resp.LoadFromListForBenchmark(pos)
	if err != nil {
		err = errors.Wrapf(err, "[LoadFromListForBenchmark] failed")
		return
	}

	resp.Total = total

	return
}
