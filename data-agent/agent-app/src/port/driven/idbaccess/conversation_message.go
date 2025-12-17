package idbaccess

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/conversation_message/conversationmsgreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
)

//go:generate mockgen -source=./conversation.go -destination ./idbaccessmock/conversation.go -package idbaccessmock
type IConversationMsgRepo interface {
	IDBAccBaseRepo

	Create(ctx context.Context, po *dapo.ConversationMsgPO) (id string, err error)
	Update(ctx context.Context, po *dapo.ConversationMsgPO) (err error)
	Delete(ctx context.Context, id string) (err error)
	DeleteByConversationID(ctx context.Context, tx *sql.Tx, conversationID string) (err error)
	DeleteByAPPKey(ctx context.Context, tx *sql.Tx, appKey string) (err error)

	GetByID(ctx context.Context, id string) (po *dapo.ConversationMsgPO, err error)
	GetMaxIndexByID(ctx context.Context, id string) (maxIndex int, err error)

	List(ctx context.Context, req conversationmsgreq.ListReq) (rt []*dapo.ConversationMsgPO, err error)
	GetLatestMsgByConversationID(ctx context.Context, conversationID string) (po *dapo.ConversationMsgPO, err error)
}
