package agentreq

type ResumeReq struct {
	ConversationID string `json:"conversation_id" binding:"required"`
}
