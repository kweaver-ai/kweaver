// Package driveradapters 定义驱动适配器
// @file rest_private_handler.go
// @description: 定义rest私有接口适配器
package driveradapters

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/driveradapters/demo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/driveradapters/mcp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"github.com/gin-gonic/gin"
)

type restPrivateHandler struct {
	DemoHandler demo.DocumentOperatorHandler
	MCPHandler  mcp.MCPHandler
	Logger      interfaces.Logger
}

// NewRestPrivateHandler 创建restHandler实例
func NewRestPrivateHandler(logger interfaces.Logger) interfaces.HTTPRouterInterface {
	return &restPrivateHandler{
		DemoHandler: demo.NewDocumentOperatorHandler(logger),
		MCPHandler:  mcp.NewMCPHandler(),
		Logger:      logger,
	}
}

// RegisterRouter 注册路由
func (r *restPrivateHandler) RegisterRouter(engine *gin.RouterGroup) {
	mws := []gin.HandlerFunc{}
	mws = append(mws, middlewareRequestLog(r.Logger), middlewareHeaderAuthContext())
	engine.Use(mws...)

	// 注册demo相关接口
	// POST /api/agent-operator-app/internal-v1/demo/document/bulk_index
	engine.POST("/demo/document/bulk_index", r.DemoHandler.BulkIndex)
	// POST /api/agent-operator-app/internal-v1/demo/document/search
	engine.POST("/demo/document/search", r.DemoHandler.Search)

	// mcp实例相关接口
	mcpGroup := engine.Group("/mcp/instance")
	mcpGroup.POST("/create", r.MCPHandler.CreateMCPInstance)
	mcpGroup.PUT("/update/:mcp_id/:version", r.MCPHandler.UpdateMCPInstance)
	mcpGroup.DELETE("/remove/:mcp_id/:version", r.MCPHandler.DeleteMCPInstance)

	// mcp app相关接口
	mcpAppGroup := engine.Group("/mcp/app")
	mcpAppGroup.Any("/:mcp_id/:version/stream", r.MCPHandler.StreamHandler)
	mcpAppGroup.GET("/:mcp_id/:version/sse", r.MCPHandler.SSEHandler)
	mcpAppGroup.POST("/:mcp_id/:version/message", r.MCPHandler.MessageHandler)
}
