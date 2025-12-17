package iportdriver

import (
	"context"

	tempareareq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/temparea/req"
	temparearesp "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/temparea/resp"
)

type ITempAreaSvc interface {
	Create(ctx context.Context, req tempareareq.CreateReq) (id string, resp temparearesp.CreateResp, err error)
	Append(ctx context.Context, req tempareareq.CreateReq) (resp temparearesp.CreateResp, err error)
	Remove(ctx context.Context, req tempareareq.RemoveReq) (err error)
	Get(ctx context.Context, req tempareareq.GetReq) (resp []tempareareq.TempArea, err error)
}
