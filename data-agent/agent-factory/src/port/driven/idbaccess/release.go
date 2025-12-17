package idbaccess

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/square/squarereq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/comvalobj"
)

//go:generate mockgen -source=./release.go -destination ./idbaccessmock/release.go -package idbaccessmock
type IReleaseRepo interface {
	IDBAccBaseRepo
	Create(ctx context.Context, tx *sql.Tx, po *dapo.ReleasePO) (id string, err error)
	Update(ctx context.Context, tx *sql.Tx, po *dapo.ReleasePO) (err error)

	ListRecentAgentForMarket(ctx context.Context, req squarereq.AgentSquareRecentAgentReq) (rt []*dapo.RecentVisitAgentPO, err error)

	GetByAgentID(ctx context.Context, agentID string) (rt *dapo.ReleasePO, err error)
	GetMapByAgentIDs(ctx context.Context, agentIDS []string) (rt map[string]*dapo.ReleasePO, err error)
	GetMapByUniqFlags(ctx context.Context, uniqFlags []*comvalobj.DataAgentUniqFlag) (m map[string]*dapo.ReleasePO, err error)
	DeleteByAgentID(ctx context.Context, tx *sql.Tx, agentID string) (err error)
}

type IReleaseHistoryRepo interface {
	IDBAccBaseRepo
	Create(ctx context.Context, tx *sql.Tx, po *dapo.ReleaseHistoryPO) (id string, err error)
	ListByAgentID(ctx context.Context, agentID string) (rt []*dapo.ReleaseHistoryPO, total int64, err error)
	GetLatestVersionByAgentID(ctx context.Context, agentID string) (rt *dapo.ReleaseHistoryPO, err error)
	GetByAgentIdVersion(ctx context.Context, agentID string, version string) (rt *dapo.ReleaseHistoryPO, err error)
}

type IReleaseCategoryRelRepo interface {
	IDBAccBaseRepo
	Create(ctx context.Context, tx *sql.Tx, po *dapo.ReleaseCategoryRelPO) (err error)

	BatchCreate(ctx context.Context, tx *sql.Tx, pos []*dapo.ReleaseCategoryRelPO) (err error)

	GetByReleaseID(ctx context.Context, release string) (rt []*dapo.ReleaseCategoryRelPO, err error)
	GetByCategoryID(ctx context.Context, categoryID string) (rt []*dapo.ReleaseCategoryRelPO, err error)
	DelByReleaseID(ctx context.Context, tx *sql.Tx, release string) (err error)
}

type IReleasePermissionRepo interface {
	IDBAccBaseRepo
	Create(ctx context.Context, tx *sql.Tx, po *dapo.ReleasePermissionPO) (err error)
	BatchCreate(ctx context.Context, tx *sql.Tx, pos []*dapo.ReleasePermissionPO) (err error)

	GetByReleaseID(ctx context.Context, release string) (rt []*dapo.ReleasePermissionPO, err error)
	DelByReleaseID(ctx context.Context, tx *sql.Tx, release string) (err error)
}

type IConversationHistoryRepo interface {
	GetLatestVisitAgentIds(ctx context.Context, userId string) (rt []*dapo.ConversationHistoryLatestVisitAgentPO, err error)
}
