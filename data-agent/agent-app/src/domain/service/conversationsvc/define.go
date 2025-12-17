package conversationsvc

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iagentexecutorhttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iagentfactoryhttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driver/iportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iusermanagementacc"
)

type conversationSvc struct {
	*service.SvcBase
	logger              icmp.Logger
	conversationRepo    idbaccess.IConversationRepo
	conversationMsgRepo idbaccess.IConversationMsgRepo
	tempAreaRepo        idbaccess.ITempAreaRepo
	agentExecutor       iagentexecutorhttp.IAgentExecutor
	agentFactory        iagentfactoryhttp.IAgentFactory
}

var _ iportdriver.IConversationSvc = &conversationSvc{}

type NewConversationSvcDto struct {
	SvcBase             *service.SvcBase
	ConversationRepo    idbaccess.IConversationRepo
	ConversationMsgRepo idbaccess.IConversationMsgRepo
	Logger              icmp.Logger
	OpenAICmp           icmp.IOpenAI
	UmHttp              iusermanagementacc.UserMgnt
	TempAreaRepo        idbaccess.ITempAreaRepo
	AgentExecutor       iagentexecutorhttp.IAgentExecutor
	AgentFactory        iagentfactoryhttp.IAgentFactory
}

func NewConversationService(dto *NewConversationSvcDto) iportdriver.IConversationSvc {
	impl := &conversationSvc{
		SvcBase:             dto.SvcBase,
		conversationRepo:    dto.ConversationRepo,
		conversationMsgRepo: dto.ConversationMsgRepo,
		logger:              dto.Logger,
		tempAreaRepo:        dto.TempAreaRepo,
		agentExecutor:       dto.AgentExecutor,
		agentFactory:        dto.AgentFactory,
	}

	return impl
}
