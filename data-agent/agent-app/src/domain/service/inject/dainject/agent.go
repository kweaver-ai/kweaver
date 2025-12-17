package dainject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/service/agentsvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/dbaccess/conversationdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/dbaccess/conversationmsgdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/dbaccess/tempareadbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/httpinject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driver/iportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

var (
	agentSvcOnce sync.Once
	agentSvcImpl iportdriver.IAgent
)

func NewAgentSvc() iportdriver.IAgent {
	agentSvcOnce.Do(func() {
		dto := &agentsvc.NewAgentSvcDto{
			SvcBase:             service.NewSvcBase(),
			Logger:              logger.GetLogger(),
			AgentFactory:        httpinject.NewAgentFactoryHttpAcc(),
			AgentExecutor:       httpinject.NewAgentExecutorHttpAcc(),
			ConversationSvc:     NewConversationSvc(),
			ConversationRepo:    conversationdbacc.NewConversationRepo(),
			ConversationMsgRepo: conversationmsgdbacc.NewConversationMsgRepo(),
			Efast:               httpinject.NewEfastHttpAcc(),

			Text2Vec:     agentsvc.NewText2Vec(),
			TempAreaRepo: tempareadbacc.NewTempAreaRepo(),
			Docset:       httpinject.NewDocsetHttpAcc(),
			//NOTE: streamDiffFrequency must be greater than 0
			StreamDiffFrequency: max(global.GConfig.StreamDiffFrequency, 1),
		}

		agentSvcImpl = agentsvc.NewAgentSvc(dto)
	})

	return agentSvcImpl
}
