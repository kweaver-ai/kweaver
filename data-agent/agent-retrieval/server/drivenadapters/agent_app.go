// Package drivenadapters
// file: agent_app.go
// desc: 智能体App接口
package drivenadapters

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/config"
	infraErr "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/utils"
)

type agentClient struct {
	logger      interfaces.Logger
	baseURL     string
	httpClient  interfaces.HTTPClient
	DeployAgent config.DeployAgentConfig
}

var (
	agentOnce sync.Once
	ag        interfaces.AgentApp
)

const (
	// https://{host}:{port}/api/agent-app/internal/v1/app/{app_key}/api/chat/completion
	chatURI = "/internal/v1/app/%s/api/chat/completion"
)

// NewAgentAppClient 新建AgentAppClient
func NewAgentAppClient() interfaces.AgentApp {
	agentOnce.Do(func() {
		configLoader := config.NewConfigLoader()
		ag = &agentClient{
			logger: configLoader.GetLogger(),
			baseURL: fmt.Sprintf("%s://%s:%d/api/agent-app",
				configLoader.AgentApp.PrivateProtocol,
				configLoader.AgentApp.PrivateHost,
				configLoader.AgentApp.PrivatePort),
			httpClient:  rest.NewHTTPClient(),
			DeployAgent: configLoader.DeployAgent,
		}
	})
	return ag
}

// APIChat 智能体API调用
func (a *agentClient) APIChat(ctx context.Context, req *interfaces.ChatRequest) (resp *interfaces.ChatResponse, err error) {
	url := fmt.Sprintf("%s%s", a.baseURL, fmt.Sprintf(chatURI, req.AgentKey))
	header := common.GetHeaderFromCtx(ctx)
	header[rest.ContentTypeKey] = rest.ContentTypeJSON
	_, respBody, err := a.httpClient.Post(ctx, url, header, req)
	if err != nil {
		a.logger.WithContext(ctx).Warnf("[AgentApp#ApiChat] ApiChat request failed, err: %v", err)
		return
	}

	resp = &interfaces.ChatResponse{}
	resultByt := utils.ObjectToByte(respBody)
	err = json.Unmarshal(resultByt, resp)
	if err != nil {
		a.logger.WithContext(ctx).Errorf("[AgentApp#ApiChat] Unmarshal %s err:%v", string(resultByt), err)
		err = infraErr.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
	}
	return
}

// ConceptIntentionAnalysisAgent 概念意图识分析智能体 app
func (a *agentClient) ConceptIntentionAnalysisAgent(ctx context.Context,
	req *interfaces.ConceptIntentionAnalysisAgentReq) (queryUnderstandResult *interfaces.QueryUnderstanding, err error) {
	customQuerys := make(map[string]any)
	if len(req.PreviousQueries) > 0 {
		customQuerys["previous_queries"] = req.PreviousQueries
		customQuerys["kn_id"] = req.KnID
	}
	chatReq := &interfaces.ChatRequest{
		AgentKey:     a.DeployAgent.ConceptIntentionAnalysisAgentKey,
		Stream:       false,
		Query:        req.Query,
		CustomQuerys: customQuerys,
		AgentVersion: "latest",
	}
	result, err := a.APIChat(ctx, chatReq)
	if err != nil {
		a.logger.WithContext(ctx).Errorf("[AgentApp#ConceptIntentionAnalysisAgent] APIChat err:%v", err)
		return
	}

	// 输出内容判断
	var text string
	if result != nil && result.Message != nil && result.Message.Content != nil && result.Message.Content.FinalAnswer != nil && result.Message.Content.FinalAnswer.Answer != nil {
		text = result.Message.Content.FinalAnswer.Answer.Text
	}

	// 解析输出内容
	resultStr, err := parseResultFromAgentV1Answer(text)
	if err != nil {
		a.logger.WithContext(ctx).Errorf("[AgentApp#ConceptIntentionAnalysisAgent] parseResultFromAgentV1Answer err:%v", err)
		err = infraErr.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	queryUnderstandResult = &interfaces.QueryUnderstanding{}
	err = json.Unmarshal([]byte(resultStr), queryUnderstandResult)
	if err != nil {
		a.logger.WithContext(ctx).Errorf("[AgentApp#ConceptIntentionAnalysisAgent] Unmarshal %s err:%v", resultStr, err)
		err = infraErr.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	return queryUnderstandResult, nil
}

// ConceptRetrievalStrategistAgent 概念召回策略智能体 app
func (a *agentClient) ConceptRetrievalStrategistAgent(ctx context.Context,
	req *interfaces.ConceptRetrievalStrategistReq) (queryStrategys []*interfaces.SemanticQueryStrategy, err error) {
	customQuerys := make(map[string]any)
	if len(req.PreviousQueries) > 0 {
		customQuerys["previous_queries"] = req.PreviousQueries
		customQuerys["kn_id"] = req.KnID
	}
	chatReq := &interfaces.ChatRequest{
		AgentKey:     a.DeployAgent.ConceptRetrievalStrategistAgentKey,
		Stream:       false,
		Query:        utils.ObjectToJSON(req.QueryParam),
		CustomQuerys: customQuerys,
	}
	result, err := a.APIChat(ctx, chatReq)
	if err != nil {
		a.logger.WithContext(ctx).Errorf("[AgentApp#ConceptIntentionAnalysisAgent] APIChat err:%v", err)
		return
	}
	// 输出内容判断
	var text string
	if result != nil && result.Message != nil && result.Message.Content != nil && result.Message.Content.FinalAnswer != nil && result.Message.Content.FinalAnswer.Answer != nil {
		text = result.Message.Content.FinalAnswer.Answer.Text
	}
	// 解析输出内容
	resultStr, err := parseResultFromAgentV1Answer(text)
	if err != nil {
		a.logger.WithContext(ctx).Errorf("[AgentApp#ConceptRetrievalStrategistAgent] parseResultFromAgentV1Answer err:%v", err)
		err = infraErr.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	queryUnderstanding := &interfaces.QueryUnderstanding{}
	err = json.Unmarshal([]byte(resultStr), queryUnderstanding)
	if err != nil {
		a.logger.WithContext(ctx).Errorf("[AgentApp#ConceptRetrievalStrategistAgent] Unmarshal %s err:%v", resultStr, err)
		err = infraErr.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	queryStrategys = queryUnderstanding.QueryStrategys
	return queryStrategys, nil
}

func parseResultFromAgentV1Answer(jsonStr string) (resultStr string, err error) {
	start := strings.Index(jsonStr, "{")
	end := strings.LastIndex(jsonStr, "}")
	if start == -1 || end == -1 {
		err = fmt.Errorf("invalid JSON format")
		return
	}

	jsonStr = jsonStr[start : end+1]

	// If the string contains escape characters, unescape them
	if strings.Contains(jsonStr, "\\n") || strings.Contains(jsonStr, "\\\"") {
		jsonStr = strings.ReplaceAll(jsonStr, "\\n", "\n")
		jsonStr = strings.ReplaceAll(jsonStr, "\\\"", "\"")
	}
	resultStr = jsonStr
	return
}
