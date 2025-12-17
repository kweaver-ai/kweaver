package spacereq

// UpdateReq 更新空间请求
type UpdateReq struct {
	Name    string `json:"name" binding:"required,max=50" label:"空间名称"`
	Profile string `json:"profile" binding:"max=100" label:"空间简介"`
}

func NewUpdateReq() *UpdateReq {
	return &UpdateReq{}
}

// GetErrMsgMap 返回错误信息映射
func (r *UpdateReq) GetErrMsgMap() map[string]string {
	return map[string]string{
		"Name.required": `"name"不能为空`,
		"Name.max":      `"name"长度不能超过50个字符`,
		"Profile.max":   `"profile"长度不能超过100个字符`,
	}
}

func (r *UpdateReq) CustomCheck() error {
	return nil
}
