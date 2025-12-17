package permissionsvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/cenvhelper"
	"github.com/pkg/errors"
)

func (svc *permissionSvc) InitPermission(ctx context.Context) (err error) {
	if cenvhelper.IsLocalDev() {
		return
	}

	// 1. 授予应用管理员-所有Agent的“使用权限”
	err = svc.authZHttp.GrantAgentUsePmsForAppAdmin(ctx)
	if err != nil {
		err = errors.Wrapf(err, "grant agent use pms for app admin failed")
		return
	}

	// 2. 授予应用管理员-相关资源的管理权限（Agent、Agent模板）
	err = svc.authZHttp.GrantMgmtPmsForAppAdmin(ctx)
	if err != nil {
		err = errors.Wrapf(err, "grant agent use pms for app admin failed")
		return
	}

	return
}
