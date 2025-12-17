package model

import (
	"context"
	"database/sql"
)

type ResourceDeployDB struct {
	ID          int64  `json:"f_id" db:"f_id"`                   // 自增主键
	ResourceID  string `json:"f_resource_id" db:"f_resource_id"` // 资源ID
	Type        string `json:"f_type" db:"f_type"`               // 资源类型
	Version     int    `json:"f_version" db:"f_version"`         // 资源版本
	Name        string `json:"f_name" db:"f_name"`               // 资源名称
	Description string `json:"f_description" db:"f_description"` // 资源描述
	Config      string `json:"f_config" db:"f_config"`           // 资源配置
	Status      string `json:"f_status" db:"f_status"`           // 资源状态
	CreateUser  string `json:"f_create_user" db:"f_create_user"` // 创建者
	CreateTime  int64  `json:"f_create_time" db:"f_create_time"` // 创建时间
	UpdateUser  string `json:"f_update_user" db:"f_update_user"` // 更新者
	UpdateTime  int64  `json:"f_update_time" db:"f_update_time"` // 更新时间
}

type DBResourceDeploy interface {
	// Insert 插入资源
	Insert(ctx context.Context, tx *sql.Tx, resourceDeploy *ResourceDeployDB) (ID string, err error)
	// Update 更新资源
	Update(ctx context.Context, tx *sql.Tx, resourceDeploy *ResourceDeployDB) error
	// Delete 删除资源
	Delete(ctx context.Context, tx *sql.Tx, resourceVersion int, resourceType, resourceID string) error
	// SelectList 查询资源列表
	SelectList(ctx context.Context, tx *sql.Tx, resourceDeploy *ResourceDeployDB) (list []*ResourceDeployDB, err error)
}
