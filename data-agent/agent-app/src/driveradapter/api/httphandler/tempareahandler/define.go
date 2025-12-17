package tempareahandler

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/service/inject/dainject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driver/ihandlerportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driver/iportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"

	"github.com/gin-gonic/gin"
)

type tempareaHTTPHandler struct {
	tempareaSvc iportdriver.ITempAreaSvc
	logger      icmp.Logger
}

func (h *tempareaHTTPHandler) RegPubRouter(router *gin.RouterGroup) {
	router.POST("/temparea", h.Create)
	router.PUT("/temparea/:id", h.Append)
	router.DELETE("/temparea/:id", h.Remove)
	router.GET("/temparea/:id", h.Get)

}

func (h *tempareaHTTPHandler) RegPriRouter(router *gin.RouterGroup) {
	router.Use(capimiddleware.SetInternalAPIFlag())

}

var (
	handlerOnce sync.Once
	_handler    ihandlerportdriver.IHTTPRouter
)

func NewTempareaHTTPHandler() ihandlerportdriver.IHTTPRouter {
	handlerOnce.Do(func() {
		_handler = &tempareaHTTPHandler{
			tempareaSvc: dainject.NewTempAreaSvc(),
			logger:      logger.GetLogger(),
		}
	})

	return _handler
}
