package dapo

type TempAreaPO struct {
	ID             string `json:"id" db:"f_temp_area_id"`
	ConversationID string `json:"conversation_id" db:"f_conversation_id"`
	SourceID       string `json:"source_id" db:"f_source_id"`
	SourceType     string `json:"source_type" db:"f_source_type"`
	UserID         string `json:"user_id" db:"f_user_id"`
	CreateAt       int64  `json:"create_at" db:"f_created_at"`
}

func (p *TempAreaPO) TableName() string {
	return "t_temporary_area"
}
