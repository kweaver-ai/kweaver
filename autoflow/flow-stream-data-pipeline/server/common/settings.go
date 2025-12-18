package common

import (
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	libdb "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/db"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/uniconfig"
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

type MQSetting struct {
	MQHost    string `mapstructure:"mqHost"`
	MQPort    int    `mapstructure:"mqPort"`
	MQType    string `mapstructure:"mqType"`
	Username  string `mapstructure:"username"`
	Password  string `mapstructure:"password"`
	Mechanism string `mapstructure:"mechanism"`
}

type KafkaSetting struct {
	Services                      string
	Protocol                      string
	Tenant                        string
	Username                      string
	Password                      string
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
	MQSetting            MQSetting                 `mapstructure:"mq"`
	KafkaSetting         KafkaSetting              `mapstructure:"kafka"`
	ObservabilitySetting o11y.ObservabilitySetting `mapstructure:"observability"`
	OpenSearchSetting    rest.OpenSearchClientConfig
	DBSetting            libdb.DBSetting
	HydraAdminSetting    rest.HydraAdminSetting
	PipelineMgmtUrl      string
	IndexBaseUrl         string
	PermissionUrl        string
}

const (
	// ConfigFile 配置文件信息
	configPath string = "./config/"
	configName string = "pipeline-config"
	configType string = "yaml"

	dbServiceName string = "rds"
	dbServicePort string = "default"

	mqServiceName string = "mq"
	mqPortName    string = "default"

	opensearchServiceName string = "opensearch"
	opensearchPortName    string = "default"

	pipelineMgmtServiceName string = "flow-stream-data-pipeline"
	pipelineMgmtPortName    string = "default"

	indexBaseServiceName string = "index-base"
	indexBasePortName    string = "default"

	permissionServiceName string = "authorization-private"
	permissionPortName    string = "default"

	hydraAdminServiceName string = "hydra-admin"
	hydraAdminPortName    string = "default"

	FLOW_DATA_BASE_NAME string = "workflow"

	MQType_Kafka = "kafka"
)

var appSetting *AppSetting
var vp *viper.Viper

var settingOnce sync.Once

// NewConfig 读取服务配置
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

	rest.SetLang(appSetting.ServerSetting.Language)
	logger.Info("Server Set Language Success")

	SetFlowDBSetting()

	SetHydraAdminSetting()

	SetLogSetting(appSetting.LogSetting)

	SetKafkaSetting()

	SetOpenSearchSetting()

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

	s, _ := sonic.Marshal(appSetting)
	logger.Debug(string(s))
}

func SetFlowDBSetting() {
	_, host, port := uniconfig.ServiceFrom(dbServiceName, dbServicePort)
	username, password := uniconfig.AuthFrom(dbServiceName)
	appSetting.DBSetting = libdb.DBSetting{
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
		DBName:   FLOW_DATA_BASE_NAME,
	}
}

func SetHydraAdminSetting() {
	adminProtocol, adminHost, adminPort := uniconfig.ServiceFrom(hydraAdminServiceName, hydraAdminPortName)
	appSetting.HydraAdminSetting = rest.HydraAdminSetting{
		HydraAdminProcotol: adminProtocol,
		HydraAdminHost:     adminHost,
		HydraAdminPort:     adminPort,
	}
}

func SetOpenSearchSetting() {
	username, password := uniconfig.AuthFrom(opensearchServiceName)
	protocol, host, port := uniconfig.ServiceFrom(opensearchServiceName, opensearchPortName)
	appSetting.OpenSearchSetting = rest.OpenSearchClientConfig{
		Host:     host,
		Port:     port,
		Protocol: protocol,
		Username: username,
		Password: password,
	}
}

func SetKafkaSetting() {
	mqType := GetMQType()
	if mqType != MQType_Kafka {
		logger.Errorf("MQ Type is not kafka, but is '%s'", mqType)
	}

	username, password := uniconfig.AuthFrom(mqServiceName)
	tenant := uniconfig.TenantFrom(mqServiceName)
	protocol, host, port := uniconfig.ServiceFrom(mqServiceName, mqPortName)
	services := fmt.Sprintf("%s:%d", host, port)

	appSetting.KafkaSetting = KafkaSetting{
		Services:                      services,
		Protocol:                      strings.ToLower(protocol),
		Tenant:                        tenant,
		Username:                      username,
		Password:                      password,
		SessionTimeoutMs:              appSetting.KafkaSetting.SessionTimeoutMs,
		SocketTimeoutMs:               appSetting.KafkaSetting.SocketTimeoutMs,
		MaxPollIntervalMs:             appSetting.KafkaSetting.MaxPollIntervalMs,
		HeartbeatIntervalMs:           appSetting.KafkaSetting.HeartbeatIntervalMs,
		TransactionTimeoutMs:          appSetting.KafkaSetting.TransactionTimeoutMs,
		AutoOffsetReset:               appSetting.KafkaSetting.AutoOffsetReset,
		RetentionTime:                 appSetting.KafkaSetting.RetentionTime,
		RetentionSize:                 appSetting.KafkaSetting.RetentionSize,
		AdminClientRequestTimeoutMs:   appSetting.KafkaSetting.AdminClientRequestTimeoutMs,
		AdminClientOperationTimeoutMs: appSetting.KafkaSetting.AdminClientOperationTimeoutMs,
		Retries:                       appSetting.KafkaSetting.Retries,
		RetryBackoffMs:                appSetting.KafkaSetting.RetryBackoffMs,
	}
}

func SetPipelineMgmtSetting() {
	protocol, svc, port := uniconfig.ServiceFrom(pipelineMgmtServiceName, pipelineMgmtPortName)
	appSetting.PipelineMgmtUrl = fmt.Sprintf("%s://%s:%d/api/flow-stream-data-pipeline/in/v1/pipelines", protocol, svc, port)
}

func SetIndexBaseSetting() {
	protocol, svc, port := uniconfig.ServiceFrom(indexBaseServiceName, indexBasePortName)
	appSetting.IndexBaseUrl = fmt.Sprintf("%s://%s:%d/api/mdl-index-base/in/v1/index_bases", protocol, svc, port)
}

func SetPermissionSetting() {
	protocol, svc, port := uniconfig.ServiceFrom(permissionServiceName, permissionPortName)
	appSetting.PermissionUrl = fmt.Sprintf("%s://%s:%d/api/authorization/v1", protocol, svc, port)
}

func GetMQType() string {
	return os.Getenv("MQ_TYPE")
}
