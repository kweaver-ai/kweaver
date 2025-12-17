package deployer

import (
	"context"
	"fmt"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"github.com/mark3labs/mcp-go/server"
)

var (
	httpDeployerOnce sync.Once
	httpDeployer     *HTTPDeployer
)

type HTTPDeployer struct {
}

func NewHTTPDeployer() *HTTPDeployer {
	httpDeployerOnce.Do(func() {
		httpDeployer = &HTTPDeployer{}
	})
	return httpDeployer
}

func (d *HTTPDeployer) Deploy(ctx context.Context, instance *interfaces.MCPServerInstance) error {
	// 1. 生成路由路径
	streamPath := fmt.Sprintf("/app/%s/%d/stream", instance.Config.MCPID, instance.Config.Version)
	// 2. 构建stream server
	streamServer := server.NewStreamableHTTPServer(instance.MCPServer, server.WithEndpointPath(streamPath))
	// 3. 更新实例
	instance.StreamServer = streamServer
	instance.StreamRoutePath = streamPath
	return nil
}

func (d *HTTPDeployer) Undeploy(ctx context.Context, instance *interfaces.MCPServerInstance) error {
	// 关闭stream server
	if instance.StreamServer != nil {
		err := instance.StreamServer.Shutdown(ctx)
		if err != nil {
			return err
		}
	}
	return nil
}
