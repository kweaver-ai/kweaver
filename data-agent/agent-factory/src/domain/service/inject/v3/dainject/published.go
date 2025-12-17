package dainject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/publishedsvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconftpldbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/productdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/pubedagentdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/publishedtpldbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/chttpinject"
)

var (
	publishedSvcOnce sync.Once
	publishedSvcImpl iv3portdriver.IPublishedSvc
)

// NewPublishedSvc .
func NewPublishedSvc() iv3portdriver.IPublishedSvc {
	publishedSvcOnce.Do(func() {
		dto := &publishedsvc.NewPublishedSvcDto{
			SvcBase:          service.NewSvcBase(),
			AgentTplRepo:     daconftpldbacc.NewDataAgentTplRepo(),
			PublishedTplRepo: publishedtpldbacc.NewPublishedTplRepo(),
			ProductRepo:      productdbacc.NewProductRepo(),
			UmHttp:           chttpinject.NewUmHttpAcc(),
			AuthZHttp:        chttpinject.NewAuthZHttpAcc(),
			PubedAgentRepo:   pubedagentdbacc.NewPubedAgentRepo(),
			PmsSvc:           NewPermissionSvc(),
			BizDomainHttp:    chttpinject.NewBizDomainHttpAcc(),
		}

		publishedSvcImpl = publishedsvc.NewPublishedService(dto)
	})

	return publishedSvcImpl
}
