package releasehandler

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/inject/v3/dainject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/ihandlerportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"

	"github.com/gin-gonic/gin"
)

type releaseHandler struct {
	releaseSvc iv3portdriver.IReleaseSvc
	logger     icmp.Logger
}

func (h *releaseHandler) RegPubRouter(router *gin.RouterGroup) {
	router.POST("/agent/:agent_id/publish", h.Publish)
	router.PUT("/agent/:agent_id/unpublish", h.UnPublish)
	router.GET("/agent/:agent_id/release-history", h.HistoryList)
	router.GET("/agent/:agent_id/release-history/:history_id", h.HistoryInfo)

	// 发布信息相关接口
	router.GET("/agent/:agent_id/publish-info", h.GetPublishInfo)
	router.PUT("/agent/:agent_id/publish-info", h.UpdatePublishInfo)
}

func (h *releaseHandler) RegPriRouter(router *gin.RouterGroup) {
	router.Use(
		capimiddleware.SetInternalAPIUserInfo(),
		capimiddleware.SetInternalAPIFlag(),
	)

	// 私有路由注册
	router.POST("/agent/:agent_id/publish", h.Publish) // 发布 Agent

	router.GET("/agent/:agent_id/publish-info", h.GetPublishInfo)
}

var (
	handlerOnce sync.Once
	_handler    ihandlerportdriver.IHTTPRouter
)

func NewReleaseHandler() ihandlerportdriver.IHTTPRouter {
	handlerOnce.Do(func() {
		_handler = &releaseHandler{
			logger:     logger.GetLogger(),
			releaseSvc: dainject.NewReleaseSvc(),
		}
	})

	return _handler
}
