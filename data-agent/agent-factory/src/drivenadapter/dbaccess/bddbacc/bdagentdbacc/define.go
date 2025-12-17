package bdagentdbacc

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
	bizDomainAgentRelRepoOnce sync.Once
	bizDomainAgentRelRepoImpl idbaccess.IBizDomainAgentRelRepo
)

// BizDomainAgentRelRepo 业务域与agent关联表操作实现
type BizDomainAgentRelRepo struct {
	idbaccess.IDBAccBaseRepo

	db     *sqlx.DB
	logger icmp.Logger
}

var _ idbaccess.IBizDomainAgentRelRepo = &BizDomainAgentRelRepo{}

func NewBizDomainAgentRelRepo() idbaccess.IBizDomainAgentRelRepo {
	bizDomainAgentRelRepoOnce.Do(func() {
		bizDomainAgentRelRepoImpl = &BizDomainAgentRelRepo{
			db:             global.GDB,
			logger:         logger.GetLogger(),
			IDBAccBaseRepo: dbaccess.NewDBAccBase(),
		}
	})

	return bizDomainAgentRelRepoImpl
}
