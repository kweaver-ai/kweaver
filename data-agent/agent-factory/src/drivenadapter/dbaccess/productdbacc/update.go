package productdbacc

import (
	"context"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
)

// Update 更新产品
func (r *ProductRepo) Update(ctx context.Context, po *dapo.ProductPo) (err error) {
	sr := dbhelper2.NewSQLRunner(r.db, r.logger)

	// 设置更新时间
	po.UpdatedAt = time.Now().UnixMilli()

	sr.FromPo(po)

	_, err = sr.WhereEqual("f_id", po.ID).
		SetUpdateFields([]string{
			"f_name",
			"f_key",
			"f_profile",
			"f_updated_at",
			"f_updated_by",
		}).
		UpdateByStruct(po)

	return
}
