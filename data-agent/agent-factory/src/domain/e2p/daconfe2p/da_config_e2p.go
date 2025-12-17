package daconfe2p

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/daconfeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// DataAgents 将多个数据智能体实体转换为持久化对象
func DataAgents(eos []*daconfeo.DataAgent) (pos []*dapo.DataAgentPo, err error) {
	pos = make([]*dapo.DataAgentPo, 0, len(eos))

	for i := range eos {
		var po *dapo.DataAgentPo

		if po, err = DataAgent(eos[i]); err != nil {
			return
		}

		pos = append(pos, po)
	}

	return
}

// DataAgent 将单个数据智能体实体转换为持久化对象
func DataAgent(eo *daconfeo.DataAgent) (po *dapo.DataAgentPo, err error) {
	po = &dapo.DataAgentPo{}

	err = cutil.CopyStructUseJSON(po, eo.DataAgentPo)
	if err != nil {
		return
	}

	po.Config, err = cutil.JSON().MarshalToString(eo.Config)
	if err != nil {
		return
	}

	return
}
