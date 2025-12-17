package auth

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/mq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
)

type authServiceImpl struct {
	logger         interfaces.Logger
	authorization  interfaces.Authorization
	mqClient       mq.MQClient
	userManagement interfaces.UserManagement
}

func NewAuthServiceImpl() interfaces.IAuthorizationService {
	return &authServiceImpl{
		logger:         config.NewConfigLoader().GetLogger(),
		authorization:  drivenadapters.NewAuthorization(),
		mqClient:       mq.NewMQClient(),
		userManagement: drivenadapters.NewUserManagementClient(),
	}
}
