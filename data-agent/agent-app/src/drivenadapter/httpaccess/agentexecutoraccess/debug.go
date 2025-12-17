package agentexecutoraccess

import (
	"context"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/agentexecutoraccess/agentexecutordto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
)

func (ae *agentExecutorHttpAcc) Debug(ctx context.Context, req *agentexecutordto.AgentDebugReq) (chan string, chan error, error) {
	// messages := make(chan string)
	// errs := make(chan error)
	url := fmt.Sprintf("%s/api/agent-executor/v1/agent/debug", ae.privateAddress)

	headers := make(map[string]string)
	// headers["x-account_id"] = req.UserID
	chelper.SetAccountInfoToHeaderMap(headers, req.XAccountID, req.XAccountType)
	if req.Token != "" {
		headers["token"] = req.Token
		headers["Authorization"] = "Bearer " + req.Token
	}
	headers["x-business-domain"] = req.XBusinessDomainID

	messages, errs, err := ae.streamClient.StreamPost(ctx, url, headers, req)

	return messages, errs, err
}
