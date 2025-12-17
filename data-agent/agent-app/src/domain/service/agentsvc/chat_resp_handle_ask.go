package agentsvc

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/agentrespvo/daresvo"

// 首先尝试从原始数据中提取ask信息
func (agentSvc *agentSvc) ask(result *daresvo.DataAgentRes) (ask interface{}, err error) {
	_ask := result.Ask

	if _ask == nil {
		return
	}

	if askData, ok1 := _ask.(map[string]interface{}); ok1 {
		if sessionID, ok2 := askData["session_id"].(string); ok2 && sessionID != "" {
			ask = askData
		}
	}

	return
}
