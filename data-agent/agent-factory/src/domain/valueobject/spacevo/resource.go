package spacevo

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"

type ResourceUniq struct {
	ResourceType cdaenum.ResourceType `json:"resource_type"` // 资源对象类型，如：data_agent等
	ResourceID   string               `json:"resource_id"`   // 资源的唯一标识
}

type ResourceAssoc struct {
	ResourceUniq
	AssocID int64 `json:"assoc_id"` // 资源关联ID
}
