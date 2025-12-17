package config

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"reflect"
	"strconv"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/utils"

	"github.com/creasty/defaults"
	"gopkg.in/yaml.v3"
)

// Config 配置
type Config struct {
	Project             Project           `yaml:"project"`
	OAuth               OAuthConfig       `yaml:"oauth"`
	DB                  DBConfig          `yaml:"db"`
	UserMgnt            PrivateBaseConfig `yaml:"user_management"`
	Logger              interfaces.Logger `yaml:"-"`
	OpenSearch          OpenSearchConfig  `yaml:"opensearch"`
	OperatorIntegration PrivateBaseConfig `yaml:"operator_integration"`
}

// Project 项目配置
type Project struct {
	Host        string              `yaml:"host"`
	Port        int                 `yaml:"port"`
	Language    string              `yaml:"language"`
	LoggerLevel int                 `yaml:"logger_level"`
	Name        string              `yaml:"name" default:"agent-operator-app"`
	MachineID   string              `yaml:"machine_id"`
	PodID       string              `yaml:"pod_id" default:"DEFAULT_POD_ID"`
	Debug       bool                `yaml:"debug"`
	CommitInfo  utils.GitCommitInfo `yaml:"-"`
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
		conf.DB.DBName = "doc_set"
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

// OpenSearchConfig OpenSearch配置
type OpenSearchConfig struct {
	Protocol string `yaml:"protocol"`
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	UserName string `yaml:"user"`
	Password string `yaml:"password"`
}

var (
	once         sync.Once
	configLoader *Config
)

// NewConfigLoader 获取配置
func NewConfigLoader() *Config {
	once.Do(func() {
		configFilePath := "/sysvol/config/agent-operator-app.yaml"
		secretFilePath := "/sysvol/secret/agent-operator-app-secret.yaml"
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
		configLoader.Logger = logger.NewLogger(logger.Level(configLoader.Project.LoggerLevel))
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
