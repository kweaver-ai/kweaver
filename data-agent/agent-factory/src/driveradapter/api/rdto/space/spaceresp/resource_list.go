package spaceresp

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/spaceeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/agentvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"github.com/pkg/errors"
)

// ResourceListResp 空间资源列表响应
type ResourceListResp struct {
	Entries []*ResourceItem `json:"entries"` // 资源列表
}

// ResourceItem 空间资源列表项
type ResourceItem struct {
	ID           int64                `json:"id"`            // 资源关联ID
	SpaceID      string               `json:"space_id"`      // 空间ID
	ResourceType cdaenum.ResourceType `json:"resource_type"` // 资源对象类型，如：data_agent等
	ResourceID   string               `json:"resource_id"`   // 资源的唯一标识
	ResourceName string               `json:"resource_name"` // 资源名称

	PublishedAgentInfo *agentvo.PublishedAgentInfo `json:"published_agent_info"` // 已发布智能体信息

	CreatedBy string `json:"created_by" db:"f_created_by"` // 创建者id
	CreatedAt int64  `json:"created_at" db:"f_created_at"` // 创建时间
}

func NewResourceListResp() *ResourceListResp {
	return &ResourceListResp{
		Entries: make([]*ResourceItem, 0),
	}
}

func (r *ResourceListResp) LoadFromEos(eos []*spaceeo.SpaceResource) error {
	for _, eo := range eos {
		item := &ResourceItem{}

		err := cutil.CopyStructUseJSON(item, eo)
		if err != nil {
			return errors.Wrap(err, "[ResourceListResp]: LoadFromEos failed")
		}

		r.Entries = append(r.Entries, item)
	}

	return nil
}
