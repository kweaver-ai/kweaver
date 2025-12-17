package v2agentexecutoraccess

import (
	"context"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/v2agentexecutoraccess/v2agentexecutordto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
)

func (ae *v2AgentExecutorHttpAcc) Debug(ctx context.Context, req *v2agentexecutordto.V2AgentDebugReq) (chan string, chan error, error) {
	url := fmt.Sprintf("%s/api/agent-executor/v2/agent/debug", ae.privateAddress)

	headers := make(map[string]string)
	chelper.SetAccountInfoToHeaderMap(headers, req.XAccountID, req.XAccountType)
	if req.Token != "" {
		headers["token"] = req.Token
		headers["Authorization"] = "Bearer " + req.Token
	}
	headers["x-business-domain"] = req.XBusinessDomainID

	messages, errs, err := ae.streamClient.StreamPost(ctx, url, headers, req)

	return messages, errs, err
}
