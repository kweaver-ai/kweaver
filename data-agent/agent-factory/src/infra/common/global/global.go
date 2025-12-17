package global

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/conf"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-rds-sdk-go/sqlx"
)

var (
	GConfig *conf.Config // 全局配置
	GDB     *sqlx.DB     // 全局 DB
)
