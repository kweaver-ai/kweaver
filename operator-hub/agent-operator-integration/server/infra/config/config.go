// Package config 定义配置
// @file config.go
// @description: 定义配置
package config

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"reflect"
	"runtime"
	"strconv"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/telemetry"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/creasty/defaults"
	"github.com/go-playground/validator/v10"
	"github.com/spf13/viper"
	"gopkg.in/yaml.v3"
)

const (
	DefaultOperatorNameMaxLength  = 50 // 算子名称最大长度
	DefaultOperatorHistoryRecords = 10 // 算子历史记录最大保留数
)

// Config 配置
type Config struct {
	Project                  Project             `yaml:"project"`
	OAuth                    OAuthConfig         `yaml:"oauth"`
	DB                       DBConfig            `yaml:"db"`
	UserMgnt                 PrivateBaseConfig   `yaml:"user_management"`
	Authorization            PrivateBaseConfig   `yaml:"authorization"`
	AgentOperatorApp         PrivateBaseConfig   `yaml:"agent-operator-app"`
	OperatorConfig           OperatorConfig      `yaml:"operator"`
	Logger                   interfaces.Logger   `yaml:"-"`
	RedisConfig              RedisConfig         `yaml:"redis"`
	ProxyModuleConfig        ProxyModuleConfig   `yaml:"proxy_module"`
	MCPConfig                MCPConfig           `yaml:"mcp"`
	CategoryConfig           CategoryConfig      `yaml:"category"`
	MQConfigFile             string              `yaml:"-"`
	Observability            ObservabilityConfig `yaml:"-"`
	FlowAutomation           PrivateBaseConfig   `yaml:"flow-automation"`
	BusinessDomainManagement PrivateBaseConfig   `yaml:"business-system-service"`
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
	LoggerLevel int                 `yaml:"logger_level" default:"0"`
	Name        string              `yaml:"name" default:"agent-operator-integration"`
	MachineID   string              `yaml:"machine_id"`
	PodID       string              `yaml:"pod_id" default:"DEFAULT_POD_ID"`
	Debug       bool                `yaml:"debug"`
	CommitInfo  utils.GitCommitInfo `yaml:"-"`
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

// ProxyModuleConfig 代理模块配置信息
type ProxyModuleConfig struct {
	// 代理配置
	DefaultTimeout int64 `yaml:"default_timeout" default:"30"` // 单位: 秒
	MaxTimeout     int64 `yaml:"max_timeout" default:"300"`    // 单位: 秒
	// 代理池配置
	MaxClients     int   `yaml:"max_clients" default:"50"`      // 最大客户端连接数
	ClientLifetime int64 `yaml:"client_lifetime" default:"300"` // 单位: 秒
}

// OperatorConfig 算子配置
type OperatorConfig struct {
	ImportFileSizeLimit    int64 `yaml:"import_file_size_limit" default:"2097152"  validate:"min=0,max=104857600"` // 默认2MB
	ImportOperatorMaxCount int64 `yaml:"import_operator_max_count" default:"10" validate:"min=1"`                  // 默认10
	DescLengthLimit        int64 `yaml:"operator_description_length_limit" default:"255" validate:"min=1"`         // 算子描述最大长度, 单位: 字节
}

// MCPConfig MCP配置
type MCPConfig struct {
	ConnTimeout int64 `yaml:"conn_timeout" default:"10"` // 单位: 秒
}

// CategoryConfig 算子分类配置
type CategoryConfig struct {
	InitSwitch bool `yaml:"init_switch"` // 是否初始化算子分类
}

// DBConfig 数据库配置
type DBConfig struct {
	Host         string `yaml:"host"`
	Port         int    `yaml:"port"`
	UserName     string `yaml:"user_name"`
	Password     string `yaml:"password"`
	ConnTimeout  int    `yaml:"conn_timeout"`
	MaxOpenConns int    `yaml:"max_open_conns"`
	ReadTimeout  int    `yaml:"read_timeout"`
	WriteTimeout int    `yaml:"write_timeout"`
	CertFile     string `yaml:"cert_file"`
	KeyFile      string `yaml:"key_file"`
	DBName       string `yaml:"db_name"`
	Charset      string `yaml:"charset"`
	SystemID     string `yaml:"system_id"`
}

// GetDBName 获取数据库名称
func (conf *Config) GetDBName() string {
	if conf.DB.DBName == "" {
		conf.DB.DBName = "dip_data_operator_hub"
	}
	if conf.DB.SystemID == "" {
		return conf.DB.DBName
	}
	return fmt.Sprintf("%s%s", conf.DB.SystemID, conf.DB.DBName)
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

var (
	once         sync.Once
	configLoader *Config
)

// NewConfigLoader 获取配置
func NewConfigLoader() *Config {
	once.Do(func() {
		configFilePath := "/sysvol/config/agent-operator-integration.yaml"
		secretFilePath := "/sysvol/secret/agent-operator-integration-secret.yaml"
		mqConfigFilePath := "/sysvol/config/mq_config.yaml"
		// 设置默认配置
		configLoader = &Config{
			MQConfigFile: mqConfigFilePath,
		}
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
		overrideWithEnv(configLoader)
		// 增加校验validator
		err = validator.New().Struct(configLoader)
		if err != nil {
			log.Panicln("Error: validate config failed: ", err)
			return
		}
		// 初始化可观测性相关配置
		configLoader.initO11yAndLog()
		// 设置机器ID
		configLoader.Project.SetMachineID()
	})
	return configLoader
}

func (conf *Config) localConfig(path string) (err error) {
	file, err := os.ReadFile(filepath.Clean(path))
	if err != nil {
		return
	}
	err = yaml.Unmarshal(file, conf)
	if err != nil {
		return
	}
	err = defaults.Set(conf)
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
		switch field.Kind() { //nolint:exhaustive
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
