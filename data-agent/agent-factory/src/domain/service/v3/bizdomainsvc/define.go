package bizdomainsvc

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/ibizdomainacc"
)

type BizDomainSvc struct {
	*service.SvcBase
	logger        icmp.Logger
	bizDomainHttp ibizdomainacc.BizDomainHttpAcc
}

type NewBizDomainSvcDto struct {
	SvcBase       *service.SvcBase
	Logger        icmp.Logger
	BizDomainHttp ibizdomainacc.BizDomainHttpAcc
}

func NewBizDomainService(dto *NewBizDomainSvcDto) *BizDomainSvc {
	impl := &BizDomainSvc{
		SvcBase:       dto.SvcBase,
		logger:        dto.Logger,
		bizDomainHttp: dto.BizDomainHttp,
	}

	return impl
}
