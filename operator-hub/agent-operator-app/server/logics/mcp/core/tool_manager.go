package core

import (
	"context"
	"encoding/json"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/utils"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// ToolManager MCP工具管理器
type ToolManager struct {
	operatorIntegration interfaces.AgentOperatorIntegration
	logger              interfaces.Logger
}

func NewToolManager() *ToolManager {
	return &ToolManager{
		operatorIntegration: drivenadapters.NewOperatorIntegration(),
		logger:              config.NewConfigLoader().GetLogger(),
	}
}

// RegisterTools 注册工具到运行时
func (tm *ToolManager) RegisterTools(tools []*interfaces.MCPToolConfig, mcpServer *server.MCPServer) error {
	for _, tool := range tools {
		var rawSchema json.RawMessage
		if tool.InputSchema != nil {
			b, err := json.Marshal(tool.InputSchema)
			if err != nil {
				return err
			}
			rawSchema = b
		}

		handler := func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			return tm.toolHandler(ctx, request, tool.ToolID)
		}

		mcpServer.AddTool(mcp.NewToolWithRawSchema(tool.Name, tool.Description, rawSchema), handler)
	}
	return nil
}

func (tm *ToolManager) toolHandler(ctx context.Context, request mcp.CallToolRequest, mcpToolID string) (*mcp.CallToolResult, error) {
	requestJson := utils.ObjectToJSON(request)
	if mcpToolID == "" {
		// If mcpToolID is empty, return an error indicating the tool is unrecognized
		errMsg := fmt.Sprintf("[agent-operator-app.tool_manager#toolHandler]Unrecognized tool, request: %s", requestJson)
		tm.logger.Error(errMsg)
		return mcp.NewToolResultError(errMsg), nil
	}

	// 将arguments反序列化为MCPToolArguments
	var toolArgs interfaces.MCPToolArguments
	err := request.BindArguments(&toolArgs)
	if err != nil {
		errMsg := fmt.Sprintf("[agent-operator-app.tool_manager#toolHandler]bad request, Please check if the parameters are correct, Failed to bind arguments, mcpToolID: %s,request: %s, error: %+v", mcpToolID, requestJson, err)
		tm.logger.Error(errMsg)
		return mcp.NewToolResultError(errMsg), nil
	}

	execReq, err := toolArgs.ToMCPExecuteToolRequest()
	if err != nil {
		errMsg := fmt.Sprintf("[agent-operator-app.tool_manager#toolHandler]Failed to convert tool arguments to MCPExecuteToolRequest, mcpToolID: %s,request: %s, error: %+v", mcpToolID, requestJson, err)
		tm.logger.Error(errMsg)
		return mcp.NewToolResultError(errMsg), nil
	}

	// 调用mcpToolID对应的工具
	result, err := tm.operatorIntegration.ExecuteTool(ctx, mcpToolID, execReq)
	if err != nil {
		errMsg := fmt.Sprintf("[agent-operator-app.tool_manager#toolHandler]Failed to execute tool, mcpToolID: %s,request: %s, error: %+v", mcpToolID, requestJson, err)
		tm.logger.Error(errMsg)
		return mcp.NewToolResultError(errMsg), nil
	}
	return mcp.NewToolResultText(utils.ObjectToJSON(result)), nil
}
