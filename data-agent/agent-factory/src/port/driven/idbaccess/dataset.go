package idbaccess

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
)

//go:generate mockgen -source=./dataset.go -destination ./idbaccessmock/dataset.go -package idbaccessmock
type IDatasetRepo interface {
	IDBAccBaseRepo

	Create(ctx context.Context, tx *sql.Tx, id, hashSha256 string) (err error)

	CreateDatasetObjs(ctx context.Context, tx *sql.Tx, dto *dsdto.DsComDto, datasetId string) (err error)

	GetReusableDataset(ctx context.Context, tx *sql.Tx, dto *dsdto.DsComDto) (datasetId string, isReusable bool, err error)

	DeleteDatasetAndObj(ctx context.Context, tx *sql.Tx, datasetId string) (err error)
}
