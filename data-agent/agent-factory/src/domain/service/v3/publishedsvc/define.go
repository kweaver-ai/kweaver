package publishedsvc

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iauthzacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/ibizdomainacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iumacc"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
)

type publishedSvc struct {
	*service.SvcBase
	agentTplRepo     idbaccess.IDataAgentTplRepo
	publishedTplRepo idbaccess.IPublishedTplRepo
	pubedAgentRepo   idbaccess.IPubedAgentRepo
	productRepo      idbaccess.IProductRepo
	umHttp           iumacc.UmHttpAcc
	authZHttp        iauthzacc.AuthZHttpAcc
	pmsSvc           iv3portdriver.IPermissionSvc

	bizDomainHttp ibizdomainacc.BizDomainHttpAcc
}

var _ iv3portdriver.IPublishedSvc = &publishedSvc{}

type NewPublishedSvcDto struct {
	SvcBase *service.SvcBase

	PubedAgentRepo idbaccess.IPubedAgentRepo

	AgentTplRepo idbaccess.IDataAgentTplRepo

	PublishedTplRepo idbaccess.IPublishedTplRepo

	ProductRepo idbaccess.IProductRepo

	UmHttp iumacc.UmHttpAcc

	AuthZHttp iauthzacc.AuthZHttpAcc

	PmsSvc iv3portdriver.IPermissionSvc

	BizDomainHttp ibizdomainacc.BizDomainHttpAcc
}

func NewPublishedService(dto *NewPublishedSvcDto) iv3portdriver.IPublishedSvc {
	publishedSvcImpl := &publishedSvc{
		SvcBase:          dto.SvcBase,
		agentTplRepo:     dto.AgentTplRepo,
		publishedTplRepo: dto.PublishedTplRepo,
		pubedAgentRepo:   dto.PubedAgentRepo,
		productRepo:      dto.ProductRepo,
		umHttp:           dto.UmHttp,
		authZHttp:        dto.AuthZHttp,
		pmsSvc:           dto.PmsSvc,
		bizDomainHttp:    dto.BizDomainHttp,
	}

	return publishedSvcImpl
}
