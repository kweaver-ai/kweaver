package bdagenttpldbacc

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
	bizDomainAgentTplRelRepoOnce sync.Once
	bizDomainAgentTplRelRepoImpl idbaccess.IBizDomainAgentTplRelRepo
)

// BizDomainAgentTplRelRepo 业务域与agent模板关联表操作实现
type BizDomainAgentTplRelRepo struct {
	idbaccess.IDBAccBaseRepo

	db     *sqlx.DB
	logger icmp.Logger
}

var _ idbaccess.IBizDomainAgentTplRelRepo = &BizDomainAgentTplRelRepo{}

func NewBizDomainAgentTplRelRepo() idbaccess.IBizDomainAgentTplRelRepo {
	bizDomainAgentTplRelRepoOnce.Do(func() {
		bizDomainAgentTplRelRepoImpl = &BizDomainAgentTplRelRepo{
			db:             global.GDB,
			logger:         logger.GetLogger(),
			IDBAccBaseRepo: dbaccess.NewDBAccBase(),
		}
	})

	return bizDomainAgentTplRelRepoImpl
}
