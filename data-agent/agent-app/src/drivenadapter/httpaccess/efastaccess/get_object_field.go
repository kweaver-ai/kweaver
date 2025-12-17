package efastaccess

import (
	"context"
	"fmt"
	"strings"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/efastaccess/efastdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/common/util"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"go.opentelemetry.io/otel/attribute"

	"github.com/bytedance/sonic"
	"github.com/pkg/errors"
)

func (efast *efastHttpAcc) GetObjectFieldByID(ctx context.Context, objectIDs []string, fields ...string) (map[string]*efastdto.DocumentMetaData, error) {
	var err error
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	o11y.SetAttributes(ctx, attribute.String("object_ids", strings.Join(objectIDs, ",")))
	o11y.SetAttributes(ctx, attribute.String("fields", strings.Join(fields, ",")))
	documentMap := map[string]*efastdto.DocumentMetaData{}
	if len(objectIDs) == 0 {
		return documentMap, nil
	}
	fieldStrs := []string{}
	for _, field := range fields {
		fieldStrs = append(fieldStrs, string(field))
	}
	uri := efast.privateAddress + fmt.Sprintf("/api/efast/v1/items-batch/%s", strings.Join(fieldStrs, ","))
	headers := map[string]string{}
	headers["Content-Type"] = "application/json; charset=utf-8"
	ids := []string{}
	for _, id := range objectIDs {
		if id != "" {
			ids = append(ids, id)
		}
	}

	req := efastdto.GetObjectFieldByIDReq{
		Method: "GET",
		ObjIDs: ids,
	}
	_, data, err := efast.client.PostNoUnmarshal(ctx, uri, headers, req)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[GetObjectFieldByID] request uri %s err %s, resp %s, req: %v ", uri, err, string(data), req))
		return documentMap, errors.Wrapf(err, "[GetObjectFieldByID] request uri %s err %s, resp %s, req: %v ", uri, err, string(data), req)
	}

	arr := []*efastdto.DocumentMetaData{}
	err = sonic.Unmarshal(data, &arr)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[GetObjectFieldByID] request uri %s unmarshal err %s, resp %s ", uri, err, string(data)))
		return documentMap, errors.Wrapf(err, "[GetObjectFieldByID] request uri %s unmarshal err %s, resp %s ", uri, err, string(data))
	}

	for _, item := range arr {
		documentMap[util.GNS2ObjectID(item.ID)] = item
	}

	return documentMap, nil
}
