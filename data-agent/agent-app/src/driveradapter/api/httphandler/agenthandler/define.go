package agenthandler

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/service/inject/dainject"
	apimiddleware "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/apimiddlerware"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driver/ihandlerportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driver/iportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"

	"github.com/gin-gonic/gin"
)

type agentHTTPHandler struct {
	agentSvc iportdriver.IAgent
	logger   icmp.Logger
}

func (h *agentHTTPHandler) RegPubRouter(router *gin.RouterGroup) {
	router.POST("/app/:app_key/chat/resume", h.ResumeChat)
	router.POST("/app/:app_key/chat/termination", h.TerminateChat)
	router.POST("/file/check", h.FileCheck)

	permissionRouter := router.Group("",
		apimiddleware.CheckAgentUsePms(),
		// apimiddleware.CheckSpaceMember(),
	)
	permissionRouter.POST("/app/:app_key/chat/completion", h.Chat)
	permissionRouter.POST("/app/:app_key/debug/completion", h.Debug)
	permissionRouter.POST("/app/:app_key/api/chat/completion", h.APIChat)
	permissionRouter.POST("/app/:app_key/api/doc", h.GetAPIDoc)

	permissionRouter.POST("/conversation/session/init", h.ConversationSessionInit)
}

func (h *agentHTTPHandler) RegPriRouter(router *gin.RouterGroup) {
	// router.POST("/app/:app_key/chat/completion", h.InternalChat)
	// router.POST("/app/:app_key/chat/resume", h.ResumeChat)
	// router.POST("/app/:app_key/debug/completion", h.Debug)
	// router.POST("/app/:app_key/chat/termination", h.TerminateChat)
	// router.POST("/app/:app_key/api/chat/completion", h.APIChat)
	// router.POST("/app/:app_key/api/doc", h.GetAPIDoc)
	// router.POST("/file/check", h.FileCheck)

	permissionRouter := router.Group("",
		apimiddleware.CheckAgentUsePmsInternal(),
		// apimiddleware.CheckSpaceMemberInternal(),
	)
	permissionRouter.POST("/app/:app_key/chat/completion", h.InternalChat)
	permissionRouter.POST("/app/:app_key/api/chat/completion", h.InternalAPIChat)

}

var (
	handlerOnce sync.Once
	_handler    ihandlerportdriver.IHTTPRouter
)

func NewAgentHTTPHandler() ihandlerportdriver.IHTTPRouter {
	handlerOnce.Do(func() {
		_handler = &agentHTTPHandler{
			agentSvc: dainject.NewAgentSvc(),
			logger:   logger.GetLogger(),
		}
	})

	return _handler
}
