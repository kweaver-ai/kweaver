package pubedeo

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj"
)

// 已发布智能体配置实体对象
type PublishedAgentEo struct {
	dapo.PublishedJoinPo

	Config *daconfvalobj.Config `json:"config"`

	// CreatedByName string `json:"created_by_name"` // 创建人名称
	// UpdatedByName string `json:"updated_by_name"` // 更新人名称

	PublishedByName string `json:"published_by_name"` // 发布人名称
}
