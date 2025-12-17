package conf

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/version"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/cconf"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/spf13/viper"
)

type Config struct {
	*cconf.Config

	AgentFactoryConf  *AgentFactoryConf  `yaml:"agent_factory"`
	AgentExecutorConf *AgentExecutorConf `yaml:"agent_executor"`
	EfastConf         *EfastConf         `yaml:"efast"`
	DocsetConf        *DocsetConf        `yaml:"docset"`
	EcoConfigConf     *EcoConfigConf     `yaml:"ecoconfig"`
	// 可观测性相关配置
	O11yCfg *o11y.ObservabilitySetting
	// 流式响应配置
	StreamDiffFrequency int `yaml:"stream_diff_frequency"`
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
		configImpl.O11yCfg = &o11y.ObservabilitySetting{}

		bys := cconf.GetConfigBys("agent-app.yaml")
		cconf.LoadConfig(bys, configImpl.Config)
		//NOTE: 加载configImpl
		cconf.LoadConfig(bys, configImpl)

		init_o11y()
	})

	return configImpl
}

// 加载&初始化可观测性相关配置
func init_o11y() {
	viper.SetConfigName("observability")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("/sysvol/conf/")

	if err := viper.ReadInConfig(); err != nil {
		panic(err)
	}

	if err := viper.Unmarshal(&configImpl.O11yCfg); err != nil {
		panic(err)
	}

	serverInfo := o11y.ServerInfo{
		ServerName:    version.ServerName,
		ServerVersion: version.ServerVersion,
		Language:      version.LanguageGo,
		GoVersion:     version.GoVersion,
		GoArch:        version.GoArch,
	}

	o11y.Init(serverInfo, *configImpl.O11yCfg)
}
