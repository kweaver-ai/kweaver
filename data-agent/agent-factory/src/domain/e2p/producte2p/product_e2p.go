package producte2p

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/producteo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// Product 将产品实体对象转换为持久化对象
func Product(eo *producteo.Product) (po *dapo.ProductPo, err error) {
	if eo == nil {
		return
	}

	po = &dapo.ProductPo{}

	err = cutil.CopyStructUseJSON(po, eo)
	if err != nil {
		return
	}

	return
}
