package spaceresp

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/spaceeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"github.com/pkg/errors"
)

// MemberListResp 空间成员列表响应
type MemberListResp struct {
	Entries []*MemberItem `json:"entries"` // 成员列表
}

func NewMemberListResp() *MemberListResp {
	return &MemberListResp{
		Entries: make([]*MemberItem, 0),
	}
}

// MemberItem 空间成员列表项
type MemberItem struct {
	ID      int64            `json:"id"`       // 成员关联ID
	SpaceID string           `json:"space_id"` // 空间ID
	ObjType cenum.OrgObjType `json:"obj_type"` // 组织对象类型，枚举值：user-个人，dept-部门，user_group-用户组
	ObjID   string           `json:"obj_id"`   // 组织对象的唯一标识
	ObjName string           `json:"obj_name"` // 组织对象名称

	CreatedBy string `json:"created_by" db:"f_created_by"` // 创建者id
	CreatedAt int64  `json:"created_at" db:"f_created_at"` // 创建时间

	IsOwner  bool `json:"is_owner"`  // 是否是空间所有者
	IsMyself bool `json:"is_myself"` // 是否是当前用户
}

func (r *MemberListResp) LoadFromEos(ctx context.Context, eos []*spaceeo.SpaceMember) (err error) {
	currentUid := chelper.GetUserIDFromCtx(ctx)

	for _, eo := range eos {
		item := &MemberItem{}

		err = cutil.CopyStructUseJSON(item, eo)
		if err != nil {
			return errors.Wrap(err, "[MemberListResp]: LoadFromEos failed")
		}

		if item.ObjID == currentUid && item.ObjType == cenum.OrgObjTypeUser {
			item.IsMyself = true
		}

		if item.ObjID == item.CreatedBy && item.ObjType == cenum.OrgObjTypeUser {
			item.IsOwner = true
		}

		r.Entries = append(r.Entries, item)
	}

	return nil
}
