package productsvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/e2p/producte2p"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/product/productreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

func (s *productSvc) Create(ctx context.Context, req *productreq.CreateReq) (key string, err error) {
	// 加分布式锁，后续的步骤在锁内执行
	//mu := s.dlmCmp.NewMutex(sceneCUDDlmName)
	//err = mu.Lock(ctx)
	//if err != nil {
	//	return
	//}
	//
	//defer func() {
	//	_err := mu.Unlock()
	//	if _err != nil {
	//		s.logger.Errorln("[sceneGroupSvc][Create]: dlm unlock failed:", _err)
	//	}
	//}()
	// 1. 检查名称是否重复
	exists, err := s.productRepo.ExistsByName(ctx, req.Name)
	if err != nil {
		return
	}

	if exists {
		err = capierr.NewCustom409Err(ctx, apierr.ProductNameExists, "产品名称已存在")
		return
	}

	// 2. 检查Key是否重复（如果提供了Key）
	if req.Key != "" {
		exists, err = s.productRepo.ExistsByKey(ctx, req.Key)
		if err != nil {
			return
		}

		if exists {
			err = capierr.NewCustom409Err(ctx, apierr.ProductKeyExists, "产品标识已存在")
			return
		}
	}

	// 3. DTO 转 EO
	eo, err := req.D2e()
	if err != nil {
		return
	}

	// 4. 设置创建信息
	eo.CreatedAt = cutil.GetCurrentMSTimestamp()
	eo.CreatedBy = chelper.GetUserIDFromCtx(ctx)

	// 5. EO转PO
	po, err := producte2p.Product(eo)
	if err != nil {
		return
	}

	// 6. 调用 repo 层创建数据
	key, err = s.productRepo.Create(ctx, po)
	if err != nil {
		return
	}

	// 4. 发送审计日志
	// err = s.sendAuditLog(ctx, eo, persrecenums.MngLogOpTypeCreate, tx)
	return
}
