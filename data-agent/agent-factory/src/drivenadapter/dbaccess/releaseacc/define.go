package releaseacc

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/spacedb/spaceresourcedbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"

	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-rds-sdk-go/sqlx"
)

var (
	releaseRepoOnce sync.Once
	releaseRepoImpl idbaccess.IReleaseRepo
)

type releaseRepo struct {
	idbaccess.IDBAccBaseRepo

	db     *sqlx.DB
	logger icmp.Logger

	spaceResourceRepo idbaccess.ISpaceResourceRepo
}

var _ idbaccess.IReleaseRepo = &releaseRepo{}

func NewReleaseRepo() idbaccess.IReleaseRepo {
	releaseRepoOnce.Do(func() {
		releaseRepoImpl = &releaseRepo{
			db:                global.GDB,
			logger:            logger.GetLogger(),
			IDBAccBaseRepo:    dbaccess.NewDBAccBase(),
			spaceResourceRepo: spaceresourcedbacc.NewSpaceResourceRepo(),
		}
	})

	return releaseRepoImpl
}
