package spacereq

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/common"

// ListReq 空间列表请求
type ListReq struct {
	common.PageSize
	Name string `form:"name" json:"name"` // 空间名称过滤
}

// GetErrMsgMap 返回错误信息映射
func (r *ListReq) GetErrMsgMap() map[string]string {
	return r.PageSize.GetErrMsgMap()
}
