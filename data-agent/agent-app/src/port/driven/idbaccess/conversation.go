package idbaccess

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/conversation/conversationreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
)

//go:generate mockgen -source=./conversation.go -destination ./idbaccessmock/conversation.go -package idbaccessmock
type IConversationRepo interface {
	IDBAccBaseRepo

	Create(ctx context.Context, po *dapo.ConversationPO) (rt *dapo.ConversationPO, err error)
	Update(ctx context.Context, po *dapo.ConversationPO) (err error)
	Delete(ctx context.Context, tx *sql.Tx, id string) (err error)
	DeleteByAPPKey(ctx context.Context, tx *sql.Tx, appKey string) (err error)

	GetByID(ctx context.Context, id string) (po *dapo.ConversationPO, err error)

	List(ctx context.Context, req conversationreq.ListReq) (rt []*dapo.ConversationPO, count int64, err error)
}
