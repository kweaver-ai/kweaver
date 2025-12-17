package interfaces

import (
	"context"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/utils"
	"github.com/mark3labs/mcp-go/server"
)

var (
	MCPServers   = make(map[string]*MCPServerInstance) // mcp 服务实例列表
	MCPServersMu sync.RWMutex                          // mcp 服务实例列表锁
)

type MCPToolArguments struct {
	Headers     map[string]any `json:"header"`
	Body        interface{}    `json:"body"`
	QueryParams map[string]any `json:"query"`
	PathParams  map[string]any `json:"path"`
}

func (args *MCPToolArguments) ToMCPExecuteToolRequest() (*MCPExecuteToolRequest, error) {
	req := &MCPExecuteToolRequest{
		Body:        args.Body,
		Headers:     make(map[string]string),
		QueryParams: make(map[string]string),
		PathParams:  make(map[string]string),
	}

	for k, v := range args.Headers {
		req.Headers[k] = utils.ToString(v)
	}

	for k, v := range args.QueryParams {
		req.QueryParams[k] = utils.ToString(v)
	}

	for k, v := range args.PathParams {
		req.PathParams[k] = utils.ToString(v)
	}
	return req, nil
}

type MCPToolConfig struct {
	ToolID      string      `json:"tool_id"`      // mcp工具id
	Name        string      `json:"name"`         // mcp工具名称
	Description string      `json:"description"`  // mcp工具描述
	InputSchema interface{} `json:"input_schema"` // mcp工具输入参数
}

type MCPConfig struct {
	MCPID        string           `json:"mcp_id"`       // mcp id
	Version      int              `json:"version"`      // mcp 版本
	Name         string           `json:"name"`         // mcp 名称
	Instructions string           `json:"instructions"` // mcp介绍
	Tools        []*MCPToolConfig `json:"tools"`        // mcp 工具列表
}

// MCPServerInstance 代表MCP实例的核心模型
type MCPServerInstance struct {
	Config           *MCPConfig
	MCPServer        *server.MCPServer
	StreamServer     *server.StreamableHTTPServer
	SSEServer        *server.SSEServer
	StreamRoutePath  string
	SSERoutePath     string
	MessageRoutePath string
	IsDisabled       bool
	CreatedAt        *time.Time
}

type MCPDeployCreateRequest struct {
	MCPID        string           `json:"mcp_id"`       // mcp id
	Version      int              `json:"version"`      // mcp 版本
	Name         string           `json:"name"`         // mcp 名称
	Instructions string           `json:"instructions"` // mcp介绍
	Tools        []*MCPToolConfig `json:"tools"`        // mcp 工具列表
}

type MCPDeployCreateResponse struct {
	MCPID      string `json:"mcp_id"`
	MCPVersion int    `json:"version"`
	StreamURL  string `json:"stream_url"`
	SSEURL     string `json:"sse_url"`
}

type MCPDeployUpdateRequest struct {
	MCPID        string           `uri:"mcp_id"`        // mcp id
	Version      int              `uri:"version"`       // mcp 版本
	Name         string           `json:"name"`         // mcp 名称
	Instructions string           `json:"instructions"` // mcp介绍
	Tools        []*MCPToolConfig `json:"tools"`        // mcp 工具列表
}

type MCPDeployUpdateResponse struct {
	MCPID      string `json:"mcp_id"`
	MCPVersion int    `json:"version"`
	StreamURL  string `json:"stream_url"`
	SSEURL     string `json:"sse_url"`
}

type MCPAppRequest struct {
	MCPID   string `uri:"mcp_id" validate:"required"`
	Version int    `uri:"version" validate:"required"`
}

type MCPDeleteRequest struct {
	MCPID   string `uri:"mcp_id" validate:"required"`
	Version int    `uri:"version" validate:"required"`
}

type IMCPInstanceService interface {
	// 创建mcp服务实例
	CreateMCPInstance(ctx context.Context, req *MCPDeployCreateRequest) (*MCPDeployCreateResponse, error)
	// 删除mcp服务实例
	DeleteMCPInstance(ctx context.Context, mcpID string, mcpVersion int) error
	// 更新mcp服务实例
	UpdateMCPInstance(ctx context.Context, mcpID string, mcpVersion int, req *MCPDeployUpdateRequest) (*MCPDeployUpdateResponse, error)
	// 获取mcp服务实例
	GetMCPInstance(ctx context.Context, mcpID string, mcpVersion int) (*MCPServerInstance, error)
	// 初始化mcp服务实例
	InitOnStartup(ctx context.Context) (err error)
}
