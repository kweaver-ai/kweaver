package dsdto

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/comvalobj"

type DsUniqDto = comvalobj.DataAgentUniqFlag

func NewDsIndexUniqDto(agentID, agentVersion string) *DsUniqDto {
	return &DsUniqDto{
		AgentID:      agentID,
		AgentVersion: agentVersion,
	}
}
