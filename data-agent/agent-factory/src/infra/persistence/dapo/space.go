package dapo

type SpacePo struct {
	ID      string `json:"id" db:"f_id"`           // 唯一id
	Name    string `json:"name" db:"f_name"`       // 空间显示名称
	Key     string `json:"key" db:"f_key"`         // 空间唯一标识符，支持自动生成和人工设置
	Profile string `json:"profile" db:"f_profile"` // 空间简介说明

	CreatedBy string `json:"created_by" db:"f_created_by"` // 创建者id
	CreatedAt int64  `json:"created_at" db:"f_created_at"` // 创建时间

	UpdatedBy string `json:"updated_by" db:"f_updated_by"` // 修改者id
	UpdatedAt int64  `json:"updated_at" db:"f_updated_at"` // 更新时间

	DeletedBy string `json:"deleted_by" db:"f_deleted_by"` // 删除者id
	DeletedAt int64  `json:"deleted_at" db:"f_deleted_at"` // 删除时间
}

func (p *SpacePo) TableName() string {
	return "t_custom_space"
}
