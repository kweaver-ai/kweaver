package boot

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/conf"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/common/global"
	_ "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cglobal"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/cenvhelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/redishelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/pkg/errors"
)

// 初始化
func init() {
	// 1. 初始化配置
	global.GConfig = conf.NewConfig()
	cglobal.GConfig = global.GConfig.Config

	// 设置默认语言
	rest.SetLang(cglobal.GConfig.GetDefaultLanguage())

	// 2. 初始化数据库
	global.GDB = common.NewDBPool() // 初始化全局DB
	cglobal.GDB = global.GDB

	// 3. 初始化redis
	redishelper.ConnectRedis(&global.GConfig.Redis)

	// 4. 初始化日志
	logFile := "/app/agent-factory/logs/agent-factory.log"
	if cenvhelper.IsLocalDev() {
		logFile = "./agent-factory.log"
	}

	// new 2025年04月16日14:42:00
	// logger 初始化
	lggerSetting := logger.LogSetting{
		LogServiceName: "agent-factory",
		LogLevel:       global.GConfig.GetLogLevelString(),
		LogFileName:    logFile,
		MaxAge:         30,
		MaxBackups:     10,
		MaxSize:        100,
	}
	logger.InitGlobalLogger(lggerSetting)

	// 5. 设置http request log
	initHttpRequestLog()

	// 6. 初始化权限
	err := initPermission()
	if err != nil {
		err = errors.Wrap(err, "init permission failed")
		logger.GetLogger().Panic(err)

		return
	}

	// 7. 初始化业务域关联关系
	err = initBizDomainRel()
	if err != nil {
		err = errors.Wrap(err, "init biz domain rel failed")
		logger.GetLogger().Panic(err)

		return
	}
}
