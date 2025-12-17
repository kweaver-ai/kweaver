package agentfactoryaccess

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/conf"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iagentfactoryhttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
)

type agentFactoryHttpAcc struct {
	logger           icmp.Logger
	client           rest.HTTPClient
	agentFactoryConf *conf.AgentFactoryConf
	privateAddress   string
}

var _ iagentfactoryhttp.IAgentFactory = &agentFactoryHttpAcc{}

func NewAgentFactoryHttpAcc(logger icmp.Logger, agentFactoryConf *conf.AgentFactoryConf, client rest.HTTPClient) iagentfactoryhttp.IAgentFactory {
	impl := &agentFactoryHttpAcc{
		logger:           logger,
		client:           client,
		agentFactoryConf: agentFactoryConf,
		privateAddress:   cutil.GetHTTPAccess(agentFactoryConf.PrivateSvc.Host, agentFactoryConf.PrivateSvc.Port, agentFactoryConf.PrivateSvc.Protocol),
	}

	return impl
}
