package spacereq

import (
	"errors"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// CreateReq 创建空间请求
type CreateReq struct {
	Key       string              `json:"key" binding:"max=50" label:"空间唯一标识"`
	Members   []*SpaceMemberReq   `json:"members" label:"空间成员"`
	Resources []*SpaceResourceReq `json:"resources" label:"空间资源"`

	*UpdateReq
}

func NewCreateReq() *CreateReq {
	return &CreateReq{
		UpdateReq: NewUpdateReq(),
		Members:   make([]*SpaceMemberReq, 0),
		Resources: make([]*SpaceResourceReq, 0),
	}
}

// GetErrMsgMap 返回错误信息映射
func (r *CreateReq) GetErrMsgMap() map[string]string {
	return map[string]string{
		"Key.max": `"key"长度不能超过50个字符`,
	}
}

func (r *CreateReq) CustomCheckAndDedupl() error {
	if r.UpdateReq == nil {
		return errors.New("[CreateReq][CustomCheck]: UpdateReq不能为空")
	}

	// 1. 去重
	if len(r.Members) > 1 {
		r.Members = cutil.DeduplGeneric[*SpaceMemberReq](r.Members)
	}

	if len(r.Resources) > 1 {
		r.Resources = cutil.DeduplGeneric[*SpaceResourceReq](r.Resources)
	}

	// 2. 检查成员类型
	for _, member := range r.Members {
		if member.ObjType.EnumCheck() != nil {
			return errors.New("[UpdateReq][CustomCheck]: 无效的成员类型")
		}
	}

	// 3. 检查资源类型
	for _, resource := range r.Resources {
		if resource.ResourceType.EnumCheck() != nil {
			return errors.New("[UpdateReq][CustomCheck]: 无效的资源类型")
		}
	}

	// 4. 去重
	r.Members = cutil.DeduplGeneric[*SpaceMemberReq](r.Members)
	r.Resources = cutil.DeduplGeneric[*SpaceResourceReq](r.Resources)

	return nil
}
