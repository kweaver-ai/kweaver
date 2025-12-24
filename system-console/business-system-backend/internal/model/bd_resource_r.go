package model

import "gorm.io/gorm"

type BDResourceR struct {
	gorm.Model
	DBID         string `gorm:"column:f_bd_id"`
	ResourceID   string `gorm:"column:f_resource_id"`
	ResourceType string `gorm:"column:f_resource_type"`
	CreateBy     string `gorm:"column:f_create_by"`
}

func (BDResourceR) TableName() string {
	return "t_bd_resource_r"
}
