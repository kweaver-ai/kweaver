package boot

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/conf"
	_ "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cglobal"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

// 初始化
func Init() {
	global.GConfig = conf.NewConfig()
	cglobal.GConfig = global.GConfig.Config

	global.GDB = common.NewDBPool() // 初始化全局DB
	cglobal.GDB = global.GDB

	logFile := "/app/agent-app/logs/agent-app.log"
	// new 2025年04月16日14:42:00
	// logger 初始化
	lggerSetting := logger.LogSetting{
		LogServiceName: "agent-app",
		LogLevel:       global.GConfig.GetLogLevelString(),
		LogFileName:    logFile,
		MaxAge:         30,
		MaxBackups:     10,
		MaxSize:        100,
	}
	logger.InitGlobalLogger(lggerSetting)
}
