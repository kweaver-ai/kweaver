package squareresp

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/daconfeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/pubedeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj"
)

type AgentMarketAgentInfoResp struct {
	daconfeo.DataAgent
	CategoryId    string              `json:"category_id"`
	CategoryName  string              `json:"category_name"`
	Version       string              `json:"version"`
	LatestVersion string              `json:"latest_version"`
	Description   string              `json:"description"`
	Config        daconfvalobj.Config `json:"config"`

	PublishedAt int64 `json:"published_at"`

	// PublishUserInfo UserInfo            `json:"publish_user_info"`

	PublishedBy     string `json:"published_by"`
	PublishedByName string `json:"published_by_name"`

	// UpdateUserInfo  UserInfo            `json:"update_user_info"`

	PublishInfo *pubedeo.AgentPublishedInfoEo `json:"publish_info"` // 发布信息
}

func NewAgentMarketAgentInfoResp() *AgentMarketAgentInfoResp {
	return &AgentMarketAgentInfoResp{
		PublishInfo: &pubedeo.AgentPublishedInfoEo{},
	}
}
