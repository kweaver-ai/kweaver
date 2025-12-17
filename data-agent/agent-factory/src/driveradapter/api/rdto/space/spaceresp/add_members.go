package spaceresp

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/spacevo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/space/spacereq"
)

// AddMembersResp 添加空间成员响应
type AddMembersResp struct {
	Success []*spacevo.MemberAssoc `json:"success"` // 添加成功的成员
	Failed  *AddMemberFailed       `json:"failed"`  // 添加失败的成员
}

func NewAddMembersResp() *AddMembersResp {
	return &AddMembersResp{
		Success: make([]*spacevo.MemberAssoc, 0),
		Failed:  NewAddMemberFailed(),
	}
}

type AddMemberFailed struct {
	MemberAlreadyExists []*spacereq.SpaceMemberReq `json:"member_already_exists"` // 已存在的成员
}

func NewAddMemberFailed() *AddMemberFailed {
	return &AddMemberFailed{
		MemberAlreadyExists: make([]*spacereq.SpaceMemberReq, 0),
	}
}
