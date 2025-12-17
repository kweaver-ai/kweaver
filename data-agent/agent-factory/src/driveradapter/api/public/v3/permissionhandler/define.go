package permissionhandler

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/inject/v3/dainject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/ihandlerportdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"

	"github.com/gin-gonic/gin"
)

type permissionHandler struct {
	logger        icmp.Logger
	permissionSvc iv3portdriver.IPermissionSvc
}

func (h *permissionHandler) RegPubRouter(router *gin.RouterGroup) {
	// 权限相关路由
	router.POST("/agent-permission/execute", h.CheckUsePermission)
	// router.POST("/agent-permission/is-custom-space-member", h.CheckIsCustomSpaceMember)

	router.GET("/agent-permission/management/user-status", h.GetUserStatus)
}

func (h *permissionHandler) RegPriRouter(router *gin.RouterGroup) {
	router.Use(
		capimiddleware.SetInternalAPIUserInfo(cenum.AccountTypeUser, cenum.AccountTypeApp),
		capimiddleware.SetInternalAPIFlag(),
	)

	// 私有路由注册
	router.POST("/agent-permission/execute", h.CheckUsePermission)
	// router.POST("/agent-permission/is-custom-space-member", h.CheckIsCustomSpaceMember)

	router.GET("/agent-permission/management/user-status", h.GetUserStatus)
}

var (
	handlerOnce sync.Once
	_handler    ihandlerportdriver.IHTTPRouter
)

func NewPermissionHandler() ihandlerportdriver.IHTTPRouter {
	handlerOnce.Do(func() {
		_handler = &permissionHandler{
			logger:        logger.GetLogger(),
			permissionSvc: dainject.NewPermissionSvc(),
		}
	})

	return _handler
}
