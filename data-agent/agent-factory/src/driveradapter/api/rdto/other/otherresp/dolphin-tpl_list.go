package otherresp

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/other/otherreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/entity/dolphintpleo"
)

type DolphinTplListResp struct {
	PreDolphin  []*dolphintpleo.DolphinTplEo `json:"pre_dolphin"`
	PostDolphin []*dolphintpleo.DolphinTplEo `json:"post_dolphin"`
}

func NewDolphinTplListResp() *DolphinTplListResp {
	return &DolphinTplListResp{
		PreDolphin:  make([]*dolphintpleo.DolphinTplEo, 0),
		PostDolphin: make([]*dolphintpleo.DolphinTplEo, 0),
	}
}

func (b *DolphinTplListResp) LoadFromConfig(req *otherreq.DolphinTplListReq) (err error) {
	dolTplMapStruct := dolphintpleo.NewDolphinTplMapStruct()

	dolTplMapStruct.LoadFromConfig(req.Config, req.BuiltInAgentKey, true)

	// 1. pre_dolphin
	if dolTplMapStruct.MemoryRetrieve.IsEnable {
		b.PreDolphin = append(b.PreDolphin, dolTplMapStruct.MemoryRetrieve.ToDolphinTplEo())
	}

	if dolTplMapStruct.TempFileProcess.IsEnable {
		b.PreDolphin = append(b.PreDolphin, dolTplMapStruct.TempFileProcess.ToDolphinTplEo())
	}

	if dolTplMapStruct.DocRetrieve.IsEnable {
		b.PreDolphin = append(b.PreDolphin, dolTplMapStruct.DocRetrieve.ToDolphinTplEo())
	}

	if dolTplMapStruct.GraphRetrieve.IsEnable {
		b.PreDolphin = append(b.PreDolphin, dolTplMapStruct.GraphRetrieve.ToDolphinTplEo())
	}

	if dolTplMapStruct.ContextOrganize.IsEnable {
		b.PreDolphin = append(b.PreDolphin, dolTplMapStruct.ContextOrganize.ToDolphinTplEo())
	}

	// 2. post_dolphin
	if dolTplMapStruct.RelatedQuestions.IsEnable {
		b.PostDolphin = append(b.PostDolphin, dolTplMapStruct.RelatedQuestions.ToDolphinTplEo())
	}

	return
}
