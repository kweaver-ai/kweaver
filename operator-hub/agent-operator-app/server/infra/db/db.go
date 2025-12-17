// Package db 数据库连接池
// @file db.go
// @description 初始化连接池
package db

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/config"
	// _ 注册proton-rds驱动
	_ "devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-rds-sdk-go/driver"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-rds-sdk-go/sqlx"
)

var (
	dbOnce sync.Once
	dbPool *sqlx.DB
)

// NewDBPool 获取数据库连接池
func NewDBPool() *sqlx.DB {
	dbOnce.Do(func() {
		conf := config.NewConfigLoader()
		logger := conf.GetLogger()
		dbName := conf.GetDBName()
		connInfo := sqlx.DBConfig{
			User:         conf.DB.UserName,
			Password:     conf.DB.Password,
			Host:         conf.DB.Host,
			Port:         conf.DB.Port,
			HostRead:     conf.DB.Host,
			PortRead:     conf.DB.Port,
			Database:     dbName,
			Charset:      conf.DB.Charset,
			Timeout:      conf.DB.ConnTimeout,
			ReadTimeout:  conf.DB.ReadTimeout,
			WriteTimeout: conf.DB.WriteTimeout,
			MaxOpenConns: conf.DB.MaxOpenConns,
		}
		var err error
		dbPool, err = sqlx.NewDB(&connInfo)
		if err != nil {
			// 判断err里
			if err.Error() == "driver must implement driver.ConnBeginTx" {
				connInfo.CustomDriver = "proton-rds"
				dbPool, err = sqlx.NewDB(&connInfo)
			}
			if err != nil {
				logger.Errorf("new db operator failed; error:%s, connInfo:%+v, configLoader.DB:%+v",
					err.Error(), connInfo, conf.DB)
				panic(err)
			}
		}
	})
	return dbPool
}
