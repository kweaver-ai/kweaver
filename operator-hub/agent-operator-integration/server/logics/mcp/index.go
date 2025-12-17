// Package mcp 实现MCP Server操作接口
// @file index.go 初始化
// @description: 实现MCP Server操作管理
package mcp

import (
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
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/toolbox"
)

var (
	mOnce      sync.Once
	mcpService interfaces.IMCPService
)

type mcpServiceImpl struct {
	logger                    interfaces.Logger
	DBTx                      model.DBTx
	DBMCPServerConfig         model.DBMCPServerConfig
	DBMCPServerRelease        model.DBMCPServerRelease
	DBMCPServerReleaseHistory model.DBMCPServerReleaseHistory
	DBMCPTool                 model.DBMCPTool
	IntCompConfigService      interfaces.IIntCompConfigService
	UserMgnt                  interfaces.UserManagement
	Validator                 interfaces.Validator
	CategoryManager           interfaces.CategoryManager
	AuthService               interfaces.IAuthorizationService
	ToolService               interfaces.IToolService
	AuditLog                  interfaces.LogModelOperator[*metric.AuditLogBuilderParams]
	AgentOperatorApp          interfaces.AgentOperatorApp
	BusinessDomainService     interfaces.IBusinessDomainService
}

// NewMCPServiceImpl 初始化MCP服务
func NewMCPServiceImpl() interfaces.IMCPService {
	mOnce.Do(func() {
		mcpService = &mcpServiceImpl{
			logger:                    config.NewConfigLoader().GetLogger(),
			DBTx:                      dbaccess.NewBaseTx(),
			DBMCPServerConfig:         dbaccess.NewMCPServerConfigDBSingleton(),
			DBMCPServerRelease:        dbaccess.NewMCPServerReleaseDBSingleton(),
			DBMCPServerReleaseHistory: dbaccess.NewMCPServerReleaseHistoryDBSingleton(),
			DBMCPTool:                 dbaccess.NewMCPToolDBSingleton(),
			IntCompConfigService:      intcomp.NewIntCompConfigService(),
			UserMgnt:                  drivenadapters.NewUserManagementClient(),
			Validator:                 validator.NewValidator(),
			CategoryManager:           category.NewCategoryManager(),
			AuthService:               auth.NewAuthServiceImpl(),
			ToolService:               toolbox.NewToolServiceImpl(),
			AuditLog:                  metric.NewAuditLogBuilder(),
			AgentOperatorApp:          drivenadapters.NewAgentOperatorApp(),
			BusinessDomainService:     business_domain.NewBusinessDomainService(),
		}
	})
	return mcpService
}
