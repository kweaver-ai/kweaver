package agentconfigreq

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/comvalobj"
	"github.com/pkg/errors"
)

// BatchCheckIndexStatusReq 表示批量检查索引状态的请求
type BatchCheckIndexStatusReq struct {
	AgentUniqFlags  []*comvalobj.DataAgentUniqFlag `json:"agent_uniq_flags" binding:"required"`
	IsShowFailInfos bool                           `json:"is_show_fail_infos"`
}

func (p *BatchCheckIndexStatusReq) GetErrMsgMap() map[string]string {
	return map[string]string{
		"AgentUniqFlags.required": `"agent_uniq_flags"不能为空`,
	}
}

func (p *BatchCheckIndexStatusReq) ReqCheck() (err error) {
	if len(p.AgentUniqFlags) == 0 {
		err = errors.New("agent_uniq_flags is required")
		return
	}

	for _, item := range p.AgentUniqFlags {
		if err = item.ValObjCheck(); err != nil {
			err = errors.Wrap(err, "[BatchCheckIndexStatusReq]: agent uniq flag is invalid")
			return
		}
	}

	return
}

func (p *BatchCheckIndexStatusReq) GetAgentIDs() (unpublishIDs, publishIDs []string) {
	unpublishIDs = make([]string, 0)
	publishIDs = make([]string, 0)

	for _, item := range p.AgentUniqFlags {
		if item.IsUnpublish() {
			unpublishIDs = append(unpublishIDs, item.AgentID)
		} else {
			publishIDs = append(publishIDs, item.AgentID)
		}
	}

	return
}

func (p *BatchCheckIndexStatusReq) GetPublishUniqFlags() (uniqFlags []*comvalobj.DataAgentUniqFlag) {
	uniqFlags = make([]*comvalobj.DataAgentUniqFlag, 0)

	for _, item := range p.AgentUniqFlags {
		if !item.IsUnpublish() {
			uniqFlags = append(uniqFlags, item)
		}
	}

	return
}
