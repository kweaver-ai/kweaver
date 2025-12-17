// Package operator 实现算子操作接口
// @file index.go 初始化
// @description: 实现算子操作管理
package operator

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/dbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/mq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/validator"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/auth"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/business_domain"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/category"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/intcomp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/metric"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/parsers"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/proxy"
)

type operatorManager struct {
	Logger                interfaces.Logger
	DBOperatorManager     model.IOperatorRegisterDB
	DBAPIMetadataManager  model.IAPIMetadataDB
	DBTx                  model.DBTx
	CategoryManager       interfaces.CategoryManager
	UserMgnt              interfaces.UserManagement
	Validator             interfaces.Validator
	OpenAPIParser         interfaces.IOpenAPIParser
	Proxy                 interfaces.ProxyHandler
	OpReleaseDB           model.IOperatorReleaseDB
	OpReleaseHistoryDB    model.IOperatorReleaseHistoryDB
	IntCompConfigSvc      interfaces.IIntCompConfigService
	AuthService           interfaces.IAuthorizationService
	AuditLog              interfaces.LogModelOperator[*metric.AuditLogBuilderParams]
	FlowAutomation        interfaces.FlowAutomation
	MQClient              mq.MQClient
	BusinessDomainService interfaces.IBusinessDomainService
}

var (
	once sync.Once
	om   interfaces.OperatorManager
)

// NewOperatorManager 算子操作接口
func NewOperatorManager() interfaces.OperatorManager {
	once.Do(func() {
		conf := config.NewConfigLoader()
		om = &operatorManager{
			Logger:                conf.GetLogger(),
			DBOperatorManager:     dbaccess.NewOperatorManagerDB(),
			DBAPIMetadataManager:  dbaccess.NewAPIMetadataDB(),
			DBTx:                  dbaccess.NewBaseTx(),
			CategoryManager:       category.NewCategoryManager(),
			UserMgnt:              drivenadapters.NewUserManagementClient(),
			Validator:             validator.NewValidator(),
			OpenAPIParser:         parsers.NewOpenAPIParser(),
			Proxy:                 proxy.NewProxyServer(),
			OpReleaseDB:           dbaccess.NewOperatorReleaseDB(),
			OpReleaseHistoryDB:    dbaccess.NewOperatorReleaseHistoryDB(),
			IntCompConfigSvc:      intcomp.NewIntCompConfigService(),
			AuthService:           auth.NewAuthServiceImpl(),
			AuditLog:              metric.NewAuditLogBuilder(),
			FlowAutomation:        drivenadapters.NewFlowAutomationClient(),
			MQClient:              mq.NewMQClient(),
			BusinessDomainService: business_domain.NewBusinessDomainService(),
		}
	})
	return om
}
