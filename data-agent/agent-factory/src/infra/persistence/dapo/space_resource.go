package dapo

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"

type SpaceResourcePo struct {
	ID           int64                `json:"id" db:"f_id"`                       // 自增主键id
	SpaceID      string               `json:"space_id" db:"f_space_id"`           // 空间id，t_space表的f_id
	SpaceKey     string               `json:"space_key" db:"f_space_key"`         // 空间唯一标识
	ResourceType cdaenum.ResourceType `json:"resource_type" db:"f_resource_type"` // 资源对象类型，如：data_agent等
	ResourceID   string               `json:"resource_id" db:"f_resource_id"`     // 资源的唯一标识

	CreatedBy string `json:"created_by" db:"f_created_by"` // 创建者id
	CreatedAt int64  `json:"created_at" db:"f_created_at"` // 创建时间
}

func (p *SpaceResourcePo) TableName() string {
	return "t_custom_space_resource"
}
