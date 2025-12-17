package dainject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/agentinoutsvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/bddbacc/bdagentdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconfdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/chttpinject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

var (
	agentInOutSvcOnce sync.Once
	agentInOutSvcImpl iv3portdriver.IAgentInOutSvc
)

// NewAgentInOutSvc 创建agent导入导出服务
func NewAgentInOutSvc() iv3portdriver.IAgentInOutSvc {
	agentInOutSvcOnce.Do(func() {
		dto := &agentinoutsvc.NewAgentInOutSvcDto{
			SvcBase:        service.NewSvcBase(),
			Logger:         logger.GetLogger(),
			AgentConfRepo:  daconfdbacc.NewDataAgentRepo(),
			PmsSvc:         NewPermissionSvc(),
			BizDomainHttp:  chttpinject.NewBizDomainHttpAcc(),
			BdAgentRelRepo: bdagentdbacc.NewBizDomainAgentRelRepo(),
		}

		agentInOutSvcImpl = agentinoutsvc.NewAgentInOutService(dto)
	})

	return agentInOutSvcImpl
}
