package auditlog

import "context"

// AuditLogInterface 定义审计日志服务接口
type AuditLogInterface interface {
	// Health 健康检查
	Health() error

	// SetOperator 设置操作者信息
	SetOperator(o *Toperator)

	// SLog 发送审计日志
	SLog(ctx context.Context, msg BDMessage) error
}

// 确保 AuditLog 实现了 AuditLogInterface
var _ AuditLogInterface = (*AuditLog)(nil)
