package dainject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/releasesvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/categoryacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconfdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/releaseacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/spacedb/spaceresourcedbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/chttpinject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

var (
	releaseSvcOnce sync.Once
	releaseSvcImpl iv3portdriver.IReleaseSvc
)

// NewDaConfSvc
func NewReleaseSvc() iv3portdriver.IReleaseSvc {
	releaseSvcOnce.Do(func() {
		dto := &releasesvc.NewReleaseSvcDto{
			SvcBase:               service.NewSvcBase(),
			ReleaseRepo:           releaseacc.NewReleaseRepo(),
			ReleaseHistoryRepo:    releaseacc.NewReleaseHistoryRepo(),
			ReleaseCategoryRepo:   releaseacc.NewReleaseCategoryRelRepo(),
			ReleasePermissionRepo: releaseacc.NewReleasePermissionRepo(),
			AgentConfigRepo:       daconfdbacc.NewDataAgentRepo(),
			DsIndexSvc:            NewDsSvc(),
			Logger:                logger.GetLogger(),
			CategoryRepo:          categoryacc.NewCategoryRepo(),
			UmHttp:                chttpinject.NewUmHttpAcc(),
			SpaceResourceRepo:     spaceresourcedbacc.NewSpaceResourceRepo(),
			AuthZHttp:             chttpinject.NewAuthZHttpAcc(),
			PmsSvc:                NewPermissionSvc(),
		}

		releaseSvcImpl = releasesvc.NewReleaseService(dto)
	})

	return releaseSvcImpl
}
