package squarehandler

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/squaresvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/ihandlerportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"

	"github.com/gin-gonic/gin"
)

type squareHandler struct {
	logger    icmp.Logger
	squareSvc iv3portdriver.ISquareSvc
}

func (h *squareHandler) RegPubRouter(router *gin.RouterGroup) {
	router.GET("/recent-visit/agent", h.RecentAgentList)

	// todo：暂时保留老的路由，等前端逐步迁移
	router.GET("/agent-market/recent-agent", h.RecentAgentList)

	// agent info
	agentInfoRouter := router.Group("/agent-market/agent/:agent_id/version/:version")
	agentInfoRouter.Use(
		h.agentInfoGetReqMiddleware,
		// h.agentInfoCustomSpacePmsCheck,
		h.agentInfoAgentUsePmsCheck,
	)

	agentInfoRouter.GET("", h.AgentInfo)
}

func (h *squareHandler) RegPriRouter(router *gin.RouterGroup) {
	// 1. --- agent info start ---
	agentInfoRouter := router.Group("")
	agentInfoRouter.Use(
		h.agentInfoGetReqMiddleware,
	)

	agentInfoRouter.GET("/square/agent/:agent_id/version/:version", h.AgentInfo)

	// todo：暂时保留老的路由，等前端逐步迁移
	agentInfoRouter.GET("/agent-market/agent/:agent_id/version/:version", h.AgentInfo)
	// --- agent info end ---
}

var (
	handlerOnce sync.Once
	_handler    ihandlerportdriver.IHTTPRouter
)

func NewSquareHandler() ihandlerportdriver.IHTTPRouter {
	handlerOnce.Do(func() {
		_handler = &squareHandler{
			logger:    logger.GetLogger(),
			squareSvc: squaresvc.NewSquareService(),
		}
	})

	return _handler
}
