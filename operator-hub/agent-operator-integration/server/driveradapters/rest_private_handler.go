// Package driveradapters 定义驱动适配器
// @file rest_private_handler.go
// @description: 定义rest私有接口适配器
package driveradapters

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/driveradapters/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"github.com/gin-gonic/gin"
)

type restPrivateHandler struct {
	OperatorRestHandler OperatorRestHandler
	ToolBoxRestHandler  ToolBoxRestHandler
	MCPRestHandler      MCPRestHandler
	UpgradeHandler      common.UpgradeHandler
	Logger              interfaces.Logger
}

// NewRestPrivateHandler 创建restHandler实例
func NewRestPrivateHandler() interfaces.HTTPRouterInterface {
	return &restPrivateHandler{
		OperatorRestHandler: NewOperatorRestHandler(),
		ToolBoxRestHandler:  NewToolBoxRestHandler(),
		MCPRestHandler:      NewMCPRestHandler(),
		UpgradeHandler:      common.NewUpgradeHandler(),
		Logger:              config.NewConfigLoader().GetLogger(),
	}
}

// RegisterRouter 内部接口注册路由
func (r *restPrivateHandler) RegisterRouter(engine *gin.RouterGroup) {
	mws := []gin.HandlerFunc{}
	mws = append(mws, middlewareRequestLog(r.Logger), middlewareTrace, middlewareHeaderAuthContext())
	engine.Use(mws...)
	// 算子接口
	r.OperatorRestHandler.RegisterPrivate(engine)
	// 工具箱接口
	r.ToolBoxRestHandler.RegisterPrivate(engine)
	// MCP 相关接口
	r.MCPRestHandler.RegisterPrivate(engine)

	// 临时升级接口 - 仅在从旧版本升级到5.0.0.3时使用
	engine.GET("/upgrade/v5003/migrate-history", r.UpgradeHandler.MigrateHistoryData)
}
