package conf

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/cconf"
)

type AgentExecutorConf struct {
	PublicSvc  cconf.SvcConf `yaml:"public_svc"`
	PrivateSvc cconf.SvcConf `yaml:"private_svc"`
	// UseV2 控制是否使用 v2 版本的 Agent Executor 接口
	// true: 使用 v2 接口 (agent_id, agent_config, agent_input)
	// false: 使用 v1 接口 (id, config, input)
	UseV2 bool `yaml:"use_v2"`
}
