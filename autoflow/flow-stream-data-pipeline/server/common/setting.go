package common

import (
	"fmt"
	"os"
	"sync"
	"time"

	libdb "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/db"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	libmq "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/mq"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/bytedance/sonic"
	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"

	"flow-stream-data-pipeline/version"
)

// server配置项
type ServerSetting struct {
	RunMode                 string        `mapstructure:"runMode"`
	HttpPort                int           `mapstructure:"httpPort"`
	Language                string        `mapstructure:"language"`
	ReadTimeOut             time.Duration `mapstructure:"readTimeOut"`
	WriteTimeout            time.Duration `mapstructure:"writeTimeOut"`
	RetryIntervalMs         int           `mapstructure:"retryIntervalMs"`
	FlushMiB                int           `mapstructure:"flushMiB"`
	FlushItems              int           `mapstructure:"flushItems"`
	FlushIntervalSec        int           `mapstructure:"flushIntervalSec"`
	FailureThreshold        int           `mapstructure:"failureThreshold"`
	PackagePoolSize         int           `mapstructure:"packagePoolSize"`
	MonitorIntervalSec      int           `mapstructure:"monitorIntervalSec"`
	CpuMax                  int           `mapstructure:"cpuMax"`
	MemoryMax               int           `mapstructure:"memoryMax"`
	WatchDeployInterval     time.Duration `mapstructure:"watchDeployInterval"`
	WatchWorkersIntervalMin time.Duration `mapstructure:"watchWorkersIntervalMin"`
	MaxPipelineCount        int           `mapstructure:"maxPipelineCount"`
}

type KafkaSetting struct {
	SessionTimeoutMs              int    `mapstructure:"sessionTimeoutMs"`
	SocketTimeoutMs               int    `mapstructure:"socketTimeoutMs"`
	MaxPollIntervalMs             int    `mapstructure:"maxPollIntervalMs"`
	HeartbeatIntervalMs           int    `mapstructure:"heartbeatIntervalMs"`
	TransactionTimeoutMs          int    `mapstructure:"transactionTimeoutMs"`
	AutoOffsetReset               string `mapstructure:"autoOffsetReset"`
	RetentionTime                 string `mapstructure:"retentionTime"`
	RetentionSize                 int    `mapstructure:"retentionSize"`
	AdminClientRequestTimeoutMs   int    `mapstructure:"adminClientRequestTimeoutMs"`
	AdminClientOperationTimeoutMs int    `mapstructure:"adminClientOperationTimeoutMs"`
	Retries                       int    `mapstructure:"retries"`
	RetryBackoffMs                int    `mapstructure:"retryBackoffMs"`
}

// app配置项
type AppSetting struct {
	ServerSetting        ServerSetting             `mapstructure:"server"`
	LogSetting           logger.LogSetting         `mapstructure:"log"`
	KafkaSetting         KafkaSetting              `mapstructure:"kafka"`
	ObservabilitySetting o11y.ObservabilitySetting `mapstructure:"observability"`
	DepServices          map[string]map[string]any `mapstructure:"depServices"`

	DBSetting         libdb.DBSetting
	MQSetting         libmq.MQSetting
	OpenSearchSetting rest.OpenSearchClientConfig
	HydraAdminSetting rest.HydraAdminSetting

	PipelineMgmtUrl string
	IndexBaseUrl    string
	PermissionUrl   string
}

const (
	// ConfigFile 配置文件信息
	configPath string = "./config/"
	configName string = "pipeline-config"
	configType string = "yaml"

	rdsServiceName          string = "rds"
	mqServiceName           string = "mq"
	opensearchServiceName   string = "opensearch"
	pipelineMgmtServiceName string = "flow-stream-data-pipeline"
	indexBaseServiceName    string = "index-base"
	permissionServiceName   string = "authorization-private"
	hydraAdminServiceName   string = "hydra-admin"

	MQType_Kafka = "kafka"
)

var (
	appSetting *AppSetting
	vp         *viper.Viper

	settingOnce sync.Once
)

// NewSetting 读取服务配置
func NewSetting() *AppSetting {
	settingOnce.Do(func() {
		appSetting = &AppSetting{}
		vp = viper.New()
		initSetting(vp)
	})

	return appSetting
}

// 初始化配置
func initSetting(vp *viper.Viper) {
	logger.Infof("Init Setting From File %s%s.%s", configPath, configName, configType)

	vp.AddConfigPath(configPath)
	vp.SetConfigName(configName)
	vp.SetConfigType(configType)

	loadSetting(vp)

	vp.WatchConfig()
	vp.OnConfigChange(func(e fsnotify.Event) {
		logger.Infof("Config file changed:%s", e)
		loadSetting(vp)
	})
}

// 读取配置文件
func loadSetting(vp *viper.Viper) {
	logger.Infof("Load Setting File %s%s.%s", configPath, configName, configType)

	if err := vp.ReadInConfig(); err != nil {
		logger.Fatalf("err:%s\n", err)
	}

	if err := vp.Unmarshal(appSetting); err != nil {
		logger.Fatalf("err:%s\n", err)
	}

	SetLogSetting(appSetting.LogSetting)

	SetDBSetting()

	SetMQSetting()

	SetOpenSearchSetting()

	SetHydraAdminSetting()

	SetPipelineMgmtSetting()

	SetIndexBaseSetting()

	SetPermissionSetting()

	serverInfo := o11y.ServerInfo{
		ServerName:    version.ServerName,
		ServerVersion: version.ServerVersion,
		Language:      version.LanguageGo,
		GoVersion:     version.GoVersion,
		GoArch:        version.GoArch,
	}
	logger.Infof("ServerName: %s, ServerVersion: %s, Language: %s, GoVersion: %s, GoArch: %s, POD_NAME: %s",
		version.ServerName, version.ServerVersion, version.LanguageGo,
		version.GoVersion, version.GoArch, o11y.POD_NAME)

	o11y.Init(serverInfo, appSetting.ObservabilitySetting)

	s, _ := sonic.MarshalString(appSetting)
	logger.Debug(s)
}

func SetDBSetting() {
	setting, ok := appSetting.DepServices[rdsServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", rdsServiceName)
	}

	appSetting.DBSetting = libdb.DBSetting{
		Host:     setting["host"].(string),
		Port:     setting["port"].(int),
		Username: setting["user"].(string),
		Password: setting["password"].(string),
		DBName:   setting["database"].(string),
	}
}

func SetMQSetting() {
	setting, ok := appSetting.DepServices[mqServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", mqServiceName)
	}
	authSetting, ok := setting["auth"].(map[string]any)
	if !ok {
		logger.Fatalf("service %s auth not found in depServices", mqServiceName)
	}

	appSetting.MQSetting = libmq.MQSetting{
		MQType: setting["mqtype"].(string),
		MQHost: setting["mqhost"].(string),
		MQPort: setting["mqport"].(int),
		Tenant: setting["tenant"].(string),
		Auth: libmq.MQAuthSetting{
			Username:  authSetting["username"].(string),
			Password:  authSetting["password"].(string),
			Mechanism: authSetting["mechanism"].(string),
		},
	}
}

func SetOpenSearchSetting() {
	setting, ok := appSetting.DepServices[opensearchServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", opensearchServiceName)
	}

	appSetting.OpenSearchSetting = rest.OpenSearchClientConfig{
		Host:     setting["host"].(string),
		Port:     setting["port"].(int),
		Protocol: setting["protocol"].(string),
		Username: setting["user"].(string),
		Password: setting["password"].(string),
	}
}

func SetHydraAdminSetting() {
	setting, ok := appSetting.DepServices[hydraAdminServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", hydraAdminServiceName)
	}
	appSetting.HydraAdminSetting = rest.HydraAdminSetting{
		HydraAdminProcotol: setting["protocol"].(string),
		HydraAdminHost:     setting["host"].(string),
		HydraAdminPort:     setting["port"].(int),
	}
}

func SetPipelineMgmtSetting() {
	setting, ok := appSetting.DepServices[pipelineMgmtServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", pipelineMgmtServiceName)
	}

	protocol := setting["protocol"].(string)
	host := setting["host"].(string)
	port := setting["port"].(int)

	appSetting.PipelineMgmtUrl = fmt.Sprintf("%s://%s:%d/api/flow-stream-data-pipeline/in/v1/pipelines", protocol, host, port)
}

func SetIndexBaseSetting() {
	setting, ok := appSetting.DepServices[indexBaseServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", indexBaseServiceName)
	}

	protocol := setting["protocol"].(string)
	host := setting["host"].(string)
	port := setting["port"].(int)

	appSetting.IndexBaseUrl = fmt.Sprintf("%s://%s:%d/api/mdl-index-base/in/v1/index_bases", protocol, host, port)
}

func SetPermissionSetting() {
	setting, ok := appSetting.DepServices[permissionServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", permissionServiceName)
	}

	protocol := setting["protocol"].(string)
	host := setting["host"].(string)
	port := setting["port"].(int)

	appSetting.PermissionUrl = fmt.Sprintf("%s://%s:%d/api/authorization/v1", protocol, host, port)
}

func GetMQType() string {
	return os.Getenv("MQ_TYPE")
}
