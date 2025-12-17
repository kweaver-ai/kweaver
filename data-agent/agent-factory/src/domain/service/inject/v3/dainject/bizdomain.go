package dainject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/bizdomainsvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/chttpinject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

var (
	bizDomainSvcOnce sync.Once
	bizDomainSvcImpl *bizdomainsvc.BizDomainSvc
)

// NewBizDomainSvc 创建业务域服务实例
func NewBizDomainSvc() *bizdomainsvc.BizDomainSvc {
	bizDomainSvcOnce.Do(func() {
		dto := &bizdomainsvc.NewBizDomainSvcDto{
			SvcBase:       service.NewSvcBase(),
			Logger:        logger.GetLogger(),
			BizDomainHttp: chttpinject.NewBizDomainHttpAcc(),
		}

		bizDomainSvcImpl = bizdomainsvc.NewBizDomainService(dto)
	})

	return bizDomainSvcImpl
}
