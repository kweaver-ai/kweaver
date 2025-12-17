package daresvo

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/agentresperr"
)

func (r *DataAgentRes) GetExecutorError() (respErr *agentresperr.RespError) {
	if r.Error == nil {
		return
	}

	respErr = agentresperr.NewRespError(agentresperr.RespErrorTypeAgentExecutor, r.Error)

	return
}
