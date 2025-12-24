package config

import (
	"fmt"
	"os"

	"github.com/kelseyhightower/envconfig"
)

//nolint:errcheck
func NewConfig() *AppConfig {
	var app AppConfig
	envconfig.Process("APP", &app.CommonConfig)
	envconfig.Process("APP", &app.DatabaseConfig)
	envconfig.Process("APP", &app.LogConfig)
	envconfig.Process("APP", &app.DepsConfig)
	envconfig.Process("APP", &app.MQConfig)
	// config DB_TYPE
	os.Setenv("DB_TYPE", app.DatabaseConfig.TYPE)
	return &app
}

func (c *CommonConfig) ServeHost() string {
	return fmt.Sprintf(":%s", c.Port)
}

func (d *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		d.User,
		d.Password,
		d.Host,
		d.Port,
		fmt.Sprintf("%s%s", d.SystemID, d.DBName),
	)
}
