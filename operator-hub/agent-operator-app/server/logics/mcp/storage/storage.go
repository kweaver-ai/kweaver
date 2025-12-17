package storage

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
)

type Storage interface {
	Save(instance *interfaces.MCPServerInstance) error
	Get(mcpID string, version int) (*interfaces.MCPServerInstance, error)
	Delete(mcpID string, version int) error
	Exists(mcpID string, version int) bool
}
