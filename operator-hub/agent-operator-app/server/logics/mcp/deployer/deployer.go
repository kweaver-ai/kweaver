package deployer

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"github.com/mark3labs/mcp-go/server"
)

type Deployer interface {
	Deploy(ctx context.Context, instance *interfaces.MCPServerInstance) error
	Undeploy(ctx context.Context, instance *interfaces.MCPServerInstance) error
}

// Runtime MCP运行时结构
type Runtime struct {
	MCPServer       *server.MCPServer
	StreamServer    *server.StreamableHTTPServer
	SSEServer       *server.SSEServer
	StreamRoutePath string
	SSERoutePath    string
}
