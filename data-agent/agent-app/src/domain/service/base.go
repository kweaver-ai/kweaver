package service

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

type SvcBase struct {
	logger icmp.Logger
}

func NewSvcBase() *SvcBase {
	return &SvcBase{
		logger: logger.GetLogger(),
	}
}
