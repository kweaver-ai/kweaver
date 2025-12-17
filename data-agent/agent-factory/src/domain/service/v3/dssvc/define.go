package dssvc

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/idatahubacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iecoindex"
)

type dsSvc struct {
	*service.SvcBase
	redisCmp icmp.RedisCmp

	dsRepo idbaccess.IDsRepo

	datasetRepo idbaccess.IDatasetRepo

	ecoIndexHttp iecoindex.IEcoIndex

	datahubCentralHttp idatahubacc.IDataHubCentral

	logger icmp.Logger
}

var _ iv3portdriver.IDsSvc = &dsSvc{}

type NewDsSvcDto struct {
	RedisCmp           icmp.RedisCmp
	SvcBase            *service.SvcBase
	DsRepo             idbaccess.IDsRepo
	EcoIndexHttp       iecoindex.IEcoIndex
	DatasetRepo        idbaccess.IDatasetRepo
	DatahubCentralHttp idatahubacc.IDataHubCentral
	Logger             icmp.Logger
}

func NewDsSvc(dto *NewDsSvcDto) iv3portdriver.IDsSvc {
	return &dsSvc{
		redisCmp:           dto.RedisCmp,
		SvcBase:            dto.SvcBase,
		dsRepo:             dto.DsRepo,
		ecoIndexHttp:       dto.EcoIndexHttp,
		datasetRepo:        dto.DatasetRepo,
		datahubCentralHttp: dto.DatahubCentralHttp,
		logger:             dto.Logger,
	}
}
