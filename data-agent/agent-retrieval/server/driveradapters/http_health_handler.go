package driveradapters

import (
	"net/http"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/interfaces"
	"github.com/gin-gonic/gin"
)

// 健康检查
type httpHealthHandler struct{}

var (
	httpHealthOnce sync.Once
	httpHealthHand interfaces.HTTPRouterInterface
)

func NewHTTPHealthHandler() interfaces.HTTPRouterInterface {
	httpHealthOnce.Do(func() {
		httpHealthHand = &httpHealthHandler{}
	})

	return httpHealthHand
}

// RegisterRouter 注册路由
func (h *httpHealthHandler) RegisterRouter(router *gin.RouterGroup) {
	router.GET("/ready", h.getReady)
	router.GET("/alive", h.getAlive)
}

func (h *httpHealthHandler) getReady(c *gin.Context) {
	c.Writer.Header().Set("Content-Type", "application/json")
	c.String(http.StatusOK, "ready")
}

func (h *httpHealthHandler) getAlive(c *gin.Context) {
	c.Writer.Header().Set("Content-Type", "application/json")
	c.String(http.StatusOK, "alive")
}
