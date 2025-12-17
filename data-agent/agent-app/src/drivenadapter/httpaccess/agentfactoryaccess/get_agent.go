package agentfactoryaccess

import (
	"context"
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/agentfactoryaccess/agentfactorydto"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/bytedance/sonic"
	"github.com/pkg/errors"
	"go.opentelemetry.io/otel/attribute"
)

type ErrResponse struct {
	Description string `json:"Description"`
	ErrorCode   string `json:"ErrorCode"`
}

func (af *agentFactoryHttpAcc) GetAgent(ctx context.Context, agentID string, version string) (agentfactorydto.Agent, error) {
	var err error
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	o11y.SetAttributes(ctx, attribute.String("agent_id", agentID))
	o11y.SetAttributes(ctx, attribute.String("version", version))
	agent := agentfactorydto.Agent{}

	uri := fmt.Sprintf("%s/api/agent-factory/internal/v3/agent-market/agent/%s/version/%s", af.privateAddress, agentID, version)
	code, res, err := af.client.GetNoUnmarshal(ctx, uri, nil, nil)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[GetAgent] request uri %s err %s", uri, err))
		err = errors.Wrapf(err, "[GetAgent] request uri %s err %s", uri, err)
		return agent, err
	}
	if code != http.StatusOK {
		o11y.Error(ctx, fmt.Sprintf("[GetAgent] status code: %d , resp %s", code, string(res)))
		return agent, fmt.Errorf("status code: %d , resp %s", code, string(res))
	}

	err = sonic.Unmarshal(res, &agent)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[GetAgent] request uri %s unmarshal err %s,  resp %s ", uri, err, string(res)))
		return agent, errors.Wrapf(err, "[GetAgent] request uri %s unmarshal err %s,  resp %s ", uri, err, string(res))
	}
	return agent, nil
}
