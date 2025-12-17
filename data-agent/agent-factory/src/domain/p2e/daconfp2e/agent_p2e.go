package daconfp2e

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/locale"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/daconfeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/umcmp/dto/umarg"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/umcmp/umtypes"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/cenvhelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iumacc"
	"github.com/pkg/errors"
)

// DataAgent PO转EO
func DataAgent(ctx context.Context, _po *dapo.DataAgentPo) (eo *daconfeo.DataAgent, err error) {
	eo = &daconfeo.DataAgent{
		Config: &daconfvalobj.Config{},
	}

	err = cutil.CopyStructUseJSON(&eo.DataAgentPo, _po)
	if err != nil {
		return
	}

	// 1. 解析配置
	if _po.Config != "" {
		err = cutil.JSON().UnmarshalFromString(_po.Config, &eo.Config)
		if err != nil {
			err = errors.Wrapf(err, "DataAgent unmarshal config error")
			return
		}
	}

	return
}

// DataAgents 批量PO转EO
func DataAgents(ctx context.Context, _pos []*dapo.DataAgentPo, productRepo idbaccess.IProductRepo, umHttp iumacc.UmHttpAcc) (eos []*daconfeo.DataAgent, err error) {
	eos = make([]*daconfeo.DataAgent, 0, len(_pos))

	// 1. 获取用户名称
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

	// 2. 获取产品名称
	productKeys := make([]string, 0, len(_pos))
	for i := range _pos {
		productKeys = append(productKeys, _pos[i].ProductKey)
	}

	productKeyNameMap, err := productRepo.GetByNameMapByKeys(ctx, productKeys)
	if err != nil {
		return
	}

	// 3. PO转EO
	for i := range _pos {
		var eo *daconfeo.DataAgent

		if eo, err = DataAgent(ctx, _pos[i]); err != nil {
			return
		}

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

		if eo.ProductKey != "" {
			eo.ProductName = productKeyNameMap[eo.ProductKey]
		}

		eos = append(eos, eo)
	}

	return
}

func DataAgentSimple(ctx context.Context, _po *dapo.DataAgentPo) (eo *daconfeo.DataAgent, err error) {
	eo = &daconfeo.DataAgent{
		Config: &daconfvalobj.Config{},
	}

	err = cutil.CopyStructUseJSON(&eo.DataAgentPo, _po)
	if err != nil {
		return
	}

	// 1. 解析配置
	if _po.Config != "" {
		err = cutil.JSON().UnmarshalFromString(_po.Config, &eo.Config)
		if err != nil {
			err = errors.Wrapf(err, "DataAgent unmarshal config error")
			return
		}
	}

	return
}
