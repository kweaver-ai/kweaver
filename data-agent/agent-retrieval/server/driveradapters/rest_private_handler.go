// Package driveradapters 定义驱动适配器
// @file rest_private_handler.go
// @description: 定义rest私有接口适配器
package driveradapters

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/driveradapters/knretrieval"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/interfaces"
	"github.com/gin-gonic/gin"
)

type restPrivateHandler struct {
	KnRetrievalHandler knretrieval.KnRetrievalHandler
	Logger             interfaces.Logger
}

// NewRestPrivateHandler 创建restHandler实例
func NewRestPrivateHandler(logger interfaces.Logger) interfaces.HTTPRouterInterface {
	return &restPrivateHandler{
		KnRetrievalHandler: knretrieval.NewKnRetrievalHandler(),
		Logger:             logger,
	}
}

// RegisterRouter 注册路由
func (r *restPrivateHandler) RegisterRouter(engine *gin.RouterGroup) {
	mws := []gin.HandlerFunc{}
	mws = append(mws, middlewareRequestLog(r.Logger), middlewareTrace, middlewareHeaderAuthContext())
	engine.Use(mws...)

	engine.POST("/kn/semantic-search", r.KnRetrievalHandler.SemanticSearch)
}
