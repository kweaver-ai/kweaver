package agentexecutoraccess

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/conf"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/cmp/httpclient"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iagentexecutorhttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
)

type agentExecutorHttpAcc struct {
	logger            icmp.Logger
	httpClient        icmp.IHttpClient
	agentExecutorConf *conf.AgentExecutorConf
	streamClient      httpclient.HTTPClient
	restClient        rest.HTTPClient

	privateAddress string
}

var _ iagentexecutorhttp.IAgentExecutor = &agentExecutorHttpAcc{}

func NewAgentExecutorHttpAcc(logger icmp.Logger, agentExecutorConf *conf.AgentExecutorConf, httpClient icmp.IHttpClient, streamClient httpclient.HTTPClient, restClient rest.HTTPClient) iagentexecutorhttp.IAgentExecutor {
	impl := &agentExecutorHttpAcc{
		logger:            logger,
		httpClient:        httpClient,
		agentExecutorConf: agentExecutorConf,
		streamClient:      streamClient,
		restClient:        restClient,
		privateAddress:    cutil.GetHTTPAccess(agentExecutorConf.PrivateSvc.Host, agentExecutorConf.PrivateSvc.Port, agentExecutorConf.PrivateSvc.Protocol),
	}

	return impl
}
