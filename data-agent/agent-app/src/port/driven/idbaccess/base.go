package idbaccess

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-rds-sdk-go/sqlx"
)

type IDBAccBaseRepo interface {
	BeginTx(ctx context.Context) (*sql.Tx, error)

	GetDB() *sqlx.DB
}
