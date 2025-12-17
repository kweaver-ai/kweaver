// Package mcp provides MCP (Model Context Protocol) driver adapters implementation.
// This package contains handlers for MCP server management, tool execution, and market integration.
package mcp

import (
	"fmt"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	logicsmcp "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/mcp"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type MCPPublicHandler interface {
	// ParseSSE 解析SSE类型的MCP服务
	ParseSSE(c *gin.Context)
	// AddMCPServer 注册MCP服务
	AddMCPServer(c *gin.Context)
	// DeleteMCPServer 删除MCP服务
	DeleteMCPServer(c *gin.Context)
	// QueryMCPServerPage 查询MCP服务
	QueryMCPServerPage(c *gin.Context)
	// QueryMCPServerDetail 查询MCP服务详情
	QueryMCPServerDetail(c *gin.Context)
	// UpdateMCPServer 更新MCP服务
	UpdateMCPServer(c *gin.Context)
	// UpdateMCPServerStatus 更新MCP服务状态
	UpdateMCPServerStatus(c *gin.Context)
	// DebugTool 工具调试
	DebugTool(c *gin.Context)

	// GetMCPTools 查询MCP服务工具
	GetMCPTools(c *gin.Context)
	// CallMCPTool 调用MCP服务工具
	CallMCPTool(c *gin.Context)

	// QueryMCPServerMarketList 查询MCP服务市场列表
	QueryMCPServerMarketList(c *gin.Context)
	// QueryMCPServerMarketDetail 查询MCP服务市场详情
	QueryMCPServerMarketDetail(c *gin.Context)
	// QueryMCPServerMarketBatch 批量查询MCP服务市场详情
	QueryMCPServerMarketBatch(c *gin.Context)

	// HandleStreamingHttp 基于HTTP分块传输的流式处理
	HandleStreamingHttp(c *gin.Context)
	// HandleServerSentEvents SSE事件处理
	HandleServerSentEvents(c *gin.Context)
	// HandleMessage 消息处理
	HandleSSEMessage(c *gin.Context)
}

type MCPPrivateHandler interface {
	// GetMCPTools 查询MCP服务工具
	GetMCPTools(c *gin.Context)
	// CallMCPTool 调用MCP服务工具
	CallMCPTool(c *gin.Context)
	// ExecuteTool 执行MCP服务工具
	ExecuteTool(c *gin.Context)

	// RegisterBuiltinMCPServerPrivate 注册内置MCP服务
	RegisterBuiltinMCPServerPrivate(c *gin.Context)
	// UnregisterBuiltinMCPServerPrivate 注销内置MCP服务
	UnregisterBuiltinMCPServerPrivate(c *gin.Context)
}

var (
	once sync.Once
	h    *mcpHandle
)

type mcpHandle struct {
	Logger     interfaces.Logger
	mcpService interfaces.IMCPService
	redisCli   *redis.Client
}

// NewMCPHandler 创建MCP处理程序
func NewMCPHandler() *mcpHandle {
	once.Do(func() {
		conf := config.NewConfigLoader()
		cli, _, err := conf.RedisConfig.GetClient()
		if err != nil {
			panic(fmt.Sprintf("get redis client failed: %v", err))
		}
		h = &mcpHandle{
			Logger:     config.NewConfigLoader().GetLogger(),
			mcpService: logicsmcp.NewMCPServiceImpl(),
			redisCli:   cli,
		}
	})
	return h
}
