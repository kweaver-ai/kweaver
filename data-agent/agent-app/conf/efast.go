package conf

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/cconf"

type EfastConf struct {
	PublicSvc  cconf.SvcConf `yaml:"public_svc"`
	PrivateSvc cconf.SvcConf `yaml:"private_svc"`
}
