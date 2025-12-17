package httpinject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/httpaccess/modelfactoryacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/cmp/httpclient"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/ihttpaccess/imodelfactoryacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
)

var (
	modelApiOnce sync.Once
	modelApiImpl imodelfactoryacc.IModelApiAcc
)

func NewModelApiAcc() imodelfactoryacc.IModelApiAcc {
	modelApiOnce.Do(func() {
		modelApiImpl = modelfactoryacc.NewModelApiAcc(
			httpclient.NewHTTPClient(),
			rest.NewHTTPClient(),
			logger.GetLogger(),
		)
	})

	return modelApiImpl
}
