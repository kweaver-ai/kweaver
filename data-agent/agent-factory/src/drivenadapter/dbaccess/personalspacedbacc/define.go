package personalspacedbacc

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
	pubedAgentRepoOnce sync.Once
	pubedAgentRepoImpl idbaccess.IPersonalSpaceRepo
)

type personalSpaceRepo struct {
	idbaccess.IDBAccBaseRepo

	db *sqlx.DB

	logger icmp.Logger
}

var _ idbaccess.IPersonalSpaceRepo = &personalSpaceRepo{}

func NewPersonalSpaceRepo() idbaccess.IPersonalSpaceRepo {
	pubedAgentRepoOnce.Do(func() {
		pubedAgentRepoImpl = &personalSpaceRepo{
			db:             global.GDB,
			logger:         logger.GetLogger(),
			IDBAccBaseRepo: dbaccess.NewDBAccBase(),
		}
	})

	return pubedAgentRepoImpl
}
