package mcp

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	logicmcp "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/logics/mcp"
	"github.com/gin-gonic/gin"
)

type MCPHandler interface {
	// 创建mcp实例
	CreateMCPInstance(c *gin.Context)
	// 删除mcp实例
	DeleteMCPInstance(c *gin.Context)
	// 更新mcp实例
	UpdateMCPInstance(c *gin.Context)

	StreamHandler(c *gin.Context)
	SSEHandler(c *gin.Context)
	MessageHandler(c *gin.Context)
}

var (
	once sync.Once
	h    *mcpHnadle
)

type mcpHnadle struct {
	mcpService interfaces.IMCPInstanceService
}

func NewMCPHandler() MCPHandler {
	once.Do(func() {
		h = &mcpHnadle{
			mcpService: logicmcp.NewMCPInstanceService(),
		}
	})
	return h
}
