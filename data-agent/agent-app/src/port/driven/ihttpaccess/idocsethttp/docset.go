package idocsethttp

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/docsetaccess/docsetdto"
)

type IDocset interface {
	FullText(ctx context.Context, req *docsetdto.FullTextReq) (rsp *docsetdto.FullTextRsp, err error)
}
