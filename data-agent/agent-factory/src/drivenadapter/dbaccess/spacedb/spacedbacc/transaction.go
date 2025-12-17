package spacedbacc

import (
	"context"
	"database/sql"
)

// BeginTx 开启事务
func (repo *SpaceRepo) BeginTx(ctx context.Context) (tx *sql.Tx, err error) {
	tx, err = repo.db.BeginTx(ctx, nil)
	return
}
