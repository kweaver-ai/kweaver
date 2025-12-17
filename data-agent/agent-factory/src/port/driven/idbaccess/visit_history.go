package idbaccess

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
)

//go:generate mockgen -source=./release.go -destination ./idbaccessmock/release.go -package idbaccessmock
type IVisitHistoryRepo interface {
	IncVisitCount(ctx context.Context, po *dapo.VisitHistoryPO) (err error)
}
