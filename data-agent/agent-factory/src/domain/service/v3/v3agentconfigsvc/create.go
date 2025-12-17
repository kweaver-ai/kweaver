package v3agentconfigsvc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/daconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/e2p/daconfe2p"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/bizdomainhttp/bizdomainhttpreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"github.com/pkg/errors"
)

func (s *dataAgentConfigSvc) Create(ctx context.Context, req *agentconfigreq.CreateReq) (id string, err error) {
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
	// exists, err := s.agentConfRepo.ExistsByName(ctx, req.Name)
	// if err != nil {
	// 	return
	// }
	// if exists {
	// 	err = capierr.NewCustom409Err(ctx, apierr.DataAgentConfigNameExists, "名称已存在")
	// 	return
	// }
	// 1. 检查
	// 1.1 检查产品是否存在
	exists, err := s.productRepo.ExistsByKey(ctx, req.ProductKey)
	if err != nil {
		return
	}

	if !exists {
		err = capierr.NewCustom409Err(ctx, apierr.ProductNotFound, "产品不存在")
		return
	}

	// 1.2 检查是否有创建系统Agent权限
	if req.IsSystemAgent != nil && req.IsSystemAgent.Bool() {
		// 检查是否有创建系统Agent权限
		var hasPms bool

		hasPms, err = s.isHasSystemAgentCreatePermission(ctx)
		if err != nil {
			err = errors.Wrapf(err, "check system agent create permission failed")
			return
		}

		if !hasPms {
			err = capierr.New403Err(ctx, "do not have system agent create permission")
			return
		}
	}

	// 2. DTO 转 EO
	eo, err := req.D2e()
	if err != nil {
		return
	}

	id = cutil.UlidMake()

	// 3. 开始事务
	tx, err := s.agentConfRepo.BeginTx(ctx)
	if err != nil {
		return
	}

	defer chelper.TxRollback(tx, &err, s.logger)

	// 4. 创建数据集
	isHasBuiltInDocSource := req.Config.IsHasBuiltInDocSource()

	var (
		datasetId   string
		isReusable  bool
		dsCreateDto *dsdto.DsComDto
	)

	if isHasBuiltInDocSource {
		dsCreateDto = dsdto.NewDsComDto(id, daconstant.AgentVersionUnpublished, req.Config)

		datasetId, isReusable, err = s.dsSvc.Create(ctx, tx, dsCreateDto)
		if err != nil {
			return
		}

		eo.SetDatasetId(datasetId)
	}

	// 5. 调用 repo 层创建数据
	po, err := daconfe2p.DataAgent(eo)
	if err != nil {
		return
	}

	// 5.1 保存数据
	err = s.createPo(ctx, tx, req, po, id)
	if err != nil {
		return
	}

	// 5.2 关联业务域（先写入本地关联表，再调用HTTP）
	bdID := chelper.GetBizDomainIDFromCtx(ctx)

	// 5.2.1 写入本地关联表
	bdRelPo := &dapo.BizDomainAgentRelPo{
		BizDomainID: bdID,
		AgentID:     id,
		CreatedAt:   cutil.GetCurrentMSTimestamp(),
	}

	err = s.bdAgentRelRepo.BatchCreate(ctx, tx, []*dapo.BizDomainAgentRelPo{bdRelPo})
	if err != nil {
		return
	}

	// 5.2.2 调用HTTP接口关联
	bdReq := &bizdomainhttpreq.AssociateResourceReq{
		ID:   id,
		BdID: bdID,
		Type: cdaenum.ResourceTypeDataAgent,
	}

	err = s.bizDomainHttp.AssociateResource(ctx, bdReq)
	if err != nil {
		return
	}

	// 5.3 提交事务
	err = tx.Commit()
	if err != nil {
		return
	}

	// 6. 触发向量索引
	if isHasBuiltInDocSource && !isReusable {
		err = s.dsSvc.AddIndex(ctx, dsCreateDto, datasetId)
		if err != nil {
			return
		}
	}

	// 7. 发送审计日志
	// err = s.sendAuditLog(ctx, eo, persrecenums.MngLogOpTypeCreate, tx)

	return
}

func (s *dataAgentConfigSvc) createPo(ctx context.Context, tx *sql.Tx, req *agentconfigreq.CreateReq, po *dapo.DataAgentPo, id string) (err error) {
	po.Status = cdaenum.StatusUnpublished

	currentTs := cutil.GetCurrentMSTimestamp()
	po.CreatedAt = currentTs
	po.UpdatedAt = currentTs

	if req.IsInternalAPI {
		po.CreatedBy = req.CreatedBy
		po.UpdatedBy = req.CreatedBy
	} else {
		po.CreatedBy = chelper.GetUserIDFromCtx(ctx)
		po.UpdatedBy = po.CreatedBy
	}

	err = s.agentConfRepo.Create(ctx, tx, id, po)
	if err != nil {
		return
	}

	return
}
