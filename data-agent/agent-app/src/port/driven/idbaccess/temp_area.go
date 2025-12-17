package idbaccess

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
)

type ITempAreaRepo interface {
	IDBAccBaseRepo

	//NOTE: 绑定临时区域和会话
	Bind(ctx context.Context, areaID string, conversationID string) (err error)

	//NOTE: 获取临时区域
	GetByConversationID(ctx context.Context, conversationID string) (po *dapo.TempAreaPO, err error)

	Create(ctx context.Context, po []*dapo.TempAreaPO) (err error)
	Append(ctx context.Context, po []*dapo.TempAreaPO) (err error)
	Remove(ctx context.Context, tempAreaID string, sourceIDs []string) (err error)
	GetByTempAreaID(ctx context.Context, tempAreaID string) (result []*dapo.TempAreaPO, err error)
}
