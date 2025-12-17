package httpinject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/agentfactoryaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iagentfactoryhttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
)

var (
	agentFactoryOnce sync.Once
	agentFactoryImpl iagentfactoryhttp.IAgentFactory
)

func NewAgentFactoryHttpAcc() iagentfactoryhttp.IAgentFactory {
	agentFactoryOnce.Do(func() {
		agentFactoryConf := global.GConfig.AgentFactoryConf
		agentFactoryImpl = agentfactoryaccess.NewAgentFactoryHttpAcc(
			logger.GetLogger(),
			agentFactoryConf,
			rest.NewHTTPClient(),
		)
	})

	return agentFactoryImpl
}
