package spaceresp

// CreateResp 创建空间响应
type CreateResp struct {
	ID string `json:"id"` // 空间ID
}

func NewCreateResp() *CreateResp {
	return &CreateResp{}
}
