package service

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

type SvcBase struct {
	Logger icmp.Logger
}

func NewSvcBase() *SvcBase {
	return &SvcBase{
		Logger: logger.GetLogger(),
	}
}
