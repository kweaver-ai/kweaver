package spacep2e

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/locale"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/spaceeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/agentvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/umcmp/dto/umarg"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/umcmp/umtypes"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/cenvhelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iumacc"
)

// SpaceResource PO转EO
func SpaceResource(ctx context.Context, _po *dapo.SpaceResourcePo) (eo *spaceeo.SpaceResource, err error) {
	eo = spaceeo.NewSpaceResource()

	err = cutil.CopyStructUseJSON(&eo.SpaceResourcePo, _po)
	if err != nil {
		return
	}

	return
}

// SpaceResources 批量PO转EO
func SpaceResources(ctx context.Context, _pos []*dapo.SpaceResourcePo, releaseAgentPoMap map[string]*dapo.PublishedJoinPo, umHttp iumacc.UmHttpAcc) (eos []*spaceeo.SpaceResource, err error) {
	eos = make([]*spaceeo.SpaceResource, 0, len(_pos))

	pubUserNameMap, err := getPublishUserNameMap(ctx, releaseAgentPoMap, umHttp)
	if err != nil {
		return
	}

	unknownUserName := locale.GetI18nByCtx(ctx, locale.UnknownUser)

	for i := range _pos {
		var eo *spaceeo.SpaceResource

		if eo, err = SpaceResource(ctx, _pos[i]); err != nil {
			return
		}

		isResourceExists := false

		if eo.ResourceType == cdaenum.ResourceTypeDataAgent {
			if releaseAgentPo, exists := releaseAgentPoMap[eo.ResourceID]; exists {
				eo.ResourceName = releaseAgentPo.Name
				eo.PublishedAgentInfo = agentvo.NewPublishedAgentInfo()

				err = eo.PublishedAgentInfo.LoadFromReleaseAgentPO(releaseAgentPo)
				if err != nil {
					return
				}

				if userName, _exists := pubUserNameMap[releaseAgentPo.ReleasePartPo.PublishedBy]; _exists {
					eo.PublishedAgentInfo.PublishedByName = userName
				} else {
					eo.PublishedAgentInfo.PublishedByName = unknownUserName
				}

				isResourceExists = true
			}
		}

		if !isResourceExists {
			continue
		}

		eos = append(eos, eo)
	}

	return
}

func getPublishUserNameMap(ctx context.Context, releaseAgentPoMap map[string]*dapo.PublishedJoinPo, umHttp iumacc.UmHttpAcc) (pubUserNameMap map[string]string, err error) {
	pubUserNameMap = make(map[string]string)
	pubUserIDs := make([]string, 0)

	for _, releaseAgentPo := range releaseAgentPoMap {
		pubUserIDs = append(pubUserIDs, releaseAgentPo.ReleasePartPo.PublishedBy)
	}

	arg := &umarg.GetOsnArgDto{
		UserIDs: pubUserIDs,
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

	pubUserNameMap = ret.UserNameMap

	return
}
