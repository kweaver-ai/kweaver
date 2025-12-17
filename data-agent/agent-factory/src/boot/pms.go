package boot

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/inject/v3/dainject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/common"
	_ "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
)

func initPermission() (err error) {
	if common.IsDisablePmsCheck() {
		return
	}

	pmsSvc := dainject.NewPermissionSvc()
	ctx := context.Background()

	err = pmsSvc.InitPermission(ctx)
	if err != nil {
		return
	}

	return
}
