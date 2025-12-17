package productsvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/p2e/productp2e"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/product/productresp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
)

func (s *productSvc) Detail(ctx context.Context, id int64) (res *productresp.DetailRes, err error) {
	// 2. 获取数据
	po, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		if chelper.IsSqlNotFound(err) {
			err = capierr.NewCustom404Err(ctx, apierr.ProductNotFound, "产品不存在")
			return
		}

		return
	}

	// 3. PO转EO
	eo, err := productp2e.Product(po)
	if err != nil {
		return
	}

	// 4. 转换为响应DTO
	res = productresp.NewDetailRes()
	err = res.LoadFromEo(eo)

	return
}
