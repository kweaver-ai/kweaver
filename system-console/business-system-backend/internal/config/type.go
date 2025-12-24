package config

type AppConfig struct {
	CommonConfig   CommonConfig
	DatabaseConfig DatabaseConfig
	MQConfig       MessageQueueConfig
	LogConfig      LogConfig
	DepsConfig     DepsConfig
}

type (
	CommonConfig struct {
		Port   string `envconfig:"PORT"       default:"8080"`
		Name   string `envconfig:"NAME"       default:"business-system-backend"`
		Prefix string `envconfig:"PREFIX"     default:"/api/business-system"`
	}
	DatabaseConfig struct {
		Host     string `envconfig:"DB_HOST"     default:"localhost"`
		Port     string `envconfig:"DB_PORT"     default:"3306"`
		User     string `envconfig:"DB_USER"     default:"root"`
		Password string `envconfig:"DB_PASSWORD" default:"root"`
		DBName   string `envconfig:"DB_NAME"     default:"mydb"`
		TYPE     string `envconfig:"DB_TYPE"     default:"MYSQL"`
		SystemID string `envconfig:"DB_SYSTEMID" default:""`

		MaxIdleConns    int `envconfig:"DB_MAX_IDLE_CONNS"     default:"10"`
		MaxOpenConns    int `envconfig:"DB_MAX_OPEN_CONNS"     default:"100"`
		ConnMaxLifetime int `envconfig:"DB_CONN_MAX_LIFETIME"  default:"60"` // minute
		ConnMaxIdleTime int `envconfig:"DB_CONN_MAX_IDLE_TIME" default:"30"`
	}

	MessageQueueConfig struct {
		Type        string `envconfig:"MQ_TYPE"         default:"kafka"`
		Host        string `envconfig:"MQ_HOST"         default:"kafka-headless.resource.svc.cluster.local."`
		Port        int    `envconfig:"MQ_PORT"         default:"9097"`
		LookupdHost string `envconfig:"MQ_LOOKUPD_HOST" default:""`
		LookupdPort int    `envconfig:"MQ_LOOKUPD_PORT" default:"0"`

		AuthMechanism string `envconfig:"MQ_AUTH_MECHANISM" default:"PLAIN"`
		AuthUsername  string `envconfig:"MQ_AUTH_USERNAME"  default:"anyrobot"`
		AuthPassword  string `envconfig:"MQ_AUTH_PASSWORD"  default:"eisoo.com123"`
	}
	LogConfig struct {
		Level        string `envconfig:"LOG_LEVEL"         default:"debug"`
		Format       string `envconfig:"LOG_FORMAT"        default:"text"`
		EnableHealth bool   `envconfig:"LOG_ENABLE_HEALTH" default:"false"`
		EnableSQL    bool   `envconfig:"LOG_ENABLE_SQL"    default:"false"`
	}
	DepsConfig struct {
		AuthPrivateBaseURL   string `envconfig:"AUTH_PRIVATE_BASE_URL"   default:"http://authorization-private:30920"`
		AuthPublicBaseURL    string `envconfig:"AUTH_PUBLIC_BASE_URL"    default:"http://authorization-public:30920"`
		DeployServiceBaseURL string `envconfig:"DEPLOY_SERVICE_BASE_URL" default:"http://deploy-service:9703"`
		HydraBaseURL         string `envconfig:"HYDRA_BASE_URL"          default:"http://hydra-admin:4445"`
		UserMgntBaseURL      string `envconfig:"USER_MNGT_BASE_URL"      default:"http://user-management-private:30980"`
		EnableMQ             bool   `envconfig:"ENABLE_MQ" default:"true"`
	}
)
