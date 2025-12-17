// Package model 定义数据库操作接口
// @file api_metadata.go
// @description: 定义t_metadata_api表操作接口
package model

//go:generate mockgen -source=api_metadata.go -destination=../../mocks/model_api_metadata.go -package=mocks
import (
	"context"
	"database/sql"
)

// APIMetadataDB API元数据数据库
type APIMetadataDB struct {
	ID          int64  `json:"f_id" db:"f_id"`
	Summary     string `json:"f_summary" db:"f_summary"`
	Version     string `json:"f_version" db:"f_version"`
	Description string `json:"f_description" db:"f_description"`
	Path        string `json:"f_path" db:"f_path"`
	ServerURL   string `json:"f_svc_url" db:"f_svc_url"`
	Method      string `json:"f_method" db:"f_method"`
	APISpec     string `json:"f_api_spec" db:"f_api_spec"`
	CreateUser  string `json:"f_create_user" db:"f_create_user"`
	CreateTime  int64  `json:"f_create_time" db:"f_create_time"`
	UpdateUser  string `json:"f_update_user" db:"f_update_user"`
	UpdateTime  int64  `json:"f_update_time" db:"f_update_time"`
}

// IAPIMetadataDB API元数据数据库
type IAPIMetadataDB interface {
	InsertAPIMetadata(ctx context.Context, tx *sql.Tx, metadata *APIMetadataDB) (version string, err error)
	SelectByVersion(ctx context.Context, version string) (has bool, metadata *APIMetadataDB, err error)
	UpdateByVersion(ctx context.Context, tx *sql.Tx, version string, metadata *APIMetadataDB) error
	UpdateByID(ctx context.Context, tx *sql.Tx, id int64, metadata *APIMetadataDB) error
	DeleteByVersion(ctx context.Context, tx *sql.Tx, version string) error
	DeleteByVersions(ctx context.Context, tx *sql.Tx, versions []string) error
	InsertAPIMetadatas(ctx context.Context, tx *sql.Tx, metadatas []*APIMetadataDB) (versions []string, err error)
	SelectListByVersion(ctx context.Context, versions []string) ([]*APIMetadataDB, error)
}
