package conversationhandler

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

type conversationHTTPHandler struct {
	conversationSvc iportdriver.IConversationSvc
	logger          icmp.Logger
}

func (h *conversationHTTPHandler) RegPubRouter(router *gin.RouterGroup) {
	router.GET("/app/:app_key/conversation", h.List)                   // 获取会话列表
	router.GET("/app/:app_key/conversation/:id", h.Detail)             // 获取会话详情
	router.PUT("/app/:app_key/conversation/:id", h.Update)             // 更新会话
	router.DELETE("/app/:app_key/conversation/:id", h.Delete)          // 删除会话
	router.DELETE("/app/:app_key/conversation", h.DeleteByAPPKey)      // 删除指定agent应用下所有会话
	router.POST("/app/:app_key/conversation", h.Init)                  // 初始化会话
	router.PUT("/app/:app_key/conversation/:id/mark_read", h.MarkRead) // 删除指定agent应用下所有会话

}

func (h *conversationHTTPHandler) RegPriRouter(router *gin.RouterGroup) {
	router.Use(capimiddleware.SetInternalAPIFlag())

}

var (
	handlerOnce sync.Once
	_handler    ihandlerportdriver.IHTTPRouter
)

func NewConversationHTTPHandler() ihandlerportdriver.IHTTPRouter {
	handlerOnce.Do(func() {
		_handler = &conversationHTTPHandler{
			conversationSvc: dainject.NewConversationSvc(),
			logger:          logger.GetLogger(),
		}
	})

	return _handler
}
