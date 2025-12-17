package spaceresourcedbacc

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
	spaceResourceRepoOnce sync.Once
	spaceResourceRepoImpl idbaccess.ISpaceResourceRepo
)

// SpaceResourceRepo 空间资源仓库实现
type SpaceResourceRepo struct {
	idbaccess.IDBAccBaseRepo

	db *sqlx.DB

	logger icmp.Logger
}

var _ idbaccess.ISpaceResourceRepo = &SpaceResourceRepo{}

func NewSpaceResourceRepo() idbaccess.ISpaceResourceRepo {
	spaceResourceRepoOnce.Do(func() {
		spaceResourceRepoImpl = &SpaceResourceRepo{
			db:             global.GDB,
			logger:         logger.GetLogger(),
			IDBAccBaseRepo: dbaccess.NewDBAccBase(),
		}
	})

	return spaceResourceRepoImpl
}
