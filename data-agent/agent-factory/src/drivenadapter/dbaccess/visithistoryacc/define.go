package visithistoryacc

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"

	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-rds-sdk-go/sqlx"
)

var (
	visitHistoryRepoOnce sync.Once
	visitHistoryRepoImpl idbaccess.IVisitHistoryRepo
)

type visitHistoryRepo struct {
	*drivenadapter.RepoBase

	db     *sqlx.DB
	logger icmp.Logger
}

var _ idbaccess.IVisitHistoryRepo = &visitHistoryRepo{}

func NewVisitHistoryRepo() idbaccess.IVisitHistoryRepo {
	visitHistoryRepoOnce.Do(func() {
		visitHistoryRepoImpl = &visitHistoryRepo{
			db:       global.GDB,
			logger:   logger.GetLogger(),
			RepoBase: drivenadapter.NewRepoBase(),
		}
	})

	return visitHistoryRepoImpl
}
