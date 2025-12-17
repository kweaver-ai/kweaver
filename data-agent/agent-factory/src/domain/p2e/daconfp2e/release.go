package daconfp2e

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/releaseeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"github.com/pkg/errors"
)

func ReleaseDAConfEoSimple(ctx context.Context, _po *dapo.ReleasePO) (eo *releaseeo.ReleaseDAConfWrapperEO, err error) {
	eo = &releaseeo.ReleaseDAConfWrapperEO{
		Config: &daconfvalobj.Config{},
	}

	err = cutil.CopyStructUseJSON(&eo.ReleaseEO, _po)
	if err != nil {
		return
	}

	// 1. 解析配置
	if _po.AgentConfig != "" {
		// 1.1. _po.AgentConfig -> DataAgentPo
		agentConfPo := &dapo.DataAgentPo{}

		err = cutil.JSON().UnmarshalFromString(_po.AgentConfig, agentConfPo)
		if err != nil {
			err = errors.Wrapf(err, "ReleaseSimple unmarshal1 config error")
			return
		}

		// 1.2. agentConfPo.Config -> eo.Config
		err = cutil.JSON().UnmarshalFromString(agentConfPo.Config, &eo.Config)
		if err != nil {
			err = errors.Wrapf(err, "ReleaseSimple unmarshal2 config error")
			return
		}
	}

	return
}
