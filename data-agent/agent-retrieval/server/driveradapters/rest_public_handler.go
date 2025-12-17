package driveradapters

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/driveradapters/knretrieval"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/interfaces"
	"github.com/gin-gonic/gin"
)

type restPublicHandler struct {
	Hydra              interfaces.Hydra
	KnRetrievalHandler knretrieval.KnRetrievalHandler
	Logger             interfaces.Logger
}

// NewRestPublicHandler 创建restHandler实例
func NewRestPublicHandler(logger interfaces.Logger) interfaces.HTTPRouterInterface {
	return &restPublicHandler{
		Hydra:              drivenadapters.NewHydra(),
		KnRetrievalHandler: knretrieval.NewKnRetrievalHandler(),
		Logger:             logger,
	}
}

// RegisterPublic 注册公共路由
func (r *restPublicHandler) RegisterRouter(engine *gin.RouterGroup) {
	mws := []gin.HandlerFunc{}
	mws = append(mws, middlewareRequestLog(r.Logger), middlewareTrace, middlewareIntrospectVerify(r.Hydra))
	engine.Use(mws...)

	engine.POST("/kn/semantic-search", r.KnRetrievalHandler.SemanticSearch)
}
