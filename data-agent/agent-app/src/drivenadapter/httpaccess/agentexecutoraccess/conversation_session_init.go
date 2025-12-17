package agentexecutoraccess

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/agentexecutoraccess/agentexecutordto"
)

// NOTE: v1版本没有这个接口，实现为空
func (ae *agentExecutorHttpAcc) ConversationSessionInit(ctx context.Context, req *agentexecutordto.ConversationSessionInitReq) (int, error) {
	return 0, nil
}
