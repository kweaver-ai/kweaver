package idbaccess

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/spacevo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
)

//go:generate mockgen -source=./space_member_repo.go -destination ./idbaccessmock/space_member_repo.go -package idbaccessmock

// ISpaceMemberRepo 空间成员仓库接口
type ISpaceMemberRepo interface {
	IDBAccBaseRepo

	BatchCreate(ctx context.Context, tx *sql.Tx, pos []*dapo.SpaceMemberPo) (err error)
	Delete(ctx context.Context, tx *sql.Tx, id int64) (err error)
	DeleteBySpaceID(ctx context.Context, tx *sql.Tx, spaceID string) (err error)

	ExistsBySpaceIDAndObjTypeAndObjIDs(ctx context.Context, spaceID string, members []*spacevo.MemberUniq) (exists []*spacevo.MemberUniq, err error)
	IsMemberExist(ctx context.Context, spaceID string, members []*spacevo.MemberUniq) (exists bool, err error)

	GetByID(ctx context.Context, id int64) (po *dapo.SpaceMemberPo, err error)

	GetBySpaceIDAndObjTypeAndObjIDs(ctx context.Context, tx *sql.Tx, spaceID string, members []*spacevo.MemberUniq) (assocs []*spacevo.MemberAssoc, err error)

	List(ctx context.Context, spaceID string, req *common.PageByLastIntID) (rt []*dapo.SpaceMemberPo, err error)
}
