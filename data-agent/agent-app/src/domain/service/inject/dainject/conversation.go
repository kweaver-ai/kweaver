package dainject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/service/conversationsvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/dbaccess/conversationdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/dbaccess/conversationmsgdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/dbaccess/tempareadbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/httpinject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driver/iportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

var (
	conversationSvcOnce sync.Once
	conversationSvcImpl iportdriver.IConversationSvc
)

func NewConversationSvc() iportdriver.IConversationSvc {
	conversationSvcOnce.Do(func() {
		dto := &conversationsvc.NewConversationSvcDto{
			SvcBase:             service.NewSvcBase(),
			ConversationRepo:    conversationdbacc.NewConversationRepo(),
			ConversationMsgRepo: conversationmsgdbacc.NewConversationMsgRepo(),
			TempAreaRepo:        tempareadbacc.NewTempAreaRepo(),
			Logger:              logger.GetLogger(),
			AgentExecutor:       httpinject.NewAgentExecutorHttpAcc(),
			AgentFactory:        httpinject.NewAgentFactoryHttpAcc(),
		}
		conversationSvcImpl = conversationsvc.NewConversationService(dto)
	})

	return conversationSvcImpl
}
