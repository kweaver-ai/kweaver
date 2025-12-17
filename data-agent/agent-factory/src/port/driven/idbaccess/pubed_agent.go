package idbaccess

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/pubedagentdbacc/padbarg"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/pubedagentdbacc/padbret"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/published/pubedreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
)

//go:generate mockgen -source=./pubed_agent.go -destination ./idbaccessmock/pubed_agent.go -package idbaccessmock
type IPubedAgentRepo interface {
	IDBAccBaseRepo

	GetPubedList(ctx context.Context, req *pubedreq.PubedAgentListReq) (rt []*dapo.PublishedJoinPo, err error)

	GetPubedListByXx(ctx context.Context, arg *padbarg.GetPaPoListByXxArg) (ret *padbret.GetPaPoListByXxRet, err error)

	GetPubedPoMapByXx(ctx context.Context, arg *padbarg.GetPaPoListByXxArg) (ret *padbret.GetPaPoMapByXxRet, err error)
}
