// Package toolbox 工具箱、工具管理
// @file index.go
// @description: 实现工具箱、工具管理接口
package toolbox

import (
	"fmt"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/dbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/validator"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/auth"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/business_domain"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/category"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/intcomp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/metric"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/operator"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/parsers"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/proxy"
)

var (
	tOnce       sync.Once
	toolService interfaces.IToolService

	validatorMethodPath = func(method, path string) string {
		return fmt.Sprintf("%s:%s", method, path)
	}
)

// ToolServiceImpl 工具箱
type ToolServiceImpl struct {
	DBTx             model.DBTx
	ToolBoxDB        model.IToolboxDB
	ToolDB           model.IToolDB
	MetadataDB       model.IAPIMetadataDB
	Proxy            interfaces.ProxyHandler
	CategoryManager  interfaces.CategoryManager
	Logger           interfaces.Logger
	UserMgnt         interfaces.UserManagement
	Validator        interfaces.Validator
	OpenAPIParser    interfaces.IOpenAPIParser
	OperatorMgnt     interfaces.OperatorManager
	IntCompConfigSvc interfaces.IIntCompConfigService
	AuthService      interfaces.IAuthorizationService
	AuditLog         interfaces.LogModelOperator[*metric.AuditLogBuilderParams]
	// BaseService      *infrastructure.BaseServiceImpl
	BusinessDomainService interfaces.IBusinessDomainService
}

// NewToolServiceImpl 创建工具箱服务
func NewToolServiceImpl() interfaces.IToolService {
	tOnce.Do(func() {
		conf := config.NewConfigLoader()
		toolService = &ToolServiceImpl{
			DBTx:             dbaccess.NewBaseTx(),
			MetadataDB:       dbaccess.NewAPIMetadataDB(),
			ToolBoxDB:        dbaccess.NewToolboxDB(),
			ToolDB:           dbaccess.NewToolDB(),
			Proxy:            proxy.NewProxyServer(),
			Logger:           conf.GetLogger(),
			UserMgnt:         drivenadapters.NewUserManagementClient(),
			Validator:        validator.NewValidator(),
			CategoryManager:  category.NewCategoryManager(),
			OpenAPIParser:    parsers.NewOpenAPIParser(),
			OperatorMgnt:     operator.NewOperatorManager(),
			IntCompConfigSvc: intcomp.NewIntCompConfigService(),
			AuthService:      auth.NewAuthServiceImpl(),
			AuditLog:         metric.NewAuditLogBuilder(),
			// BaseService:      infrastructure.NewBaseServiceImpl(),
			BusinessDomainService: business_domain.NewBusinessDomainService(),
		}
	})
	return toolService
}
