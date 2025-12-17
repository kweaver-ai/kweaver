package spaceresp

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/spaceeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"github.com/pkg/errors"
)

// DetailResp 空间详情响应
type DetailResp struct {
	ID        string `json:"id"`         // 空间ID
	Name      string `json:"name"`       // 空间名称
	Key       string `json:"key"`        // 空间唯一标识符
	Profile   string `json:"profile"`    // 空间简介
	CreatedAt int64  `json:"created_at"` // 创建时间（时间戳，单位：ms）
	UpdatedAt int64  `json:"updated_at"` // 更新时间（时间戳，单位：ms）

	CreatedBy string `json:"created_by"` // 创建者id
	UpdatedBy string `json:"updated_by"` // 更新者id
}

func NewDetailResp() *DetailResp {
	return &DetailResp{}
}

func (d *DetailResp) LoadFromEo(eo *spaceeo.Space) error {
	err := cutil.CopyStructUseJSON(d, eo)
	if err != nil {
		return errors.Wrap(err, "[DetailRes]: LoadFromEo failed")
	}

	return nil
}
