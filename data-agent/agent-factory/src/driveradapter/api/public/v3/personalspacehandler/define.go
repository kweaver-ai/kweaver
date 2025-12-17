package personalspacehandler

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/inject/v3/dainject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"github.com/gin-gonic/gin"
)

var (
	personalSpaceHandlerOnce sync.Once
	personalSpaceHandlerImpl *PersonalSpaceHTTPHandler
)

// PersonalSpaceHTTPHandler 个人空间HTTP处理器
type PersonalSpaceHTTPHandler struct {
	personalSpaceService iv3portdriver.IPersonalSpaceService
	logger               icmp.Logger
}

// GetPersonalSpaceHTTPHandler 获取个人空间HTTP处理器实例
func GetPersonalSpaceHTTPHandler() *PersonalSpaceHTTPHandler {
	personalSpaceHandlerOnce.Do(func() {
		personalSpaceHandlerImpl = &PersonalSpaceHTTPHandler{
			personalSpaceService: dainject.NewPersonalSpaceSvc(),
			logger:               logger.GetLogger(),
		}
	})

	return personalSpaceHandlerImpl
}

// RegPubRouter 注册公共路由
func (h *PersonalSpaceHTTPHandler) RegPubRouter(router *gin.RouterGroup) {
	// 个人空间Agent模板列表
	router.GET("/personal-space/agent-tpl-list", h.AgentTplList)

	// 个人空间Agent列表
	router.GET("/personal-space/agent-list", h.AgentList)
}
