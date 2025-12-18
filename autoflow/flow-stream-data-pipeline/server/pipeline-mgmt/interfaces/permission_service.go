package interfaces

import "context"

type AccountInfo struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	Name string `json:"name"`
}

//go:generate mockgen -source ../interfaces/permission_service.go -destination ../interfaces/mock/mock_permission_service.go
type PermissionService interface {
	CheckPermission(ctx context.Context, resource Resource, ops []string) error
	CreateResources(ctx context.Context, resources []Resource, ops []string) error
	DeleteResources(ctx context.Context, resourceType string, ids []string) error
	FilterResources(ctx context.Context, resourceType string, ids []string,
		ops []string, allowOperation bool) (map[string]ResourceOps, error)
	UpdateResource(ctx context.Context, resource Resource) error
}
