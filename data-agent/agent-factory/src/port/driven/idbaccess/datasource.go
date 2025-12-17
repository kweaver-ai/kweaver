package idbaccess

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
)

//go:generate mockgen -source=./datasource.go -destination ./idbaccessmock/datasource.go -package idbaccessmock
type IDsRepo interface {
	Create(ctx context.Context, tx *sql.Tx, dto *dsdto.DsUniqDto, datasetId string) (id string, err error)

	Delete(ctx context.Context, tx *sql.Tx, dto *dsdto.DsRepoDeleteDto) (err error)

	GetByAgentIDAgentVersion(ctx context.Context, agentID, agentVersion string) (po *dapo.DsDataSetAssocPo, err error)
	GetOneByIndexKey(ctx context.Context, indexKey string) (po *dapo.DsDataSetAssocPo, err error)

	GetAssocInfoAndIsOtherUsed(ctx context.Context, agentID, agentVersion string) (datasetID string, isAssocExists bool, isOtherUsed bool, err error)

	GetListByAgentID(ctx context.Context, agentID string) (list []*dapo.DsDataSetAssocPo, err error)
}
