package conversationresp

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/entity/conversationeo"
)

type ConversationDetail struct {
	conversationeo.Conversation
	TempareaId string `json:"temparea_id"`
	Status     string `json:"status"` //会话最新消息的状态，completed,processing,failed
}

func NewConversationDetail() *ConversationDetail {
	return &ConversationDetail{}
}

func (d *ConversationDetail) LoadFromEo(eo *conversationeo.Conversation) error {
	d.Conversation = *eo
	return nil
}
