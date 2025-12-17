package otherreq

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum/builtinagentenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj"
)

type DolphinTplListReq struct {
	Config *daconfvalobj.Config `json:"config" binding:"required"`

	BuiltInAgentKey builtinagentenum.AgentKey `json:"built_in_agent_key"`
}

func (p *DolphinTplListReq) GetErrMsgMap() map[string]string {
	return map[string]string{
		"Config.required": `"config"不能为空`,
	}
}

func (p *DolphinTplListReq) CustomCheck() (err error) {
	//	if p.BuiltInAgentKey != "" {
	//		if err = p.BuiltInAgentKey.EnumCheck(); err != nil {
	//			err = errors.Wrap(err, "[DolphinTplListReq]: built_in_agent_key is invalid")
	//			return
	//		}
	//	}
	return
}
