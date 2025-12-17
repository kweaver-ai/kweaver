package api

import (
	"net/http"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/ihandlerportdriver"
	"github.com/gin-gonic/gin"
)

// 健康检查
type httpHealthHandler struct{}

var (
	httpHealthOnce sync.Once
	httpHealthHand ihandlerportdriver.IHTTPHealthRouter
)

func NewHTTPHealthHandler() ihandlerportdriver.IHTTPHealthRouter {
	httpHealthOnce.Do(func() {
		httpHealthHand = &httpHealthHandler{}
	})

	return httpHealthHand
}

// RegisterHealthRouter 注册健康检查路由
func (h *httpHealthHandler) RegHealthRouter(router *gin.RouterGroup) {
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
