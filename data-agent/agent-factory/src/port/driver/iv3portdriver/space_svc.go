package iv3portdriver

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/auditlogdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/space/spacereq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/space/spaceresp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
)

//go:generate mockgen -source=./space_svc.go -destination ./iv3portdrivermock/space_svc.go -package iv3portdrivermock

// ISpaceService 空间服务接口
type ISpaceService interface {
	// --- 基础 start ---
	// List 获取空间列表
	List(ctx context.Context, req *spacereq.ListReq) (resp *spaceresp.ListResp, err error)

	// Create 创建空间
	Create(ctx context.Context, req *spacereq.CreateReq) (resp *spaceresp.CreateResp, err error)

	// Detail 获取空间详情
	Detail(ctx context.Context, spaceID string) (resp *spaceresp.DetailResp, err error)

	// Update 更新空间
	Update(ctx context.Context, spaceID string, req *spacereq.UpdateReq) (auditloginfo auditlogdto.CustomSpaceUpdateAuditLogInfo, err error)

	// Delete 删除空间
	Delete(ctx context.Context, spaceID string) (auditloginfo auditlogdto.CustomSpaceDeleteAuditLogInfo, err error)

	// --- 基础 end ---

	//  --- 成员 start ---
	// GetMembers 获取空间成员列表
	GetMembers(ctx context.Context, spaceID string, req *spacereq.MemberListReq) (resp *spaceresp.MemberListResp, err error)

	// AddMembers 添加空间成员
	AddMembers(ctx context.Context, spaceID string, req *spacereq.AddMembersReq) (resp *spaceresp.AddMembersResp, auditloginfo auditlogdto.CustomSpaceUpdateAuditLogInfo, err error)

	// RemoveMember 删除空间成员
	RemoveMember(ctx context.Context, spaceID string, memberID int64) (auditloginfo auditlogdto.CustomSpaceUpdateAuditLogInfo, err error)

	// IsMemberExists 检查空间成员是否存在
	IsMemberExists(ctx context.Context, spaceID string, uid string) (exists bool, err error)

	// --- 成员 end ---

	// --- 资源 start ---

	// GetResources 获取空间资源列表
	GetAgentResources(ctx context.Context, spaceID string, req *spacereq.ResourceListReq) (resp *spaceresp.ResourceListResp, err error)

	// AddResources 添加空间资源
	AddResources(ctx context.Context, spaceID string, req *spacereq.AddResourcesReq) (resp *spaceresp.AddResourcesResp, auditloginfo auditlogdto.CustomSpaceUpdateAuditLogInfo, err error)

	// RemoveResource 删除空间资源
	RemoveResourceByAssocID(ctx context.Context, spaceID string, resourceID int64) (auditloginfo auditlogdto.CustomSpaceUpdateAuditLogInfo, err error)
	RemoveResourceByResourceTypeAndResourceID(ctx context.Context, spaceID string, resourceType cdaenum.ResourceType, resourceID string) (auditloginfo auditlogdto.CustomSpaceUpdateAuditLogInfo, err error)

	// --- 资源 end ---
}
