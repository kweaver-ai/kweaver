package mcp

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/dbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces/model"
)

type mcpInstanceServiceImpl struct {
	Logger           interfaces.Logger
	DBResourceDeploy model.DBResourceDeploy
	DBTx             model.DBTx
}

var (
	mcpOnce            sync.Once
	mcpInstanceService *mcpInstanceServiceImpl
)

func NewMCPInstanceService() interfaces.IMCPInstanceService {
	configLoader := config.NewConfigLoader()
	mcpOnce.Do(func() {
		mcpInstanceService = &mcpInstanceServiceImpl{
			Logger:           configLoader.GetLogger(),
			DBResourceDeploy: dbaccess.NewResourceDeployDB(),
			DBTx:             dbaccess.NewBaseTx(),
		}
	})
	return mcpInstanceService
}
