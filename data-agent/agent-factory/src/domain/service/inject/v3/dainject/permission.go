package dainject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/permissionsvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconfdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/releaseacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/spacedb/spacedbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/chttpinject"
)

var (
	permissionSvcOnce sync.Once
	permissionSvcImpl iv3portdriver.IPermissionSvc
)

// NewPermissionSvc
func NewPermissionSvc() iv3portdriver.IPermissionSvc {
	permissionSvcOnce.Do(func() {
		dto := &permissionsvc.NewPermissionSvcDto{
			SvcBase:               service.NewSvcBase(),
			ReleaseRepo:           releaseacc.NewReleaseRepo(),
			ReleasePermissionRepo: releaseacc.NewReleasePermissionRepo(),
			AgentConfigRepo:       daconfdbacc.NewDataAgentRepo(),
			UmHttp:                chttpinject.NewUmHttpAcc(),
			AuthZHttp:             chttpinject.NewAuthZHttpAcc(),
			SpaceRepo:             spacedbacc.NewSpaceRepo(),
			// SpaceSvc:              NewCustomSpaceSvc(),
		}

		permissionSvcImpl = permissionsvc.NewPermissionService(dto)
	})

	return permissionSvcImpl
}
