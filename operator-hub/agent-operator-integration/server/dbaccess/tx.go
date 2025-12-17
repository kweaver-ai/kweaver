package dbaccess

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/db"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-rds-sdk-go/sqlx"
)

type baseTx struct {
	dbPool *sqlx.DB
}

func NewBaseTx() model.DBTx {
	return &baseTx{
		dbPool: db.NewDBPool(),
	}
}

func (b *baseTx) GetTx(ctx context.Context) (*sql.Tx, error) {
	return b.dbPool.BeginTx(ctx, nil)
}
