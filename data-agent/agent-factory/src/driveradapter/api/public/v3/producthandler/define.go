package producthandler

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/productsvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/ihandlerportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
	"github.com/gin-gonic/gin"
)

type productHTTPHandler struct {
	productService iv3portdriver.IProductSvc
}

func (h *productHTTPHandler) RegPubRouter(router *gin.RouterGroup) {
	router.POST("/product", h.Create)       // 新建product
	router.PUT("/product/:id", h.Update)    // 编辑product
	router.GET("/product/:id", h.Detail)    // 获取product详情
	router.GET("/product", h.List)          // 获取product列表
	router.DELETE("/product/:id", h.Delete) // 删除product
}

func (h *productHTTPHandler) RegPriRouter(router *gin.RouterGroup) {
	// 私有路由注册
	router.Use(
		capimiddleware.SetInternalAPIUserInfo(),
		capimiddleware.SetInternalAPIFlag(),
	)
}

var (
	handlerOnce sync.Once
	_handler    ihandlerportdriver.IHTTPRouter
)

func NewProductHTTPHandler() ihandlerportdriver.IHTTPRouter {
	handlerOnce.Do(func() {
		_handler = &productHTTPHandler{
			productService: productsvc.NewProductService(),
		}
	})

	return _handler
}
