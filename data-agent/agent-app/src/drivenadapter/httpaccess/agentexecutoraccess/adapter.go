package agentexecutoraccess

import (
	"context"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/agentexecutoraccess/agentexecutordto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/v2agentexecutoraccess/v2agentexecutordto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iagentexecutorhttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/iv2agentexecutorhttp"
)

// AgentExecutorAdapter 适配器，根据配置选择使用 v1 或 v2 接口
type AgentExecutorAdapter struct {
	useV2 bool
	v1    iagentexecutorhttp.IAgentExecutor
	v2    iv2agentexecutorhttp.IV2AgentExecutor
}

var _ iagentexecutorhttp.IAgentExecutor = &AgentExecutorAdapter{}

// NewAgentExecutorAdapter 创建适配器
// 参数:
//   - useV2: 是否使用 v2 接口
//   - v1: v1 版本的实现（不能为 nil）
//   - v2: v2 版本的实现（如果 useV2 为 true，则不能为 nil）
func NewAgentExecutorAdapter(useV2 bool, v1 iagentexecutorhttp.IAgentExecutor, v2 iv2agentexecutorhttp.IV2AgentExecutor) iagentexecutorhttp.IAgentExecutor {
	return &AgentExecutorAdapter{
		useV2: useV2,
		v1:    v1,
		v2:    v2,
	}
}

// Call 适配器方法，根据配置调用 v1 或 v2
func (a *AgentExecutorAdapter) Call(ctx context.Context, req *agentexecutordto.AgentCallReq) (chan string, chan error, error) {
	if req.ExecutorVersion == "v2" && a.v2 != nil {
		// 转换 v1 请求为 v2 请求
		v2Req := ConvertV1ToV2CallReq(req)
		return a.v2.Call(ctx, v2Req)
	}
	if req.ExecutorVersion == "v1" && a.v1 != nil {
		return a.v1.Call(ctx, req)
	}
	return nil, nil, fmt.Errorf("version %s not supported", req.ExecutorVersion)
}

// Debug 适配器方法，根据配置调用 v1 或 v2
func (a *AgentExecutorAdapter) Debug(ctx context.Context, req *agentexecutordto.AgentDebugReq) (chan string, chan error, error) {
	if req.ExecutorVersion == "v2" && a.v2 != nil {
		// 转换 v1 请求为 v2 请求
		v2Req := ConvertV1ToV2DebugReq(req)
		return a.v2.Debug(ctx, v2Req)
	}
	if req.ExecutorVersion == "v1" && a.v1 != nil {
		return a.v1.Debug(ctx, req)
	}
	return nil, nil, fmt.Errorf("version %s not supported", req.ExecutorVersion)
}

// ConversationSessionInit 适配器方法，根据配置调用 v1 或 v2
func (a *AgentExecutorAdapter) ConversationSessionInit(ctx context.Context, req *agentexecutordto.ConversationSessionInitReq) (int, error) {
	if req.ExecutorVersion == "v2" && a.v2 != nil {
		v2Req := ConvertV1ToV2ConversationSessionInitReq(req)
		return a.v2.ConversationSessionInit(ctx, v2Req)
	}
	return a.v1.ConversationSessionInit(ctx, req)
}

// ConvertV1ToV2CallReq 将 v1 的 AgentCallReq 转换为 v2 的 V2AgentCallReq
func ConvertV1ToV2CallReq(v1Req *agentexecutordto.AgentCallReq) *v2agentexecutordto.V2AgentCallReq {
	v2Req := &v2agentexecutordto.V2AgentCallReq{
		AgentID:      v1Req.ID,
		AgentVersion: v1Req.AgentVersion,
		AgentConfig: v2agentexecutordto.Config{
			Config: v1Req.Config.Config,
		},
		AgentInput: v1Req.Input,
		UserID:     v1Req.UserID,
		Token:      v1Req.Token,
		CallType:   v1Req.CallType,
		AgentOptions: v2agentexecutordto.AgentOptions{
			ConversationID: v1Req.Config.ConversationID,
			AgentRunID:     v1Req.Config.SessionID,
		},
		VisitorType:       v1Req.VisitorType,
		XAccountID:        v1Req.XAccountID,
		XAccountType:      v1Req.XAccountType,
		XBusinessDomainID: v1Req.XBusinessDomainID,
	}

	return v2Req
}

// ConvertV1ToV2DebugReq 将 v1 的 AgentDebugReq 转换为 v2 的 V2AgentDebugReq
func ConvertV1ToV2DebugReq(v1Req *agentexecutordto.AgentDebugReq) *v2agentexecutordto.V2AgentDebugReq {
	v2Req := &v2agentexecutordto.V2AgentDebugReq{
		AgentID:      v1Req.ID,
		AgentVersion: v1Req.AgentVersion,
		AgentConfig: v2agentexecutordto.Config{
			Config: v1Req.Config.Config,
		},
		AgentInput: v1Req.Input,
		UserID:     v1Req.UserID,
		Token:      v1Req.Token,
		AgentOptions: v2agentexecutordto.AgentOptions{
			ConversationID: v1Req.Config.ConversationID,
			AgentRunID:     v1Req.Config.SessionID,
		},
		XAccountID:        v1Req.XAccountID,
		XAccountType:      v1Req.XAccountType,
		XBusinessDomainID: v1Req.XBusinessDomainID,
	}

	return v2Req
}

// ConvertV1ToV2ConversationSessionInitReq 将 v1 的 ConversationSessionInitReq 转换为 v2 的 V2ConversationSessionInitReq
func ConvertV1ToV2ConversationSessionInitReq(v1Req *agentexecutordto.ConversationSessionInitReq) *v2agentexecutordto.V2ConversationSessionInitReq {
	v2Req := &v2agentexecutordto.V2ConversationSessionInitReq{
		ConversationID:    v1Req.ConversationID,
		AgentID:           v1Req.AgentID,
		AgentVersion:      v1Req.AgentVersion,
		AgentConfig:       v1Req.AgentConfig,
		UserID:            v1Req.UserID,
		XAccountID:        v1Req.XAccountID,
		XAccountType:      v1Req.XAccountType,
		XBusinessDomainID: v1Req.XBusinessDomainID,
	}
	return v2Req
}
