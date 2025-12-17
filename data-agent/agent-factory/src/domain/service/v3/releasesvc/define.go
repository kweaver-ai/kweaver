package releasesvc

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iauthzacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iumacc"
)

type releaseSvc struct {
	*service.SvcBase
	releaseRepo            idbaccess.IReleaseRepo
	releaseHistoryRepo     idbaccess.IReleaseHistoryRepo
	agentConfigRepo        idbaccess.IDataAgentConfigRepo
	releaseCategoryRelRepo idbaccess.IReleaseCategoryRelRepo
	releasePermissionRepo  idbaccess.IReleasePermissionRepo
	dsSvc                  iv3portdriver.IDsSvc

	categoryRepo      idbaccess.ICategoryRepo
	spaceResourceRepo idbaccess.ISpaceResourceRepo

	umHttp iumacc.UmHttpAcc

	authZHttp iauthzacc.AuthZHttpAcc

	pmsSvc iv3portdriver.IPermissionSvc
}

var _ iv3portdriver.IReleaseSvc = &releaseSvc{}

func NewReleaseService(dto *NewReleaseSvcDto) iv3portdriver.IReleaseSvc {
	releaseSvcImpl := &releaseSvc{
		SvcBase:                dto.SvcBase,
		releaseRepo:            dto.ReleaseRepo,
		releaseHistoryRepo:     dto.ReleaseHistoryRepo,
		agentConfigRepo:        dto.AgentConfigRepo,
		releaseCategoryRelRepo: dto.ReleaseCategoryRepo,
		releasePermissionRepo:  dto.ReleasePermissionRepo,
		dsSvc:                  dto.DsIndexSvc,
		categoryRepo:           dto.CategoryRepo,
		spaceResourceRepo:      dto.SpaceResourceRepo,
		umHttp:                 dto.UmHttp,
		authZHttp:              dto.AuthZHttp,
		pmsSvc:                 dto.PmsSvc,
	}

	return releaseSvcImpl
}

type NewReleaseSvcDto struct {
	SvcBase               *service.SvcBase
	ReleaseRepo           idbaccess.IReleaseRepo
	ReleaseHistoryRepo    idbaccess.IReleaseHistoryRepo
	AgentConfigRepo       idbaccess.IDataAgentConfigRepo
	ReleaseCategoryRepo   idbaccess.IReleaseCategoryRelRepo
	ReleasePermissionRepo idbaccess.IReleasePermissionRepo
	DsIndexSvc            iv3portdriver.IDsSvc

	CategoryRepo      idbaccess.ICategoryRepo
	SpaceResourceRepo idbaccess.ISpaceResourceRepo

	UmHttp iumacc.UmHttpAcc

	Logger    icmp.Logger
	AuthZHttp iauthzacc.AuthZHttpAcc

	PmsSvc iv3portdriver.IPermissionSvc
}
