package driveradapters

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/driveradapters/demo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"github.com/gin-gonic/gin"
)

type restPublicHandler struct {
	Hydra       interfaces.Hydra
	DemoHandler demo.DocumentOperatorHandler
	Logger      interfaces.Logger
}

// NewRestPublicHandler 创建restHandler实例
func NewRestPublicHandler(logger interfaces.Logger) interfaces.HTTPRouterInterface {
	return &restPublicHandler{
		Hydra:       drivenadapters.NewHydra(),
		DemoHandler: demo.NewDocumentOperatorHandler(logger),
		Logger:      logger,
	}
}

// RegisterPublic 注册公共路由
func (r *restPublicHandler) RegisterRouter(engine *gin.RouterGroup) {
	// middleware.TracingMiddleware()
	mws := []gin.HandlerFunc{}
	mws = append(mws, middlewareRequestLog(r.Logger), middlewareIntrospectVerify(r.Hydra))
	engine.Use(mws...)
	// POST /api/agent-operator-app/v1/demo/document/bulk_index
	engine.POST("/demo/document/bulk_index", r.DemoHandler.BulkIndex)
	// POST /api/agent-operator-app/v1/demo/document/search
	engine.POST("/demo/document/search", r.DemoHandler.Search)
}
