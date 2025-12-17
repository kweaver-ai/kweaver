package iefasthttp

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/efastaccess/efastdto"
)

type IEfast interface {
	GetObjectFieldByID(ctx context.Context, objectIDs []string, fields ...string) (map[string]*efastdto.DocumentMetaData, error)
}
