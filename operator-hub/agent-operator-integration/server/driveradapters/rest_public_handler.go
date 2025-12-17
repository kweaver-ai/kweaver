// Package driveradapters 定义驱动适配器
// @file rest_public_handler.go
// @description: 定义rest公共适配器
package driveradapters

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/driveradapters/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"github.com/gin-gonic/gin"
)

type restPublicHandler struct {
	Hydra               interfaces.Hydra
	OperatorRestHandler OperatorRestHandler
	ToolBoxRestHandler  ToolBoxRestHandler
	MCPRestHandler      MCPRestHandler
	ImpexHandler        common.ImpexHandler
	Logger              interfaces.Logger
}

// NewRestPublicHandler 创建restHandler实例
func NewRestPublicHandler() interfaces.HTTPRouterInterface {
	return &restPublicHandler{
		Hydra:               drivenadapters.NewHydra(),
		OperatorRestHandler: NewOperatorRestHandler(),
		ToolBoxRestHandler:  NewToolBoxRestHandler(),
		MCPRestHandler:      NewMCPRestHandler(),
		ImpexHandler:        common.NewImpexHandler(),
		Logger:              config.NewConfigLoader().GetLogger(),
	}
}

// RegisterPublic 注册公共路由
func (r *restPublicHandler) RegisterRouter(engine *gin.RouterGroup) {
	mws := []gin.HandlerFunc{}
	mws = append(mws, middlewareRequestLog(r.Logger), middlewareTrace, middlewareIntrospectVerify(r.Hydra))
	engine.Use(mws...)
	// 算子注册相关接口
	r.OperatorRestHandler.RegisterPublic(engine)
	// 工具箱相关接口
	r.ToolBoxRestHandler.RegisterPublic(engine)
	// MCP 相关接口
	r.MCPRestHandler.RegisterPublic(engine)
	// 导入导出
	engine.GET("/impex/export/:type/:id", r.ImpexHandler.Export)
	engine.POST("/impex/import/:type", middlewareBusinessDomain(true, false), r.ImpexHandler.Import)
}
