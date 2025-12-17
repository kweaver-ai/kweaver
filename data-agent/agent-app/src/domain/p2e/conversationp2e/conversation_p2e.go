package conversationp2e

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/entity/conversationeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/conversation_message/conversationmsgreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/idbaccess"
	"github.com/pkg/errors"
)

// DataAgent PO转EO
func Conversation(ctx context.Context, _po *dapo.ConversationPO, conversationMsgRepo idbaccess.IConversationMsgRepo, withMsg bool) (eo *conversationeo.Conversation, err error) {
	eo = &conversationeo.Conversation{
		ConversationPO: _po,
	}
	if withMsg {
		msgPOList, err := conversationMsgRepo.List(ctx, conversationmsgreq.ListReq{ConversationID: _po.ID})
		if err != nil {
			return nil, errors.Wrapf(err, "查询对话消息失败")
		}
		eo.Messages = msgPOList
	}

	return
}

// DataAgents 批量PO转EO
func Conversations(ctx context.Context, _pos []*dapo.ConversationPO, conversationMsgRepo idbaccess.IConversationMsgRepo) (eos []*conversationeo.Conversation, err error) {
	eos = make([]*conversationeo.Conversation, 0, len(_pos))

	for i := range _pos {
		var eo *conversationeo.Conversation

		if eo, err = Conversation(ctx, _pos[i], conversationMsgRepo, false); err != nil {
			return
		}

		eos = append(eos, eo)
	}

	return
}
