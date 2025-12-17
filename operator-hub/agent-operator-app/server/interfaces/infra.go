package interfaces

import (
	"context"
	"net/url"
)

// ContextKey Context Value Key
//
//go:generate mockgen -source=infra.go -destination=../mocks/infra.go -package=mocks
type ContextKey string

const (
	// KeyToken context中token key
	KeyToken ContextKey = "token"
	// KeyIP context中ip key
	KeyIP ContextKey = "ip"
	// OperationID API操作唯一标识
	OperationID ContextKey = "operationID"
	// XLanguageKey 语言类型
	XLanguageKey ContextKey = "X-Language"
	// FileNameKey 文件名
	FileNameKey ContextKey = "FileName"
	// Headers header 请求参数
	Headers ContextKey = "headers"
	// UserAgent user agent
	UserAgent ContextKey = "User-Agent"
	// KeyTokenInfo token信息
	// KeyTokenInfo ContextKey = "Token-Info"
	// KeyAccountAuthContext 账户认证上下文
	KeyAccountAuthContext ContextKey = "account_auth_context"
)

// HeaderKey 上下文键
type HeaderKey string

const (
	// HeaderXAccountID 账户ID头参数
	HeaderXAccountID HeaderKey = "x-account-id"
	// HeaderXAccountType 账户类型头参数
	HeaderXAccountType HeaderKey = "x-account-type"
	// HeaderUserID 用户ID
	HeaderUserID HeaderKey = "user_id"
)

// Logger 日志接口
type Logger interface {
	Debug(v ...interface{})
	Info(v ...interface{})
	Warn(v ...interface{})
	Error(v ...interface{})
	Debugf(format string, v ...interface{})
	Infof(format string, v ...interface{})
	Warnf(format string, v ...interface{})
	Errorf(format string, v ...interface{})
	Output(calldepth int, s string) error
	WithContext(ctx context.Context) Logger
}

// HTTPClient HTTP客户端服务接口
type HTTPClient interface {
	Get(ctx context.Context, url string, queryValues url.Values, headers map[string]string) (respCode int, respData interface{}, err error)
	GetNoUnmarshal(ctx context.Context, url string, queryValues url.Values, headers map[string]string) (respCode int, respBody []byte, err error)
	Delete(ctx context.Context, url string, headers map[string]string) (respCode int, respData interface{}, err error)
	DeleteNoUnmarshal(ctx context.Context, url string, headers map[string]string) (respCode int, respBody []byte, err error)
	Post(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respData interface{}, err error)
	PostNoUnmarshal(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respBody []byte, err error)
	Put(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respData interface{}, err error)
	PutNoUnmarshal(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respBody []byte, err error)
	Patch(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respData interface{}, err error)
	PatchNoUnmarshal(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respBody []byte, err error)
}
