package dainject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/dssvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/datasetdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/dsdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/httpaccess/httpinject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/rediscmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

var (
	dsSvcOnce sync.Once
	dsSvcImpl iv3portdriver.IDsSvc
)

func NewDsSvc() iv3portdriver.IDsSvc {
	dsSvcOnce.Do(func() {
		dto := &dssvc.NewDsSvcDto{
			RedisCmp:           rediscmp.NewRedisCmp(),
			SvcBase:            service.NewSvcBase(),
			DsRepo:             dsdbacc.NewDsRepo(),
			EcoIndexHttp:       httpinject.NewEcoIndexHttpAcc(),
			DatasetRepo:        datasetdbacc.NewDatasetRepo(),
			DatahubCentralHttp: httpinject.NewDataHubCentralHttpAcc(),
			Logger:             logger.GetLogger(),
		}

		dsSvcImpl = dssvc.NewDsSvc(dto)
	})

	return dsSvcImpl
}
