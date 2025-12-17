// Package interfaces 定义接口
// @file api_metadata.go
// @description: 定义API元数据接口
package interfaces

import (
	"context"

	"github.com/getkin/kin-openapi/openapi3"
)

// APIMetadataEdit API元数据编辑
//
//go:generate mockgen -source=api_metadata.go -destination=../mocks/api_metadata.go -package=mocks
type APIMetadataEdit struct {
	Summary     string   `json:"summary" validate:"required"`    // 摘要
	Description string   `json:"description"`                    // 描述
	Path        string   `json:"path" validate:"required"`       // 路径
	Method      string   `json:"method" validate:"required"`     // 方法
	ServerURL   string   `json:"server_url" validate:"required"` // 服务URL
	APISpec     *APISpec `json:"api_spec"`                       // OpenAPI 格式
}

// APIMetadata API元数据
type APIMetadata struct {
	Version     string      `json:"version" validate:"required"`     // 版本
	Summary     string      `json:"summary" validate:"required"`     // 摘要
	Description string      `json:"description"`                     // 描述
	ServerURL   string      `json:"server_url" validate:"required"`  // 服务URL
	Path        string      `json:"path" validate:"required"`        // 路径
	Method      string      `json:"method" validate:"required"`      // 方法
	CreateTime  int64       `json:"create_time" validate:"required"` // 创建时间
	UpdateTime  int64       `json:"update_time" validate:"required"` // 更新时间
	CreateUser  string      `json:"create_user" validate:"required"` // 创建人
	UpdateUser  string      `json:"update_user" validate:"required"` // 更新人
	APISpec     interface{} `json:"api_spec" validate:"required"`    // OpenAPI 格式
}

// OpenAPIContent OpenAPI内容
type OpenAPIContent struct {
	SererURL string `json:"server_url" validate:"required"` // 服务器URL
	// Info 信息
	// @description: 信息
	Info *openapi3.Info `json:"info"`
	// PathItems 路径项内容
	// @description: 路径项内容
	PathItems []*PathItemContent `json:"path_items"`
}

// PathItemContent 路径项内容
type PathItemContent struct {
	Summary     string  `json:"summary" validate:"required"`
	Path        string  `json:"path" validate:"required"`
	Method      string  `json:"method" validate:"required"`
	Description string  `json:"description"`
	APISpec     APISpec `json:"api_spec"`
	ServerURL   string  `json:"server_url" validate:"required"` // 服务器URL
	ErrMessage  string  `json:"err_message,omitempty"`
}

// APISpec OpenAPI 格式
type APISpec struct {
	Parameters   []*Parameter `json:"parameters"`    // 结构化参数
	RequestBody  *RequestBody `json:"request_body"`  // 请求体结构
	Responses    []*Response  `json:"responses"`     // 响应结构
	Components   *Components  `json:"components"`    // 组件定义
	Callbacks    interface{}  `json:"callbacks"`     // 回调函数定义
	Security     interface{}  `json:"security"`      // 安全要求
	Tags         []string     `json:"tags"`          // 标签
	ExternalDocs interface{}  `json:"external_docs"` // 外部文档
}

// Components 组件定义
type Components struct {
	Schemas interface{} `json:"schemas"` // 引用的结构体定义
}

// Parameter 参数类型
type Parameter struct {
	Name        string              `json:"name"`
	In          string              `json:"in"` // path/query/header/cookie
	Description string              `json:"description"`
	Required    bool                `json:"required"`
	Schema      *openapi3.SchemaRef `json:"schema,omitempty"`
	Example     any                 `json:"example,omitempty"`
	Examples    openapi3.Examples   `json:"examples,omitempty"`
	Content     openapi3.Content    `json:"content,omitempty"`
}

// RequestBody 请求体结构
type RequestBody struct {
	Description string           `json:"description"`
	Content     openapi3.Content `json:"content"` // 按媒体类型分类
	Required    bool             `json:"required"`
}

// Response 响应结构
type Response struct {
	StatusCode  string           `json:"status_code"` // 200/400等
	Description string           `json:"description"`
	Content     openapi3.Content `json:"content"`
}

// IOpenAPIParser 解析器
type IOpenAPIParser interface {
	GetPathItems(ctx context.Context, data []byte) (items []*PathItemContent, err error)
	GetAllContent(ctx context.Context, data []byte) (content *OpenAPIContent, err error)
	// 获取指定路径项内容
	GetPathItemContent(ctx context.Context, data []byte, path, method string) (item *PathItemContent, err error)
}
