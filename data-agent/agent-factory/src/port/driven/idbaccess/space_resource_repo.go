package idbaccess

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/spacevo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/spacedb/spaceresourcedbacc/srdbarg"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
)

//go:generate mockgen -source=./space_resource_repo.go -destination ./idbaccessmock/space_resource_repo.go -package idbaccessmock

// ISpaceResourceRepo 空间资源仓库接口
type ISpaceResourceRepo interface {
	IDBAccBaseRepo

	BatchCreate(ctx context.Context, tx *sql.Tx, pos []*dapo.SpaceResourcePo) (err error)

	Delete(ctx context.Context, tx *sql.Tx, id int64) (err error)
	DeleteBySpaceID(ctx context.Context, tx *sql.Tx, spaceID string) (err error)
	DeleteByAgentID(ctx context.Context, tx *sql.Tx, agentID string) (err error)

	ExistsBySpaceIDAndResourceTypeAndResourceIDs(ctx context.Context, spaceID string, resources []*spacevo.ResourceUniq) (exists []*spacevo.ResourceUniq, err error)

	GetByID(ctx context.Context, id int64) (po *dapo.SpaceResourcePo, err error)

	GetBySpaceIDAndResourceTypeAndResourceIDs(ctx context.Context, tx *sql.Tx, spaceID string, resources []*spacevo.ResourceUniq) (assocs []*spacevo.ResourceAssoc, err error)

	GetBySpaceIDAndResourceTypeAndResourceID(ctx context.Context, tx *sql.Tx, spaceID string, resourceType cdaenum.ResourceType, resourceID string) (po *dapo.SpaceResourcePo, err error)

	List(ctx context.Context, arg *srdbarg.GetSRListArg) (pos []*dapo.SpaceResourcePo, err error)
}
