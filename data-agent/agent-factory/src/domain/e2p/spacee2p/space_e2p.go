package spacee2p

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/spaceeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// Spaces 将多个空间实体转换为持久化对象
func Spaces(eos []*spaceeo.Space) (pos []*dapo.SpacePo, err error) {
	pos = make([]*dapo.SpacePo, 0, len(eos))

	for i := range eos {
		var po *dapo.SpacePo

		if po, err = Space(eos[i]); err != nil {
			return
		}

		pos = append(pos, po)
	}

	return
}

// Space 将单个空间实体转换为持久化对象
func Space(eo *spaceeo.Space) (po *dapo.SpacePo, err error) {
	po = &dapo.SpacePo{}

	err = cutil.CopyStructUseJSON(po, eo.SpacePo)
	if err != nil {
		return
	}

	return
}
