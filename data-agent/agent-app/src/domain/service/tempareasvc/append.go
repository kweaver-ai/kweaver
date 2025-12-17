package tempareasvc

import (
	"context"

	tempareareq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/temparea/req"
	temparearesp "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/temparea/resp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"github.com/pkg/errors"
)

func (svc *tempareaSvc) Append(ctx context.Context, req tempareareq.CreateReq) (temparearesp.CreateResp, error) {
	if len(req.Source) == 0 {
		return temparearesp.CreateResp{}, errors.New("source is required")
	}
	addSource, sourceResp, err := svc.checkSource(ctx, req, req.TempAreaID)
	if err != nil {
		return temparearesp.CreateResp{}, errors.Wrap(err, "check source failed")
	}
	poList := make([]*dapo.TempAreaPO, 0)
	createTime := cutil.GetCurrentMSTimestamp() / 1000
	for _, source := range addSource {
		poList = append(poList, &dapo.TempAreaPO{
			ID:         req.TempAreaID,
			SourceID:   source.ID,
			SourceType: source.Type,
			UserID:     req.UserID,
			CreateAt:   createTime,
		})
	}
	err = svc.tempAreaRepo.Create(ctx, poList)
	if err != nil {
		return temparearesp.CreateResp{}, errors.Wrap(err, "append temp area failed")
	}
	createResp := temparearesp.CreateResp{
		ID:      req.TempAreaID,
		Sources: sourceResp,
	}
	return createResp, nil
}
