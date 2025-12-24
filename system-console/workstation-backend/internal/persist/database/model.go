package database

import (
	"workstation-backend/internal/model"

	"gorm.io/gorm"
)

type MicroWebappRecord struct {
	gorm.Model
	Name     string `gorm:"column:name;unique;not null"`
	Parent   string `gorm:"column:parent;not null;default:''"`
	Type     string `gorm:"column:type;not null;default:normal"`
	Manifest string `gorm:"column:manifest;type:text;not null"`
}

func (MicroWebappRecord) TableName() string {
	return "micro_webapp_records"
}

const (
	MicroWebappRecordTypeInline  = model.WebAppTypeInline
	MicroWebappRecordTypeNormal  = model.WebAppTypeNormal
	MicroWebappRecordTypeBuiltin = model.WebAppTypeBuiltin
	MicroWebappRecordTypeCustom  = model.WebAppTypeCustom
)

type MicroWebappOverride struct {
	gorm.Model
	UID    string `gorm:"column:uid;type:varchar(255);uniqueIndex:uid_appconfig_unique;not null"`
	Name   string `gorm:"column:name;type:varchar(255);uniqueIndex:uid_appconfig_unique;not null"`
	Parent string `gorm:"column:parent;type:varchar(255);not null;default:''"`
	// 非内联才能修改 Parent
	Manifest string `gorm:"column:manifest;type:text;not null"`
}

func (MicroWebappOverride) TableName() string {
	return "micro_webapp_overrides"
}
