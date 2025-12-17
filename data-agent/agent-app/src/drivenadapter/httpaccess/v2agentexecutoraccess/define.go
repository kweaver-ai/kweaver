package v2agentexecutoraccess

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/conf"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/cmp/httpclient"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iv2agentexecutorhttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
)

type v2AgentExecutorHttpAcc struct {
	logger            icmp.Logger
	client            rest.HTTPClient
	agentExecutorConf *conf.AgentExecutorConf
	streamClient      httpclient.HTTPClient

	privateAddress string
}

var _ iv2agentexecutorhttp.IV2AgentExecutor = &v2AgentExecutorHttpAcc{}

func NewV2AgentExecutorHttpAcc(logger icmp.Logger, agentExecutorConf *conf.AgentExecutorConf, client rest.HTTPClient, streamClient httpclient.HTTPClient) iv2agentexecutorhttp.IV2AgentExecutor {
	impl := &v2AgentExecutorHttpAcc{
		logger:            logger,
		client:            client,
		agentExecutorConf: agentExecutorConf,
		streamClient:      streamClient,
		privateAddress:    cutil.GetHTTPAccess(agentExecutorConf.PrivateSvc.Host, agentExecutorConf.PrivateSvc.Port, agentExecutorConf.PrivateSvc.Protocol),
	}

	return impl
}
