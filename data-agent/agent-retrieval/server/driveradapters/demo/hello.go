package demo

import (
	"net/http"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/logics/demo"
	"github.com/gin-gonic/gin"
)

type DemoHandler interface {
	Hello(c *gin.Context)
}

var (
	dhOnce sync.Once
	dh     DemoHandler
)

type demoHelloHandle struct {
	Logger       interfaces.Logger
	IDemoService interfaces.IDemoHelloService
}

func NewDemoHelloHandler() DemoHandler {
	dhOnce.Do(func() {
		dh = &demoHelloHandle{
			Logger:       config.NewConfigLoader().GetLogger(),
			IDemoService: demo.NewDemoHelloService(),
		}
	})
	return dh
}

func (h *demoHelloHandle) Hello(c *gin.Context) {
	rest.ReplyOK(c, http.StatusOK, h.IDemoService.Hello())
}
