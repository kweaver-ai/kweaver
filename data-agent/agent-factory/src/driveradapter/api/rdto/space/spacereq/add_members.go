package spacereq

import (
	"errors"
	"strconv"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/csconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/spaceeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// AddMembersReq 添加空间成员请求
type AddMembersReq struct {
	Members []*SpaceMemberReq `json:"members" binding:"required,min=1" label:"空间成员列表"`
}

// GetErrMsgMap 返回错误信息映射
func (r *AddMembersReq) GetErrMsgMap() map[string]string {
	return map[string]string{
		"Members.required": `"members"不能为空`,
		"Members.min":      `"members"至少需要一个成员`,
	}
}

func (r *AddMembersReq) CustomCheck() error {
	// 1. 检查成员列表的长度
	if len(r.Members) == 0 {
		return errors.New("[AddMembersReq][CustomCheck]: 成员列表不能为空")
	}

	// 2. 去重
	r.Members = cutil.DeduplPtrGeneric(r.Members)

	// 3. 检查成员类型
	for _, member := range r.Members {
		if member.ObjType.EnumCheck() != nil {
			return errors.New("[AddMembersReq][CustomCheck]: 无效的成员类型")
		}
	}

	// 4. 检查成员数量
	if len(r.Members) > csconstant.MaxMemberNumInOneSpace {
		return errors.New("[AddMembersReq][CustomCheck]: 成员数量超过最大限制（" + strconv.Itoa(csconstant.MaxMemberNumInOneSpace) + "）")
	}

	return nil
}

func (r *AddMembersReq) ToMemberEos(leftAddMembers []*SpaceMemberReq, spaceID string, spaceKey string) (eos []*spaceeo.SpaceMember, err error) {
	for _, member := range leftAddMembers {
		eo := &spaceeo.SpaceMember{}

		err = cutil.CopyStructUseJSON(eo, member)
		if err != nil {
			return
		}

		eo.SpaceID = spaceID
		eo.SpaceKey = spaceKey
		eos = append(eos, eo)
	}

	return
}
