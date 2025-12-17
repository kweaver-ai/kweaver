package publishvo

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/enum/daenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/pmsvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
)

type PublishInfo struct {
	CategoryIDs []string `json:"category_ids"` // 分类IDs
	Description string   `json:"description"`  // 发布描述

	PublishToWhere []daenum.PublishToWhere `json:"publish_to_where"` // 发布到的目标 ["custom_space", "square"]

	// CustomSpaceIDs []string `json:"custom_space_ids"` // 自定义空间ID列表

	PmsControl *pmsvo.PmsControlObjS `json:"pms_control"` // 权限控制信息

	PublishToBes []cdaenum.PublishToBe `json:"publish_to_bes"` // 发布为什么 ["skill_agent", "api_agent", "web_sdk_agent", "agent_tpl"]
}
