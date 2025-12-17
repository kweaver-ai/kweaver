package core

import (
	"context"
	"net/http"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/config"
	infraerrors "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/logics/mcp/deployer"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/logics/mcp/storage"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/utils"
	"github.com/mark3labs/mcp-go/server"
)

// InstanceManager MCP实例管理器
type InstanceManager struct {
	storage      storage.Storage
	httpDeployer deployer.Deployer
	sseDeployer  deployer.Deployer
	toolManager  *ToolManager

	logger interfaces.Logger
}

func NewInstanceManager(storage storage.Storage, httpDeployer deployer.Deployer, sseDeployer deployer.Deployer) *InstanceManager {
	return &InstanceManager{
		storage:      storage,
		httpDeployer: httpDeployer,
		sseDeployer:  sseDeployer,
		toolManager:  NewToolManager(),
		logger:       config.NewConfigLoader().GetLogger(),
	}
}

// Create 创建MCP实例
func (m *InstanceManager) Create(ctx context.Context, config *interfaces.MCPConfig) (*interfaces.MCPServerInstance, error) {
	// 1. 检查实例是否存在
	exists := m.storage.Exists(config.MCPID, config.Version)
	if exists {
		return nil, infraerrors.NewHTTPError(context.Background(), http.StatusBadRequest, infraerrors.ErrExtMCPInstanceAlreadyExists, nil)
	}
	now := time.Now()
	instance := &interfaces.MCPServerInstance{
		Config:    config,
		CreatedAt: &now,
	}
	// 2. 构建统一的mcp Server
	mcpServer := server.NewMCPServer(config.Name, utils.GenerateMCPServerVersion(config.Version), server.WithInstructions(config.Instructions))
	instance.MCPServer = mcpServer

	// 3. 注册工具
	err := m.toolManager.RegisterTools(config.Tools, mcpServer)
	if err != nil {
		return nil, err
	}
	// 4. 部署stream server
	err = m.httpDeployer.Deploy(ctx, instance)
	if err != nil {
		return nil, err
	}
	// 5. 部署sse server
	err = m.sseDeployer.Deploy(ctx, instance)
	if err != nil {
		return nil, err
	}
	// 6. 存储实例
	err = m.storage.Save(instance)
	if err != nil {
		m.logger.Errorf("[Create] save mcp instance failed, mcpID: %s, version: %d, error: %v", config.MCPID, config.Version, err)
		return nil, err
	}
	m.logger.Infof("[Create] create mcp instance success, mcpID: %s, version: %d", config.MCPID, config.Version)
	return instance, nil
}

func (m *InstanceManager) Delete(ctx context.Context, mcpID string, version int) error {
	instance, err := m.storage.Get(mcpID, version)
	if err != nil {
		return err
	}
	// 1. 卸载stream server
	err = m.httpDeployer.Undeploy(ctx, instance)
	if err != nil {
		return err
	}
	// 2. 卸载sse server
	err = m.sseDeployer.Undeploy(ctx, instance)
	if err != nil {
		return err
	}
	// 3. 删除实例
	return m.storage.Delete(mcpID, version)
}
