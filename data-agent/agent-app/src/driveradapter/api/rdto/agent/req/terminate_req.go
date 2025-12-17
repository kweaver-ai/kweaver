package agentreq

type TerminateReq struct {
	ConversationID string `json:"conversation_id" binding:"required"`
}
