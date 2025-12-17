package storage

import (
	"context"
	"net/http"
	"sync"

	infraerrors "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/utils"
)

type MemoryStore struct {
	instances map[string]*interfaces.MCPServerInstance
	mu        sync.RWMutex
}

var (
	memoryStore *MemoryStore
	storeOnce   sync.Once
)

func NewMemoryStore() *MemoryStore {
	storeOnce.Do(func() {
		memoryStore = &MemoryStore{
			instances: make(map[string]*interfaces.MCPServerInstance),
		}
	})
	return memoryStore
}

func (s *MemoryStore) Save(instance *interfaces.MCPServerInstance) error {
	key := utils.GenerateMCPKey(instance.Config.MCPID, instance.Config.Version)
	s.mu.Lock()
	defer s.mu.Unlock()
	exists := s.Exists(instance.Config.MCPID, instance.Config.Version)
	if exists {
		return infraerrors.NewHTTPError(context.Background(), http.StatusBadRequest, infraerrors.ErrExtMCPInstanceAlreadyExists, nil)
	}
	s.instances[key] = instance
	return nil
}

func (s *MemoryStore) Get(mcpID string, version int) (*interfaces.MCPServerInstance, error) {
	key := utils.GenerateMCPKey(mcpID, version)
	s.mu.RLock()
	defer s.mu.RUnlock()
	if instance, exists := s.instances[key]; exists {
		return instance, nil
	}
	return nil, infraerrors.NewHTTPError(context.Background(), http.StatusNotFound, infraerrors.ErrExtMCPInstanceNotFound, nil)
}

func (s *MemoryStore) Delete(mcpID string, version int) error {
	key := utils.GenerateMCPKey(mcpID, version)
	s.mu.Lock()
	defer s.mu.Unlock()
	exists := s.Exists(mcpID, version)
	if exists {
		delete(s.instances, key)
	}
	return nil
}

func (s *MemoryStore) Exists(mcpID string, version int) bool {
	key := utils.GenerateMCPKey(mcpID, version)
	_, exists := s.instances[key]
	return exists
}
