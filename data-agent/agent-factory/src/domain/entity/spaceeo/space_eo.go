package spaceeo

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
)

// Space 空间实体对象
type Space struct {
	dapo.SpacePo

	CreatedByName string `json:"created_by_name"` // 创建者名称
	UpdatedByName string `json:"updated_by_name"` // 更新者名称
}

// GetObjName 获取对象名称
func (s *Space) GetObjName() string {
	return s.Name
}

// AuditMngLogCreate 创建空间的审计日志
func (s *Space) AuditMngLogCreate(ctx context.Context) {
	// 实现审计日志创建逻辑
}

// AuditMngLogUpdate 更新空间的审计日志
func (s *Space) AuditMngLogUpdate(ctx context.Context) {
	// 实现审计日志更新逻辑
}

// AuditMngLogDelete 删除空间的审计日志
func (s *Space) AuditMngLogDelete(ctx context.Context) {
	// 实现审计日志删除逻辑
}
