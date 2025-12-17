package spacee2p

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/spaceeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// SpaceMembers 将多个空间成员实体转换为持久化对象
func SpaceMembers(eos []*spaceeo.SpaceMember) (pos []*dapo.SpaceMemberPo, err error) {
	pos = make([]*dapo.SpaceMemberPo, 0, len(eos))

	for i := range eos {
		var po *dapo.SpaceMemberPo

		if po, err = SpaceMember(eos[i]); err != nil {
			return
		}

		pos = append(pos, po)
	}

	return
}

// SpaceMember 将单个空间成员实体转换为持久化对象
func SpaceMember(eo *spaceeo.SpaceMember) (po *dapo.SpaceMemberPo, err error) {
	po = &dapo.SpaceMemberPo{}

	err = cutil.CopyStructUseJSON(po, eo.SpaceMemberPo)
	if err != nil {
		return
	}

	return
}
