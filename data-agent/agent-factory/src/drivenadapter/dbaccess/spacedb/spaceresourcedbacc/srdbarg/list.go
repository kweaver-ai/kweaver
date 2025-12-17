package srdbarg

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
)

type GetSRListArg struct {
	SpaceID      string
	PageByIntID  *common.PageByLastIntID
	ResourceType cdaenum.ResourceType
}

func NewGetSRListArg() *GetSRListArg {
	return &GetSRListArg{}
}
