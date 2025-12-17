package interfaces

import (
	"context"
	"io"
)

// Validator 验证接口
// 用于验证算子名称、描述、单次导入个数、导入数据大小等
//
//go:generate mockgen -source=logics.go -destination=../mocks/logics.go -package=mocks
type Validator interface {
	ValidateOperatorName(ctx context.Context, name string) (err error)
	ValidateOperatorDesc(ctx context.Context, desc string) (err error)
	ValidateOperatorImportCount(ctx context.Context, count int64) (err error)
	ValidateOperatorImportSize(ctx context.Context, size int64) (err error)
	ValidatorToolBoxName(ctx context.Context, name string) (err error)
	ValidatorToolBoxDesc(ctx context.Context, desc string) (err error)
	ValidatorToolName(ctx context.Context, name string) (err error)
	ValidatorToolDesc(ctx context.Context, desc string) (err error)
	ValidatorIntCompVersion(ctx context.Context, version string) (err error)
	ValidatorMCPName(ctx context.Context, name string) (err error)
	ValidatorMCPDesc(ctx context.Context, desc string) (err error)
	ValidatorCategoryName(ctx context.Context, name string) (err error)
	ValidatorStruct(ctx context.Context, obj interface{}) (err error)
}

// ProxyHandler 代理处理器
type ProxyHandler interface {
	HandlerRequest(ctx context.Context, req *HTTPRequest) (resp *HTTPResponse, err error)
}

// IOutboxMessageEvent 消息事件管理
type IOutboxMessageEvent interface {
	Publish(ctx context.Context, req *OutboxMessageReq) (err error)
}

// Forwarder 转发器接口
type Forwarder interface {
	Forward(ctx context.Context, req *HTTPRequest) (*HTTPResponse, error)
	ForwardStream(ctx context.Context, req *HTTPRequest) (*HTTPResponse, error)
}

// StreamProcessor 流式处理器接口
type StreamProcessor interface {
	ProcessSSE(ctx context.Context, reader io.Reader, writer io.Writer) error
	ProcessHTTPStream(ctx context.Context, reader io.Reader, writer io.Writer) error
}
