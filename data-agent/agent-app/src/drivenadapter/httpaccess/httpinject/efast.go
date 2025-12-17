package httpinject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/efastaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iefasthttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/cmphelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
)

var (
	efastOnce sync.Once
	efastImpl iefasthttp.IEfast
)

func NewEfastHttpAcc() iefasthttp.IEfast {
	efastOnce.Do(func() {
		efastConf := global.GConfig.EfastConf
		efastImpl = efastaccess.NewEfastHttpAcc(
			logger.GetLogger(),
			efastConf,
			cmphelper.GetClient(),
			rest.NewHTTPClient(),
		)
	})

	return efastImpl
}
