package config

type AppConfig struct {
	CommonConfig   CommonConfig
	DatabaseConfig DatabaseConfig
	LogConfig      LogConfig
	DepsConfig     DepsConfig
}

type (
	CommonConfig struct {
		Port             string `envconfig:"PORT"       default:"8080"`
		Name             string `envconfig:"NAME"       default:"workstation-backend"`
		Prefix           string `envconfig:"PREFIX"     default:"/api/workstation"`
		CacheTime        string `envconfig:"CACHE_TIME" default:"500ms"`
		GlobalSID        string `envconfig:"GLOBAL_SID" default:"00000000-0000-0000-0000-000000000000"`
		PersistCacheTime string `envconfig:"PERSIST_CACHE_TIME" default:"500ms"`
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
	LogConfig struct {
		Level        string `envconfig:"LOG_LEVEL"         default:"debug"`
		Format       string `envconfig:"LOG_FORMAT"        default:"text"`
		EnableHealth bool   `envconfig:"LOG_ENABLE_HEALTH" default:"false"`
		EnableSQL    bool   `envconfig:"LOG_ENABLE_SQL"    default:"false"`
	}
	DepsConfig struct {
		AuthBaseURL string `envconfig:"AUTH_BASE_URL" default:"http://authorization-private:30920"`
	}
)
