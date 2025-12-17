package conf

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/cconf"
)

type Config struct {
	*cconf.Config
}

func (c Config) IsDebug() bool {
	return c.Project.Debug
}

var (
	configOnce sync.Once
	configImpl *Config
)

func NewConfig() *Config {
	configOnce.Do(func() {
		configImpl = &Config{}
		configImpl.Config = cconf.BaseDefConfig()

		bys := cconf.GetConfigBys("agent-factory.yaml")
		cconf.LoadConfig(bys, configImpl.Config)
	})

	return configImpl
}
