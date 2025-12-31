package logics

import (
	"context"
	"fmt"
	"net/http"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	mqclient "devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-mq-go"
	"github.com/bytedance/sonic"

	"flow-stream-data-pipeline/common"
	serrors "flow-stream-data-pipeline/errors"
	"flow-stream-data-pipeline/pipeline-mgmt/interfaces"
)

var (
	pServiceOnce sync.Once
	pService     interfaces.PermissionService
)

type permissionService struct {
	appSetting *common.AppSetting
	mqClient   mqclient.ProtonMQClient
	pa         interfaces.PermissionAccess
}

func NewPermissionService(appSetting *common.AppSetting) interfaces.PermissionService {
	pServiceOnce.Do(func() {
		client, err := mqclient.NewProtonMQClient(appSetting.MQSetting.MQHost, appSetting.MQSetting.MQPort,
			appSetting.MQSetting.MQHost, appSetting.MQSetting.MQPort, appSetting.MQSetting.MQType,
			mqclient.UserInfo(appSetting.MQSetting.Auth.Username, appSetting.MQSetting.Auth.Password),
			mqclient.AuthMechanism(appSetting.MQSetting.Auth.Mechanism),
		)
		if err != nil {
			logger.Fatal("failed to create a proton mq client:", err)
		}
		pService = &permissionService{
			appSetting: appSetting,
			mqClient:   client,
			pa:         PA,
		}
	})
	return pService
}

func (ps *permissionService) CheckPermission(ctx context.Context, resource interfaces.Resource, ops []string) error {
	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}
	if accountInfo.ID == "" || accountInfo.Type == "" {
		return rest.NewHTTPError(ctx, http.StatusForbidden, rest.PublicError_Forbidden).
			WithErrorDetails("Access denied: missing account ID or type")
	}

	ok, err := ps.pa.CheckPermission(ctx, interfaces.PermissionCheck{
		Accessor: interfaces.Accessor{
			ID:   accountInfo.ID,
			Type: accountInfo.Type,
		},
		Resource:   resource,
		Operations: ops,
	})

	if err != nil {
		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			serrors.StreamDataPipeline_InternalError_CheckPermissionFailed).WithErrorDetails(err)
	}

	if !ok {
		return rest.NewHTTPError(ctx, http.StatusForbidden, rest.PublicError_Forbidden).
			WithErrorDetails(fmt.Sprintf("Access denied: insufficient permissions for[%v]", ops))
	}
	return nil
}

// 添加资源权限（新建决策）
func (ps *permissionService) CreateResources(ctx context.Context, resources []interfaces.Resource, ops []string) error {
	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}
	if accountInfo.ID == "" || accountInfo.Type == "" {
		return rest.NewHTTPError(ctx, http.StatusForbidden, rest.PublicError_Forbidden).
			WithErrorDetails("Access denied: missing account ID or type")
	}

	allowOps := []interfaces.Operation{}
	for _, op := range ops {
		allowOps = append(allowOps, interfaces.Operation{
			Operation: op,
		})
	}

	policies := []interfaces.PermissionPolicy{}
	for _, resource := range resources {
		policies = append(policies, interfaces.PermissionPolicy{
			Accessor: interfaces.Accessor{
				Type: accountInfo.Type,
				ID:   accountInfo.ID,
			},
			Resource: resource,
			Operations: interfaces.PermissionPolicyOps{
				Allow: allowOps,
				Deny:  []interfaces.Operation{},
			},
		})
	}

	err := ps.pa.CreateResources(ctx, policies)
	if err != nil {
		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			serrors.StreamDataPipeline_InternalError_CreateResourcesFailed).WithErrorDetails(err)
	}
	return nil
}

// 删除策略
func (ps *permissionService) DeleteResources(ctx context.Context, resourceType string, ids []string) error {
	// 清除资源策略
	resources := []interfaces.Resource{}
	for _, id := range ids {
		resources = append(resources, interfaces.Resource{
			Type: resourceType,
			ID:   id,
		})
	}

	err := ps.pa.DeleteResources(ctx, resources)
	if err != nil {
		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			serrors.StreamDataPipeline_InternalError_DeleteResourcesFailed).WithErrorDetails(err)
	}
	return nil
}

// 过滤资源列表
func (ps *permissionService) FilterResources(ctx context.Context, resourceType string, ids []string,
	ops []string, allowOperation bool) (map[string]interfaces.ResourceOps, error) {

	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}
	if accountInfo.ID == "" || accountInfo.Type == "" {
		return nil, rest.NewHTTPError(ctx, http.StatusForbidden, rest.PublicError_Forbidden).
			WithErrorDetails("Access denied: missing account ID or type")
	}

	resources := []interfaces.Resource{}
	for _, id := range ids {
		resources = append(resources, interfaces.Resource{
			ID:   id,
			Type: resourceType,
		})
	}

	matchResouces, err := ps.pa.FilterResources(ctx, interfaces.ResourcesFilter{
		Accessor: interfaces.Accessor{
			ID:   accountInfo.ID,
			Type: accountInfo.Type,
		},
		Resources:      resources,
		Operations:     ops,
		AllowOperation: allowOperation,
	})
	if err != nil {
		return nil, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			serrors.StreamDataPipeline_InternalError_FilterResourcesFailed).WithErrorDetails(err)
	}

	// id转map
	idMap := make(map[string]interfaces.ResourceOps)
	for _, resourceOps := range matchResouces {
		idMap[resourceOps.ResourceID] = resourceOps
	}

	return idMap, nil
}

// 更新资源名称
func (ps *permissionService) UpdateResource(ctx context.Context, resource interfaces.Resource) error {
	bytes, err := sonic.Marshal(resource)
	if err != nil {
		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			serrors.StreamDataPipeline_InternalError_UpdateResourceFailed).WithErrorDetails(err)
	}

	err = ps.mqClient.Pub(interfaces.AUTHORIZATION_RESOURCE_NAME_MODIFY, bytes)
	if err != nil {
		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			serrors.StreamDataPipeline_InternalError_UpdateResourceFailed).WithErrorDetails(err)
	}

	return nil
}
