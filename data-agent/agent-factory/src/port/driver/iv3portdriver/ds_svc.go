package iv3portdriver

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/docindexobj"
)

//go:generate mockgen -source=./ds_svc.go -destination ./v3portdrivermock/ds_svc.go -package v3portdrivermock
type IDsSvc interface {
	Create(ctx context.Context, tx *sql.Tx, dto *dsdto.DsComDto) (datasetId string, isReusable bool, err error)
	CreateAssocOnly(ctx context.Context, tx *sql.Tx, dto *dsdto.DsUniqDto, datasetId string) (err error)

	Update(ctx context.Context, tx *sql.Tx, dto *dsdto.DsUpdateDto) (datasetId string, err error)
	Delete(ctx context.Context, tx *sql.Tx, dto *dsdto.DsComDto) (err error)

	GetAgentDatasetID(ctx context.Context, req *dsdto.DsUniqDto) (datasetID string, err error)

	iDsIndex
}

type iDsIndex interface {
	GetDsIndexStatus(ctx context.Context, req *dsdto.DsUniqWithDatasetIDDto, isShowFailInfos bool) (info *docindexobj.AgentDocIndexStatusInfo, err error)
	BatchGetDsIndexStatus(ctx context.Context, req *dsdto.BatchCheckIndexStatusReq) (infos []*docindexobj.AgentDocIndexStatusInfo, err error)

	AddIndex(ctx context.Context, dto *dsdto.DsComDto, datasetID string) (err error)
}
