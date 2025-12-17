package spacememdbacc

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"

	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-rds-sdk-go/sqlx"
)

var (
	spaceMemberRepoOnce sync.Once
	spaceMemberRepoImpl idbaccess.ISpaceMemberRepo
)

// SpaceMemberRepo 空间成员仓库实现
type SpaceMemberRepo struct {
	idbaccess.IDBAccBaseRepo

	db *sqlx.DB

	logger icmp.Logger
}

var _ idbaccess.ISpaceMemberRepo = &SpaceMemberRepo{}

func NewSpaceMemberRepo() idbaccess.ISpaceMemberRepo {
	spaceMemberRepoOnce.Do(func() {
		spaceMemberRepoImpl = &SpaceMemberRepo{
			db:             global.GDB,
			logger:         logger.GetLogger(),
			IDBAccBaseRepo: dbaccess.NewDBAccBase(),
		}
	})

	return spaceMemberRepoImpl
}
