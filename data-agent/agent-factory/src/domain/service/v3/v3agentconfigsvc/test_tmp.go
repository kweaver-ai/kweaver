package v3agentconfigsvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// TmpTest 方便临时测试用，后面不需要时删除
func (s *dataAgentConfigSvc) TmpTest(ctx context.Context, req *agentconfigreq.TestTmpReq) (err error) {
	switch req.TestFlag {
	case "update_status":
		err = s.updateStatusTest(ctx, req.Params)
	}

	return
}

// ------------------updateStatusTest start----------------------
type UpdateStatusTestReq struct {
	Id     string         `json:"id"`
	Status cdaenum.Status `json:"status"`
}

func (s *dataAgentConfigSvc) updateStatusTest(ctx context.Context, params interface{}) (err error) {
	req := &UpdateStatusTestReq{}

	err = cutil.CopyUseJSON(req, params)
	if err != nil {
		return
	}

	err = s.agentConfRepo.UpdateStatus(ctx, nil, req.Status, req.Id, "")

	return
}

// ------------------updateStatusTest end----------------------
