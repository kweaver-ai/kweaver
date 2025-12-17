package dbaccess

import (
	"context"
	"database/sql"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-rds-sdk-go/sqlx"
)

var (
	baseRepoOnce sync.Once
	baseRepoImpl idbaccess.IDBAccBaseRepo
)

var _ idbaccess.IDBAccBaseRepo = &DBAccBase{}

type DBAccBase struct {
	db *sqlx.DB
}

func NewDBAccBase() idbaccess.IDBAccBaseRepo {
	baseRepoOnce.Do(func() {
		db := global.GDB
		baseRepoImpl = &DBAccBase{
			db: db,
		}
	})

	return baseRepoImpl
}

func (r *DBAccBase) BeginTx(ctx context.Context) (*sql.Tx, error) {
	return r.db.BeginTx(ctx, nil)
}

func (r *DBAccBase) GetDB() *sqlx.DB {
	return r.db
}
