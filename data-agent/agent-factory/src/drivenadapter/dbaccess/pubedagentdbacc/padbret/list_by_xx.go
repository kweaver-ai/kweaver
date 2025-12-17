package padbret

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"

type GetPaPoListByXxRet struct {
	JoinPos []*dapo.PublishedJoinPo
}

func NewGetPaPoListByXxRet() *GetPaPoListByXxRet {
	return &GetPaPoListByXxRet{
		JoinPos: make([]*dapo.PublishedJoinPo, 0),
	}
}
