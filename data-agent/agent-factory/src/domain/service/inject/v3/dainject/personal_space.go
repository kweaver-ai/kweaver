package dainject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/personalspacesvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconfdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconftpldbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/personalspacedbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/pubedagentdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/releaseacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/chttpinject"
)

var (
	personalSpaceSvcOnce sync.Once
	personalSpaceSvcImpl iv3portdriver.IPersonalSpaceService
)

// NewPersonalSpaceSvc
func NewPersonalSpaceSvc() iv3portdriver.IPersonalSpaceService {
	personalSpaceSvcOnce.Do(func() {
		dto := &personalspacesvc.NewPersonalSpaceSvcDto{
			SvcBase:           service.NewSvcBase(),
			AgentTplRepo:      daconftpldbacc.NewDataAgentTplRepo(),
			AgentConfigRepo:   daconfdbacc.NewDataAgentRepo(),
			PersonalSpaceRepo: personalspacedbacc.NewPersonalSpaceRepo(),
			ReleaseRepo:       releaseacc.NewReleaseRepo(),
			PubedAgentRepo:    pubedagentdbacc.NewPubedAgentRepo(),
			UmHttp:            chttpinject.NewUmHttpAcc(),
			PmsSvc:            NewPermissionSvc(),
			BizDomainHttp:     chttpinject.NewBizDomainHttpAcc(),
		}

		personalSpaceSvcImpl = personalspacesvc.NewPersonalSpaceService(dto)
	})

	return personalSpaceSvcImpl
}
