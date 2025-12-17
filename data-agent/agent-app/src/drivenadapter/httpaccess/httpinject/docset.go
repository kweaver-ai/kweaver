package httpinject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/docsetaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/idocsethttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
)

var (
	docsetOnce sync.Once
	docsetImpl idocsethttp.IDocset
)

func NewDocsetHttpAcc() idocsethttp.IDocset {
	docsetOnce.Do(func() {
		docsetConf := global.GConfig.DocsetConf
		docsetImpl = docsetaccess.NewDocsetHttpAcc(
			logger.GetLogger(),
			docsetConf,
			rest.NewHTTPClient(),
		)
	})

	return docsetImpl
}
