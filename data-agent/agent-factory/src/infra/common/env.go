// Package common dbPool
package common

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/cenvhelper"
)

func IsDisablePmsCheck() bool {
	return cenvhelper.IsDisablePmsCheck()
}
