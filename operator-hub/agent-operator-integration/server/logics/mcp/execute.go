package mcp

import (
	"context"
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	infraerrors "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/telemetry"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/metric"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/mark3labs/mcp-go/mcp"
)

type CallToolRequest struct {
	MCPCoreInfo *interfaces.MCPCoreConfigInfo
	ToolName    string         `json:"tool_name"` // 工具名称
	Params      map[string]any `json:"params"`    // 工具参数
}

type CallToolResponse struct {
	interfaces.MCPProxyCallToolResponse
}

type ListToolsRequest struct {
	MCPCoreInfo *interfaces.MCPCoreConfigInfo
}

type ListToolsResponse struct {
	interfaces.MCPProxyToolListResponse
	ServerInitInfo *mcp.InitializeResult
}

// GetMCPTools 获取MCP工具列表
func (s *mcpServiceImpl) GetMCPTools(ctx context.Context, req *interfaces.MCPProxyToolListRequest) (resp *interfaces.MCPProxyToolListResponse, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	telemetry.SetSpanAttributes(ctx, map[string]interface{}{
		"mcp_id":  req.MCPID,
		"user_id": req.UserID,
	})
	// 如果是公开接口，检查公开访问或者查看权限，内部接口暂时不校验
	if req.IsPublic {
		var accessor *interfaces.AuthAccessor
		accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
		if err != nil {
			return
		}
		var authorized bool
		authorized, err = s.AuthService.OperationCheckAny(ctx, accessor, req.MCPID, interfaces.AuthResourceTypeMCP, interfaces.AuthOperationTypeView, interfaces.AuthOperationTypePublicAccess)
		if err != nil {
			return
		}
		if !authorized {
			err = infraerrors.NewHTTPError(ctx, http.StatusForbidden, infraerrors.ErrExtCommonOperationForbidden, nil)
			return
		}
	}

	serverConfig, err := s.DBMCPServerConfig.SelectByID(ctx, nil, req.MCPID)
	if err != nil {
		s.logger.WithContext(ctx).Errorf("select mcp server config by id error: %v", err)
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError,
			fmt.Sprintf("select mcp server config by id error: %v", err))
		return
	}

	if serverConfig == nil {
		err = infraerrors.DefaultHTTPError(ctx, http.StatusNotFound, "mcp server config not found")
		return
	}

	listToolsReq := &ListToolsRequest{
		MCPCoreInfo: &interfaces.MCPCoreConfigInfo{
			Mode:    interfaces.MCPMode(serverConfig.Mode),
			URL:     serverConfig.URL,
			Headers: nil,
		},
	}

	listToolsResp, err := s.listTools(ctx, listToolsReq)
	if err != nil {
		return
	}

	resp = &interfaces.MCPProxyToolListResponse{
		Tools: listToolsResp.Tools,
	}
	return resp, nil
}

// CallMCPTool 调用MCP工具
func (s *mcpServiceImpl) CallMCPTool(ctx context.Context, req *interfaces.MCPProxyCallToolRequest) (resp *interfaces.MCPProxyCallToolResponse, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	telemetry.SetSpanAttributes(ctx, map[string]interface{}{
		"mcp_id":  req.MCPID,
		"user_id": req.UserID,
	})
	accessor, err := s.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	err = s.AuthService.CheckExecutePermission(ctx, accessor, req.MCPID, interfaces.AuthResourceTypeMCP)
	if err != nil {
		return
	}
	serverConfig, err := s.DBMCPServerConfig.SelectByID(ctx, nil, req.MCPID)
	if err != nil {
		s.logger.WithContext(ctx).Errorf("select mcp server config by id error: %v", err)
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError,
			fmt.Sprintf("select mcp server config by id error: %v", err))
		return
	}

	if serverConfig == nil {
		err = infraerrors.DefaultHTTPError(ctx, http.StatusNotFound, "mcp server config not found")
		return
	}

	callToolReq := &CallToolRequest{
		MCPCoreInfo: &interfaces.MCPCoreConfigInfo{
			Mode:    interfaces.MCPMode(serverConfig.Mode),
			URL:     serverConfig.URL,
			Headers: nil,
		},
		ToolName: req.ToolName,
		Params:   req.Parameters,
	}

	callToolResult, err := s.callTool(ctx, callToolReq)
	if err != nil {
		return
	}
	// 异步记录审计日志
	go func() {
		tokenInfo, _ := common.GetTokenInfoFromCtx(ctx)
		s.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
			TokenInfo: tokenInfo,
			Accessor:  accessor,
			Operation: metric.AuditLogOperationExecute,
			Object: &metric.AuditLogObject{
				Type: metric.AuditLogObjectMCP,
				Name: req.ToolName,
				ID:   req.MCPID,
			},
		})
	}()

	resp = &interfaces.MCPProxyCallToolResponse{
		Content: callToolResult.Content,
		IsError: callToolResult.IsError,
	}
	return resp, nil
}

func (s *mcpServiceImpl) callTool(ctx context.Context, req *CallToolRequest) (*CallToolResponse, error) {
	mcpClient, err := drivenadapters.NewMCPClient(ctx, s.logger, req.MCPCoreInfo)
	if err != nil {
		return nil, err
	}

	callToolRequest := mcp.CallToolRequest{}
	callToolRequest.Params.Name = req.ToolName
	callToolRequest.Params.Arguments = req.Params

	result, err := mcpClient.CallTool(ctx, callToolRequest)
	if err != nil {
		return nil, infraerrors.NewHTTPError(ctx, http.StatusGatewayTimeout, infraerrors.ErrExtMCPCallToolFailed, err.Error())
	}

	return &CallToolResponse{
		MCPProxyCallToolResponse: interfaces.MCPProxyCallToolResponse{
			Content: result.Content,
			IsError: result.IsError,
		},
	}, nil
}

func (s *mcpServiceImpl) listTools(ctx context.Context, req *ListToolsRequest) (*ListToolsResponse, error) {
	mcpClient, err := drivenadapters.NewMCPClient(ctx, s.logger, req.MCPCoreInfo)
	if err != nil {
		return nil, err
	}

	initInfo := mcpClient.GetInitInfo(ctx)

	tools, err := mcpClient.ListTools(ctx, mcp.ListToolsRequest{})
	if err != nil {
		return nil, infraerrors.NewHTTPError(ctx, http.StatusGatewayTimeout, infraerrors.ErrExtMCPListToolsFailed, err.Error())
	}

	return &ListToolsResponse{
		MCPProxyToolListResponse: interfaces.MCPProxyToolListResponse{
			Tools: tools.Tools,
		},
		ServerInitInfo: initInfo,
	}, nil
}

// ExecuteTool 执行MCP工具
func (s *mcpServiceImpl) ExecuteTool(ctx context.Context, req *interfaces.MCPExecuteToolRequest) (*interfaces.HTTPResponse, error) {
	// 获取MCP工具配置信息
	tool, err := s.DBMCPTool.SelectByMCPToolID(ctx, nil, req.MCPToolID)
	if err != nil {
		s.logger.Warnf("select mcp tool failed, err: %v", err)
		return nil, infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select mcp tool failed")
	}

	if tool == nil {
		return nil, infraerrors.DefaultHTTPError(ctx, http.StatusNotFound, "mcp tool not found")
	}

	// 调用工具服务执行工具
	executeToolReq := &interfaces.ExecuteToolReq{
		BoxID:       tool.BoxID,
		ToolID:      tool.ToolID,
		Headers:     req.Headers,
		Body:        req.Body,
		QueryParams: req.QueryParams,
		PathParams:  req.PathParams,
	}
	executeToolResp, err := s.ToolService.ExecuteToolCore(ctx, executeToolReq)
	if err != nil {
		return nil, err
	}
	return executeToolResp, nil
}
