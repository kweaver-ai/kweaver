package squarereq

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
)

// Agent 详情请求对象
type AgentInfoReq struct {
	UserID       string
	AgentID      string
	AgentVersion string
	IsVisit      bool

	CustomSpaceID string `json:"custom_space_id"`
}

// Agent 应用广场请求对象
type AgentSquareAgentReq struct {
	Name        string              `json:"name"`
	CategoryID  string              `json:"category_id"`
	ReleaseIDS  []string            `json:"release_ids"`
	PublishToBe cdaenum.PublishToBe `json:"publish_to_be"`
	common.PageSize
}

// 个人空间 Agent 请求对象
type AgentSquareMyAgentReq struct {
	UserID                    string `json:"user_id"`
	Name                      string `json:"name"`
	ShouldContainBuiltInAgent bool
	common.PageSize
}

// 最近访问 Agent 请求对象
type AgentSquareRecentAgentReq struct {
	UserID    string
	Name      string `json:"name"`
	StartTime int64  `json:"start_time"`
	EndTime   int64  `json:"end_time"`
	common.PageSize
}
