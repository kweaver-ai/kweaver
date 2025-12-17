package tempareadbacc

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/dbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"

	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-rds-sdk-go/sqlx"
)

var (
	tempAreaRepoOnce sync.Once
	tempAreaRepoImpl idbaccess.ITempAreaRepo
)

type TempAreaRepo struct {
	idbaccess.IDBAccBaseRepo

	db *sqlx.DB

	logger icmp.Logger
}

var _ idbaccess.ITempAreaRepo = &TempAreaRepo{}

func NewTempAreaRepo() idbaccess.ITempAreaRepo {
	tempAreaRepoOnce.Do(func() {
		tempAreaRepoImpl = &TempAreaRepo{
			db:             global.GDB,
			logger:         logger.GetLogger(),
			IDBAccBaseRepo: dbaccess.NewDBAccBase(),
		}
	})

	return tempAreaRepoImpl
}
