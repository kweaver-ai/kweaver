package dsdbacc

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/datasetdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"

	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-rds-sdk-go/sqlx"
)

var (
	dsRepoOnce sync.Once
	dsRepoImpl idbaccess.IDsRepo
)

type DsRepo struct {
	*drivenadapter.RepoBase

	db *sqlx.DB

	logger icmp.Logger

	datasetRepo idbaccess.IDatasetRepo
}

var _ idbaccess.IDsRepo = &DsRepo{}

func NewDsRepo() idbaccess.IDsRepo {
	dsRepoOnce.Do(func() {
		dsRepoImpl = &DsRepo{
			db:          global.GDB,
			logger:      logger.GetLogger(),
			RepoBase:    drivenadapter.NewRepoBase(),
			datasetRepo: datasetdbacc.NewDatasetRepo(),
		}
	})

	return dsRepoImpl
}
