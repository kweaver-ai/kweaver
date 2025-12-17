package v3agentconfigsvc

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/ihttpaccess/imodelfactoryacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/ihttpaccess/iusermanagementacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iauthzacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/ibizdomainacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iumacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/imqaccess"
)

type dataAgentConfigSvc struct {
	*service.SvcBase
	logger         icmp.Logger
	agentConfRepo  idbaccess.IDataAgentConfigRepo
	agentTplRepo   idbaccess.IDataAgentTplRepo
	releaseRepo    idbaccess.IReleaseRepo
	pubedAgentRepo idbaccess.IPubedAgentRepo
	redisCmp       icmp.RedisCmp
	OpenAICmp      icmp.IOpenAI

	umHttp iusermanagementacc.UserMgnt

	dsSvc iv3portdriver.IDsSvc

	productRepo idbaccess.IProductRepo

	spaceResourceRepo idbaccess.ISpaceResourceRepo

	um2Http iumacc.UmHttpAcc

	tplSvc iv3portdriver.IDataAgentTplSvc

	modelFactoryAcc imodelfactoryacc.IModelApiAcc
	mqAccess        imqaccess.IMqAccess

	pmsSvc iv3portdriver.IPermissionSvc

	authZHttp iauthzacc.AuthZHttpAcc

	bizDomainHttp     ibizdomainacc.BizDomainHttpAcc
	bdAgentRelRepo    idbaccess.IBizDomainAgentRelRepo
	bdAgentTplRelRepo idbaccess.IBizDomainAgentTplRelRepo
}

var _ iv3portdriver.IDataAgentConfigSvc = &dataAgentConfigSvc{}

type NewDaConfSvcDto struct {
	RedisCmp          icmp.RedisCmp
	SvcBase           *service.SvcBase
	AgentConfRepo     idbaccess.IDataAgentConfigRepo
	AgentTplRepo      idbaccess.IDataAgentTplRepo
	ReleaseRepo       idbaccess.IReleaseRepo
	PubedAgentRepo    idbaccess.IPubedAgentRepo
	Logger            icmp.Logger
	OpenAICmp         icmp.IOpenAI
	DsIndexSvc        iv3portdriver.IDsSvc
	UmHttp            iusermanagementacc.UserMgnt
	ProductRepo       idbaccess.IProductRepo
	SpaceResourceRepo idbaccess.ISpaceResourceRepo
	Um2Http           iumacc.UmHttpAcc
	ModelApiAcc       imodelfactoryacc.IModelApiAcc

	TplSvc   iv3portdriver.IDataAgentTplSvc
	MqAccess imqaccess.IMqAccess

	PmsSvc iv3portdriver.IPermissionSvc

	AuthZHttp iauthzacc.AuthZHttpAcc

	BizDomainHttp     ibizdomainacc.BizDomainHttpAcc
	BdAgentRelRepo    idbaccess.IBizDomainAgentRelRepo
	BdAgentTplRelRepo idbaccess.IBizDomainAgentTplRelRepo
}

func NewDataAgentConfigService(dto *NewDaConfSvcDto) iv3portdriver.IDataAgentConfigSvc {
	impl := &dataAgentConfigSvc{
		redisCmp:          dto.RedisCmp,
		SvcBase:           dto.SvcBase,
		agentConfRepo:     dto.AgentConfRepo,
		agentTplRepo:      dto.AgentTplRepo,
		releaseRepo:       dto.ReleaseRepo,
		pubedAgentRepo:    dto.PubedAgentRepo,
		logger:            dto.Logger,
		OpenAICmp:         dto.OpenAICmp,
		dsSvc:             dto.DsIndexSvc,
		umHttp:            dto.UmHttp,
		productRepo:       dto.ProductRepo,
		spaceResourceRepo: dto.SpaceResourceRepo,
		um2Http:           dto.Um2Http,
		tplSvc:            dto.TplSvc,
		modelFactoryAcc:   dto.ModelApiAcc,
		mqAccess:          dto.MqAccess,
		pmsSvc:            dto.PmsSvc,
		authZHttp:         dto.AuthZHttp,
		bizDomainHttp:     dto.BizDomainHttp,
		bdAgentRelRepo:    dto.BdAgentRelRepo,
		bdAgentTplRelRepo: dto.BdAgentTplRelRepo,
	}

	return impl
}
