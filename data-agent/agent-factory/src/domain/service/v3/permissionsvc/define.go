package permissionsvc

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iauthzacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iumacc"
)

type permissionSvc struct {
	*service.SvcBase
	agentConfRepo         idbaccess.IDataAgentConfigRepo
	releaseRepo           idbaccess.IReleaseRepo
	releasePermissionRepo idbaccess.IReleasePermissionRepo
	umHttp                iumacc.UmHttpAcc
	authZHttp             iauthzacc.AuthZHttpAcc

	spaceRepo idbaccess.ISpaceRepo
	// spaceSvc                 iv3portdriver.ISpaceService
}

var _ iv3portdriver.IPermissionSvc = &permissionSvc{}

type NewPermissionSvcDto struct {
	SvcBase               *service.SvcBase
	AgentConfigRepo       idbaccess.IDataAgentConfigRepo
	ReleaseRepo           idbaccess.IReleaseRepo
	ReleasePermissionRepo idbaccess.IReleasePermissionRepo
	UmHttp                iumacc.UmHttpAcc
	AuthZHttp             iauthzacc.AuthZHttpAcc

	SpaceRepo idbaccess.ISpaceRepo
	// SpaceSvc                 iv3portdriver.ISpaceService
}

func NewPermissionService(dto *NewPermissionSvcDto) iv3portdriver.IPermissionSvc {
	permissionSvcImpl := &permissionSvc{
		SvcBase:               dto.SvcBase,
		agentConfRepo:         dto.AgentConfigRepo,
		releaseRepo:           dto.ReleaseRepo,
		releasePermissionRepo: dto.ReleasePermissionRepo,
		umHttp:                dto.UmHttp,
		authZHttp:             dto.AuthZHttp,
		spaceRepo:             dto.SpaceRepo,
		// spaceSvc:                 dto.SpaceSvc,
	}

	return permissionSvcImpl
}
