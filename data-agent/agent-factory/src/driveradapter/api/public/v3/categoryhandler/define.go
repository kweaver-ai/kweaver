package categoryhandler

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/categorysvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/ihandlerportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"

	"github.com/gin-gonic/gin"
)

type categoryHandler struct {
	logger      icmp.Logger
	categorySvc iv3portdriver.ICategorySvc
}

func (h *categoryHandler) RegPubRouter(router *gin.RouterGroup) {
	router.GET("/category", h.List)
}

func (a *categoryHandler) RegPriRouter(router *gin.RouterGroup) {
	// 私有路由注册
}

var (
	handlerOnce sync.Once
	_handler    ihandlerportdriver.IHTTPRouter
)

func NewCategoryHandler() ihandlerportdriver.IHTTPRouter {
	handlerOnce.Do(func() {
		_handler = &categoryHandler{
			logger:      logger.GetLogger(),
			categorySvc: categorysvc.NewCategorySvc(),
		}
	})

	return _handler
}
