package releasesvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdapmsenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"github.com/pkg/errors"
)

func (s *releaseSvc) isHasPubOrUnPubPms(ctx context.Context, po *dapo.DataAgentPo, operator cdapmsenum.Operator) (b bool, err error) {
	// 1. 检查operator
	if operator != cdapmsenum.AgentPublish && operator != cdapmsenum.AgentUnpublish {
		err = errors.New("[isHasPubOrUnPubPms]: invalid operator")
		return
	}

	// 2. 一些变量设置
	uid := chelper.GetUserIDFromCtx(ctx)
	isOwner := po.CreatedBy == uid
	isBuiltIn := po.IsBuiltIn.IsBuiltIn()

	// 3. 检查发布权限
	var hasPubPms bool

	hasPubPms, err = s.pmsSvc.GetSingleMgmtPermission(ctx, cdaenum.ResourceTypeDataAgent, operator)
	if err != nil {
		return
	}

	// 4. 如果有发布权限且是owner，返回true
	if hasPubPms && isOwner {
		b = true
		return
	}

	// 5. 否则-如果不是内置Agent，返回false
	if !isBuiltIn {
		return
	}

	// 6. 如果是内置Agent，检查内置Agent管理权限
	var hasAgentBuiltInAgentMgmt bool

	hasAgentBuiltInAgentMgmt, err = s.pmsSvc.GetSingleMgmtPermission(ctx, cdaenum.ResourceTypeDataAgent, cdapmsenum.AgentBuiltInAgentMgmt)
	if err != nil {
		return
	}

	// 7. 如果有内置Agent管理权限，返回true
	if hasAgentBuiltInAgentMgmt {
		b = true
		return
	}

	return
}

func (s *releaseSvc) isHasPublishPermission(ctx context.Context, po *dapo.DataAgentPo) (has bool, err error) {
	has, err = s.isHasPubOrUnPubPms(ctx, po, cdapmsenum.AgentPublish)
	return
}

func (s *releaseSvc) isHasUnPublishPermission(ctx context.Context, po *dapo.DataAgentPo) (has bool, err error) {
	has, err = s.isHasPubOrUnPubPms(ctx, po, cdapmsenum.AgentUnpublish)
	return
}

func (s *releaseSvc) isHasUnpublishOtherUserAgentPermission(ctx context.Context) (has bool, err error) {
	has, err = s.pmsSvc.GetSingleMgmtPermission(ctx, cdaenum.ResourceTypeDataAgent, cdapmsenum.AgentUnpublishOtherUserAgent)
	return
}
