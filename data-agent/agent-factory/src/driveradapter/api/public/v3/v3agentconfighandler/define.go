package v3agentconfighandler

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

type daConfHTTPHandler struct {
    daConfSvc iv3portdriver.IDataAgentConfigSvc
    logger    icmp.Logger
}

func (h *daConfHTTPHandler) RegPubRouter(router *gin.RouterGroup) {
    router.POST("/agent", h.Create)          // 新建agent
    router.PUT("/agent/:agent_id", h.Update) // 编辑agent
    router.GET("/agent/:agent_id", h.Detail) // 获取agent详情
    // router.GET("/agent", h.AgentList)        // agent列表

    router.GET("/agent/by-key/:key", h.DetailByKey) // 获取agent详情 by key
    router.DELETE("/agent/:agent_id", h.Delete)     // 删除agent

    router.POST("/agent/ai-autogen", h.AIAutogenContent)

    router.POST("/agent/batch-check-index-status", h.BatchCheckIndexStatus)

    // 复制相关接口
    router.POST("/agent/:agent_id/copy", h.Copy)                               // 复制Agent
    router.POST("/agent/:agent_id/copy2tpl", h.Copy2Tpl)                       // 复制Agent为模板
    router.POST("/agent/:agent_id/copy2tpl-and-publish", h.Copy2TplAndPublish) // 复制Agent为模板并发布

    // 获取内置头像列表
    router.GET("/agent/avatar/built-in", h.GetBuiltInAvatarList)
    // 获取内置头像
    router.GET("/agent/avatar/built-in/:avatar_id", h.GetBuiltInAvatar)

    // 获取SELF_CONFIG字段结构
    router.GET("/agent-self-config-fields", h.SelfConfig)
}

func (h *daConfHTTPHandler) RegPriRouter(router *gin.RouterGroup) {
    router.Use(
        capimiddleware.SetInternalAPIUserInfo(),
        capimiddleware.SetInternalAPIFlag(),
    )

    // 私有路由注册
    router.POST("/agent", h.Create)                   // 新建agent
    router.PUT("/agent/:agent_id", h.Update)          // 编辑agent
    router.DELETE("/agent/:agent_id", h.Delete)       // 删除agent
    router.GET("/agent", h.AgentListListForBenchmark) // agent列表 for benchmark

    router.GET("/agent/:agent_id", h.Detail)        // 获取agent详情
    router.GET("/agent/by-key/:key", h.DetailByKey) // 获取agent详情 by key
    router.POST("/agent-fields", h.BatchFields)     // 批量获取agent指定字段
}

var (
    handlerOnce sync.Once
    _handler    ihandlerportdriver.IHTTPRouter
)

func NewDAConfHTTPHandler() ihandlerportdriver.IHTTPRouter {
    handlerOnce.Do(func() {
        _handler = &daConfHTTPHandler{
            daConfSvc: dainject.NewDaConfSvc(),
            logger:    logger.GetLogger(),
        }
    })

    return _handler
}
