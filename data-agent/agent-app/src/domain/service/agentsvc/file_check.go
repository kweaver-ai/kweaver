package agentsvc

import (
	"context"
	"fmt"
	"math"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/constant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/docsetaccess/docsetdto"
	agentreq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/req"
	agentresp "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/resp"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/pkg/errors"
)

func (a *agentSvc) FileCheck(ctx context.Context, req *agentreq.FileCheckReq) (agentresp.FileCheckResp, error) {
	var err error
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	rsp := &agentresp.FileCheckResp{Progress: 0, ProcessInfo: []agentresp.Info{}}
	cnt := 0
	for _, file := range *req {
		fullTextRsp, err := a.docset.FullText(ctx, &docsetdto.FullTextReq{
			DocID: file.ID,
		})
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[FileCheck] FullText error: %s", err.Error()))
			err = errors.Wrapf(err, "[FileCheck] FullText error: %s", err.Error())
			return *rsp, err
		}
		if fullTextRsp.Status == constant.FileCheckStatusSuccess {
			rsp.ProcessInfo = append(rsp.ProcessInfo, agentresp.Info{
				ID:     file.ID,
				Status: constant.FileCheckStatusSuccess,
			})
			cnt++
		} else if fullTextRsp.Status == constant.FileCheckStatusProcessing {
			rsp.ProcessInfo = append(rsp.ProcessInfo, agentresp.Info{
				ID:     file.ID,
				Status: constant.FileCheckStatusProcessing,
			})
		} else {
			rsp.ProcessInfo = append(rsp.ProcessInfo, agentresp.Info{
				ID:     file.ID,
				Status: constant.FileCheckStatusFailed,
			})
			cnt++
		}

	}
	if cnt == len(*req) {
		rsp.Progress = 100
	} else {
		rsp.Progress = int(math.Ceil(float64(cnt) / float64(len(*req)) * 100))
	}
	return *rsp, nil
}
