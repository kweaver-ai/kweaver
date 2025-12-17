package dsdto

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

type DsUpdateDto struct {
	*DsComDto

	OldConfig *daconfvalobj.Config
}

func (d *DsUpdateDto) IsDatasetChanged() (ok bool) {
	newObjIDs := d.Config.GetBuiltInDocObjIDs()
	oldObjIDs := d.OldConfig.GetBuiltInDocObjIDs()

	return !cutil.IsSliceEqualGeneric(newObjIDs, oldObjIDs)
}

func NewDsUpdateDto(agentID, agentVersion string, config *daconfvalobj.Config, oldConfig *daconfvalobj.Config) *DsUpdateDto {
	return &DsUpdateDto{
		DsComDto: &DsComDto{
			DsUniqDto: &DsUniqDto{
				AgentID:      agentID,
				AgentVersion: agentVersion,
			},
			Config: config,
		},
		OldConfig: oldConfig,
	}
}
