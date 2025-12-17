package iv3portdriver

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/square/squarereq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/square/squareresp"
)

//go:generate mockgen -source=./square.go -destination ./v3portdrivermock/square.go -package v3portdrivermock
type ISquareSvc interface {
	GetAgentInfo(ctx context.Context, agentInfoReq *squarereq.AgentInfoReq) (resp *squareresp.AgentMarketAgentInfoResp, err error)

	GetRecentAgentList(ctx context.Context, req squarereq.AgentSquareRecentAgentReq) (res squareresp.RecentListAgentResp, err error)

	IsSpaceExists(ctx context.Context, spaceID string) (exists bool, err error)

	IsAgentExists(ctx context.Context, agentID string) (exists bool, err error)

	CheckAndGetID(ctx context.Context, agentID string) (newAgentID string, err error)
}
