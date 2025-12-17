package httpinject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/ecoconfigaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/common/global"
	iecoConfighttp "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iecoconfighttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
)

var (
	ecoConfigOnce sync.Once
	ecoConfigImpl iecoConfighttp.IEcoConfig
)

func NewEcoConfigHttpAcc() iecoConfighttp.IEcoConfig {
	ecoConfigOnce.Do(func() {
		ecoConfigConf := global.GConfig.EcoConfigConf
		ecoConfigImpl = ecoconfigaccess.NewEcoConfigHttpAcc(
			logger.GetLogger(),
			ecoConfigConf,
			rest.NewHTTPClient(),
		)
	})

	return ecoConfigImpl
}
