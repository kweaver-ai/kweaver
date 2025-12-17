package dainject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/othersvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconfdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
)

var (
	otherSvcOnce sync.Once
	otherSvcImpl iv3portdriver.IOtherSvc
)

// NewOtherSvc 创建 Other 服务实例
func NewOtherSvc() iv3portdriver.IOtherSvc {
	otherSvcOnce.Do(func() {
		dto := &othersvc.NewOtherSvcDto{
			SvcBase:       service.NewSvcBase(),
			AgentConfRepo: daconfdbacc.NewDataAgentRepo(),
		}
		otherSvcImpl = othersvc.NewOtherService(dto)
	})

	return otherSvcImpl
}
