package daresvo

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/agentrespvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

func (r *DataAgentRes) IsPromptType() (answer *agentrespvo.AnswerPrompt, ok bool) {
	answer = &agentrespvo.AnswerPrompt{}

	isValid, err := r.isPromptType()
	if err != nil {
		return
	}

	if !isValid {
		return
	}

	err = cutil.CopyUseJSON(&answer, r.GetFinalAnswer())
	if err != nil {
		return
	}

	ok = true

	return
}

func (r *DataAgentRes) isPromptType() (isValid bool, err error) {
	byt, err := r.GetFinalAnswerJSON()
	if err != nil {
		return
	}

	isValid, err = agentrespvo.IsPromptType(string(byt))
	if err != nil {
		return
	}

	if !isValid {
		return
	}

	return
}
