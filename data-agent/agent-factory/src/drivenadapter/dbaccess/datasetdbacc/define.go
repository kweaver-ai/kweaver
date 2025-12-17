package datasetdbacc

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

var (
	datasetRepoOnce sync.Once
	datasetRepoImpl idbaccess.IDatasetRepo
)

type DatasetRepo struct {
	idbaccess.IDBAccBaseRepo

	logger icmp.Logger
}

var _ idbaccess.IDatasetRepo = &DatasetRepo{}

func NewDatasetRepo() idbaccess.IDatasetRepo {
	datasetRepoOnce.Do(func() {
		datasetRepoImpl = &DatasetRepo{
			logger:         logger.GetLogger(),
			IDBAccBaseRepo: dbaccess.NewDBAccBase(),
		}
	})

	return datasetRepoImpl
}
