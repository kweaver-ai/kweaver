package dapo

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"

type DataAgentPo struct {
	ID   string `json:"id" db:"f_id"`
	Name string `json:"name" db:"f_name"`
	Key  string `json:"key" db:"f_key"`

	Profile *string `json:"profile" db:"f_profile"`

	AvatarType cdaenum.AvatarType `json:"avatar_type" db:"f_avatar_type"`
	Avatar     string             `json:"avatar" db:"f_avatar"`

	Status cdaenum.Status `json:"status" db:"f_status"`

	IsBuiltIn *cdaenum.BuiltIn `json:"is_built_in" db:"f_is_built_in"`

	ProductID int64 `json:"product_id" db:"f_product_id"`

	CreateTime int64 `json:"create_time" db:"f_create_time"`
	UpdateTime int64 `json:"update_time" db:"f_update_time"`

	CreateBy string `json:"create_by" db:"f_create_by"`
	UpdateBy string `json:"update_by" db:"f_update_by"`

	Config string `json:"config" db:"f_config"`
	// IndexKey string `json:"index_key" db:"f_index_key"`

	// 下面这些后面可能去掉
	CreateFrom      string `json:"create_from" db:"f_create_from"`
	EnableIntervene string `json:"enable_intervene" db:"f_enable_intervene"`
}

func (p *DataAgentPo) TableName() string {
	return "t_data_agent_config"
}
