package iecoConfighttp

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/ecoconfigaccess/ecoconfigdto"
)

type IEcoConfig interface {
	DocReindex(ctx context.Context, request []ecoconfigdto.ReindexReq) (err error)
}
