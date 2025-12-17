package docindexobj

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/ecoindexhttp/ecoindexdto"

type AgentDocIndexStatusInfo struct {
	AgentID       string                       `json:"agent_id"`
	AgentVersion  string                       `json:"agent_version"`
	DatasetID     string                       `json:"dataset_id"`
	CompleteCount int                          `json:"complete_count"`
	FailInfos     []*ecoindexdto.IndexFailInfo `json:"fail_infos"`
	Progress      int                          `json:"progress"`
}

func (d *AgentDocIndexStatusInfo) LoadFrom(dtos *ecoindexdto.BotIndexStatusInfo) error {
	return nil
}
