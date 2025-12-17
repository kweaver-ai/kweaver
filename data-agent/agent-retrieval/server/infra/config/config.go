package config

import (
	"log"
	"os"
	"path/filepath"
	"reflect"
	"runtime"
	"strconv"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/telemetry"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/utils"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/creasty/defaults"
	"github.com/spf13/viper"
	"gopkg.in/yaml.v3"
)

// Config 配置
type Config struct {
	Project             Project               `yaml:"project"`
	OAuth               OAuthConfig           `yaml:"oauth"`
	UserMgnt            PrivateBaseConfig     `yaml:"user_management"`
	OntologyManager     PrivateBaseConfig     `yaml:"ontology_manager"`
	OntologyQuery       PrivateBaseConfig     `yaml:"ontology_query"`
	AgentApp            PrivateBaseConfig     `yaml:"agent_app"`
	RedisConfig         RedisConfig           `yaml:"redis"`
	Logger              interfaces.Logger     `yaml:"-"`
	DeployAgent         DeployAgentConfig     `yaml:"deploy_agent"`          // 依赖智能体配置
	ConceptSearchConfig KnConceptSearchConfig `yaml:"concept_search_config"` // 业务知识网络概念搜索配置
	DataRetrieval       PrivateBaseConfig     `yaml:"data_retrieval"`        // 数据检索配置
	Observability       ObservabilityConfig   `yaml:"-"`
}

// ObservabilityConfig 跟踪配置
type ObservabilityConfig struct {
	TraceType                 telemetry.ExporterType `mapstructure:"traceType"`
	o11y.ObservabilitySetting `mapstructure:",squash"`
}

// Project 项目配置
type Project struct {
	Host        string              `yaml:"host"`
	Port        int                 `yaml:"port"`
	Language    string              `yaml:"language"`
	LoggerLevel int                 `yaml:"logger_level"`
	Name        string              `yaml:"name" default:"agent-retrieval"`
	MachineID   string              `yaml:"machine_id"`
	PodID       string              `yaml:"pod_id" default:"DEFAULT_POD_ID"`
	Debug       bool                `yaml:"debug"`
	CommitInfo  utils.GitCommitInfo `yaml:"-"`
}

// GetLogger 获取Logger
func (conf *Config) GetLogger() interfaces.Logger {
	if conf.Logger == nil {
		return logger.DefaultLogger()
	}
	return conf.Logger
}

// OAuthConfig OAuth连接信息
type OAuthConfig struct {
	PublicBaseConfig `yaml:",inline"`
	AdminHost        string `yaml:"admin_host"`
	AdminPort        int    `yaml:"admin_port"`
	AdminProtocol    string `yaml:"admin_protocol"`
	AdminPrefix      string `yaml:"admin_prefix"`
}

// PublicBaseConfig public 基础配置
type PublicBaseConfig struct {
	PublicHost     string `yaml:"public_host"`
	PublicPort     int    `yaml:"public_port"`
	PublicProtocol string `yaml:"public_protocol"`
}

// PrivateBaseConfig private 基础配置
type PrivateBaseConfig struct {
	PrivateHost     string `yaml:"private_host"`
	PrivatePort     int    `yaml:"private_port"`
	PrivateProtocol string `yaml:"private_protocol"`
}

// OpenSearchConfig OpenSearch配置
type OpenSearchConfig struct {
	Protocol string `yaml:"protocol"`
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	UserName string `yaml:"user"`
	Password string `yaml:"password"`
}

// KnConceptSearchConfig 业务知识网络概念搜索配置
type KnConceptSearchConfig struct {
	ConceptRecallSize int `yaml:"concept_recall_size"` // 概念粗召回数量
	KnnKValue         int `yaml:"knn_k"`               // knn k值
}

// SetMachineID 设置机器ID
func (conf *Project) SetMachineID() {
	// 生成MachineID
	if conf.MachineID == "" {
		mid := os.Getenv(conf.PodID)
		if mid == "" {
			mid, _ = os.Hostname()
			// 为空也可以
			mid = utils.MD5(mid)
			mid = mid[:8]
		}
		conf.MachineID = mid
	}
}

// GetMachineID 获取机器ID
func (conf *Project) GetMachineID() string {
	return conf.MachineID
}

// DeployAgentConfig 依赖智能体配置
type DeployAgentConfig struct {
	ConceptIntentionAnalysisAgentKey   string `yaml:"concept_intention_analysis_agent_key"`   // 概念意图分析智能体Key
	ConceptRetrievalStrategistAgentKey string `yaml:"concept_retrieval_strategist_agent_key"` // 概念召回策略智能体Key
}

var (
	once         sync.Once
	configLoader *Config
)

// NewConfigLoader 获取配置
func NewConfigLoader() *Config {
	once.Do(func() {
		configFilePath := "/sysvol/config/agent-retrieval.yaml"
		secretFilePath := "/sysvol/secret/agent-retrieval-secret.yaml"

		// 设置默认配置
		configLoader = &Config{}
		err := configLoader.localConfig(configFilePath)
		if err != nil {
			log.Panicln("Error: load local config failed: ", err)
			return
		}
		err = configLoader.localConfig(secretFilePath)
		if err != nil {
			log.Panicln("Error: load local secret failed: ", err)
			return
		}
		// 初始化可观测性相关配置
		configLoader.initO11yAndLog()
		// 设置机器ID
		configLoader.Project.SetMachineID()
		overrideWithEnv(configLoader)
	})
	return configLoader
}

func (conf *Config) localConfig(path string) (err error) {
	err = defaults.Set(conf)
	if err != nil {
		return
	}

	file, err := os.ReadFile(filepath.Clean(path))
	if err != nil {
		return
	}
	err = yaml.Unmarshal(file, conf)
	return
}

// overrideWithEnv 自动遍历结构体，用反射根据 tag 进行环境变量覆盖
func overrideWithEnv(cfg interface{}) {
	v := reflect.ValueOf(cfg).Elem() // 获取指向结构体的指针
	t := v.Type()

	for i := 0; i < v.NumField(); i++ {
		field := v.Field(i)
		fieldType := t.Field(i)

		if field.Kind() == reflect.Struct {
			// 递归处理嵌套结构体
			overrideWithEnv(field.Addr().Interface())
			continue
		}

		// 获取字段的 env 标签
		envTag := fieldType.Tag.Get("env")
		if envTag == "" {
			continue // 如果没有定义 env 标签，跳过
		}

		// 判断环境变量是否存在
		envValue, exists := os.LookupEnv(envTag)
		if !exists {
			continue // 如果环境变量 key 不存在，跳过
		}

		// 如果 key 存在但值为空，则将字段设为类型的零值
		if envValue == "" {
			field.Set(reflect.Zero(field.Type()))
			continue
		}

		// 使用反射直接设置字段值，要求类型匹配
		switch field.Kind() {
		case reflect.String:
			field.SetString(envValue)
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			intValue, err := strconv.ParseInt(envValue, 10, 64)
			if err == nil {
				field.SetInt(intValue)
			}
		case reflect.Bool:
			boolValue, err := strconv.ParseBool(envValue)
			if err == nil {
				field.SetBool(boolValue)
			}
		default:
			panic("Unsupported field type for env override")
		}
	}
}

// 加载&初始化可观测性相关配置
func (conf *Config) initO11yAndLog() {
	// 初始化日志
	level := logger.Level(configLoader.Project.LoggerLevel)
	if configLoader.Project.Debug {
		level = logger.LevelDebug
	}

	// 加载配置文件
	viper.SetConfigName("observability")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("/sysvol/config/")
	if err := viper.ReadInConfig(); err != nil {
		panic(err)
	}
	if err := viper.Unmarshal(&conf.Observability); err != nil {
		panic(err)
	}
	serverInfo := o11y.ServerInfo{
		ServerName:    conf.Project.Name,
		ServerVersion: "1.0.0",
		Language:      "Go",
		GoVersion:     runtime.Version(),
		GoArch:        runtime.GOARCH,
	}

	// 初始化可观测性
	if conf.Observability.TraceEnabled && conf.Observability.TraceType == telemetry.ExporterTypeJaeger {
		_, err := telemetry.InitJaegerExporter(conf.Project.Name, conf.Observability.TraceProvider, conf.Observability.GrpcTraceFeedIngesterUrl)
		if err != nil {
			panic(err)
		}
		conf.Observability.TraceEnabled = false
	}
	o11y.Init(serverInfo, conf.Observability.ObservabilitySetting)
	// 初始化日志
	if conf.Observability.LogEnabled {
		configLoader.Logger = telemetry.NewSamplerLogger(logger.NewLogger(level, logger.MaxCalldepth))
		return
	}
	configLoader.Logger = logger.NewLogger(level, logger.DefaultCalldepth)
}
