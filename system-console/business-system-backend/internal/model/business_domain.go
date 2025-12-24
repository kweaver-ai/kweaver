package model

import (
	"gorm.io/gorm"
)

type BusinessDomain struct {
	gorm.Model
	BDID          string `gorm:"column:f_bd_id;unique"`
	BDName        string `gorm:"column:f_bd_name;uniqueIndex"`
	BDDescription string `gorm:"column:f_bd_description"`
	BDCreator     string `gorm:"column:f_bd_creator"`
	// 以下字段为冗余字段
	BDIcon          string `gorm:"column:f_bd_icon"`           // 默认""
	BDStatus        int    `gorm:"column:f_bd_status"`         // 默认1
	BDResourceCount int    `gorm:"column:f_bd_resource_count"` // 默认0
	BDMemberCount   int    `gorm:"column:f_bd_member_count"`   // 默认0
}

const (
	MemberRoleAdminitrator = "administrator"
	MemberRoleDeveloper    = "developer"

	CreatorSystem = "-"
)

func (BusinessDomain) TableName() string {
	return "t_business_domain"
}
