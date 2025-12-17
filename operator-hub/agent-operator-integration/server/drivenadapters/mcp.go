package drivenadapters

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/client/transport"
	"github.com/mark3labs/mcp-go/mcp"
)

type mcpClient struct {
	logger            interfaces.Logger
	mcpCoreConfigInfo *interfaces.MCPCoreConfigInfo
	client            *client.Client
	ctx               context.Context
	ServerInitInfo    *mcp.InitializeResult
}

// NewMCPClient 创建 MCP 客户端
func NewMCPClient(ctx context.Context, logger interfaces.Logger, mcpCoreInfo *interfaces.MCPCoreConfigInfo) (interfaces.MCPClient, error) {
	mcpClient := &mcpClient{
		logger:            logger,
		mcpCoreConfigInfo: mcpCoreInfo,
		ctx:               ctx,
	}
	if err := mcpClient.initClient(); err != nil {
		return nil, errors.NewHTTPError(ctx, http.StatusGatewayTimeout,
			errors.ErrExtMCPServerNotAccessible,
			fmt.Sprintf("mcp server %s is not accessible, please check if the MCP server is running, error: %v", mcpCoreInfo.URL, err))
	}
	return mcpClient, nil
}

// ListTools 列出工具
func (m *mcpClient) ListTools(ctx context.Context, req mcp.ListToolsRequest) (*mcp.ListToolsResult, error) {
	serverCapabilities := m.client.GetServerCapabilities()
	if serverCapabilities.Tools == nil {
		return &mcp.ListToolsResult{
			Tools: []mcp.Tool{},
		}, nil
	}

	result, err := m.client.ListTools(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("[mcpClient.ListTools] failed to list tools:\n %v", err)
	}
	return result, nil
}

// CallTool 调用工具
func (m *mcpClient) CallTool(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	result, err := m.client.CallTool(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to call tool: %w", err)
	}
	return result, nil
}

func (m *mcpClient) initClient() error {
	mode := m.mcpCoreConfigInfo.Mode
	if mode == interfaces.MCPModeSSE {
		client, err := m.getSSEClient()
		if err != nil {
			return err
		}
		m.client = client
		return nil
	}
	if mode == interfaces.MCPModeStream {
		client, err := m.getStreamClient()
		if err != nil {
			return err
		}
		m.client = client
		return nil
	}
	return errors.NewHTTPError(m.ctx, http.StatusBadRequest, errors.ErrExtMCPModeNotSupported, nil, mode)
}

func (m *mcpClient) getSSEClient() (*client.Client, error) {
	// 创建 HTTP Client
	httpClient := &http.Client{
		Transport: &http.Transport{
			DialContext: (&net.Dialer{
				Timeout: time.Duration(config.NewConfigLoader().MCPConfig.ConnTimeout) * time.Second, // 连接超时时间
			}).DialContext,
		},
	}
	// 创建SSE客户端
	cli, err := client.NewSSEMCPClient(m.mcpCoreConfigInfo.URL, client.WithHeaders(m.mcpCoreConfigInfo.Headers), client.WithHTTPClient(httpClient))
	if err != nil {
		return nil, fmt.Errorf("[mcp.getSSEClient] failed to create SSE MCP client:\n %v", err)
	}

	// 启动SSE连接
	if err = cli.Start(m.ctx); err != nil {
		return nil, fmt.Errorf("[mcp.getSSEClient] failed to start SSE MCP client:\n %v", err)
	}

	// 初始化，协商协议能力
	initReq := mcp.InitializeRequest{}
	initReq.Params.ProtocolVersion = mcp.LATEST_PROTOCOL_VERSION
	initReq.Params.Capabilities = mcp.ClientCapabilities{}
	initReq.Params.ClientInfo = mcp.Implementation{
		Name:    "agent-operator-integration",
		Version: "1.0.0",
	}

	initResp, err := cli.Initialize(m.ctx, initReq)
	if err != nil {
		return nil, fmt.Errorf("[mcp.getSSEClient] failed to initialize SSE MCP client:\n %v", err)
	}
	m.ServerInitInfo = initResp

	// 打印初始化结果
	m.logger.Info("initialize response", "response", initResp)

	// Test Ping
	if err := cli.Ping(m.ctx); err != nil {
		return nil, fmt.Errorf("[mcp.getSSEClient] failed to ping SSE MCP client:\n %v", err)
	}

	return cli, nil
}

func (m *mcpClient) getStreamClient() (*client.Client, error) {
	// 创建HTTP Client
	httpClient := &http.Client{
		Transport: &http.Transport{
			DialContext: (&net.Dialer{
				Timeout: time.Duration(config.NewConfigLoader().MCPConfig.ConnTimeout) * time.Second,
			}).DialContext,
		},
	}

	// 创建Streamable HTTP Client
	cli, err := client.NewStreamableHttpClient(m.mcpCoreConfigInfo.URL,
		transport.WithHTTPHeaders(m.mcpCoreConfigInfo.Headers),
		transport.WithHTTPBasicClient(httpClient),
	)
	if err != nil {
		return nil, fmt.Errorf("[mcp.getStreamClient] failed to create streamable MCP client:\n %v", err)
	}

	// 初始化，协商协议能力
	initReq := mcp.InitializeRequest{}
	initReq.Params.ProtocolVersion = mcp.LATEST_PROTOCOL_VERSION
	initReq.Params.Capabilities = mcp.ClientCapabilities{}
	initReq.Params.ClientInfo = mcp.Implementation{
		Name:    "agent-operator-integration",
		Version: "1.0.0",
	}

	initResp, err := cli.Initialize(m.ctx, initReq)
	if err != nil {
		return nil, fmt.Errorf("[mcp.getStreamClient] failed to initialize streamable MCP client:\n %v", err)
	}
	m.ServerInitInfo = initResp

	// Test Ping
	if err := cli.Ping(m.ctx); err != nil {
		return nil, fmt.Errorf("[mcp.getStreamClient] failed to ping streamable MCP client:\n %v", err)
	}

	return cli, nil
}

// GetInitInfo 获取初始化信息
func (m *mcpClient) GetInitInfo(ctx context.Context) *mcp.InitializeResult {
	return m.ServerInitInfo
}
