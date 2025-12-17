package personalspacep2e

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/locale"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/daconfeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/umcmp/dto/umarg"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/umcmp/umtypes"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/cenvhelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iumacc"
)

// AgentsListForPersonalSpaces 批量PO转EO，专门用于个人空间，包含用户名称获取
func AgentsListForPersonalSpaces(ctx context.Context, _pos []*dapo.DataAgentPo, umHttp iumacc.UmHttpAcc) (eos []*daconfeo.DataAgent, err error) {
	eos = make([]*daconfeo.DataAgent, 0, len(_pos))

	userIDs := make([]string, 0, len(_pos))
	for i := range _pos {
		userIDs = append(userIDs, _pos[i].CreatedBy)
		userIDs = append(userIDs, _pos[i].UpdatedBy)
	}

	arg := &umarg.GetOsnArgDto{
		UserIDs: userIDs,
	}

	ret := umtypes.NewOsnInfoMapS()

	if cenvhelper.IsLocalDev() {
		// 本地开发环境模拟数据
		for _, userID := range arg.UserIDs {
			ret.UserNameMap[userID] = userID + "_name"
		}
	} else {
		ret, err = umHttp.GetOsnNames(ctx, arg)
		if err != nil {
			return
		}
	}

	unknownUserName := locale.GetI18nByCtx(ctx, locale.UnknownUser)

	for i := range _pos {
		var eo *daconfeo.DataAgent

		if eo, err = AgentsListForPersonalSpace(ctx, _pos[i]); err != nil {
			return
		}

		// 设置用户名称
		if eo.CreatedBy != "" {
			userName, ok := ret.UserNameMap[eo.CreatedBy]
			if !ok {
				userName = unknownUserName
			}

			eo.CreatedByName = userName
		}

		if eo.UpdatedBy != "" {
			userName, ok := ret.UserNameMap[eo.UpdatedBy]
			if !ok {
				userName = unknownUserName
			}

			eo.UpdatedByName = userName
		}

		eos = append(eos, eo)
	}

	return
}

// AgentsListForPersonalSpace 简单的PO转EO，专门用于个人空间
func AgentsListForPersonalSpace(ctx context.Context, _po *dapo.DataAgentPo) (eo *daconfeo.DataAgent, err error) {
	eo = &daconfeo.DataAgent{
		Config: &daconfvalobj.Config{},
	}

	err = cutil.CopyStructUseJSON(&eo.DataAgentPo, _po)
	if err != nil {
		return
	}

	return
}
