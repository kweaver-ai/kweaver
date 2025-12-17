package afresvo

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/agentresperr"
	agentresp "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/resp"
	"github.com/bytedance/sonic"
)

type AgentFactoryError struct {
	Description  string `json:"Description"`
	ErrorCode    string `json:"ErrorCode"`
	ErrorDetails string `json:"ErrorDetails"`
	Solution     string `json:"Solution"`
}

func NewAgentFactoryError() *AgentFactoryError {
	return &AgentFactoryError{}
}

func IsAgentFactoryError(data []byte) (afErr AgentFactoryError, isErr bool) {
	if err := sonic.Unmarshal(data, &afErr); err != nil {
		return
	}

	isErr = afErr.ErrorCode != ""

	return
}

func HandleAFErrorForChatProcess(data []byte) (newData []byte, isErr bool) {
	afErr, isErr := IsAgentFactoryError(data)
	if !isErr {
		return
	}
	chatResponse := &agentresp.ChatResp{}

	respErr := agentresperr.NewRespError(agentresperr.RespErrorTypeAgentFactory, afErr)

	chatResponse.Message.Ext["error"] = respErr

	newData, _ = sonic.Marshal(chatResponse)

	return
}
