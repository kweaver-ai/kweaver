package daconfe2p

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/daconfeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// DataAgentTpls 将多个数据智能体模板实体转换为持久化对象
func DataAgentTpls(eos []*daconfeo.DataAgentTpl) (pos []*dapo.DataAgentTplPo, err error) {
	pos = make([]*dapo.DataAgentTplPo, 0, len(eos))

	for i := range eos {
		var po *dapo.DataAgentTplPo

		if po, err = DataAgentTpl(eos[i]); err != nil {
			return
		}

		pos = append(pos, po)
	}

	return
}

// DataAgentTpl 将单个数据智能体模板实体转换为持久化对象
func DataAgentTpl(eo *daconfeo.DataAgentTpl) (po *dapo.DataAgentTplPo, err error) {
	po = &dapo.DataAgentTplPo{}

	err = cutil.CopyStructUseJSON(po, eo.DataAgentTplPo)
	if err != nil {
		return
	}

	po.Config, err = cutil.JSON().MarshalToString(eo.Config)
	if err != nil {
		return
	}

	return
}
