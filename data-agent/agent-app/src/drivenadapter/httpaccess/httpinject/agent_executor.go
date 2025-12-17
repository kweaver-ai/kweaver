package httpinject

import (
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/agentexecutoraccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/v2agentexecutoraccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/cmp/httpclient"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iagentexecutorhttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/cmphelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
)

var (
	agentExecutorOnce sync.Once
	agentExecutorImpl iagentexecutorhttp.IAgentExecutor
)

func NewAgentExecutorHttpAcc() iagentexecutorhttp.IAgentExecutor {
	agentExecutorOnce.Do(func() {
		agentExecutorConf := global.GConfig.AgentExecutorConf
		log := logger.GetLogger()
		httpClient := cmphelper.GetClient()
		client := rest.NewHTTPClient()
		streamClient := httpclient.NewHTTPClientEx(600 * time.Second)
		// 使用 v2 接口，创建适配器
		v1Impl := agentexecutoraccess.NewAgentExecutorHttpAcc(
			log,
			agentExecutorConf,
			httpClient,
			streamClient,
			client,
		)
		v2Impl := v2agentexecutoraccess.NewV2AgentExecutorHttpAcc(
			log,
			agentExecutorConf,
			client,
			streamClient,
		)
		agentExecutorImpl = agentexecutoraccess.NewAgentExecutorAdapter(true, v1Impl, v2Impl)
	})

	return agentExecutorImpl
}
