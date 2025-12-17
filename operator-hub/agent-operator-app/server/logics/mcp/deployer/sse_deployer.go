package deployer

import (
	"context"
	"fmt"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"github.com/mark3labs/mcp-go/server"
)

var (
	sseDeployerOnce sync.Once
	sseDeployer     *SSEDeployer
)

type SSEDeployer struct {
}

func NewSSEDeployer() *SSEDeployer {
	sseDeployerOnce.Do(func() {
		sseDeployer = &SSEDeployer{}
	})
	return sseDeployer
}

func (d *SSEDeployer) Deploy(ctx context.Context, instance *interfaces.MCPServerInstance) error {
	// 1. 生成路由路径
	ssePath := fmt.Sprintf("/api/agent-operator-app/internal-v1/mcp/app/%s/%d/sse", instance.Config.MCPID, instance.Config.Version)
	messagePath := fmt.Sprintf("/api/agent-operator-app/internal-v1/mcp/app/%s/%d/message", instance.Config.MCPID, instance.Config.Version)
	// 2.构建SSE Server
	sseServer := server.NewSSEServer(
		instance.MCPServer,
		server.WithSSEEndpoint(ssePath),
		server.WithMessageEndpoint(messagePath),
	)

	// 3. 更新实例
	instance.SSEServer = sseServer
	instance.SSERoutePath = ssePath
	instance.MessageRoutePath = messagePath
	return nil
}

func (d *SSEDeployer) Undeploy(ctx context.Context, instance *interfaces.MCPServerInstance) error {
	// 关闭SSE服务
	if instance.SSEServer != nil {
		err := instance.SSEServer.Shutdown(ctx)
		if err != nil {
			return err
		}
	}
	return nil
}
