package releasesvc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/daconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/releaseeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/p2e/daconfp2e"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/types/dto/daconfigdto/dsdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
)

// handlePublishDatasource 发布时处理datasource相关的东西
// 1. 获取v0的datasetID
// 2. 创建assoc，发布的version使用v0的datasetID
func (svc *releaseSvc) handlePublishDatasource(ctx context.Context, tx *sql.Tx, po *dapo.ReleasePO) (err error) {
	// 1. 获取v0的datasetID
	dsV0Dto := dsdto.NewDsIndexUniqDto(po.AgentID, daconstant.AgentVersionUnpublished)

	datasetID, err := svc.dsSvc.GetAgentDatasetID(ctx, dsV0Dto)
	if err != nil {
		// 如果是sql not found的错误，表示v0版本的没有数据集，直接返回（发布的版本也不需要创建数据集）
		if chelper.IsSqlNotFound(err) {
			err = nil
		}

		return
	}

	// 2. 创建assoc，发布的version使用v0的datasetID
	dsDto := dsdto.NewDsIndexUniqDto(po.AgentID, po.AgentVersion)

	err = svc.dsSvc.CreateAssocOnly(ctx, tx, dsDto, datasetID)
	if err != nil {
		return
	}

	return
}

// handleUnPublishDatasource 取消发布时处理datasource相关的东西
// 1. 直接调用dsSvc.Delete 和删除agent时的逻辑一致。其内部会判断是只删除assoc还是删除assoc和dataset等
func (svc *releaseSvc) handleUnPublishDatasource(ctx context.Context, tx *sql.Tx, po *dapo.ReleasePO) (err error) {
	// 1. po 转 eoSimple
	var eoSimple *releaseeo.ReleaseDAConfWrapperEO

	eoSimple, err = daconfp2e.ReleaseDAConfEoSimple(ctx, po)
	if err != nil {
		return
	}

	// 2. 构造dsDto
	dsDto := dsdto.NewDsComDto(po.AgentID, eoSimple.AgentVersion, eoSimple.Config)

	// 3. 调用dsSvc.Delete
	err = svc.dsSvc.Delete(ctx, tx, dsDto)
	if err != nil {
		return
	}

	return
}
