package tempareasvc

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iagentfactoryhttp"
	iecoConfighttp "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iecoconfighttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iefasthttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driver/iportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
)

type tempareaSvc struct {
	*service.SvcBase
	logger       icmp.Logger
	tempAreaRepo idbaccess.ITempAreaRepo
	agentFactory iagentfactoryhttp.IAgentFactory
	EcoConfig    iecoConfighttp.IEcoConfig
	Efast        iefasthttp.IEfast
}

var _ iportdriver.ITempAreaSvc = &tempareaSvc{}

type NewTempAreaSvcDto struct {
	SvcBase      *service.SvcBase
	Logger       icmp.Logger
	TempAreaRepo idbaccess.ITempAreaRepo
	AgentFactory iagentfactoryhttp.IAgentFactory
	EcoConfig    iecoConfighttp.IEcoConfig
	Efast        iefasthttp.IEfast
}

func NewTempAreaService(dto *NewTempAreaSvcDto) iportdriver.ITempAreaSvc {
	impl := &tempareaSvc{
		SvcBase:      dto.SvcBase,
		logger:       dto.Logger,
		tempAreaRepo: dto.TempAreaRepo,
		agentFactory: dto.AgentFactory,
		EcoConfig:    dto.EcoConfig,
		Efast:        dto.Efast,
	}

	return impl
}
