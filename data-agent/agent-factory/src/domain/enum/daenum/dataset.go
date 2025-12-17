package daenum

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"github.com/pkg/errors"
)

type DatasetObjectType string

const (
	DatasetObjTypeDir DatasetObjectType = "dir"
)

func (b DatasetObjectType) EnumCheck() (err error) {
	if !cutil.ExistsGeneric([]DatasetObjectType{DatasetObjTypeDir}, b) {
		err = errors.New("[DatasetObjectType]: invalid object type")
		return
	}

	return
}
