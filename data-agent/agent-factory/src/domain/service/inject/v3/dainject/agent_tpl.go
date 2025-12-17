package dainject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/categorysvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/tplsvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/bddbacc/bdagenttpldbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/categoryacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconfdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconftpldbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/productdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/publishedtpldbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/chttpinject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/rediscmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

var (
	daTplSvcOnce sync.Once
	daTplSvcImpl iv3portdriver.IDataAgentTplSvc
)

// NewDaTplSvc 创建模板服务实例
func NewDaTplSvc() iv3portdriver.IDataAgentTplSvc {
	daTplSvcOnce.Do(func() {
		dto := &tplsvc.NewDaTplSvcDto{
			RedisCmp:          rediscmp.NewRedisCmp(),
			SvcBase:           service.NewSvcBase(),
			AgentTplRepo:      daconftpldbacc.NewDataAgentTplRepo(),
			AgentConfRepo:     daconfdbacc.NewDataAgentRepo(),
			Logger:            logger.GetLogger(),
			UmHttp:            chttpinject.NewUmHttpAcc(),
			CategorySvc:       categorysvc.NewCategorySvc(),
			ProductRepo:       productdbacc.NewProductRepo(),
			PmsSvc:            NewPermissionSvc(),
			PublishedTplRepo:  publishedtpldbacc.NewPublishedTplRepo(),
			CategoryRepo:      categoryacc.NewCategoryRepo(),
			BizDomainHttp:     chttpinject.NewBizDomainHttpAcc(),
			BdAgentTplRelRepo: bdagenttpldbacc.NewBizDomainAgentTplRelRepo(),
		}

		daTplSvcImpl = tplsvc.NewDataAgentTplService(dto)
	})

	return daTplSvcImpl
}
