package httpinject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/datahubcentralhttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/idatahubacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

var (
	dataHubCentralOnce sync.Once
	dataHubCentralImpl idatahubacc.IDataHubCentral
)

func NewDataHubCentralHttpAcc() idatahubacc.IDataHubCentral {
	dataHubCentralOnce.Do(func() {
		// 2. dataHubCentral configuration
		dataHubCentralConf := global.GConfig.DataHubCentral

		// 3. dataHubCentral
		dataHubCentralImpl = datahubcentralhttp.NewDataHubHttpAcc(
			logger.GetLogger(),
			dataHubCentralConf,
		)
	})

	return dataHubCentralImpl
}
