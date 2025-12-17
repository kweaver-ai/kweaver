package tempareasvc

import (
	"context"

	tempareareq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/temparea/req"
	"github.com/pkg/errors"
)

func (svc *tempareaSvc) Get(ctx context.Context, req tempareareq.GetReq) ([]tempareareq.TempArea, error) {
	var result []tempareareq.TempArea
	poList, err := svc.tempAreaRepo.GetByTempAreaID(ctx, req.TempAreaID)
	if err != nil {
		return result, errors.Wrap(err, "get temp area list")
	}
	docIDs := make([]string, 0, len(poList))
	// wikiIDs := make([]string, 0, len(data.Sources))
	for i := range poList {
		result = append(result, tempareareq.TempArea{
			ID:   poList[i].SourceID,
			Type: poList[i].SourceType,
		})

		if poList[i].SourceType == "doc" {
			docIDs = append(docIDs, poList[i].SourceID)
		}
	}
	docMap, err := svc.Efast.GetObjectFieldByID(ctx, docIDs, "names")
	if err != nil {
		return result, errors.Wrap(err, "get object field by id")
	}

	for i := range result {
		if result[i].Type == "doc" {
			result[i].Details = docMap[result[i].ID]
		}
	}
	return result, nil
}
