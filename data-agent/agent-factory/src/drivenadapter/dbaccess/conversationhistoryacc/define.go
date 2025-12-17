package conversationhistoryacc

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
	conversationHistoryRepoOnce sync.Once
	conversationHistoryRepoImpl idbaccess.IConversationHistoryRepo
)

type conversationHistoryRepo struct {
	*drivenadapter.RepoBase

	db     *sqlx.DB
	logger icmp.Logger
}

// GetLatestVersionByAgentId implements idbaccess.ReleaseHistoryRepo.

var _ idbaccess.IConversationHistoryRepo = &conversationHistoryRepo{}

func NewConversationHistoryRepo() idbaccess.IConversationHistoryRepo {
	conversationHistoryRepoOnce.Do(func() {
		conversationHistoryRepoImpl = &conversationHistoryRepo{
			db:       global.GDB,
			logger:   logger.GetLogger(),
			RepoBase: drivenadapter.NewRepoBase(),
		}
	})

	return conversationHistoryRepoImpl
}
