package v2agentexecutoraccess

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/v2agentexecutoraccess/v2agentexecutordto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
)

func (ae *v2AgentExecutorHttpAcc) ConversationSessionInit(ctx context.Context, req *v2agentexecutordto.V2ConversationSessionInitReq) (int, error) {
	url := fmt.Sprintf("%s/api/agent-executor/v1/agent/conversation-session/init", ae.privateAddress)
	headers := make(map[string]string)
	// headers["x-account-type"] = req.VisitorType
	// headers["x-account-id"] = req.UserID
	chelper.SetAccountInfoToHeaderMap(headers, req.XAccountID, req.XAccountType)
	headers["x-business-domain"] = req.XBusinessDomainID

	respCode, respBody, err := ae.client.PostNoUnmarshal(ctx, url, headers, req)
	if err != nil {
		ae.logger.Errorf("failed to initialize conversation session: %v", err)
		return 0, err
	}
	result := struct {
		TTL int `json:"ttl"`
	}{}
	err = json.Unmarshal(respBody, &result)
	if err != nil {
		ae.logger.Errorf("failed to unmarshal response body: %v", err)
		return 0, err
	}
	if respCode != http.StatusOK {
		return 0, fmt.Errorf("failed to initialize conversation session: %d", respCode)
	}
	return result.TTL, nil
}
