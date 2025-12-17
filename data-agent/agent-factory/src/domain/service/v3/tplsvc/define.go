package tplsvc

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/ibizdomainacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iumacc"
)

type dataAgentTplSvc struct {
	*service.SvcBase
	logger           icmp.Logger
	agentTplRepo     idbaccess.IDataAgentTplRepo
	publishedTplRepo idbaccess.IPublishedTplRepo
	agentConfRepo    idbaccess.IDataAgentConfigRepo
	redisCmp         icmp.RedisCmp
	umHttp           iumacc.UmHttpAcc
	categorySvc      iv3portdriver.ICategorySvc
	productRepo      idbaccess.IProductRepo
	categoryRepo     idbaccess.ICategoryRepo

	pmsSvc iv3portdriver.IPermissionSvc

	bizDomainHttp     ibizdomainacc.BizDomainHttpAcc
	bdAgentTplRelRepo idbaccess.IBizDomainAgentTplRelRepo
}

var _ iv3portdriver.IDataAgentTplSvc = &dataAgentTplSvc{}

type NewDaTplSvcDto struct {
	RedisCmp         icmp.RedisCmp
	SvcBase          *service.SvcBase
	AgentTplRepo     idbaccess.IDataAgentTplRepo
	PublishedTplRepo idbaccess.IPublishedTplRepo
	AgentConfRepo    idbaccess.IDataAgentConfigRepo
	Logger           icmp.Logger
	UmHttp           iumacc.UmHttpAcc
	CategorySvc      iv3portdriver.ICategorySvc
	ProductRepo      idbaccess.IProductRepo
	CategoryRepo     idbaccess.ICategoryRepo

	PmsSvc iv3portdriver.IPermissionSvc

	BizDomainHttp     ibizdomainacc.BizDomainHttpAcc
	BdAgentTplRelRepo idbaccess.IBizDomainAgentTplRelRepo
}

func NewDataAgentTplService(dto *NewDaTplSvcDto) iv3portdriver.IDataAgentTplSvc {
	impl := &dataAgentTplSvc{
		redisCmp:          dto.RedisCmp,
		SvcBase:           dto.SvcBase,
		agentTplRepo:      dto.AgentTplRepo,
		publishedTplRepo:  dto.PublishedTplRepo,
		agentConfRepo:     dto.AgentConfRepo,
		logger:            dto.Logger,
		umHttp:            dto.UmHttp,
		categorySvc:       dto.CategorySvc,
		productRepo:       dto.ProductRepo,
		categoryRepo:      dto.CategoryRepo,
		pmsSvc:            dto.PmsSvc,
		bizDomainHttp:     dto.BizDomainHttp,
		bdAgentTplRelRepo: dto.BdAgentTplRelRepo,
	}

	return impl
}
