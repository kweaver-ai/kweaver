package agentsvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/agentrespvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/conversationmsgvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
)

type handleExploreDto struct {
	exploreAnswerList []*agentrespvo.AnswerExplore
	nameToTypeMap     map[string]string
}

func (agentSvc *agentSvc) handleExplore(ctx context.Context, dto handleExploreDto) (mainThinking string, skillsProcess []*conversationmsgvo.SkillsProcessItem, err error) {
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	skillsProcess = make([]*conversationmsgvo.SkillsProcessItem, 0, len(dto.exploreAnswerList))

	for i := range dto.exploreAnswerList {
		skillsItem := &conversationmsgvo.SkillsProcessItem{}

		err = cutil.CopyStructUseJSON(skillsItem, dto.exploreAnswerList[i])
		if err != nil {
			return
		}

		skillsItem.Type = dto.nameToTypeMap[skillsItem.AgentName]

		skillName := dto.exploreAnswerList[i].AgentName

		//	AgentName   == main   取  answer 字段 作为返回
		//	AgentName   ！= main   取  BlockAnswer 字段 作为返回
		if skillName == "main" {
			_dto := &mainHandleDto{
				skillsItem:        skillsItem,
				exploreAnswerList: dto.exploreAnswerList,
				i:                 i,
				mainThinking:      &mainThinking,
				skillsProcess:     skillsProcess,
			}
			skillsProcess = agentSvc.mainHandle(ctx, _dto)
		} else {
			if skillsItem.Type == "tool" {
				_dto := &toolHandleDto{
					exploreAnswerList: dto.exploreAnswerList,
					i:                 i,
					skillsItem:        skillsItem,
					skillsProcess:     skillsProcess,
				}
				skillsProcess, err = agentSvc.toolHandle(ctx, _dto)
			} else {
				_dto := &agentToolHandleDto{
					exploreAnswerList: dto.exploreAnswerList,
					i:                 i,
					skillsItem:        skillsItem,
					skillsProcess:     skillsProcess,
				}
				skillsProcess, err = agentSvc.agentToolHandle(ctx, _dto)
			}
		}
	}

	return
}
