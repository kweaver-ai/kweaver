package publishedhandler

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/inject/v3/dainject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/ihandlerportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"

	"github.com/gin-gonic/gin"
)

type publishedHandler struct {
	logger       icmp.Logger
	publishedSvc iv3portdriver.IPublishedSvc
}

func (h *publishedHandler) RegPubRouter(router *gin.RouterGroup) {
	// router.GET("/published/agent", h.PublishedAgentList)
	router.POST("/published/agent", h.PublishedAgentList)

	router.POST("/published/agent-info-list", h.PubedAgentInfoList)

	router.GET("/published/agent-tpl", h.PubedTplList)
	router.GET("/published/agent-tpl/:tpl_id", h.PubedTplDetail)
}

func (h *publishedHandler) RegPriRouter(router *gin.RouterGroup) {
}

var (
	handlerOnce sync.Once
	_handler    ihandlerportdriver.IHTTPRouter
)

func NewPublishedHandler() ihandlerportdriver.IHTTPRouter {
	handlerOnce.Do(func() {
		_handler = &publishedHandler{
			logger:       logger.GetLogger(),
			publishedSvc: dainject.NewPublishedSvc(),
		}
	})

	return _handler
}
