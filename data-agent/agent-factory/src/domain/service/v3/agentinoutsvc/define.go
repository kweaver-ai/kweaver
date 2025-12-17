package agentinoutsvc

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/ibizdomainacc"
)

type agentInOutSvc struct {
	*service.SvcBase
	logger         icmp.Logger
	agentConfRepo  idbaccess.IDataAgentConfigRepo
	pmsSvc         iv3portdriver.IPermissionSvc
	bizDomainHttp  ibizdomainacc.BizDomainHttpAcc
	bdAgentRelRepo idbaccess.IBizDomainAgentRelRepo
}

var _ iv3portdriver.IAgentInOutSvc = &agentInOutSvc{}

type NewAgentInOutSvcDto struct {
	SvcBase        *service.SvcBase
	Logger         icmp.Logger
	AgentConfRepo  idbaccess.IDataAgentConfigRepo
	PmsSvc         iv3portdriver.IPermissionSvc
	BizDomainHttp  ibizdomainacc.BizDomainHttpAcc
	BdAgentRelRepo idbaccess.IBizDomainAgentRelRepo
}

func NewAgentInOutService(dto *NewAgentInOutSvcDto) iv3portdriver.IAgentInOutSvc {
	impl := &agentInOutSvc{
		SvcBase:        dto.SvcBase,
		logger:         dto.Logger,
		agentConfRepo:  dto.AgentConfRepo,
		pmsSvc:         dto.PmsSvc,
		bizDomainHttp:  dto.BizDomainHttp,
		bdAgentRelRepo: dto.BdAgentRelRepo,
	}

	return impl
}
