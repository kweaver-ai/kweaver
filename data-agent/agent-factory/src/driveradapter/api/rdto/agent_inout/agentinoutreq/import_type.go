package agentinoutreq

import (
	"errors"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

type ImportType string

const (
	ImportTypeUpsert ImportType = "upsert"
	ImportTypeCreate ImportType = "create"
)

func (b ImportType) EnumCheck() (err error) {
	if !cutil.ExistsGeneric([]ImportType{ImportTypeUpsert, ImportTypeCreate}, b) {
		err = errors.New("[ImportType]: invalid import type")
		return
	}

	return
}

func (b ImportType) String() string {
	return string(b)
}
