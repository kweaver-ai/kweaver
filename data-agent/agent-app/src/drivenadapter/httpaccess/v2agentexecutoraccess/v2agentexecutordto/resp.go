package v2agentexecutordto

// V2AgentCallResp v2 版本的 Agent 调用响应
type V2AgentCallResp struct {
	Answer interface{} `json:"answer"`
	Status string      `json:"status"`
}

// V2AgentDebugResp v2 版本的 Agent Debug 响应
type V2AgentDebugResp struct {
	Answer interface{} `json:"answer"`
	Status string      `json:"status"`
}
