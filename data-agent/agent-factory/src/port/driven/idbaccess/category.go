package idbaccess

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
)

//go:generate mockgen -source=./category.go -destination ./idbaccessmock/category.go -package idbaccessmock
type ICategoryRepo interface {
	GetByReleaseId(ctx context.Context, releaaseId string) (rt []*dapo.CategoryPO, err error)
	List(ctx context.Context, req interface{}) (rt []*dapo.CategoryPO, err error)

	GetIDNameMap(ctx context.Context, ids []string) (m map[string]string, err error)
}
