package drivenadapters

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	infraErr "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
)

type agentOperatorApp struct {
	logger     interfaces.Logger
	httpClient interfaces.HTTPClient
	baseURL    string
}

var (
	agentOperatorAppOnce   sync.Once
	agentOperatorAppHandle *agentOperatorApp
)

const (
	createMCPInstanceURI = "/internal-v1/mcp/instance/create"
	deleteMCPInstanceURI = "/internal-v1/mcp/instance/delete/%s/%d"
	updateMCPInstanceURI = "/internal-v1/mcp/instance/update/%s/%d"
)

func NewAgentOperatorApp() interfaces.AgentOperatorApp {
	agentOperatorAppOnce.Do(func() {
		config := config.NewConfigLoader()
		agentOperatorAppHandle = &agentOperatorApp{
			logger:     config.GetLogger(),
			httpClient: rest.NewHTTPClient(),
			baseURL: fmt.Sprintf("%s://%s:%d/api/agent-operator-app", config.AgentOperatorApp.PrivateProtocol,
				config.AgentOperatorApp.PrivateHost, config.AgentOperatorApp.PrivatePort),
		}
	})
	return agentOperatorAppHandle
}

func (a *agentOperatorApp) CreateMCPInstance(ctx context.Context, req *interfaces.MCPInstanceCreateRequest) (*interfaces.MCPInstanceCreateResponse, error) {
	url := fmt.Sprintf("%s%s", a.baseURL, createMCPInstanceURI)
	header := common.GetHeaderFromCtx(ctx)
	header["Content-Type"] = "application/json"
	_, respBody, err := a.httpClient.Post(ctx, url, header, req)
	if err != nil {
		a.logger.WithContext(ctx).Warnf("[CreateMCPInstance] create mcp instance failed, err: %v", err)
		return nil, err
	}
	resp := &interfaces.MCPInstanceCreateResponse{}
	resultByt := utils.ObjectToByte(respBody)
	err = json.Unmarshal(resultByt, resp)
	if err != nil {
		a.logger.WithContext(ctx).Errorf("[CreateMCPInstance] Unmarshal %s err:%v", string(resultByt), err)
		err = infraErr.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
	}
	return resp, nil
}

func (a *agentOperatorApp) DeleteMCPInstance(ctx context.Context, mcpID string, mcpVersion int) error {
	url := fmt.Sprintf("%s%s", a.baseURL, fmt.Sprintf(deleteMCPInstanceURI, mcpID, mcpVersion))
	header := common.GetHeaderFromCtx(ctx)
	header["Content-Type"] = "application/json"
	respCode, _, err := a.httpClient.Delete(ctx, url, header)
	if respCode == http.StatusNotFound {
		return nil
	}
	if err != nil {
		a.logger.WithContext(ctx).Warnf("[DeleteMCPInstance] delete mcp instance failed, err: %v", err)
		return err
	}
	return err
}

func (a *agentOperatorApp) UpdateMCPInstance(ctx context.Context, mcpID string, mcpVersion int, req *interfaces.MCPInstanceUpdateRequest) (*interfaces.MCPInstanceUpdateResponse, error) {
	url := fmt.Sprintf("%s%s", a.baseURL, fmt.Sprintf(updateMCPInstanceURI, mcpID, mcpVersion))
	header := common.GetHeaderFromCtx(ctx)
	header["Content-Type"] = "application/json"
	_, respBody, err := a.httpClient.Put(ctx, url, header, req)
	if err != nil {
		a.logger.WithContext(ctx).Warnf("[UpdateMCPInstance] update mcp instance failed, err: %v", err)
		return nil, err
	}
	resp := &interfaces.MCPInstanceUpdateResponse{}
	resultByt := utils.ObjectToByte(respBody)
	err = json.Unmarshal(resultByt, resp)
	if err != nil {
		a.logger.WithContext(ctx).Errorf("[UpdateMCPInstance] Unmarshal %s err:%v", string(resultByt), err)
		err = infraErr.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
	}
	return resp, nil
}
