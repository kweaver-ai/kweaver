package tplp2e

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/daconfeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"github.com/pkg/errors"
)

// DataAgentTpl PO转EO
func DataAgentTpl(ctx context.Context, _po *dapo.DataAgentTplPo, productRepo idbaccess.IProductRepo) (eo *daconfeo.DataAgentTpl, err error) {
	eo = &daconfeo.DataAgentTpl{
		Config: &daconfvalobj.Config{},
	}

	err = cutil.CopyStructUseJSON(&eo.DataAgentTplPo, _po)
	if err != nil {
		return
	}

	// 1. 解析配置
	if _po.Config != "" {
		err = cutil.JSON().UnmarshalFromString(_po.Config, &eo.Config)
		if err != nil {
			err = errors.Wrapf(err, "DataAgentTpl unmarshal config error")
			return
		}
	}

	// 2. 获取产品名称
	if _po.ProductKey != "" {
		var po *dapo.ProductPo

		po, err = productRepo.GetByKey(ctx, _po.ProductKey)
		if err != nil {
			if chelper.IsSqlNotFound(err) {
				err = nil
			} else {
				err = errors.Wrapf(err, "get product name error")
				return
			}
		}

		eo.ProductName = po.Name
	}

	return
}
