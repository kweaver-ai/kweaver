package v3agentconfigsvc

import (
	"context"
	"encoding/json"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/mqvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/ctopicenum"
	"github.com/pkg/errors"
)

func (s *dataAgentConfigSvc) handleUpdateNameMq(agentID, agentName string) (err error) {
	msg := mqvo.NewUpdateAgentNameMqMsg(agentID, agentName)

	msgBys, err := json.Marshal(msg)
	if err != nil {
		err = errors.Wrapf(err, "marshal msg failed")
		return
	}

	ctx := context.Background()

	err = s.mqAccess.Publish(ctx, ctopicenum.AgentNameModifyForAuthorizationPlatform, msgBys)
	if err != nil {
		err = errors.Wrapf(err, "publish msg failed")
		return
	}

	return
}
