package spaceresp

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/spaceeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// ListItem 空间列表项
type ListItem struct {
	ID        string `json:"id"`         // 空间ID
	Name      string `json:"name"`       // 空间名称
	Key       string `json:"key"`        // 空间唯一标识符
	Profile   string `json:"profile"`    // 空间简介说明
	CreatedAt int64  `json:"created_at"` // 创建时间（时间戳，单位：ms）
	UpdatedAt int64  `json:"updated_at"` // 更新时间（时间戳，单位：ms）

	CreatedBy string `json:"created_by"` // 创建者
	UpdatedBy string `json:"updated_by"` // 更新者

	CreatedByName string `json:"created_by_name"` // 创建者名称
	UpdatedByName string `json:"updated_by_name"` // 更新者名称
}

// ListResp 空间列表响应
type ListResp struct {
	Entries []*ListItem `json:"entries"` // 空间列表
	Total   int64       `json:"total"`   // 总数
}

func NewListResp(total int64) *ListResp {
	return &ListResp{
		Entries: make([]*ListItem, 0),
		Total:   total,
	}
}

func (l *ListResp) LoadFromEos(eos []*spaceeo.Space) (err error) {
	if len(eos) == 0 {
		return
	}

	l.Entries = make([]*ListItem, 0, len(eos))

	for _, eo := range eos {
		item := ListItem{}

		err = cutil.CopyStructUseJSON(&item, eo)
		if err != nil {
			return
		}

		l.Entries = append(l.Entries, &item)
	}

	return
}
