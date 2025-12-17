package drivenadapters

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/utils"
)

type operatorIntegration struct {
	logger     interfaces.Logger
	httpClient interfaces.HTTPClient
	baseURL    string
}

var (
	operatorIntegrationHandle *operatorIntegration
	operatorIntegrationOnce   sync.Once
)

const (
	operatorIntegrationPath = "/internal-v1/mcp/execute/tool/%s"
)

func NewOperatorIntegration() interfaces.AgentOperatorIntegration {
	operatorIntegrationOnce.Do(func() {
		config := config.NewConfigLoader()
		operatorIntegrationHandle = &operatorIntegration{
			logger:     config.GetLogger(),
			httpClient: rest.NewHTTPClient(),
			baseURL: fmt.Sprintf("%s://%s:%d/api/agent-operator-integration", config.OperatorIntegration.PrivateProtocol,
				config.OperatorIntegration.PrivateHost, config.OperatorIntegration.PrivatePort),
		}
	})
	return operatorIntegrationHandle
}

// ExecuteTool 执行MCP工具
func (o *operatorIntegration) ExecuteTool(ctx context.Context, mcpToolID string, req *interfaces.MCPExecuteToolRequest) (resp *interfaces.HTTPResponse, err error) {
	url := fmt.Sprintf("%s%s", o.baseURL, fmt.Sprintf(operatorIntegrationPath, mcpToolID))
	header := common.GetHeaderFromCtx(ctx)
	header["Content-Type"] = "application/json"
	_, respBody, err := o.httpClient.Post(ctx, url, header, req)
	if err != nil {
		o.logger.WithContext(ctx).Warnf("[agent-operator-integration] ExecuteTool error: %v", err)
		return
	}
	resp = &interfaces.HTTPResponse{}
	resultByt := utils.ObjectToByte(respBody)
	err = json.Unmarshal(resultByt, resp)
	if err != nil {
		o.logger.WithContext(ctx).Warnf("[agent-operator-integration] ExecuteTool error: %v", err)
		return
	}

	return
}
