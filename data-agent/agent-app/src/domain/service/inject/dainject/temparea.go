package dainject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/service/tempareasvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/dbaccess/tempareadbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/httpinject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driver/iportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

var (
	tempAreaSvcOnce sync.Once
	tempAreaSvcImpl iportdriver.ITempAreaSvc
)

func NewTempAreaSvc() iportdriver.ITempAreaSvc {
	tempAreaSvcOnce.Do(func() {
		dto := &tempareasvc.NewTempAreaSvcDto{
			SvcBase:      service.NewSvcBase(),
			Logger:       logger.GetLogger(),
			TempAreaRepo: tempareadbacc.NewTempAreaRepo(),
			AgentFactory: httpinject.NewAgentFactoryHttpAcc(),
			EcoConfig:    httpinject.NewEcoConfigHttpAcc(),
			Efast:        httpinject.NewEfastHttpAcc(),
		}
		tempAreaSvcImpl = tempareasvc.NewTempAreaService(dto)
	})
	return tempAreaSvcImpl
}
