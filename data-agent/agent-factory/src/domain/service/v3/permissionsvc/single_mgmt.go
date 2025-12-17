package permissionsvc

import (
    "context"

    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/common"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdapmsenum"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/cenvhelper"
    "github.com/pkg/errors"
)

func (svc *permissionSvc) GetSingleMgmtPermission(ctx context.Context, resourceType cdaenum.ResourceType, operator cdapmsenum.Operator) (allAllowed bool, err error) {
    // 1. 检查是否禁用权限检查
    if common.IsDisablePmsCheck() {
        allAllowed = true
        return
    }

    if cenvhelper.IsLocalDev() {
        allAllowed = false
        return
    }

    // 2. 获取当前用户ID
    uid := chelper.GetUserIDFromCtx(ctx)
    if uid == "" {
        err = errors.New("user id is empty")
        return
    }

    // 3. 获取用户权限
    var m map[cdapmsenum.Operator]bool

    switch resourceType {
    case cdaenum.ResourceTypeDataAgent:
        m, err = svc.authZHttp.GetAgentResourceOpsByUid(ctx, uid)
    case cdaenum.ResourceTypeDataAgentTpl:
        m, err = svc.authZHttp.GetAgentTplResourceOpsByUid(ctx, uid)
    default:
        err = errors.New("invalid resource type")
        return
    }

    // 4. 返回权限
    allAllowed = m[operator]

    return
}
