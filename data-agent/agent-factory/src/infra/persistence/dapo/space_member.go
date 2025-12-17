package dapo

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cenum"

type SpaceMemberPo struct {
	ID       int64            `json:"id" db:"f_id"`               // 自增主键id
	SpaceID  string           `json:"space_id" db:"f_space_id"`   // 空间id，t_space表的f_id
	SpaceKey string           `json:"space_key" db:"f_space_key"` // 空间唯一标识
	ObjType  cenum.OrgObjType `json:"obj_type" db:"f_obj_type"`   // 组织对象类型，枚举值：user-个人，dept-部门，user_group-用户组
	ObjID    string           `json:"obj_id" db:"f_obj_id"`       // 组织对象的唯一标识

	CreatedBy string `json:"created_by" db:"f_created_by"` // 创建者id
	CreatedAt int64  `json:"created_at" db:"f_created_at"` // 创建时间
}

func (p *SpaceMemberPo) TableName() string {
	return "t_custom_space_member"
}
